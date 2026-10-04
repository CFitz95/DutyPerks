-- Run AFTER schema.sql (or security.sql) in Supabase SQL Editor.
-- Repeatable. Grants one read-only, bounded public operation; base tables stay closed.
begin;
create or replace function public.search_verified_benefits(
  p_location text default '', p_status text default '', p_category text default ''
)
returns table (
  id uuid, title text, description text, category text, requirements text,
  business_name text, city text, state text, postal_code text,
  eligibility text[], source_url text, source_name text,
  verified_at timestamptz, expires_at date
)
language sql stable security definer set search_path = ''
as $$
  select b.id, b.title, b.description, b.category, b.requirements,
    biz.name, l.city, l.state, l.postal_code,
    array(select e.status::text from public.benefit_eligibility e
          where e.benefit_id = b.id order by e.status::text),
    v.source_url, v.source_name, v.verified_at, b.expires_at
  from public.benefits b
  join public.businesses biz on biz.id = b.business_id
  join public.locations l on l.id = b.location_id
  join lateral (
    select bv.source_url, bv.source_name, bv.verified_at
    from public.benefit_verifications bv
    where bv.benefit_id = b.id
      and bv.verified_at is not null and bv.verified_at <= now()
      and bv.source_url ~ '^https://[^[:space:]]+$'
      and (bv.next_review_at is null or bv.next_review_at > now())
    order by bv.verified_at desc, bv.id
    limit 1
  ) v on true
  where b.status = 'verified'
    and (b.starts_at is null or b.starts_at <= current_date)
    and (b.expires_at is null or b.expires_at >= current_date)
    and length(coalesce(p_location, '')) <= 120
    and (coalesce(p_status, '') = '' or p_status in
      ('active_duty','reserve_guard','veteran','retired','family'))
    and (coalesce(p_category, '') = '' or p_category in
      ('food','hotel','attraction','tour','entertainment','shopping','automotive','fitness','education','financial'))
    and (coalesce(btrim(p_location), '') = ''
      or lower(l.city) = lower(btrim(p_location))
      or lower(l.city || ', ' || l.state) = lower(btrim(p_location))
      or l.postal_code = btrim(p_location))
    and (coalesce(p_status, '') = '' or exists (
      select 1 from public.benefit_eligibility e
      where e.benefit_id = b.id and e.status::text = p_status))
    and (coalesce(p_category, '') = '' or b.category = p_category)
  order by v.verified_at desc, b.id
  limit 100;
$$;
-- SECURITY DEFINER is intentional: expose ONLY the projection above, never
-- table SELECT, verification notes, writes, trip data, or credentials.
revoke all on function public.search_verified_benefits(text,text,text) from public, anon, authenticated;
grant execute on function public.search_verified_benefits(text,text,text) to anon, authenticated;
comment on function public.search_verified_benefits(text,text,text) is
  'Read-only public verified offers. Explicit safe columns, fixed search_path, bounded results. No private notes or writes.';
notify pgrst, 'reload schema';
commit;
