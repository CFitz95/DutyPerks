# MilBenefit Trips — MVP Starter

A mobile-first PWA concept for:
1. finding verified military benefits nearby; and
2. generating trips optimized around eligible benefits and estimated savings.

## Product rule
AI is an organizer, not the source of truth. A military discount may be presented as verified only when a structured benefit record has a verification source/date and is currently valid.

## Stack
- Next.js + TypeScript
- Supabase/PostgreSQL + PostGIS
- PWA-first responsive web interface
- Map/location provider added in Sprint 2
- Payment/affiliate integrations added only after validation

## Local setup
1. Install Node 20+.
2. `npm install`
3. Copy `.env.example` to `.env.local`.
4. Create a Supabase project and run `supabase/schema.sql`.
5. Add Supabase environment variables.
6. `npm run dev`

## Sprint 1 (included)
- Core national-ready schema
- Explore and Plan entry screens
- Trip request validation
- Verification/provenance model
- Savings data model
- Affiliate/bookings data model

## Sprint 2
- Geocoding and radius search
- Admin CRUD + verification queue
- Seed first verified San Diego records
- Real benefit result cards
- Map/list toggle
- Persist trips
- Itinerary ranking engine
- Analytics events

## Sprint 3
- AI itinerary composition constrained to retrieved records
- Live travel inventory/provider integration
- Affiliate attribution
- Business claim flow
- Featured listings/payments
- PWA manifest/install polish

## MVP metrics
Do not optimize for downloads. Measure:
- search -> benefit-detail CTR
- trip-plan completion
- outbound booking/offer clicks
- repeat users
- incorrect-info report rate
- verified benefit coverage by destination
- estimated savings per completed itinerary

## Sprint 2 update
Added:
- `app/admin/page.tsx` verification-queue shell
- `supabase/seed_candidates.sql` with five San Diego candidate offers
- Seed records default to `pending`; public view remains verified-only
- Time-bounded offers include explicit start/end dates

Next engineering step:
- connect admin actions to Supabase
- add geocoding/radius RPC
- replace candidate source notes with direct primary-source verification URLs
- render verified cards in `/explore`
