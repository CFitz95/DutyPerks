# DutyPerks

DutyPerks shows manually verified military offers in San Diego. Explore filters
by city/ZIP, status and category. Plan is still a request-validation prototype;
it does not generate or save itineraries.

## Weekly offer discovery
Vercel calls /api/cron/discover Mondays at 13:00 UTC (9 AM Eastern in summer,
8 AM in winter). It checks selected official sources for the five starter
businesses and follows up to two public military-offer links on the same site.
Checks process at most 12 sources per run, oldest checked first. Added links
are checked on a later run. This is official-site monitoring, not a web-wide
search engine. New businesses require adding a trusted hostname in
lib/discovery-core.mjs and a discovery_sources row with business/location IDs.

Discovery stores military-related source excerpts, not AI-generated offer terms.
Page text can contain unrelated prices or conflicts. Humans open the original
source and confirm eligibility, dates and exclusions before publication.
Authenticated ID.me offers, emails, and JavaScript-only pages are not fetched.
robots.txt restrictions, rate limits, blocks, timeouts, oversized pages and
unsupported content are respected/reported; no bypass is attempted.

Source fingerprints prevent identical evidence from becoming duplicate queue
entries. Existing offers can be updated rather than copied. Repeated approval
submissions with the same payload return the prior offer. A shared database
lease prevents overlapping scheduled and manual runs.

A changed source makes its previous verifications overdue immediately, hiding
affected offers until reviewed. Unchanged offers are queued again as their
30-day review deadline approaches. Reviewed pages may contain multiple offers;
save each separately and click Finish reviewing this page when done. Dismissal
does not publish anything or revive hidden offers. Expiration/review deadlines
are enforced at public query time even if a scheduled run fails.

## Setup for an already-deployed DutyPerks project
1. Run supabase/automation.sql in Supabase SQL Editor after the existing schema
   and explore.sql. It creates private discovery tables/functions and seeds
   official sources; it does not overwrite your current benefits.
2. In Supabase Authentication > Users, choose Add user > Create new user.
   Create your admin email/password and mark the email confirmed. Store the
   password in your password manager. Do not put it in source code or chat.
3. In Vercel project duty-perks-angs > Settings > Environment Variables, add
   these to Production:
   - SUPABASE_SECRET_KEY: the Supabase server secret key (sb_secret_...) or
     legacy service_role key. Never use a NEXT_PUBLIC_ prefix for this value.
   - ADMIN_EMAIL: the email created in step 2.
   - CRON_SECRET: a random secret of at least 32 characters, stored as Secret.
     Generate it with your password manager; do not put it in a GitHub file.
   Keep NEXT_PUBLIC_SUPABASE_URL set to the project base URL, with no /rest/v1.
   Keep NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as already configured.
4. Upload the app update to GitHub including vercel.json at the repository root.
   This triggers Vercel to deploy. Wait for Ready. Production cron jobs are
   installed from vercel.json; check Settings > Cron Jobs for the weekly job.
5. Open /admin on your production site and sign in with the new Supabase user.
   Click Check sources now. It may take several minutes. Inspect Recent runs
   and Monitored sources; partial results are expected if a site blocks robots.
6. Open each source yourself, choose an existing offer for rechecks or explicitly
   confirm a distinct new offer, fill all terms and eligibility, then save.
   Do not guess conflicting terms. For multiple offers, save each separately
   before finishing the page. Use Dismiss for irrelevant finds.
7. Verify the published offer in Explore. Run the optional rollback-only
   supabase/test_automation.sql checks after setup if desired.

The browser never receives the server key. Admin cookies are HttpOnly,
SameSite=Strict and Secure on HTTPS. Every protected request checks the user
against Supabase Auth and ADMIN_EMAIL. No public signup or email sending is
added. Sessions expire in at most one hour; sign in again instead of refreshing
tokens in the browser. Cross-origin writes are rejected. Supabase Auth handles
password-login rate limits. Disable the admin user to revoke access.
Discovery tables/functions are unavailable to anon/authenticated roles.

## Local validation
Node 22 LTS, pnpm 11.25.0. Run pnpm install --frozen-lockfile, pnpm lint,
pnpm test, pnpm build, pnpm typecheck. The app builds without credentials.
Local secrets belong in ignored .env.local. No extra paid API is required.
A live database and real Vercel credentials are needed to validate activation.

## Existing database
On a NEW project run schema.sql, explore.sql, then automation.sql. On an existing
project do not rerun table creation; use security.sql if original safeguards
were never applied, then explore.sql and automation.sql. Candidate seed scripts
insert pending offers only. They never prove an offer is real. Existing reviewed
benefits are stored in Supabase and are preserved by the automation setup.

## What remains
A broader business-discovery provider, geographic radius search, notification
delivery, authenticated customer trips, and real itineraries remain future
work. The current job reports to the private queue without sending messages.
Review dates are not silently extended merely because a crawler found a page.

## Secrets and deployment
.gitignore excludes environment files except placeholder .env.example, generated
files, credentials and ZIPs. Manual GitHub uploads still need checking. Rotate
any leaked credential; deletion alone does not erase Git history.
Vercel root: repository root. Install: pnpm install --frozen-lockfile.
Build: pnpm build. Node: 22.x. Output directory: Next.js default.
Server secrets must never be placed in vercel.json or public framework variables.

References:
- https://vercel.com/docs/cron-jobs/manage-cron-jobs
- https://supabase.com/docs/reference/javascript/auth-getuser
- https://supabase.com/docs/guides/getting-started/api-keys
