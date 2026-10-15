create table public.supermarket_contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid unique not null references public.organizations(id) on delete cascade,
  monthly_amount numeric(12,2) not null check (monthly_amount > 0),
  status text not null default 'PROPOSED' check (status in ('PROPOSED','ACTIVE','PAUSED','CANCELLED')),
  started_on date,
  billing_day smallint not null default 1 check (billing_day between 1 and 28),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.supermarket_contract_installments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.supermarket_contracts(id) on delete cascade,
  period date not null,
  amount numeric(12,2) not null check (amount > 0),
  due_on date not null,
  status text not null default 'PENDING' check (status in ('PENDING','PAID','OVERDUE')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (contract_id, period),
  check ((status = 'PAID') = (paid_at is not null))
);

create index supermarket_contract_installments_contract_period_idx
  on public.supermarket_contract_installments(contract_id, period desc);

alter table public.supermarket_contracts enable row level security;
alter table public.supermarket_contract_installments enable row level security;
revoke all on public.supermarket_contracts, public.supermarket_contract_installments from anon, authenticated;
grant select, insert, update, delete on public.supermarket_contracts, public.supermarket_contract_installments to authenticated;

create policy admin_contracts_read on public.supermarket_contracts
  for select to authenticated using (private.actor_role() = 'ADMIN');
create policy admin_contracts_write on public.supermarket_contracts
  for all to authenticated using (private.actor_role() = 'ADMIN')
  with check (private.actor_role() = 'ADMIN');
create policy admin_installments_read on public.supermarket_contract_installments
  for select to authenticated using (private.actor_role() = 'ADMIN');
create policy admin_installments_write on public.supermarket_contract_installments
  for all to authenticated using (private.actor_role() = 'ADMIN')
  with check (private.actor_role() = 'ADMIN');

-- Add a proposed term for supermarkets created by the existing demo seed or later.
create function private.propose_supermarket_contract() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.type = 'SUPERMARKET' then
    insert into public.supermarket_contracts (organization_id, monthly_amount, status)
    values (new.id, 499.00, 'PROPOSED')
    on conflict (organization_id) do nothing;
  end if;
  return new;
end;
$$;
create trigger propose_supermarket_contract
  after insert on public.organizations
  for each row execute function private.propose_supermarket_contract();

-- Include supermarkets already present at migration time; no payment is recorded.
insert into public.supermarket_contracts (organization_id, monthly_amount, status)
select id, 499.00, 'PROPOSED'
from public.organizations
where type = 'SUPERMARKET'
on conflict (organization_id) do nothing;
