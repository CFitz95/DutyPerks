begin;
do $$
declare owner_id uuid:=gen_random_uuid();lead_id uuid;old_revision uuid;changed integer;before_offers integer;
begin
 if has_table_privilege('anon','public.social_leads','SELECT') or has_table_privilege('authenticated','public.social_leads','UPDATE') then raise exception 'Lead inbox exposed'; end if;
 select count(*) into before_offers from public.benefits;
 execute 'set local role service_role';
 insert into public.social_leads(business_name,market,source_url,created_by,updated_by)
 values('TEST LEAD','San Antonio','https://example.com/lead-test',owner_id,owner_id) returning id,revision into lead_id,old_revision;
 begin
   insert into public.social_leads(business_name,market,source_url,created_by,updated_by)
   values(' test lead ','San Antonio','https://example.com/lead-test',owner_id,owner_id);
   raise exception 'Duplicate not rejected';
 exception when unique_violation then null; end;
 begin
   update public.social_leads set stage='ready' where id=lead_id;
   raise exception 'Ready accepted without evidence';
 exception when check_violation then null; end;
 update public.social_leads set stage='researching',revision=gen_random_uuid() where id=lead_id and revision=old_revision;
 update public.social_leads set stage='dismissed' where id=lead_id and revision=old_revision;
 get diagnostics changed=row_count;
 if changed<>0 then raise exception 'Stale edit accepted'; end if;
 update public.social_leads set stage='ready',official_url='https://example.com/official',offer_summary='TEST ONLY',eligibility_notes='TEST ONLY',redemption_notes='TEST ONLY' where id=lead_id;
 execute 'reset role';
 if (select count(*) from public.benefits)<>before_offers then raise exception 'Lead published a benefit'; end if;
end $$;
rollback;
