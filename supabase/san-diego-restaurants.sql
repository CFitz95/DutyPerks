-- Existing project, after automation.sql. Repeatable PRIVATE drafts only.
-- No existing benefit is deleted, published, or overwritten.
begin;
insert into public.businesses(id,name,website,phone) values
 ('00000000-0000-0000-0000-000000002102','Cafe Sevilla San Diego','https://www.cafesevilla.com/location/san-diego/','619-233-5979'),
 ('00000000-0000-0000-0000-000000002103','Rodizio Grill San Diego — El Cajon','https://www.rodiziogrill.com/san-diego/','619-749-4700')
on conflict(id) do nothing;
insert into public.locations(id,business_id,name,address,city,state,postal_code) values
 ('00000000-0000-0000-0000-000000002202','00000000-0000-0000-0000-000000002102','Gaslamp Quarter','353 Fifth Ave','San Diego','CA','92101'),
 ('00000000-0000-0000-0000-000000002203','00000000-0000-0000-0000-000000002103','El Cajon restaurant','110 N Magnolia Ave','El Cajon','CA','92020')
on conflict(id) do nothing;
insert into public.benefits(id,business_id,location_id,title,description,requirements,category,discount_type,discount_value,status) values
 ('00000000-0000-0000-0000-000000002302','00000000-0000-0000-0000-000000002102','00000000-0000-0000-0000-000000002202',
 'Cafe Sevilla San Diego: 15% service appreciation discount',
 'Active and retired military members and their families receive 15% off their food bill when dining in at Cafe Sevilla San Diego.',
 'Dine-in only. Show your server military ID. Not valid with another offer or promotion. Discount applies to the food bill; drinks are not stated as included. The source includes families of active and retired members but does not specify whether dependents may redeem without the member or which dependent ID is accepted; confirm with the restaurant. Non-retired veteran and reserve/Guard eligibility is not stated. No expiration date is published.',
 'food','percentage',15,'pending'),
 ('00000000-0000-0000-0000-000000002303','00000000-0000-0000-0000-000000002103','00000000-0000-0000-0000-000000002203',
 'Rodizio Grill El Cajon: 10% active-duty military discount',
 'Active-duty military personnel plus one guest receive 10% off food and drinks at Rodizio Grill''s San Diego location in El Cajon.',
 'Present valid military ID. Member plus one guest only. Valid only at the San Diego-branded restaurant at 110 N Magnolia Ave, El Cajon. Not valid with other coupons, offers, or certificates. Retired, non-retired veteran and reserve/Guard eligibility is not stated. The guest is covered when accompanying the member, not as an independent military eligibility group. No expiration date is published.',
 'food','percentage',10,'pending')
on conflict(id) do nothing;
insert into public.benefit_eligibility(benefit_id,status)
select b.id,e.status::public.military_status from public.benefits b
cross join (values('active_duty'),('retired'),('family')) e(status)
where b.id='00000000-0000-0000-0000-000000002302' and b.status='pending'
on conflict(benefit_id,status) do nothing;
insert into public.benefit_eligibility(benefit_id,status)
select b.id,'active_duty'::public.military_status from public.benefits b
where b.id='00000000-0000-0000-0000-000000002303' and b.status='pending'
on conflict(benefit_id,status) do nothing;
insert into public.discovery_sources(business_id,location_id,url) values
 ('00000000-0000-0000-0000-000000002102','00000000-0000-0000-0000-000000002202','https://www.cafesevilla.com/promos-san-diego/'),
 ('00000000-0000-0000-0000-000000002103','00000000-0000-0000-0000-000000002203','https://www.rodiziogrill.com/san-diego/events-and-specials.aspx')
on conflict(url) do nothing;
commit;
