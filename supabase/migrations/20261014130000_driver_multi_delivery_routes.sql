alter table public.rescues
  add column driver_route_position integer;

with ranked as (
  select id, row_number() over (
    partition by driver_id
    order by driver_assigned_at nulls last, created_at, id
  )::integer as route_position
  from public.rescues
  where driver_id is not null and status not in ('DELIVERED', 'CANCELLED')
)
update public.rescues r
set driver_route_position = ranked.route_position
from ranked
where ranked.id = r.id;

alter table public.rescues
  add constraint rescues_driver_route_position_positive
  check (driver_route_position is null or driver_route_position > 0);
create index rescues_driver_route_order_idx
  on public.rescues(driver_id, driver_route_position)
  where driver_id is not null;

create function private.accept_deliveries(rescue_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare
  d public.drivers;
  r public.rescues;
  requested_count integer;
  locked_count integer := 0;
  active_weight numeric;
  selected_weight numeric;
  next_position integer;
  driver_name text;
begin
  if private.actor_role() is distinct from 'DRIVER' then
    raise exception 'Apenas motoristas podem aceitar entregas';
  end if;
  if rescue_ids is null or cardinality(rescue_ids) not between 1 and 30
     or array_position(rescue_ids, null) is not null then
    raise exception 'Selecione de 1 a 30 entregas válidas';
  end if;
  select count(distinct requested.id)::integer into requested_count
  from unnest(rescue_ids) as requested(id);
  if requested_count <> cardinality(rescue_ids) then
    raise exception 'A mesma entrega não pode ser selecionada mais de uma vez';
  end if;

  select * into d
  from public.drivers
  where profile_id = private.actor_id()
  for update;
  if d.id is null or not d.availability then
    raise exception 'Ative sua disponibilidade para adicionar entregas à rota';
  end if;

  -- Lock opportunities in stable order so two drivers cannot take the same lot.
  for r in
    select * from public.rescues
    where id = any(rescue_ids)
    order by id
    for update
  loop
    if r.status <> 'WAITING_DRIVER' or r.driver_id is not null then
      raise exception 'Outro motorista já aceitou uma das entregas selecionadas';
    end if;
    locked_count := locked_count + 1;
  end loop;
  if locked_count <> cardinality(rescue_ids) then
    raise exception 'Uma ou mais entregas não estão mais disponíveis';
  end if;

  select coalesce(sum(b.estimated_weight_kg), 0) into active_weight
  from public.rescues active
  join public.surplus_batches b on b.id = active.batch_id
  where active.driver_id = d.id and active.status not in ('DELIVERED', 'CANCELLED');
  select coalesce(sum(b.estimated_weight_kg), 0) into selected_weight
  from public.rescues selected
  join public.surplus_batches b on b.id = selected.batch_id
  where selected.id = any(rescue_ids);
  if active_weight + selected_weight > d.vehicle_capacity_kg then
    raise exception 'O peso total desta rota ultrapassa a capacidade do veículo';
  end if;

  select coalesce(max(driver_route_position), 0) into next_position
  from public.rescues where driver_id = d.id;
  select name into driver_name from public.profiles where id = private.actor_id();
  for r in
    select rescues.*
    from unnest(rescue_ids) with ordinality as requested(id, position)
    join public.rescues on rescues.id = requested.id
    order by requested.position
  loop
    next_position := next_position + 1;
    update public.rescues
      set driver_id = d.id,
          driver_route_position = next_position,
          status = 'DRIVER_ASSIGNED',
          driver_assigned_at = now(),
          updated_at = now()
      where id = r.id;
    insert into public.rescue_events(rescue_id, event_type, status, actor_profile_id, metadata)
      values (r.id, 'DRIVER_ASSIGNED', 'DRIVER_ASSIGNED', private.actor_id(),
        jsonb_build_object('driver_name', driver_name, 'route_position', next_position));
    insert into public.notifications(profile_id, type, title, body, metadata)
      select profile_id, 'DRIVER_ASSIGNED', driver_name || ' aceitou a entrega',
        'A coleta foi adicionada à rota do motorista.', jsonb_build_object('rescue_id', r.id)
      from public.organization_members
      where organization_id in (r.supermarket_id, r.ngo_id);
  end loop;
end $$;

create function public.accept_deliveries(rescue_ids uuid[]) returns void
language sql security invoker set search_path = '' as $$
  select private.accept_deliveries(rescue_ids)
$$;

-- Keep the single-item RPC compatible with existing clients while sharing the
-- same capacity, availability, and route-order checks.
create or replace function private.accept_mission(rescue uuid) returns void
language sql security definer set search_path = '' as $$
  select private.accept_deliveries(array[rescue])
$$;

create function private.require_pickups_before_delivery() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.status = 'PICKED_UP' and new.status = 'IN_TRANSIT' and exists (
    select 1 from public.rescues other
    where other.driver_id = new.driver_id
      and other.id <> new.id
      and other.status in ('DRIVER_ASSIGNED', 'GOING_TO_PICKUP', 'AT_PICKUP')
  ) then
    raise exception 'Conclua todas as coletas da rota antes de seguir para as instituições';
  end if;
  return new;
end $$;
create trigger require_pickups_before_delivery
  before update of status on public.rescues
  for each row execute function private.require_pickups_before_delivery();

revoke all on function private.accept_deliveries(uuid[]) from public, anon, authenticated;
grant execute on function private.accept_deliveries(uuid[]) to authenticated;
revoke all on function public.accept_deliveries(uuid[]) from public, anon;
grant execute on function public.accept_deliveries(uuid[]) to authenticated;
revoke all on function private.require_pickups_before_delivery() from public, anon, authenticated;
