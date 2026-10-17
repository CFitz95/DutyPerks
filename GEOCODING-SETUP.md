# Location-coordinate automation (prepared, not deployed)

This addition uses the existing DutyPerks administrator login and private Supabase client. Weekly lookups propose coordinates for locations with no coordinates. You open a map and save the reviewed pin in `/admin/locations`; repeated per-location SQL is no longer needed.

## Activate after review and validation

1. Extract the ZIP locally; do not upload the ZIP itself as a GitHub file. It contains additions and replacements, not a complete app. Apply them to a review branch of the existing repository. Validate in a test environment first. Use Node 22 and the existing lockfile: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm typecheck`. Run the existing integration checks documented in README.md.
2. Run **only** `supabase/geocoding.sql` in Supabase SQL Editor. Do not rerun schema.sql. This adds a coordinate_role field, a private proposal table and guarded functions. It labels the existing NBSD MWR resource as organization_resource and the Convergence Zone office as purchase_office. It does not fill, clear or overwrite coordinates. Optional rollback-only checks are in `supabase/test_geocoding.sql`.
3. Add the new files and two modified files to the existing repository through a reviewed branch/PR, then deploy. The patch was prepared against commit 9971106e2f4e4500b377ec7c8d91b6fa25886ba5; check for newer repository changes before applying.
4. Existing production variables must be configured: NEXT_PUBLIC_SUPABASE_URL, the existing public key, SUPABASE_SECRET_KEY, ADMIN_EMAIL, and CRON_SECRET (at least 32 characters). Do not share secrets in chat or GitHub. No new geocoding API key is needed.
5. Sign into `/admin`, choose **Review location coordinates**, then **Check missing addresses now**. The manual run stores proposals only. Review the full returned address and map pin. Select the confirmation checkbox and **Save reviewed coordinates** only when correct. This button changes that location's live coordinates.
6. In Vercel, verify the new `/api/cron/geocode` job appears. It is scheduled Mondays at 13:30 UTC (9:30 AM Eastern during daylight saving time, 8:30 AM in winter). Hobby timing is approximate. No emails or notifications are sent.

## Behavior and limits

- Existing coordinates, including the two saved in chat, are untouched.
- A changed address with coordinates still present is not automatically geocoded or cleared. Those cases need explicit re-verification. A changed address with no coordinates gets a fresh proposal on the next run.
- All coordinate matches require review. Census matches estimate address locations; they do not prove the business, entrance, building, launch site, or rooftop accuracy.
- MWR organizations provide offers; they are not destinations. Keep them as businesses/resource links. Each individual benefit should link through location_id to the actual attraction or activity destination, which can differ from its offer provider. Ticket purchase offices are separate from offer destinations.
- The coordinate_role field distinguishes destination, organization_resource, and purchase_office. Only destinations enter the lookup/review queue. The migration labels the two known MWR records; other existing rows default to destination. Explicitly set this role for future resources and purchase offices. Existing business/benefit/location relationships are not rewritten.
- Conservative name checks flag likely MWR resources and ticket offices as a fallback. Role changes invalidate approvals; the database rejects resource/office destination-coordinate approvals. Existing pins are not automatically cleared.
- Each run handles at most 10 outstanding records among the first 500 missing-coordinate locations. Review queries are bounded to 500 locations and 1,000 previous proposals. Increase/paginate these limits before scaling beyond them.
- Failed lookups retry at most three times per unchanged address, at least one day apart. Other results are retained until the address changes or a new review policy is implemented. No-match records need address correction or another source.
- Address snapshots and proposal revision IDs prevent approval of changed addresses or replaced proposals. Database row locks and null-coordinate guards prevent overwriting a concurrently saved pin. Concurrent runs may duplicate lookups, but cannot replace reviewed coordinates.
- Read/write endpoints reuse the existing authenticated admin and same-origin controls. The cron endpoint requires CRON_SECRET. Proposal data is private; anon/authenticated database roles cannot read it or call approval functions.
- Provider requests go only to the fixed Census HTTPS endpoint, with timeouts, response-size limits, and no redirect following. Public street addresses are sent to Census.

## Validation status

All 24 local unit tests pass (14 new geocoding tests and 10 existing tests). New tests cover candidate eligibility, no/multiple matches, invalid coordinates, address mismatches, oversized responses, and provider failures. Database rollback checks run in a disposable PostgreSQL 17/PostGIS GitHub Actions service, including the server role, stale approvals and MWR-role guards. Supabase branching requires Pro on this account; no paid branch was created. This does not replace end-to-end validation of Supabase Auth, REST and production settings. Local installation was blocked by unavailable offline dependencies. All three Vercel preview deployments of the initial PR passed; the latest revision must pass its checks before merging. Nothing has been deployed to production. No live provider call was made from this prepared web implementation. The earlier user-run Census preview demonstrated three address matches, but does not validate this app deployment.

## Pause / rollback

Remove the geocode entry from vercel.json and redeploy to stop scheduled lookups. Stop using the manual lookup/save buttons. Leaving the private proposal table in place is safe and retains review history. App rollback does not revert coordinates already explicitly saved by an administrator; preserve prior values before any later data rollback.

References: [Census API](https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html), [Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).
