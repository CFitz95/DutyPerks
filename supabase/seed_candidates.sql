-- Sprint 2 seed candidates.
-- IMPORTANT: rows below are deliberately PENDING until an admin verifies the primary source.
-- Do not expose them through public_verified_benefits until status='verified'.

insert into businesses (id,name,website) values
('00000000-0000-0000-0000-000000000101','USS Midway Museum','https://www.midway.org/'),
('00000000-0000-0000-0000-000000000102','Navy SEAL Museum San Diego','https://navysealmuseumsd.org/'),
('00000000-0000-0000-0000-000000000103','SeaWorld San Diego','https://seaworld.com/san-diego/'),
('00000000-0000-0000-0000-000000000104','The Gondola Company','https://www.gondolacompany.com/'),
('00000000-0000-0000-0000-000000000105','Wild Pacific Whale Watch','https://wildpacificwhalewatch.com/')
on conflict do nothing;

insert into locations (id,business_id,name,address,city,state,postal_code,country,coordinates) values
('00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000101','USS Midway Museum','910 N Harbor Dr','San Diego','CA','92101','US',ST_GeogFromText('POINT(-117.1751 32.7137)')),
('00000000-0000-0000-0000-000000000202','00000000-0000-0000-0000-000000000102','Navy SEAL Museum San Diego','1001 Kettner Blvd','San Diego','CA','92101','US',ST_GeogFromText('POINT(-117.1694 32.7163)')),
('00000000-0000-0000-0000-000000000203','00000000-0000-0000-0000-000000000103','SeaWorld San Diego','500 Sea World Dr','San Diego','CA','92109','US',ST_GeogFromText('POINT(-117.2266 32.7648)')),
('00000000-0000-0000-0000-000000000204','00000000-0000-0000-0000-000000000104','The Gondola Company','Coronado Cays','Coronado','CA',null,'US',null),
('00000000-0000-0000-0000-000000000205','00000000-0000-0000-0000-000000000105','Wild Pacific Whale Watch','H&M Landing','San Diego','CA','92106','US',null)
on conflict do nothing;

insert into benefits
(id,business_id,location_id,title,description,category,requirements,discount_type,discount_value,starts_at,expires_at,status)
values
('00000000-0000-0000-0000-000000000301','00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000201',
 'Military admission','Active-duty and reservist admission reported as free; retired military reported as discounted. Verify directly before publishing.','attraction','Valid military identification; verify current terms.','admission',null,null,null,'pending'),
('00000000-0000-0000-0000-000000000302','00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000202',
 'Military admission','Active-duty and reservists reported as free; discounted admission reported for veterans and military families. Verify directly before publishing.','attraction','Verify eligibility and current terms.','admission',null,null,null,'pending'),
('00000000-0000-0000-0000-000000000303','00000000-0000-0000-0000-000000000103','00000000-0000-0000-0000-000000000203',
 'Waves of Honor','Military salute program reported to provide eligible U.S. armed-forces members free admission under program terms. Verify eligibility/current annual terms before publishing.','attraction','Program registration and military eligibility rules apply.','admission',null,null,null,'pending'),
('00000000-0000-0000-0000-000000000304','00000000-0000-0000-0000-000000000104','00000000-0000-0000-0000-000000000204',
 'Veterans Day Appreciation Cruise','50% off the first two passengers on a Pasaporto Cruise for veterans and active duty on Veterans Day 2026; source reports code Salute50.','tour','Valid military/veteran ID; advance reservation recommended.','percent',50,'2026-11-11','2026-11-11','pending'),
('00000000-0000-0000-0000-000000000305','00000000-0000-0000-0000-000000000105','00000000-0000-0000-0000-000000000205',
 'November Military & Veterans Appreciation','50% off whale-watching tickets for active-duty military and veterans during November 2026.','tour','Valid military/veteran ID at check-in; subject to availability.','percent',50,'2026-11-01','2026-11-30','pending')
on conflict do nothing;

insert into benefit_eligibility (benefit_id,status) values
('00000000-0000-0000-0000-000000000301','active_duty'),
('00000000-0000-0000-0000-000000000301','reserve_guard'),
('00000000-0000-0000-0000-000000000301','retired'),
('00000000-0000-0000-0000-000000000302','active_duty'),
('00000000-0000-0000-0000-000000000302','reserve_guard'),
('00000000-0000-0000-0000-000000000302','veteran'),
('00000000-0000-0000-0000-000000000302','family'),
('00000000-0000-0000-0000-000000000303','active_duty'),
('00000000-0000-0000-0000-000000000303','reserve_guard'),
('00000000-0000-0000-0000-000000000304','active_duty'),
('00000000-0000-0000-0000-000000000304','veteran'),
('00000000-0000-0000-0000-000000000305','active_duty'),
('00000000-0000-0000-0000-000000000305','veteran')
on conflict do nothing;
