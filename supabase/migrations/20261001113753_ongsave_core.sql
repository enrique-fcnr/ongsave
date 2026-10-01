-- ONGSave: mutations use narrow, audited RPCs. No direct operational writes.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create type public.app_role as enum ('SUPERMARKET','NGO','DRIVER','ADMIN');
create type public.rescue_status as enum ('AVAILABLE','RESERVED','WAITING_DRIVER','DRIVER_ASSIGNED','GOING_TO_PICKUP','AT_PICKUP','PICKED_UP','IN_TRANSIT','AT_DESTINATION','DELIVERED','CANCELLED');
create table public.profiles (
 id uuid primary key default gen_random_uuid(), auth_user_id uuid unique not null references auth.users(id) on delete cascade,
 name text not null, email text unique not null, phone text, role public.app_role not null, avatar_url text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.organizations (
 id uuid primary key default gen_random_uuid(), name text not null, type public.app_role not null check(type in ('SUPERMARKET','NGO')),
 slug text unique not null, description text, logo_url text, phone text, email text, address_line text not null,
 neighborhood text not null, city text not null default 'São Paulo', state text not null default 'SP', postal_code text,
 latitude double precision not null, longitude double precision not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.organization_members (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 profile_id uuid not null references public.profiles(id) on delete cascade, member_role text not null default 'operator', created_at timestamptz not null default now(), unique(organization_id,profile_id)
);
create table public.ngo_preferences (
 id uuid primary key default gen_random_uuid(), organization_id uuid unique not null references public.organizations(id),
 daily_capacity_kg numeric not null default 250 check(daily_capacity_kg>0), receiving_enabled boolean not null default true,
 receiving_start time not null default '07:00', receiving_end time not null default '22:00', service_radius_km numeric not null default 15,
 has_fridge boolean not null default true, has_freezer boolean not null default false, has_cold_room boolean not null default false,
 accepted_categories text[] not null default array['produce','bakery','dry_goods'], current_needs text[] not null default array['produce'],
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(receiving_start<receiving_end)
);
create table public.drivers (
 id uuid primary key default gen_random_uuid(), profile_id uuid unique not null references public.profiles(id) on delete cascade,
 vehicle_type text not null, vehicle_label text not null, vehicle_capacity_kg numeric not null check(vehicle_capacity_kg>0),
 availability boolean not null default true, mock_latitude double precision not null default -23.589, mock_longitude double precision not null default -46.64,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.surplus_batches (
 id uuid primary key default gen_random_uuid(), supermarket_id uuid not null references public.organizations(id), created_by uuid not null references public.profiles(id),
 title text not null, category text not null check(category in ('produce','bakery','dairy','prepared_food','dry_goods','frozen','other')), description text,
 image_url text, estimated_weight_kg numeric not null check(estimated_weight_kg>0 and estimated_weight_kg<=5000), estimated_weight_min numeric, estimated_weight_max numeric,
 estimated_quantity numeric, visual_condition text not null check(visual_condition in ('acceptable','attention','not_recommended','inconclusive')),
 pickup_priority text not null check(pickup_priority in ('low','medium','high','urgent')), recommended_pickup_hours integer not null check(recommended_pickup_hours between 1 and 72),
 expires_at timestamptz not null, status public.rescue_status not null default 'AVAILABLE',
 ai_analysis_json jsonb, ai_provider text, ai_model text, ai_confidence numeric, user_confirmed boolean not null check(user_confirmed), estimated_impact_json jsonb not null default '{}',
 is_seed boolean not null default false, is_demo boolean not null default false, seed_kind text check(seed_kind in ('HISTORY','AVAILABLE','MISSION')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), published_at timestamptz not null default now()
);
create table public.surplus_items (
 id uuid primary key default gen_random_uuid(), batch_id uuid not null references public.surplus_batches(id) on delete cascade,
 name text not null, estimated_quantity numeric, confidence numeric check(confidence between 0 and 1), created_at timestamptz not null default now()
);
create table public.donation_reservations (
 id uuid primary key default gen_random_uuid(), batch_id uuid unique not null references public.surplus_batches(id) on delete cascade,
 ngo_id uuid not null references public.organizations(id), accepted_by uuid not null references public.profiles(id), accepted_at timestamptz not null default now(), status text not null default 'ACTIVE'
);
create table public.rescues (
 id uuid primary key default gen_random_uuid(), batch_id uuid unique not null references public.surplus_batches(id) on delete cascade,
 supermarket_id uuid not null references public.organizations(id), ngo_id uuid not null references public.organizations(id), driver_id uuid references public.drivers(id),
 status public.rescue_status not null default 'WAITING_DRIVER', pickup_address text not null, pickup_latitude double precision not null, pickup_longitude double precision not null,
 delivery_address text not null, delivery_latitude double precision not null, delivery_longitude double precision not null,
 mock_distance_km numeric not null, mock_eta_minutes integer not null, mock_route_geometry jsonb not null,
 created_at timestamptz not null default now(), reserved_at timestamptz, driver_assigned_at timestamptz, going_to_pickup_at timestamptz,
 arrived_pickup_at timestamptz, picked_up_at timestamptz, in_transit_at timestamptz, arrived_destination_at timestamptz, delivered_at timestamptz, cancelled_at timestamptz, updated_at timestamptz not null default now()
);
-- Token lives outside the exposed schema and realtime publication.
create table private.rescue_tokens (rescue_id uuid primary key references public.rescues(id) on delete cascade, confirmation_token text not null check(confirmation_token ~ '^[0-9]{4}$'), attempts integer not null default 0, locked_until timestamptz);
create table private.analyses (id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id), image_url text not null, analysis jsonb, provider text not null, model text not null, created_at timestamptz not null default now(), published boolean not null default false);
create table public.rescue_events (
 id uuid primary key default gen_random_uuid(), rescue_id uuid not null references public.rescues(id) on delete cascade, event_type text not null,
 status public.rescue_status not null, actor_profile_id uuid references public.profiles(id), metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.impact_metrics (
 id uuid primary key default gen_random_uuid(), rescue_id uuid unique not null references public.rescues(id) on delete cascade,
 food_saved_kg numeric not null, estimated_meals integer not null, estimated_disposal_savings numeric not null,
 estimated_co2_avoided_kg numeric not null, estimated_water_saved_liters numeric not null, created_at timestamptz not null default now()
);
create table public.notifications (
 id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade, type text not null,
 title text not null, body text not null, read_at timestamptz, metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create index rescues_driver_idx on public.rescues(driver_id,status);
create index rescues_ngo_idx on public.rescues(ngo_id);
create index rescues_market_idx on public.rescues(supermarket_id);
create index batches_feed_idx on public.surplus_batches(status,expires_at);
create index members_profile_idx on public.organization_members(profile_id);
create index notifications_profile_idx on public.notifications(profile_id,created_at desc);
create index events_rescue_idx on public.rescue_events(rescue_id,created_at);
create function private.impact_for_weight(weight numeric) returns jsonb language sql immutable security invoker set search_path='' as $$
 select jsonb_build_object('food_saved_kg',weight,'estimated_meals',round(weight*2),'estimated_disposal_savings',round(weight*7.72,2),'estimated_co2_avoided_kg',round(weight*1.43,2),'estimated_water_saved_liters',round(weight*250))
$$;
create function private.estimate_batch_impact() returns trigger language plpgsql security definer set search_path='' as $$ begin new.estimated_impact_json=private.impact_for_weight(new.estimated_weight_kg); return new; end $$;
create trigger estimate_batch_impact before insert or update of estimated_weight_kg on public.surplus_batches for each row execute function private.estimate_batch_impact();
create function private.init_rescue_token() returns trigger language plpgsql security definer set search_path='' as $$ begin insert into private.rescue_tokens(rescue_id,confirmation_token) values(new.id,lpad(floor(random()*10000)::text,4,'0')); return new; end $$;
create trigger init_rescue_token after insert on public.rescues for each row execute function private.init_rescue_token();

create function private.actor_id() returns uuid language sql stable security definer set search_path='' as $$ select id from public.profiles where auth_user_id=auth.uid() $$;
create function private.actor_role() returns public.app_role language sql stable security definer set search_path='' as $$ select role from public.profiles where auth_user_id=auth.uid() $$;
create function private.member(org uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.organization_members where organization_id=org and profile_id=private.actor_id()) $$;
create function private.can_read_rescue(rid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.rescues r where r.id=rid and (private.member(r.supermarket_id) or private.member(r.ngo_id) or (private.actor_role()='DRIVER' and (r.status='WAITING_DRIVER' or r.driver_id in (select id from public.drivers where profile_id=private.actor_id()))) or private.actor_role()='ADMIN'))
$$;
create function private.can_read_batch(bid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.surplus_batches b where b.id=bid and (private.member(b.supermarket_id) or (private.actor_role()='NGO' and b.status='AVAILABLE' and b.expires_at>now()) or exists(select 1 from public.rescues r where r.batch_id=b.id and private.can_read_rescue(r.id)) or private.actor_role()='ADMIN'))
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.ngo_preferences enable row level security;
alter table public.drivers enable row level security;
alter table public.surplus_batches enable row level security;
alter table public.surplus_items enable row level security;
alter table public.donation_reservations enable row level security;
alter table public.rescues enable row level security;
alter table public.rescue_events enable row level security;
alter table public.impact_metrics enable row level security;
alter table public.notifications enable row level security;
alter table private.rescue_tokens enable row level security;
alter table private.analyses enable row level security;
-- Supabase may auto-grant CRUD on newly created public tables. Remove those
-- defaults before granting column-level updates, so role changes stay impossible.
revoke all on public.profiles,public.organizations,public.organization_members,public.ngo_preferences,public.drivers,public.surplus_batches,public.surplus_items,public.donation_reservations,public.rescues,public.rescue_events,public.impact_metrics,public.notifications from anon,authenticated;
grant select on public.profiles,public.organizations,public.organization_members,public.ngo_preferences,public.drivers,public.surplus_batches,public.surplus_items,public.donation_reservations,public.rescues,public.rescue_events,public.impact_metrics,public.notifications to authenticated;
grant update(phone,name) on public.profiles to authenticated;
grant update(daily_capacity_kg,receiving_enabled,receiving_start,receiving_end,service_radius_km,has_fridge,has_freezer,has_cold_room,accepted_categories,current_needs) on public.ngo_preferences to authenticated;
grant update(availability) on public.drivers to authenticated;
grant update(read_at) on public.notifications to authenticated;
create policy own_profile on public.profiles for select to authenticated using(auth_user_id=auth.uid());
create policy update_profile on public.profiles for update to authenticated using(auth_user_id=auth.uid()) with check(auth_user_id=auth.uid());
-- Operational directory: organization names/addresses needed for pickup and feed, no personal profiles.
create policy directory on public.organizations for select to authenticated using(private.actor_id() is not null);
create policy own_members on public.organization_members for select to authenticated using(profile_id=private.actor_id());
create policy own_preferences on public.ngo_preferences for select to authenticated using(private.member(organization_id));
create policy update_preferences on public.ngo_preferences for update to authenticated using(private.member(organization_id) and private.actor_role()='NGO') with check(private.member(organization_id) and private.actor_role()='NGO');
create policy own_driver on public.drivers for select to authenticated using(profile_id=private.actor_id());
create policy update_driver on public.drivers for update to authenticated using(profile_id=private.actor_id()) with check(profile_id=private.actor_id());
create policy read_batches on public.surplus_batches for select to authenticated using(private.can_read_batch(id));
create policy read_items on public.surplus_items for select to authenticated using(private.can_read_batch(batch_id));
create policy read_reservations on public.donation_reservations for select to authenticated using(private.member(ngo_id) or exists(select 1 from public.surplus_batches b where b.id=batch_id and private.member(b.supermarket_id)));
create policy read_rescues on public.rescues for select to authenticated using(private.can_read_rescue(id));
create policy read_events on public.rescue_events for select to authenticated using(private.can_read_rescue(rescue_id));
create policy read_impact on public.impact_metrics for select to authenticated using(private.can_read_rescue(rescue_id));
create policy own_notifications on public.notifications for select to authenticated using(profile_id=private.actor_id());
create policy read_notification on public.notifications for update to authenticated using(profile_id=private.actor_id()) with check(profile_id=private.actor_id());

create function private.record_analysis(image_path text, result jsonb, provider_name text, model_name text, actor_auth_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare aid uuid; pid uuid;
begin
 select id into pid from public.profiles where auth_user_id=actor_auth_id and role='SUPERMARKET';
 if pid is null then raise exception 'Perfil não autorizado'; end if;
 if image_path not like actor_auth_id::text || '/%' then raise exception 'Imagem não pertence ao usuário'; end if;
 insert into private.analyses(profile_id,image_url,analysis,provider,model) values(pid,image_path,result,provider_name,model_name) returning id into aid; return aid;
end $$;
create function public.record_analysis(image_path text,result jsonb,provider_name text,model_name text,actor_auth_id uuid) returns uuid language sql security invoker set search_path='' as $$ select private.record_analysis(image_path,result,provider_name,model_name,actor_auth_id) $$;
-- record_analysis is server-service-only: provenance cannot be forged by a browser.
revoke all on function public.record_analysis(text,jsonb,text,text,uuid) from public, authenticated;
grant execute on function public.record_analysis(text,jsonb,text,text,uuid) to service_role;

create function private.publish_surplus(payload jsonb, analysis_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; bid uuid; a private.analyses; it jsonb; hrs integer;
begin
 if private.actor_role() is distinct from 'SUPERMARKET' then raise exception 'Apenas supermercados publicam excedentes'; end if;
 select m.organization_id into org from public.organization_members m join public.organizations o on o.id=m.organization_id where m.profile_id=private.actor_id() and o.type='SUPERMARKET' limit 1;
 if org is null then raise exception 'Organização não encontrada'; end if;
 select * into a from private.analyses where id=analysis_id and profile_id=private.actor_id() for update;
 if a.id is null or a.published then raise exception 'Fotografia ausente ou já publicada'; end if;
 if (payload->>'user_confirmed')::boolean is distinct from true then raise exception 'Revise as informações antes de publicar'; end if;
 if length(payload->>'title') not between 3 and 120 or jsonb_array_length(payload->'items')>30 then raise exception 'Dados inválidos'; end if;
 hrs=(payload->>'recommended_pickup_hours')::integer;
 insert into public.surplus_batches(supermarket_id,created_by,title,category,description,image_url,estimated_weight_kg,estimated_weight_min,estimated_weight_max,visual_condition,pickup_priority,recommended_pickup_hours,expires_at,ai_analysis_json,ai_provider,ai_model,ai_confidence,user_confirmed,is_demo)
 values(org,private.actor_id(),payload->>'title',payload->>'category',payload->>'description',a.image_url,(payload->>'estimated_weight_kg')::numeric,(a.analysis->'estimated_weight_range'->>'min')::numeric,(a.analysis->'estimated_weight_range'->>'max')::numeric,payload->>'visual_condition',payload->>'pickup_priority',hrs,now()+make_interval(hours=>hrs),a.analysis,a.provider,a.model,(a.analysis->>'confidence')::numeric,true,exists(select 1 from public.profiles where id=private.actor_id() and email='mercado@ongsave.demo')) returning id into bid;
 for it in select * from jsonb_array_elements(payload->'items') loop
  insert into public.surplus_items(batch_id,name,estimated_quantity,confidence) values(bid,it->>'name',(it->>'estimated_quantity')::numeric,(it->>'confidence')::numeric);
 end loop;
 update private.analyses set published=true where id=a.id;
 insert into public.notifications(profile_id,type,title,body,metadata) select id,'BATCH_AVAILABLE','Nova doação disponível',(payload->>'estimated_weight_kg') || ' kg de ' || (payload->>'title'),jsonb_build_object('batch_id',bid) from public.profiles where role='NGO';
 return bid;
end $$;
create function public.publish_surplus(payload jsonb,analysis_id uuid) returns uuid language sql security invoker set search_path='' as $$ select private.publish_surplus(payload,analysis_id) $$;

create function private.reserve_donation(batch uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare b public.surplus_batches; n public.organizations; s public.organizations; prefs public.ngo_preferences; rid uuid; today_weight numeric;
begin
 if private.actor_role() is distinct from 'NGO' then raise exception 'Apenas ONGs podem aceitar doações'; end if;
 select * into b from public.surplus_batches where id=batch for update;
 if b.id is null or b.status<>'AVAILABLE' or b.expires_at<=now() then raise exception 'Esta doação não está mais disponível'; end if;
 select o.* into n from public.organizations o join public.organization_members m on m.organization_id=o.id where m.profile_id=private.actor_id() and o.type='NGO' limit 1;
 if n.id is null then raise exception 'Instituição não encontrada'; end if;
 select * into prefs from public.ngo_preferences where organization_id=n.id for update;
 select coalesce(sum(sb.estimated_weight_kg),0) into today_weight from public.rescues r join public.surplus_batches sb on sb.id=r.batch_id where r.ngo_id=n.id and r.status<>'CANCELLED' and (r.created_at at time zone 'America/Sao_Paulo')::date=(now() at time zone 'America/Sao_Paulo')::date;
 if prefs.id is null or not prefs.receiving_enabled or not (b.category=any(prefs.accepted_categories)) or today_weight+b.estimated_weight_kg>prefs.daily_capacity_kg then raise exception 'Confira a capacidade e as preferências de recebimento'; end if;
 if (now() at time zone 'America/Sao_Paulo')::time not between prefs.receiving_start and prefs.receiving_end then raise exception 'Instituição fora do horário de recebimento'; end if;
 select * into s from public.organizations where id=b.supermarket_id;
 insert into public.donation_reservations(batch_id,ngo_id,accepted_by) values(b.id,n.id,private.actor_id());
 insert into public.rescues(batch_id,supermarket_id,ngo_id,pickup_address,pickup_latitude,pickup_longitude,delivery_address,delivery_latitude,delivery_longitude,mock_distance_km,mock_eta_minutes,mock_route_geometry,reserved_at)
 values(b.id,s.id,n.id,s.address_line,s.latitude,s.longitude,n.address_line,n.latitude,n.longitude,round((sqrt(power(s.latitude-n.latitude,2)+power(s.longitude-n.longitude,2))*111*1.3)::numeric,1)+0.5,14,jsonb_build_array(jsonb_build_array(s.longitude,s.latitude),jsonb_build_array(s.longitude,n.latitude),jsonb_build_array(n.longitude,n.latitude)),now()) returning id into rid;
 update public.surplus_batches set status='RESERVED',updated_at=now() where id=b.id;
 insert into public.rescue_events(rescue_id,event_type,status,actor_profile_id) values(rid,'RESERVED','RESERVED',private.actor_id()),(rid,'WAITING_DRIVER','WAITING_DRIVER',private.actor_id());
 insert into public.notifications(profile_id,type,title,body,metadata) select profile_id,'DONATION_RESERVED',n.name || ' aceitou sua doação',b.title,jsonb_build_object('rescue_id',rid) from public.organization_members where organization_id=s.id;
 insert into public.notifications(profile_id,type,title,body,metadata) select id,'MISSION_AVAILABLE','Nova missão próxima',s.name || ' → ' || n.name,jsonb_build_object('rescue_id',rid) from public.profiles where role='DRIVER';
 return rid;
end $$;
create function public.reserve_donation(batch uuid) returns uuid language sql security invoker set search_path='' as $$ select private.reserve_donation(batch) $$;

create function private.accept_mission(rescue uuid) returns void language plpgsql security definer set search_path='' as $$
declare r public.rescues; d public.drivers; weight numeric;
begin
 if private.actor_role() is distinct from 'DRIVER' then raise exception 'Apenas motoristas podem aceitar missões'; end if;
 select * into r from public.rescues where id=rescue for update;
 if r.id is null or r.status<>'WAITING_DRIVER' then raise exception 'Outro motorista já aceitou esta missão'; end if;
 select * into d from public.drivers where profile_id=private.actor_id() for update;
 select estimated_weight_kg into weight from public.surplus_batches where id=r.batch_id;
 if d.id is null or not d.availability or d.vehicle_capacity_kg<weight then raise exception 'Veículo indisponível ou capacidade insuficiente'; end if;
 if exists(select 1 from public.rescues where driver_id=d.id and status not in ('DELIVERED','CANCELLED')) then raise exception 'Conclua sua missão atual primeiro'; end if;
 update public.rescues set driver_id=d.id,status='DRIVER_ASSIGNED',driver_assigned_at=now(),updated_at=now() where id=rescue;
 insert into public.rescue_events(rescue_id,event_type,status,actor_profile_id,metadata) values(rescue,'DRIVER_ASSIGNED','DRIVER_ASSIGNED',private.actor_id(),jsonb_build_object('driver_name',(select name from public.profiles where id=private.actor_id())));
 insert into public.notifications(profile_id,type,title,body,metadata) select profile_id,'DRIVER_ASSIGNED',(select name from public.profiles where id=private.actor_id()) || ' aceitou o resgate','A coleta será iniciada em breve.',jsonb_build_object('rescue_id',rescue) from public.organization_members where organization_id in (r.supermarket_id,r.ngo_id);
end $$;
create function public.accept_mission(rescue uuid) returns void language sql security invoker set search_path='' as $$ select private.accept_mission(rescue) $$;

create function private.advance_rescue(rescue uuid,next_status public.rescue_status,token text default null) returns boolean language plpgsql security definer set search_path='' as $$
declare r public.rescues; previous public.rescue_status; t private.rescue_tokens; impact jsonb;
begin
 select * into r from public.rescues where id=rescue for update;
 if r.id is null or private.actor_role() is distinct from 'DRIVER' or not exists(select 1 from public.drivers where id=r.driver_id and profile_id=private.actor_id()) then raise exception 'Você não é o motorista deste resgate'; end if;
 previous=r.status;
 if not ((previous='DRIVER_ASSIGNED' and next_status='GOING_TO_PICKUP') or (previous='GOING_TO_PICKUP' and next_status='AT_PICKUP') or (previous='AT_PICKUP' and next_status='PICKED_UP') or (previous='PICKED_UP' and next_status='IN_TRANSIT') or (previous='IN_TRANSIT' and next_status='AT_DESTINATION') or (previous='AT_DESTINATION' and next_status='DELIVERED')) then raise exception 'Transição de status inválida'; end if;
 if next_status='DELIVERED' then
  select * into t from private.rescue_tokens where rescue_id=rescue for update;
  if t.locked_until>now() then raise exception 'Muitas tentativas. Aguarde 1 minuto'; end if;
  if token is null or token !~ '^[0-9]{4}$' or token<>t.confirmation_token then
   update private.rescue_tokens set attempts=attempts+1,locked_until=case when (attempts+1)%5=0 then now()+interval '1 minute' else null end where rescue_id=rescue;
   return false;
  end if;
 end if;
 update public.rescues set status=next_status,updated_at=now(),going_to_pickup_at=case when next_status='GOING_TO_PICKUP' then now() else going_to_pickup_at end,arrived_pickup_at=case when next_status='AT_PICKUP' then now() else arrived_pickup_at end,picked_up_at=case when next_status='PICKED_UP' then now() else picked_up_at end,in_transit_at=case when next_status='IN_TRANSIT' then now() else in_transit_at end,arrived_destination_at=case when next_status='AT_DESTINATION' then now() else arrived_destination_at end,delivered_at=case when next_status='DELIVERED' then now() else delivered_at end where id=rescue;
 insert into public.rescue_events(rescue_id,event_type,status,actor_profile_id) values(rescue,next_status::text,next_status,private.actor_id());
 if next_status='DELIVERED' then
  update public.surplus_batches set status='DELIVERED',updated_at=now() where id=r.batch_id;
  update public.donation_reservations set status='COMPLETED' where batch_id=r.batch_id;
  select estimated_impact_json into impact from public.surplus_batches where id=r.batch_id;
  insert into public.impact_metrics(rescue_id,food_saved_kg,estimated_meals,estimated_disposal_savings,estimated_co2_avoided_kg,estimated_water_saved_liters) values(rescue,(impact->>'food_saved_kg')::numeric,(impact->>'estimated_meals')::integer,(impact->>'estimated_disposal_savings')::numeric,(impact->>'estimated_co2_avoided_kg')::numeric,(impact->>'estimated_water_saved_liters')::numeric) on conflict(rescue_id) do nothing;
 end if;
 insert into public.notifications(profile_id,type,title,body,metadata) select profile_id,next_status::text,case next_status when 'IN_TRANSIT' then 'Sua doação está a caminho' when 'DELIVERED' then 'Resgate concluído' else 'Resgate atualizado' end,'Acompanhe o resgate no ONGSave.',jsonb_build_object('rescue_id',rescue) from public.organization_members where organization_id in (r.supermarket_id,r.ngo_id);
 return true;
end $$;
create function public.advance_rescue(rescue uuid,next_status public.rescue_status,token text default null) returns boolean language sql security invoker set search_path='' as $$ select private.advance_rescue(rescue,next_status,token) $$;
create function private.delivery_token(rescue uuid) returns text language plpgsql security definer set search_path='' as $$
declare r public.rescues; result text;
begin
 select * into r from public.rescues where id=rescue;
 if auth.uid() is null or private.actor_role() is distinct from 'NGO' or not private.member(r.ngo_id) or r.status<>'AT_DESTINATION' then raise exception 'Código disponível à instituição quando o motorista chegar'; end if;
 select confirmation_token into result from private.rescue_tokens where rescue_id=rescue; return result;
end $$;
create function public.delivery_token(rescue uuid) returns text language sql security invoker set search_path='' as $$ select private.delivery_token(rescue) $$;

create function private.reset_demo(actor_auth_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare pid uuid;
begin
 select id into pid from public.profiles where auth_user_id=actor_auth_id and email='mercado@ongsave.demo' and role='SUPERMARKET';
 if pid is null then raise exception 'Use a conta oficial do supermercado para resetar'; end if;
 delete from public.notifications where profile_id in(select id from public.profiles where email in('mercado@ongsave.demo','ong@ongsave.demo','motorista@ongsave.demo'));
 delete from public.surplus_batches where is_demo and not is_seed;
 delete from public.rescues where batch_id in(select id from public.surplus_batches where is_seed and seed_kind='AVAILABLE');
 delete from public.donation_reservations where batch_id in(select id from public.surplus_batches where is_seed and seed_kind='AVAILABLE');
 delete from public.impact_metrics where rescue_id in(select r.id from public.rescues r join public.surplus_batches b on b.id=r.batch_id where b.seed_kind='MISSION');
 delete from public.rescue_events where rescue_id in(select r.id from public.rescues r join public.surplus_batches b on b.id=r.batch_id where b.seed_kind='MISSION');
 update public.rescues set status='WAITING_DRIVER',driver_id=null,driver_assigned_at=null,going_to_pickup_at=null,arrived_pickup_at=null,picked_up_at=null,in_transit_at=null,arrived_destination_at=null,delivered_at=null,cancelled_at=null,updated_at=now() where batch_id in(select id from public.surplus_batches where is_seed and seed_kind='MISSION');
 insert into public.rescue_events(rescue_id,event_type,status) select r.id,'WAITING_DRIVER','WAITING_DRIVER' from public.rescues r join public.surplus_batches b on b.id=r.batch_id where b.seed_kind='MISSION';
 update private.rescue_tokens set confirmation_token=lpad(floor(random()*10000)::text,4,'0'),attempts=0,locked_until=null where rescue_id in(select r.id from public.rescues r join public.surplus_batches b on b.id=r.batch_id where b.seed_kind='MISSION');
 update public.surplus_batches set status=case when seed_kind='MISSION' then 'RESERVED'::public.rescue_status else 'AVAILABLE'::public.rescue_status end,expires_at=now()+interval '36 hours',updated_at=now() where is_seed and seed_kind in ('MISSION','AVAILABLE');
 update public.donation_reservations set status='ACTIVE' where batch_id in(select id from public.surplus_batches where is_seed and seed_kind='MISSION');
 delete from private.analyses where profile_id=pid;
 update public.drivers set availability=true where profile_id in(select id from public.profiles where email='motorista@ongsave.demo');
 update public.ngo_preferences set receiving_enabled=true,daily_capacity_kg=250,receiving_start='00:00',receiving_end='23:59',accepted_categories=array['produce','bakery','dairy','prepared_food','dry_goods','frozen','other'],current_needs=array['produce','bakery'],has_fridge=true,has_freezer=true,service_radius_km=20 where organization_id=md5('ongsave:instituto-esperanca')::uuid;
end $$;
create function public.reset_demo(actor_auth_id uuid) returns void language sql security invoker set search_path='' as $$ select private.reset_demo(actor_auth_id) $$;
revoke all on function public.reset_demo(uuid) from public,authenticated;
grant execute on function public.reset_demo(uuid) to service_role;

revoke all on all functions in schema private from public;
grant execute on function private.actor_id(),private.actor_role(),private.member(uuid),private.can_read_rescue(uuid),private.can_read_batch(uuid),private.publish_surplus(jsonb,uuid),private.reserve_donation(uuid),private.accept_mission(uuid),private.advance_rescue(uuid,public.rescue_status,text),private.delivery_token(uuid) to authenticated;
grant usage on schema private to service_role;
grant execute on function private.record_analysis(text,jsonb,text,text,uuid),private.reset_demo(uuid) to service_role;
revoke execute on function public.record_analysis(text,jsonb,text,text,uuid),public.reset_demo(uuid),public.publish_surplus(jsonb,uuid),public.reserve_donation(uuid),public.accept_mission(uuid),public.advance_rescue(uuid,public.rescue_status,text),public.delivery_token(uuid) from public;
grant execute on function public.publish_surplus(jsonb,uuid),public.reserve_donation(uuid),public.accept_mission(uuid),public.advance_rescue(uuid,public.rescue_status,text),public.delivery_token(uuid) to authenticated;
grant all on public.profiles,public.organizations,public.organization_members,public.ngo_preferences,public.drivers,public.surplus_batches,public.surplus_items,public.donation_reservations,public.rescues,public.rescue_events,public.impact_metrics,public.notifications to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('surplus','surplus',false,4194304,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy upload_own_image on storage.objects for insert to authenticated with check(bucket_id='surplus' and (storage.foldername(name))[1]=auth.uid()::text and private.actor_role()='SUPERMARKET');
create policy read_surplus_image on storage.objects for select to authenticated using(bucket_id='surplus' and ((storage.foldername(name))[1]=auth.uid()::text or exists(select 1 from public.surplus_batches b where b.image_url=name and private.can_read_batch(b.id))));
create policy remove_own_unpublished_image on storage.objects for delete to authenticated using(bucket_id='surplus' and (storage.foldername(name))[1]=auth.uid()::text and not exists(select 1 from public.surplus_batches where image_url=name));
do $$ declare tbl text; begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  foreach tbl in array array['surplus_batches','donation_reservations','rescues','rescue_events','impact_metrics','notifications'] loop
   execute format('alter publication supabase_realtime add table public.%I',tbl);
  end loop;
 end if;
end $$;
