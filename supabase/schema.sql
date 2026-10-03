create extension if not exists pgcrypto;
create extension if not exists postgis;

create type military_status as enum ('active_duty','reserve_guard','veteran','retired','family');
create type verification_status as enum ('pending','verified','expired','rejected');

create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  phone text,
  created_at timestamptz not null default now()
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  name text,
  address text,
  city text not null,
  state text not null,
  postal_code text,
  country text not null default 'US',
  coordinates geography(point,4326),
  created_at timestamptz not null default now()
);
create index locations_geo_idx on locations using gist(coordinates);

create table benefits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  location_id uuid references locations(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  requirements text,
  discount_type text,
  discount_value numeric,
  normal_price numeric,
  military_price numeric,
  starts_at date,
  expires_at date,
  status verification_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table benefit_eligibility (
  benefit_id uuid references benefits(id) on delete cascade,
  status military_status not null,
  primary key (benefit_id,status)
);

create table benefit_verifications (
  id uuid primary key default gen_random_uuid(),
  benefit_id uuid references benefits(id) on delete cascade,
  source_url text not null,
  source_name text,
  verification_method text not null,
  verified_at timestamptz,
  next_review_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  destination_text text not null,
  destination_coordinates geography(point,4326),
  start_date date not null,
  end_date date not null,
  budget numeric,
  traveler_count int not null check (traveler_count > 0),
  military_status military_status not null,
  interests text[],
  transport text,
  created_at timestamptz not null default now()
);

create table itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  benefit_id uuid references benefits(id),
  day_number int not null,
  starts_at timestamptz,
  title text not null,
  item_type text not null,
  normal_estimated_price numeric,
  eligible_estimated_price numeric,
  savings_estimate numeric generated always as
    (greatest(coalesce(normal_estimated_price,0)-coalesce(eligible_estimated_price,0),0)) stored,
  price_source_url text,
  sort_order int not null default 0
);

create table affiliate_offers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id),
  provider text not null,
  destination_url text not null,
  disclosure text,
  active boolean not null default true
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete set null,
  itinerary_item_id uuid references itinerary_items(id) on delete set null,
  affiliate_offer_id uuid references affiliate_offers(id) on delete set null,
  amount numeric,
  commission_estimate numeric,
  status text,
  created_at timestamptz not null default now()
);

create table benefit_reports (
  id uuid primary key default gen_random_uuid(),
  benefit_id uuid references benefits(id) on delete cascade,
  report_type text not null,
  comment text,
  created_at timestamptz not null default now()
);

-- Public reads must only expose verified, non-expired benefits.
create view public_verified_benefits as
select b.*
from benefits b
where b.status='verified'
and (b.expires_at is null or b.expires_at >= current_date);
