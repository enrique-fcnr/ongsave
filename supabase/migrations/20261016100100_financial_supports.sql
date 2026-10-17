alter table public.organizations drop constraint if exists organizations_type_check;
alter table public.organizations
  add constraint organizations_type_check
  check (type in ('SUPERMARKET', 'NGO', 'FINANCIAL_DONOR'));

create table public.financial_supports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'PLEDGED' check (status in ('PLEDGED', 'RECEIVED', 'DECLINED')),
  purpose text not null default 'Apoio ao custeio das entregas',
  note text,
  received_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status = 'RECEIVED') = (received_at is not null))
);

create index financial_supports_org_created_idx
  on public.financial_supports (organization_id, created_at desc);

alter table public.financial_supports enable row level security;
revoke all on public.financial_supports from anon, authenticated;
grant select, insert, update on public.financial_supports to authenticated;

create policy financial_supports_read on public.financial_supports
  for select to authenticated
  using (private.actor_role() = 'ADMIN' or private.member(organization_id));
create policy financial_supports_insert on public.financial_supports
  for insert to authenticated
  with check (
    private.actor_role() = 'FINANCIAL_DONOR'
    and private.member(organization_id)
    and created_by = private.actor_id()
  );
create policy financial_supports_update on public.financial_supports
  for update to authenticated
  using (private.actor_role() = 'ADMIN')
  with check (private.actor_role() = 'ADMIN');

grant all on public.financial_supports to service_role;
