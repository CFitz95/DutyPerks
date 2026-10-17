-- Private bookmarks/research only. No benefit is published by this setup.
begin;
create table if not exists public.social_leads (
 id uuid primary key default gen_random_uuid(),
 revision uuid not null default gen_random_uuid(),
 business_name text not null check(length(btrim(business_name)) between 1 and 160),
 market text not null check(market in ('San Diego / Oceanside','San Antonio','Norfolk / Virginia Beach','Fayetteville','Killeen / Copperas Cove','Orlando / Kissimmee','Whidbey Island','Other / nationwide')),
 stage text not null default 'new' check(stage in ('new','researching','ready','dismissed')),
 source_url text not null check(source_url ~ '^https://' and length(source_url)<=1500),
 official_url text check(official_url is null or (official_url ~ '^https://' and length(official_url)<=1500)),
 destination text not null default '' check(length(destination)<=200),
 offer_summary text not null default '' check(length(offer_summary)<=2000),
 eligibility_notes text not null default '' check(length(eligibility_notes)<=2000),
 redemption_notes text not null default '' check(length(redemption_notes)<=2000),
 research_notes text not null default '' check(length(research_notes)<=5000),
 created_by uuid not null,
 updated_by uuid not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(stage<>'ready' or (official_url is not null and length(btrim(offer_summary))>0 and length(btrim(eligibility_notes))>0 and length(btrim(redemption_notes))>0))
);
create unique index if not exists social_leads_source_business on public.social_leads(source_url,lower(btrim(business_name)));
create index if not exists social_leads_stage_updated on public.social_leads(stage,updated_at desc);
alter table public.social_leads enable row level security;
revoke all on public.social_leads from public,anon,authenticated;
grant select,insert,update on public.social_leads to service_role;
commit;
