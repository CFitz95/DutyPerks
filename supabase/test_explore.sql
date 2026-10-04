-- Optional regression check: run AFTER explore.sql in SQL Editor.
-- All fixture changes roll back. No real offer is marked verified.
begin;
insert into public.businesses(id,name) values
('f0000000-0000-4000-8000-000000000001','Explore regression fixture');
insert into public.locations(id,business_id,city,state,postal_code) values
('f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000001','ExploreTestCity','ZZ','99999');
insert into public.benefits(id,business_id,location_id,title,description,category,status,starts_at,expires_at)
select ('f0000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,
 'f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002',
 'Fixture ' || n, 'Regression fixture only', 'attraction',
 case when n=11 then 'pending'::public.verification_status else 'verified'::public.verification_status end,
 case when n=13 then current_date+1 else current_date-1 end,
 case when n=12 then current_date-1 else current_date+1 end
from generate_series(10,16) n;
insert into public.benefit_eligibility(benefit_id,status)
select ('f0000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,'veteran'
from generate_series(10,16) n;
insert into public.benefit_verifications(benefit_id,source_url,verification_method,verified_at,next_review_at,notes)
select ('f0000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,
 case when n=16 then 'http://example.com' else 'https://example.com' end,
 'test fixture',now()-interval '1 day',
 case when n=15 then now()-interval '1 hour' else now()+interval '1 day' end,
 'PRIVATE NOTE MUST NOT BE PUBLIC'
from generate_series(10,16) n where n<>14;
set local role anon;
do $$
begin
 if (select count(*) from public.search_verified_benefits('ExploreTestCity','veteran','attraction')) <> 1 then
   raise exception 'Pending, expired, future, unverified, overdue, or insecure-source filtering failed';
 end if;
 if not exists(select 1 from public.search_verified_benefits('99999','veteran','attraction')
   where title='Fixture 10') then raise exception 'ZIP matching failed'; end if;
 if not exists(select 1 from public.search_verified_benefits('ExploreTestCity, ZZ','veteran','attraction')
   where title='Fixture 10') then raise exception 'City/state matching failed'; end if;
 if exists(select 1 from public.search_verified_benefits('ExploreTestCity','active_duty','')) then
   raise exception 'Eligibility filtering failed'; end if;
 if exists(select 1 from public.search_verified_benefits('ExploreTestCity','','food')) then
   raise exception 'Category filtering failed'; end if;
 if has_table_privilege(current_user,'public.benefits','SELECT')
   or has_table_privilege(current_user,'public.benefit_verifications','SELECT')
   or has_table_privilege(current_user,'public.trips','SELECT')
   or has_table_privilege(current_user,'public.benefits','UPDATE') then
   raise exception 'Base table permissions are too broad'; end if;
 raise notice 'Explore regression checks passed';
end $$;
reset role;
rollback;
