-- Operational time comes from the same clock that records deliveries/deadlines.
create function public.operational_time() returns timestamptz
language sql stable security invoker set search_path = '' as $$ select now() $$;
revoke all on function public.operational_time() from public, anon;
grant execute on function public.operational_time() to authenticated, service_role;
