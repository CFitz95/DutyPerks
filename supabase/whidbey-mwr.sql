-- Apply AFTER automation.sql. Repeatable; creates PRIVATE drafts and sources.
-- No existing benefit is deleted, verified, or replaced by running this setup.
begin;
insert into public.businesses(id,name,website,phone) values
 ('00000000-0000-0000-0000-000000001101','Whidbey Island Kayaking','https://www.whidbeyislandkayaking.com/','360-221-0229'),
 ('00000000-0000-0000-0000-000000001102','NAS Whidbey Island MWR Tickets & Travel','https://whidbey.navylifepnw.com/programs/5e144188-b642-4184-bde4-43fc6373469e','360-257-2432'),
 ('00000000-0000-0000-0000-000000001103','Naval Base San Diego MWR Tickets & Travel','https://sandiego.navylifesw.com/recreation/tickets-travel-itt','619-556-7498')
on conflict(id) do nothing;
insert into public.locations(id,business_id,name,address,city,state,postal_code) values
 ('00000000-0000-0000-0000-000000001201','00000000-0000-0000-0000-000000001101','Headquarters; confirm activity launch location','5781 Bayview Road','Langley','WA','98260'),
 ('00000000-0000-0000-0000-000000001202','00000000-0000-0000-0000-000000001102','Convergence Zone ticket office','3535 N Princeton Street, Building 2510','Oak Harbor','WA','98278'),
 ('00000000-0000-0000-0000-000000001203','00000000-0000-0000-0000-000000001103','NBSD ticket offices; see official office map',null,'San Diego','CA',null)
on conflict(id) do nothing;

insert into public.benefits(id,business_id,location_id,title,description,requirements,category,discount_type,discount_value,status) values
 ('00000000-0000-0000-0000-000000001301','00000000-0000-0000-0000-000000001101','00000000-0000-0000-0000-000000001201',
 'Whidbey Island Kayaking: 10% military discount',
 'Active-duty members and veterans receive 10% off tours and rentals. Enter ARMEDFORCES10 when booking. Prices depend on the activity; this is not a fixed-price ticket.',
 'The published military offer names active-duty members and veterans of the United States Armed Forces. Other groups are not confirmed. Tour launch locations vary: use your booking confirmation. Availability is seasonal and weather dependent; follow the operator''s reservation, waiver and cancellation terms. The FAQ does not state an expiration date or a specific ID requirement; confirm proof requirements with the business.',
 'tour','percentage',10,'pending')
on conflict(id) do nothing;
insert into public.benefit_eligibility(benefit_id,status)
select b.id, e.status::public.military_status from public.benefits b
cross join (values ('active_duty'),('veteran')) e(status)
where b.id='00000000-0000-0000-0000-000000001301' and b.status='pending'
on conflict(benefit_id,status) do nothing;

insert into public.discovery_sources(business_id,location_id,url) values
 ('00000000-0000-0000-0000-000000001101','00000000-0000-0000-0000-000000001201','https://www.whidbeyislandkayaking.com/faq'),
 ('00000000-0000-0000-0000-000000001102','00000000-0000-0000-0000-000000001202','https://whidbey.navylifepnw.com/programs/5e144188-b642-4184-bde4-43fc6373469e'),
 ('00000000-0000-0000-0000-000000001102','00000000-0000-0000-0000-000000001202','https://whidbey.navylifepnw.com/modules/media/?do=download&id=84f60df1-0961-43af-ac48-954af59600b4'),
 ('00000000-0000-0000-0000-000000001103','00000000-0000-0000-0000-000000001203','https://sandiego.navylifesw.com/recreation/tickets-travel-itt'),
 ('00000000-0000-0000-0000-000000001103','00000000-0000-0000-0000-000000001203','https://sandiego.navylifesw.com/modules/media/?do=download&id=f87fcc7d-b080-41f0-a9d7-2e3528198452')
on conflict(url) do nothing;

-- Updated public search and guarded review functions follow.

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
      or l.postal_code = btrim(p_location)
      or (lower(btrim(p_location)) in ('whidbey island','whidbey island, wa','whidbey island wa')
        and l.state = 'WA' and lower(l.city) in ('oak harbor','langley','coupeville','freeland','clinton','greenbank')))
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

revoke execute on function public.review_discovery_offer(uuid,uuid,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.review_discovery_offer(uuid,uuid,text,uuid,jsonb) to service_role;
notify pgrst,'reload schema';
commit;
