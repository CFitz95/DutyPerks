-- Additive setup for an existing DutyPerks database. Does not change coordinates.
begin;
-- Roles describe how a record is used, not who supplies its offers.
-- An attraction may be an MWR offer destination; MWR itself is not the destination.
alter table public.locations add column if not exists coordinate_role text not null default 'destination'
  check (coordinate_role in ('destination','organization_resource','purchase_office'));
update public.locations set coordinate_role='organization_resource'
where id='00000000-0000-0000-0000-000000001203';
update public.locations set coordinate_role='purchase_office'
where id='00000000-0000-0000-0000-000000001202';
create table if not exists public.location_geocode_reviews (
  location_id uuid primary key references public.locations(id) on delete cascade,
  revision uuid not null default gen_random_uuid(),
  snapshot jsonb not null,
  proposal jsonb not null,
  status text not null,
  attempts integer not null default 1,
  checked_at timestamptz not null default now(),
  reviewed_at timestamptz
);
alter table public.location_geocode_reviews enable row level security;
revoke all on public.location_geocode_reviews from public, anon, authenticated;
grant select on public.location_geocode_reviews to service_role;

create or replace function public.geocode_snapshot(l public.locations)
returns jsonb language sql immutable set search_path=public,pg_temp as $$
  select jsonb_build_object('name',l.name,'address',l.address,'city',l.city,'state',l.state,
    'postal_code',l.postal_code,'country',l.country,'coordinate_role',l.coordinate_role)
$$;

create or replace function public.store_geocode_proposal(p_location uuid,p_snapshot jsonb,p_proposal jsonb)
returns boolean language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare l public.locations; r public.location_geocode_reviews; lat double precision; lon double precision;
begin
  if p_snapshot is null or p_proposal is null or p_proposal->>'status' is null then return false; end if;
  select * into l from public.locations where id=p_location for update;
  if not found or l.coordinates is not null or l.coordinate_role<>'destination' or public.geocode_snapshot(l)<>p_snapshot then return false; end if;
  if p_proposal->>'status' not in ('review','ambiguous','no_match','address_mismatch','organization_resource','purchase_office','unsupported_role','address_needed','unsupported_country','failed') then raise exception 'Invalid status'; end if;
  if p_proposal->>'status'='review' then
    lat:=(p_proposal->>'latitude')::double precision; lon:=(p_proposal->>'longitude')::double precision;
    if lat is null or lon is null or not(lat between -90 and 90) or not(lon between -180 and 180) then raise exception 'Invalid point'; end if;
  end if;
  select * into r from public.location_geocode_reviews where location_id=p_location for update;
  if found and r.snapshot=p_snapshot and r.status<>'failed' then return false; end if;
  if found and r.snapshot=p_snapshot and (r.attempts>=3 or r.checked_at>now()-interval '1 day') then return false; end if;
  insert into public.location_geocode_reviews(location_id,snapshot,proposal,status)
    values(p_location,p_snapshot,p_proposal,p_proposal->>'status')
    on conflict(location_id) do update set snapshot=excluded.snapshot,proposal=excluded.proposal,status=excluded.status,
      revision=gen_random_uuid(),checked_at=now(),reviewed_at=null,
      attempts=case when location_geocode_reviews.snapshot=excluded.snapshot then location_geocode_reviews.attempts+1 else 1 end;
  return true;
end $$;

create or replace function public.review_geocode_proposal(p_location uuid,p_revision uuid,p_action text)
returns boolean language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare l public.locations; r public.location_geocode_reviews; lat double precision; lon double precision;
begin
  if p_revision is null or p_action is null or p_action not in ('approve','dismiss') then return false; end if;
  select * into l from public.locations where id=p_location for update;
  if not found or l.coordinates is not null or l.coordinate_role<>'destination' then return false; end if;
  select * into r from public.location_geocode_reviews where location_id=p_location for update;
  if not found or r.revision<>p_revision or r.status in ('saved','dismissed') or r.snapshot<>public.geocode_snapshot(l) then return false; end if;
  if p_action='approve' then
    if r.status<>'review' then return false; end if;
    lat:=(r.proposal->>'latitude')::double precision; lon:=(r.proposal->>'longitude')::double precision;
    if lat is null or lon is null or not(lat between -90 and 90) or not(lon between -180 and 180) then return false; end if;
    update public.locations set coordinates=ST_SetSRID(ST_MakePoint(lon,lat),4326)::geography where id=p_location and coordinates is null;
  end if;
  update public.location_geocode_reviews set status=case when p_action='approve' then 'saved' else 'dismissed' end,reviewed_at=now() where location_id=p_location;
  return true;
end $$;
revoke all on function public.geocode_snapshot(public.locations) from public,anon,authenticated;
revoke all on function public.store_geocode_proposal(uuid,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.review_geocode_proposal(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.store_geocode_proposal(uuid,jsonb,jsonb) to service_role;
grant execute on function public.review_geocode_proposal(uuid,uuid,text) to service_role;
commit;
