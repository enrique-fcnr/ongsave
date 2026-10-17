create or replace function private.propose_supermarket_contract() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_plan_tier text := case
    when new.slug in ('supermercado-aurora', 'joanin-mooca', 'mercado-nova-vida') then 'SMALL'
    when new.slug in ('assai-mooca', 'sonda-itaberaba', 'sonda-jacana', 'emporio-central') then 'LARGE'
    else 'MEDIUM'
  end;
  v_monthly_amount numeric := case
    when new.slug in ('supermercado-aurora', 'joanin-mooca', 'mercado-nova-vida') then 299.00
    when new.slug in ('assai-mooca', 'sonda-itaberaba', 'sonda-jacana', 'emporio-central') then 999.00
    else 499.00
  end;
begin
  if new.type = 'SUPERMARKET' then
    insert into public.supermarket_contracts (organization_id, monthly_amount, plan_tier, status)
    values (new.id, v_monthly_amount, v_plan_tier, 'PROPOSED')
    on conflict (organization_id) do nothing;
  end if;
  return new;
end;
$$;
