-- Optional: run AFTER geocoding.sql in a test project first. All fixtures roll back.
begin;
do $$
declare lid uuid:=gen_random_uuid(); rev uuid; snap jsonb; ok boolean;
begin
  if has_table_privilege('anon','public.location_geocode_reviews','SELECT') or
    has_function_privilege('authenticated','public.review_geocode_proposal(uuid,uuid,text)','EXECUTE') then
    raise exception 'Public geocoding access must be denied';
  end if;
  insert into public.locations(id,name,address,city,state,postal_code,country)
    values(lid,'TEST ONLY','353 Fifth Ave','San Diego','CA','92101','US');
  if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('store_geocode_proposal','review_geocode_proposal') and p.prosecdef) then
    raise exception 'Geocoding functions must not elevate caller privileges';
  end if;
  -- Exercise the real server role rather than relying on postgres superuser access.
  execute 'set local role service_role';
  select public.geocode_snapshot(l) into snap from public.locations l where id=lid;
  ok:=public.store_geocode_proposal(lid,snap,'{"status":"review","latitude":32.708877,"longitude":-117.16,"matched_address":"TEST ONLY"}');
  if not ok then raise exception 'Proposal not stored'; end if;
  if exists(select 1 from public.locations where id=lid and coordinates is not null) then raise exception 'Preview changed coordinates'; end if;
  select revision into rev from public.location_geocode_reviews where location_id=lid;
  update public.locations set coordinate_role='purchase_office' where id=lid;
  if public.review_geocode_proposal(lid,rev,'approve') then raise exception 'Purchase office accepted as destination'; end if;
  if public.store_geocode_proposal(lid,snap,'{"status":"no_match"}') then raise exception 'Purchase office looked up'; end if;
  update public.locations set coordinate_role='organization_resource' where id=lid;
  if public.review_geocode_proposal(lid,rev,'approve') then raise exception 'Organization accepted as destination'; end if;
  update public.locations set coordinate_role='destination' where id=lid;
  if public.review_geocode_proposal(lid,null,'approve') then raise exception 'Null revision accepted'; end if;
  if public.review_geocode_proposal(lid,gen_random_uuid(),'approve') then raise exception 'Stale revision accepted'; end if;
  update public.locations set address='Changed address' where id=lid;
  if public.review_geocode_proposal(lid,rev,'approve') then raise exception 'Changed address accepted'; end if;
  update public.locations set address='353 Fifth Ave' where id=lid;
  if not public.review_geocode_proposal(lid,rev,'approve') then raise exception 'Valid review rejected'; end if;
  if not exists(select 1 from public.locations where id=lid and abs(ST_Y(coordinates::geometry)-32.708877)<0.000001
    and abs(ST_X(coordinates::geometry)+117.16)<0.000001) then raise exception 'Wrong point order'; end if;
  if public.review_geocode_proposal(lid,rev,'approve') then raise exception 'Existing point overwritten'; end if;
  if public.store_geocode_proposal(lid,snap,'{"status":"no_match"}') then raise exception 'Existing coordinates requeued'; end if;
end $$;
reset role;
rollback;
