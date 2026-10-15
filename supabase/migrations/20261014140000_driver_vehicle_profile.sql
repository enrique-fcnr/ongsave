grant update(vehicle_label, vehicle_capacity_kg)
  on public.drivers to authenticated;

create function private.validate_driver_vehicle_capacity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  assigned_weight numeric;
begin
  if new.vehicle_capacity_kg is distinct from old.vehicle_capacity_kg then
    select coalesce(sum(b.estimated_weight_kg), 0) into assigned_weight
    from public.rescues r
    join public.surplus_batches b on b.id = r.batch_id
    where r.driver_id = old.id
      and r.status not in ('DELIVERED', 'CANCELLED');
    if new.vehicle_capacity_kg < assigned_weight then
      raise exception 'A capacidade não pode ficar abaixo dos % kg já carregados na rota', assigned_weight;
    end if;
  end if;
  return new;
end $$;

create trigger validate_driver_vehicle_capacity
  before update of vehicle_capacity_kg on public.drivers
  for each row execute function private.validate_driver_vehicle_capacity();

revoke all on function private.validate_driver_vehicle_capacity() from public, anon, authenticated;
