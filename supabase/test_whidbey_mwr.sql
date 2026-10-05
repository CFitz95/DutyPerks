-- Optional AFTER whidbey-mwr.sql. All fixtures roll back; no live offer changed.
begin;
insert into public.businesses(id,name) values
 ('f0000000-0000-4000-9000-000000000001','Whidbey regression fixture');
insert into public.locations(id,business_id,city,state) values
 ('f0000000-0000-4000-9000-000000000002','f0000000-0000-4000-9000-000000000001','Langley','WA'),
 ('f0000000-0000-4000-9000-000000000003','f0000000-0000-4000-9000-000000000001','Oak Harbor','OH');
insert into public.benefits(id,business_id,location_id,title,description,category,status) values
 ('f0000000-0000-4000-9000-000000000004','f0000000-0000-4000-9000-000000000001','f0000000-0000-4000-9000-000000000002','Whidbey regression WA','Fixture','tour','verified'),
 ('f0000000-0000-4000-9000-000000000005','f0000000-0000-4000-9000-000000000001','f0000000-0000-4000-9000-000000000003','Whidbey regression OH','Fixture','tour','verified');
insert into public.benefit_verifications(benefit_id,source_url,verification_method,verified_at,next_review_at)
select id,'https://example.com/fixture','fixture',now()-interval '1 minute',now()+interval '1 day'
from public.benefits where id in ('f0000000-0000-4000-9000-000000000004','f0000000-0000-4000-9000-000000000005');
insert into public.discovery_sources(id,business_id,location_id,url,last_hash) values
 ('f0000000-0000-4000-9000-000000000006','f0000000-0000-4000-9000-000000000001','f0000000-0000-4000-9000-000000000002','https://whidbey.navylifepnw.com/fixture',repeat('a',64));
insert into public.discovery_candidates(id,source_id,fingerprint,title,excerpt,kind) values
 ('f0000000-0000-4000-9000-000000000007','f0000000-0000-4000-9000-000000000006',repeat('a',64),'MWR fixture','Private','new');
do $$
begin
 if not exists(select 1 from public.search_verified_benefits('Whidbey Island','','') where id='f0000000-0000-4000-9000-000000000004') then raise exception 'Region did not match WA location'; end if;
 if exists(select 1 from public.search_verified_benefits('Whidbey Island','','') where id='f0000000-0000-4000-9000-000000000005') then raise exception 'Region matched an Ohio location'; end if;
 begin
   perform public.review_discovery_offer('f0000000-0000-4000-9000-000000000007','f0000000-0000-4000-9000-000000000008','approve');
   raise exception 'MWR catalog publishing was not blocked';
 exception when others then
   if sqlerrm not like 'MWR reference catalogs require%' then raise; end if;
 end;
end $$;
rollback;
