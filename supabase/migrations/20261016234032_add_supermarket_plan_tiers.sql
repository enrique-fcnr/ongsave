alter table public.supermarket_contracts
  add column plan_tier text not null default 'MEDIUM'
  check (plan_tier in ('SMALL', 'MEDIUM', 'LARGE'));

-- The existing demonstration contracts are proposals without payment history.
-- Split them across the three tiers while preserving any contract with installments.
update public.supermarket_contracts c
set
  plan_tier = case
    when o.slug in ('supermercado-aurora', 'joanin-mooca', 'mercado-nova-vida') then 'SMALL'
    when o.slug in ('assai-mooca', 'sonda-itaberaba', 'sonda-jacana', 'emporio-central') then 'LARGE'
    else 'MEDIUM'
  end,
  monthly_amount = case
    when o.slug in ('supermercado-aurora', 'joanin-mooca', 'mercado-nova-vida') then 299.00
    when o.slug in ('assai-mooca', 'sonda-itaberaba', 'sonda-jacana', 'emporio-central') then 999.00
    else 499.00
  end
from public.organizations o
where o.id = c.organization_id
  and o.type = 'SUPERMARKET'
  and c.status = 'PROPOSED'
  and not exists (
    select 1 from public.supermarket_contract_installments i where i.contract_id = c.id
  );

create or replace function private.propose_supermarket_contract() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.type = 'SUPERMARKET' then
    insert into public.supermarket_contracts (organization_id, monthly_amount, plan_tier, status)
    values (new.id, 499.00, 'MEDIUM', 'PROPOSED')
    on conflict (organization_id) do nothing;
  end if;
  return new;
end;
$$;
