-- Run after schema.sql and explore.sql. Existing offers are not modified by setup.
-- Repeatable. New discovery data is private; only the server secret role can use it.
begin;
create table if not exists public.discovery_sources (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id),
 location_id uuid not null references public.locations(id),
 url text not null unique check(length(url)<2000 and url like 'https://%'),
 enabled boolean not null default true,
 last_hash text, last_checked_at timestamptz, last_error text
);
create table if not exists public.discovery_candidates (
 id uuid primary key default gen_random_uuid(),
 source_id uuid not null references public.discovery_sources(id),
 fingerprint text not null check(length(fingerprint)=64),
 title text not null, excerpt text not null check(length(excerpt)<=16000),
 kind text not null check(kind in ('new','changed','removed','review_due')),
 state text not null default 'pending' check(state in ('pending','reviewed','dismissed')),
 discovered_at timestamptz not null default now(),
 reviewed_at timestamptz, reviewed_by uuid,
 unique(source_id,fingerprint)
);
create table if not exists public.discovery_runs (
 id uuid primary key, started_at timestamptz not null default now(), finished_at timestamptz,
 state text not null default 'running' check(state in ('running','completed','partial','failed')),
 checked integer not null default 0, queued integer not null default 0,
 errors jsonb not null default '[]'
);
create table if not exists public.discovery_lease (
 id integer primary key check(id=1), token uuid, expires_at timestamptz not null default now()
);
create table if not exists public.discovery_reviews (
 id uuid primary key default gen_random_uuid(),
 candidate_id uuid not null references public.discovery_candidates(id),
 benefit_id uuid references public.benefits(id), reviewer_id uuid not null,
 action text not null, reviewed_at timestamptz not null default now(), payload jsonb
);
create index if not exists discovery_pending_idx on public.discovery_candidates(state,discovered_at desc);
insert into public.discovery_lease(id) values(1) on conflict(id) do nothing;

alter table public.discovery_sources enable row level security;
alter table public.discovery_candidates enable row level security;
alter table public.discovery_runs enable row level security;
alter table public.discovery_lease enable row level security;
alter table public.discovery_reviews enable row level security;
revoke all on public.discovery_sources,public.discovery_candidates,public.discovery_runs,
 public.discovery_lease,public.discovery_reviews from public,anon,authenticated;
grant all on public.discovery_sources,public.discovery_candidates,public.discovery_runs,
 public.discovery_lease,public.discovery_reviews to service_role;

-- Existing official businesses only. Each newly followed link inherits its business/location.
insert into public.discovery_sources(business_id,location_id,url) values
 ('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000201','https://tickets.midway.org/webstore/shop/viewitems.aspx?cg=ticketingdated&c=genadm'),
 ('00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000202','https://navysealmuseumsd.org/visit/'),
 ('00000000-0000-0000-0000-000000000103','00000000-0000-0000-0000-000000000203','https://seaworld.com/san-diego/tickets/military-discount-active/'),
 ('00000000-0000-0000-0000-000000000103','00000000-0000-0000-0000-000000000203','https://seaworld.com/san-diego/tickets/military-discount-veteran/'),
 ('00000000-0000-0000-0000-000000000104','00000000-0000-0000-0000-000000000204','https://www.gondolacompany.com/'),
 ('00000000-0000-0000-0000-000000000105','00000000-0000-0000-0000-000000000205','https://wildpacificwhalewatch.com/')
on conflict(url) do nothing;

create or replace function public.begin_discovery_run() returns uuid
language plpgsql security invoker set search_path='' as $$
declare v_token uuid:=gen_random_uuid();
begin
 update public.discovery_lease set token=v_token,expires_at=now()+interval '6 minutes'
 where id=1 and expires_at<now();
 if not found then return null; end if;
 update public.discovery_runs set state='failed',finished_at=now(),errors='["Previous run timed out"]'
 where state='running';
 insert into public.discovery_runs(id) values(v_token);
 return v_token;
end $$;

create or replace function public.record_discovery_snapshot(
 p_run uuid,p_source uuid,p_hash text,p_title text,p_excerpt text,p_found boolean
) returns boolean language plpgsql security invoker set search_path='' as $$
declare s public.discovery_sources; v_due boolean; v_kind text;
begin
 if not exists(select 1 from public.discovery_lease where id=1 and token=p_run and expires_at>now()) then
   raise exception 'Discovery lease expired'; end if;
 select * into strict s from public.discovery_sources where id=p_source for update;
 if not s.enabled then return false; end if;
 select exists(select 1 from public.benefit_verifications v join public.benefits b on b.id=v.benefit_id
   where v.source_url=s.url and b.status='verified' and (b.expires_at is null or b.expires_at>=current_date)
     and v.next_review_at<=now()+interval '7 days'
     and v.id=(select v2.id from public.benefit_verifications v2 where v2.benefit_id=v.benefit_id
       order by v2.verified_at desc nulls last,v2.id desc limit 1)) into v_due;
 update public.discovery_sources set last_hash=p_hash,last_checked_at=now(),last_error=null where id=p_source;
 if s.last_hash is not distinct from p_hash and not v_due then return false; end if;
 if s.last_hash is null and not p_found then return false; end if;
 v_kind:=case when not p_found then 'removed' when s.last_hash is null then 'new'
   when s.last_hash=p_hash then 'review_due' else 'changed' end;
 if s.last_hash is not null and s.last_hash<>p_hash then
   -- A changed source needs a human recheck. The public search already hides overdue verifications.
   update public.benefit_verifications set next_review_at=now()
   where source_url=s.url and verified_at is not null;
 end if;
 insert into public.discovery_candidates(source_id,fingerprint,title,excerpt,kind)
 values(p_source,p_hash,left(p_title,200),left(p_excerpt,16000),v_kind)
 on conflict(source_id,fingerprint) do update set
   state=case when v_kind in ('changed','removed') or (public.discovery_candidates.state='reviewed' and v_due) then 'pending' else public.discovery_candidates.state end,
   discovered_at=case when public.discovery_candidates.state<>'pending' and (v_kind in ('changed','removed') or v_due) then now() else public.discovery_candidates.discovered_at end,
   kind=excluded.kind,title=excluded.title,excerpt=excluded.excerpt;
 return exists(select 1 from public.discovery_candidates where source_id=p_source and fingerprint=p_hash and state='pending');
end $$;

create or replace function public.finish_discovery_run(p_run uuid,p_checked int,p_queued int,p_errors jsonb)
returns void language plpgsql security invoker set search_path='' as $$
begin
 update public.discovery_runs set finished_at=now(),checked=p_checked,queued=p_queued,errors=p_errors,
   state=case when jsonb_array_length(p_errors)>0 then 'partial' else 'completed' end
 where id=p_run and state='running';
 update public.discovery_lease set expires_at=now() where id=1 and token=p_run;
end $$;

create or replace function public.review_discovery_offer(
 p_candidate uuid,p_actor uuid,p_action text,p_benefit uuid default null,p_offer jsonb default '{}'
) returns uuid language plpgsql security invoker set search_path='' as $$
declare c public.discovery_candidates; s public.discovery_sources; v_id uuid; e text;
begin
 if p_actor is null then raise exception 'Reviewer required'; end if;
 select * into strict c from public.discovery_candidates where id=p_candidate for update;
 select * into strict s from public.discovery_sources where id=c.source_id for update;
 if p_action='approve' and s.url ~ '^https://(whidbey[.]navylifepnw[.]com|sandiego[.]navylifesw[.]com)/' then
   raise exception 'MWR reference catalogs require destination-specific offer setup; cannot publish the catalog as an attraction';
 end if;
 if c.state<>'pending' then raise exception 'Review is closed'; end if;
 if p_action in ('dismiss','done') then
   update public.discovery_candidates set state=case when p_action='dismiss' then 'dismissed' else 'reviewed' end,
     reviewed_by=p_actor,reviewed_at=now() where id=p_candidate;
   insert into public.discovery_reviews(candidate_id,reviewer_id,action) values(p_candidate,p_actor,p_action);
   return null;
 end if;
 if p_action<>'approve' or c.kind='removed' then raise exception 'Cannot approve this candidate'; end if;
 if c.fingerprint is distinct from s.last_hash or not s.enabled then raise exception 'Review is stale or disabled'; end if;
 select benefit_id into v_id from public.discovery_reviews
 where candidate_id=p_candidate and action='approve' and reviewed_at>=c.discovered_at and payload=p_offer
   and (p_benefit is null or benefit_id=p_benefit) order by reviewed_at desc limit 1;
 if found then return v_id; end if;
 if length(btrim(coalesce(p_offer->>'title','')))<3 or length(btrim(coalesce(p_offer->>'description','')))<10
   or length(btrim(coalesce(p_offer->>'requirements','')))<5 then raise exception 'Complete offer terms required'; end if;
 if not(p_offer->>'category'=any(array['food','hotel','attraction','tour','entertainment','shopping','automotive','fitness','education','financial'])) then raise exception 'Invalid category'; end if;
 if jsonb_typeof(p_offer->'eligibility') is distinct from 'array' or jsonb_array_length(p_offer->'eligibility')=0 then raise exception 'Eligibility required'; end if;
 for e in select jsonb_array_elements_text(p_offer->'eligibility') loop
   if e<>all(array['active_duty','reserve_guard','veteran','retired','family']) then raise exception 'Invalid eligibility'; end if;
 end loop;
 if not coalesce((p_offer->>'noExpiry')::boolean,false) and nullif(p_offer->>'expiresAt','') is null then raise exception 'Expiry decision required'; end if;
 if nullif(p_offer->>'expiresAt','')::date<current_date then raise exception 'Offer expired'; end if;
 if nullif(p_offer->>'startsAt','')::date>nullif(p_offer->>'expiresAt','')::date then raise exception 'Invalid dates'; end if;
 if (nullif(p_offer->>'normalPrice',''))::numeric<0 or (nullif(p_offer->>'militaryPrice',''))::numeric<0 then raise exception 'Invalid prices'; end if;
 if p_benefit is null then
   if exists(select 1 from public.benefits where business_id=s.business_id and location_id=s.location_id
     and lower(btrim(title))=lower(btrim(p_offer->>'title'))) then
     raise exception 'An offer with this title already exists; update it instead'; end if;
   insert into public.benefits(business_id,location_id,title,description,requirements,category,status,starts_at,expires_at,normal_price,military_price)
   values(s.business_id,s.location_id,p_offer->>'title',p_offer->>'description',p_offer->>'requirements',p_offer->>'category','verified',
     nullif(p_offer->>'startsAt','')::date,nullif(p_offer->>'expiresAt','')::date,
     nullif(p_offer->>'normalPrice','')::numeric,nullif(p_offer->>'militaryPrice','')::numeric) returning id into v_id;
 else
   update public.benefits set title=p_offer->>'title',description=p_offer->>'description',requirements=p_offer->>'requirements',
     category=p_offer->>'category',status='verified',starts_at=nullif(p_offer->>'startsAt','')::date,
     expires_at=nullif(p_offer->>'expiresAt','')::date,normal_price=nullif(p_offer->>'normalPrice','')::numeric,
     military_price=nullif(p_offer->>'militaryPrice','')::numeric,discount_type=null,discount_value=null
   where id=p_benefit and business_id=s.business_id and location_id=s.location_id returning id into v_id;
   if not found then raise exception 'Existing offer belongs to another location'; end if;
 end if;
 delete from public.benefit_eligibility where benefit_id=v_id;
 insert into public.benefit_eligibility(benefit_id,status)
 select distinct v_id,value::public.military_status from jsonb_array_elements_text(p_offer->'eligibility');
 -- Old sources cannot continue to verify an offer after this review replaces its terms.
 update public.benefit_verifications set next_review_at=now() where benefit_id=v_id;
 insert into public.benefit_verifications(benefit_id,source_url,source_name,verification_method,verified_at,next_review_at,notes)
 values(v_id,s.url,'Official business source','human_review',now(),now()+interval '30 days','Discovery candidate '||c.id||'; reviewer '||p_actor);
 insert into public.discovery_reviews(candidate_id,benefit_id,reviewer_id,action,payload)
 values(p_candidate,v_id,p_actor,'approve',p_offer);
 -- Keep the page open for multiple distinct offers; reviewer closes it when done.
 return v_id;
end $$;

revoke execute on function public.begin_discovery_run(),public.record_discovery_snapshot(uuid,uuid,text,text,text,boolean),
 public.finish_discovery_run(uuid,int,int,jsonb),public.review_discovery_offer(uuid,uuid,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.begin_discovery_run(),public.record_discovery_snapshot(uuid,uuid,text,text,text,boolean),
 public.finish_discovery_run(uuid,int,int,jsonb),public.review_discovery_offer(uuid,uuid,text,uuid,jsonb) to service_role;
notify pgrst,'reload schema';
commit;
