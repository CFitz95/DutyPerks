# DutyPerks MVP

Next.js 15 + React 19 + strict TypeScript, with a Supabase/PostGIS schema.

## Current scope
Home, Explore, Plan, and a demo verification queue render. POST `/api/trips/generate`
validates a request and returns a prototype response. Explore queries verified benefits through a bounded public search function;
Plan does not generate or save itineraries; Admin is a static demo.
Login, maps, bookings, payments, and PWA installation are not implemented.
Deploying publishes a prototype, not a finished benefits service.

## Local setup
1. Install Node.js 22 LTS and pnpm 11.25.0.
2. Run `pnpm install --frozen-lockfile`.
3. Copy `.env.example` to `.env.local` and fill it from Supabase settings.
   The prototype builds and runs without environment variables.
4. Run `pnpm dev` and open http://localhost:3000.
5. Validate changes with `pnpm lint`, `pnpm build`, then `pnpm typecheck`.

Use the committed pnpm lockfile; do not mix npm and pnpm lockfiles.
CI runs the frozen install, ESLint, production build, and TypeScript on Node 22.

## Supabase setup
1. Create a project. Store its database password securely outside GitHub.
2. In SQL Editor, on a **new empty project**, run `supabase/schema.sql` once.
   It installs PostGIS. If PostGIS already exists in another schema, include that
   schema in the SQL session search path before running the scripts.
3. If the original schema is already installed, run **only**
   `supabase/security.sql` instead. Do not rerun creation over existing data.
4. Optionally run `supabase/seed_candidates.sql`. It inserts five pending,
   unverified candidates and is safe to rerun by ID.
5. Copy the project URL and publishable key from project settings into
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
   A legacy anon key can be used as the publishable-key variable value.
6. Run `supabase/explore.sql` to enable the read-only Explore search.
   It exposes safe fields only; all base tables and writes remain closed.
7. Optionally run `supabase/test_explore.sql` for rollback-only regression checks.

The server-only helper uses a publishable key. No service-role key is required.
Explore uses search_verified_benefits: a deliberate SECURITY DEFINER function
with a fixed empty search_path, explicit safe columns, current verification checks,
and a maximum of 100 results. It grants no direct table access or write access.
City, City, ST, and ZIP searches are exact matches; no distance search yet.
Pending starter records remain hidden. Admin editing is still not implemented.

## Trust and access rules
The verified view requires verified status, a started and unexpired offer, a
dated HTTPS verification source, and no overdue review. Pending seeds must never
be presented as verified. The view uses security_invoker to respect RLS.
Base tables stay closed. Explore uses its limited search function.
Authenticated trip-owner policies and admin authorization remain future work.
Never bypass permission errors by exposing a service-role key.

## Deploy on Vercel
1. Commit the prepared source update to GitHub after validation.
2. Choose Add New Project in Vercel and import `CFitz95/DutyPerks`.
3. Framework: Next.js. Root: repository root. Node version: 22.x.
4. Install: `pnpm install --frozen-lockfile`. Build: `pnpm build`.
   Leave the output directory at its Next.js default.
5. Add both variables from `.env.example` to Production and Preview settings.
   Use separate preview database projects when live database features are added.
6. Deploy and check /, /explore, /plan, and /admin. A valid Plan submission should
   return a prototype response; a reversed date range should show an error.
7. Redeploy after environment changes. Add a domain after this smoke check.

## Secrets
Ignore rules exclude environment files, dependencies, build output, Vercel local
settings, logs, private keys, and ZIP archives. The example has placeholders.
Ignore rules do not untrack files or protect manual GitHub uploads. Inspect
`git diff --cached` and `git ls-files` before committing. If a credential is
published, rotate/revoke it immediately; file deletion does not erase history.

## Next engineering work
Implement authenticated admin verification, geocoding/radius search,
then saved trips and itinerary ranking.
AI may organize verified records, never invent eligibility or savings.

References: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[API keys](https://supabase.com/docs/guides/getting-started/api-keys),
[Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).
