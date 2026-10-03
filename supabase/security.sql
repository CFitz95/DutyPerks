-- Apply to an EXISTING installation of the original MVP schema.
-- No data is dropped. Browser database access stays disabled until policies exist.
begin;
alter table businesses enable row level security;
alter table locations enable row level security;
alter table benefits enable row level security;
alter table benefit_eligibility enable row level security;
alter table benefit_verifications enable row level security;
alter table trips enable row level security;
alter table itinerary_items enable row level security;
alter table affiliate_offers enable row level security;
alter table bookings enable row level security;
alter table benefit_reports enable row level security;
create or replace view public_verified_benefits with (security_invoker = true) as
select b.* from benefits b
where b.status='verified'
and (b.starts_at is null or b.starts_at <= current_date)
and (b.expires_at is null or b.expires_at >= current_date)
and exists (
  select 1 from benefit_verifications v
  where v.benefit_id=b.id and v.verified_at is not null
  and v.verified_at <= now() and v.source_url ~ '^https://'
  and (v.next_review_at is null or v.next_review_at > now())
);
revoke all on businesses, locations, benefits, benefit_eligibility,
  benefit_verifications, trips, itinerary_items, affiliate_offers,
  bookings, benefit_reports, public_verified_benefits from anon, authenticated;
commit;
