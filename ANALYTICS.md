# Public traffic analytics

Prepared for the primary production site only: duty-perks-angs.vercel.app.

Collection is OFF unless the production environment has DUTYPERKS_ANALYTICS_ENABLED=true and Vercel Web Analytics is enabled for that project. Preview, localhost and other project domains do not collect through this component.

The official @vercel/analytics Next.js integration handles page navigation. A beforeSend filter allowlists six public routes and removes all query parameters and fragments, including location and military-status filters. No custom events or form/trip data are sent. Do Not Track browsers are excluded. Counts are estimates and may miss blockers or privacy browsers. Operator/test visits can appear in counts. Referrers can be missing, so a tester post cannot always be attributed.

The /feedback page explains this collection. No database/schema changes.

## Activation and budget

The owner approved at most $1/month of additional cost. Vercel Pro prices basic analytics at $0.03 per 1,000 collected events, subject to existing monthly usage credit, as checked 2026-10-17. No Analytics Plus add-on is authorized. Do not activate until a suitable enforceable budget control or revised authorization is established. Vercel's documented team spend control may pause all production projects; do not configure that for this feature without explicit authorization.

Once authorized: enable basic Web Analytics in duty-perks-angs, set the production opt-in environment variable, redeploy, open a public page and verify a real pageview in the dashboard. Previous visits cannot be reconstructed. To stop collection, remove the opt-in and redeploy, or disable the project's Web Analytics in Vercel.
