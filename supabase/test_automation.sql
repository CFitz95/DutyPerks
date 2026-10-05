-- Optional integration checks after automation.sql. All fixtures roll back.
-- Run when no discovery job is active. This does NOT publish real offers.
begin;
insert into public.businesses(id,name) values('f1000000-0000-4000-8000-000000000001','Automation test');
insert into public.locations(id,business_id,city,state) values
 ('f1000000-0000-4000-8000-000000000002','f1000000-0000-4000-8000-000000000001','AutomationTestCity','ZZ');
insert into public.discovery_sources(id,business_id,location_id,url) values
 ('f1000000-0000-4000-8000-000000000003','f1000000-0000-4000-8000-000000000001',
  'f1000000-0000-4000-8000-000000000002','https://navysealmuseumsd.org/automation-test-fixture');
do $$
declare run_id uuid; candidate uuid; offer uuid; duplicate uuid; payload jsonb;
begin
 if has_table_privilege('anon','public.discovery_candidates','SELECT')
   or has_table_privilege('authenticated','public.discovery_sources','SELECT')
   or has_function_privilege('anon','public.begin_discovery_run()','EXECUTE')
   or has_function_privilege('authenticated','public.review_discovery_offer(uuid,uuid,text,uuid,jsonb)','EXECUTE') then
   raise exception 'Private automation access exposed'; end if;
 run_id:=public.begin_discovery_run();
 if run_id is null then raise exception 'A real source check is active; run tests later'; end if;
 if public.begin_discovery_run() is not null then raise exception 'Overlap guard failed'; end if;
 perform public.record_discovery_snapshot(run_id,'f1000000-0000-4000-8000-000000000003',repeat('a',64),'Test source','Military admission fixture',true);
 perform public.record_discovery_snapshot(run_id,'f1000000-0000-4000-8000-000000000003',repeat('a',64),'Test source','Military admission fixture',true);
 if (select count(*) from public.discovery_candidates where source_id='f1000000-0000-4000-8000-000000000003')<>1 then raise exception 'Evidence deduplication failed'; end if;
 if exists(select 1 from public.benefits where business_id='f1000000-0000-4000-8000-000000000001') then raise exception 'Discovery auto-published an offer'; end if;
 select id into candidate from public.discovery_candidates where source_id='f1000000-0000-4000-8000-000000000003';
 payload:='{"title":"Verified test offer","description":"Officially reviewed fixture only","requirements":"Veteran identification required","category":"attraction","eligibility":["veteran"],"startsAt":"","expiresAt":"","noExpiry":true,"normalPrice":"","militaryPrice":"0"}';
 offer:=public.review_discovery_offer(candidate,'f1000000-0000-4000-8000-000000000004','approve',null,payload);
 duplicate:=public.review_discovery_offer(candidate,'f1000000-0000-4000-8000-000000000004','approve',null,payload);
 if offer is distinct from duplicate then raise exception 'Repeated approval created duplicates'; end if;
 if (select count(*) from public.search_verified_benefits('AutomationTestCity','veteran','attraction'))<>1 then raise exception 'Approved fixture not visible'; end if;
 perform public.record_discovery_snapshot(run_id,'f1000000-0000-4000-8000-000000000003',repeat('b',64),'Changed test','Military admission changed',true);
 if exists(select 1 from public.search_verified_benefits('AutomationTestCity','','')) then raise exception 'Changed source did not hide prior verification'; end if;
 begin
   perform public.review_discovery_offer(candidate,'f1000000-0000-4000-8000-000000000004','approve',offer,payload);
   raise exception 'Stale candidate approval unexpectedly succeeded';
 exception when others then
   if sqlerrm<>'Review is stale or disabled' then raise; end if;
 end;
 select id into candidate from public.discovery_candidates where source_id='f1000000-0000-4000-8000-000000000003' and fingerprint=repeat('b',64);
 perform public.review_discovery_offer(candidate,'f1000000-0000-4000-8000-000000000004','approve',offer,payload);
 if (select count(*) from public.benefits where business_id='f1000000-0000-4000-8000-000000000001')<>1 then raise exception 'Existing offer update created a duplicate'; end if;
 perform public.review_discovery_offer(candidate,'f1000000-0000-4000-8000-000000000004','done');
 perform public.finish_discovery_run(run_id,1,1,'[]');
 raise notice 'Automation regression checks passed';
end $$;
rollback;
