# Private lead inbox

Open `/admin/leads` after signing in, or choose Research discount leads from the admin page. Expand Add a lead, enter the business name, post/page link and pilot market, then save. You can keep unknown offer details blank while a lead is New or Researching. Filters show up to 100 recent matching leads per view.

For Instagram, copy an individual post or reel link rather than the account profile. The @militarybenefitsapp profile is provided as a starting reference. There is no automatic Instagram access, scraping or monitoring, no outreach, and no copied post text unless you supply research notes yourself.

Each lead has a business name, actual destination, pilot market, original source, official business offer source, offer summary, eligibility/restrictions, redemption/expiration notes and private research notes. Stages are New, Researching, Ready for offer review and Dismissed. Dismissed entries remain available through filters and can be reopened.

Ready requires an official source and the three offer-research fields. This is a research checkpoint, not proof that terms are verified. It never publishes a benefit or automatically creates a business, location or monitored source. Once the business/source is set up in the existing monitoring workflow, complete the existing offer review process. Automated handoff and automatic social discovery remain future work.

The same source link/business pair cannot be added twice; a multi-business post can produce separate leads. Instagram tracking links are normalized for duplicate detection. Concurrent updates use revision checks to avoid silently overwriting newer edits. The form checks common errors before submission so entered notes remain visible; database conflicts still require reloading the latest saved record.

Setup: apply only `supabase/leads.sql` to the existing database after the PR checks pass, then deploy. This adds one private table and indexes. There are no public read/write grants, no new environment variables, no new paid APIs and no changes to existing offers or pins. Server requests reuse the administrator login and same-origin checks. Notes are stored until edited; dismissal is not deletion. Avoid storing IDs, credentials or unnecessary personal details.

Testing: 34 unit tests include URL validation, tracking normalization, required research fields and lead-stage validation. Disposable PostgreSQL/PostGIS CI applies the setup twice and verifies restricted access, duplicate prevention, ready-stage constraints, revision guards, rollback and no automatic publication. Hosted admin create/edit/filter behavior must be checked after deployment.
