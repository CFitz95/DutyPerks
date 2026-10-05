-- Existing DutyPerks project, after automation.sql. Repeatable private draft.
-- Does not publish, delete, or overwrite existing offers.
begin;
insert into public.businesses(id,name,website) values
 ('00000000-0000-0000-0000-000000002101','China City — Oak Harbor','https://www.chinacityrestaurant.com/oak-harbor')
on conflict(id) do nothing;
insert into public.locations(id,business_id,name,city,state) values
 ('00000000-0000-0000-0000-000000002201','00000000-0000-0000-0000-000000002101','Oak Harbor restaurant; see official location page','Oak Harbor','WA')
on conflict(id) do nothing;
insert into public.benefits(id,business_id,location_id,title,description,requirements,category,discount_type,discount_value,status) values
 ('00000000-0000-0000-0000-000000002301','00000000-0000-0000-0000-000000002101','00000000-0000-0000-0000-000000002201',
 'China City Oak Harbor: 10% off Military Appreciation Tuesdays',
 'Every Tuesday, active-duty and retired military service members receive 10% off eligible food purchases at China City Oak Harbor. Beverages are excluded.',
 'Tuesday only. Bring military ID. Not valid on beverages or with any other discounts. The official event page identifies the Oak Harbor location; other branches are not confirmed. Veterans who are not retired, dependents, and reserve/Guard eligibility are not stated. No expiration date is published. Confirm current availability and any dine-in or takeout restrictions with the restaurant.',
 'food','percentage',10,'pending')
on conflict(id) do nothing;
insert into public.benefit_eligibility(benefit_id,status)
select b.id,e.status::public.military_status from public.benefits b
cross join (values('active_duty'),('retired')) e(status)
where b.id='00000000-0000-0000-0000-000000002301' and b.status='pending'
on conflict(benefit_id,status) do nothing;
insert into public.discovery_sources(business_id,location_id,url) values
 ('00000000-0000-0000-0000-000000002101','00000000-0000-0000-0000-000000002201','https://www.chinacityrestaurant.com/events/military-appreciation-tuesdays')
on conflict(url) do nothing;
commit;
