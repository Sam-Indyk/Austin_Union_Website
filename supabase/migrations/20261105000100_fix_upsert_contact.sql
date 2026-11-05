-- Fix: inside upsert_contact, the unqualified person_id clashed with the
-- function's own output column, so brand-new contacts failed to save.

create or replace function public.upsert_contact(
  p_email text, p_first text, p_last text, p_source text, p_opt_in text default 'none'
) returns table (person_id uuid, created boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_created boolean := false;
begin
  select pe.person_id into v_id from public.person_emails pe where pe.email = lower(p_email);
  if v_id is null then
    insert into public.people (email, first_name, last_name, source, subscribed, subscribed_at)
    values (lower(p_email), nullif(p_first, ''), nullif(p_last, ''), p_source, p_opt_in <> 'none', case when p_opt_in <> 'none' then now() end)
    on conflict (email) do nothing
    returning id into v_id;
    v_created := v_id is not null;
    if v_id is null then
      select id into v_id from public.people where email = lower(p_email);
    end if;
  end if;
  if not v_created then
    update public.people set
      first_name = coalesce(first_name, nullif(p_first, '')),
      last_name = coalesce(last_name, nullif(p_last, '')),
      subscribed = case
        when p_opt_in = 'explicit' then true
        when p_opt_in = 'implicit' and unsubscribed_at is null then true
        else subscribed end,
      subscribed_at = case
        when not subscribed and (p_opt_in = 'explicit' or (p_opt_in = 'implicit' and unsubscribed_at is null)) then now()
        else subscribed_at end,
      unsubscribed_at = case when p_opt_in = 'explicit' then null else unsubscribed_at end
    where id = v_id;
  end if;
  return query select v_id, v_created;
end $$;

revoke execute on function public.upsert_contact(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.upsert_contact(text, text, text, text, text) to service_role;
