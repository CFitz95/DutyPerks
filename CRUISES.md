# Public cruise program guide

`/cruises` is an informational program directory with an offer-type filter and direct official links. It does not quote live prices, check cabin inventory, collect documents, take payment, or make reservations. Local offer search and private lead records are separate.

The eight explicitly published summaries are maintained in `lib/cruise-programs.json`. This first publication was authorized by the owner's request to put the researched cruise programs on DutyPerks. Only selected public fields were written; private research notes and user identifiers are not exposed. Lead inbox entries remain research records and are never automatically published.

Check official terms before updating a summary. Confirm eligibility, amounts, fees, redemption, source URL and restrictions. Update `checkedAt` and `reviewBy` after review, allowing no more than 31 days; set `published:false` to withdraw a program. Do not change only the dates without reviewing terms. Entries hide at the UTC start of `reviewBy`, even without a new deployment: the page is dynamic and the service worker does not cache it. There is no automatic source monitoring or admin editor for this catalogue yet. Current summaries require review before November 16, 2026 UTC.

NCL and Princess official pages may redirect to regional locales; summaries disclose that final country, currency and booking terms must be confirmed. Margaritaville's zero-fare cabins remain capacity controlled with additional charges. Onboard credit is labeled separately from fare discounts. No percentage is claimed for Carnival or Royal Caribbean. No headquarters or ticket office has been turned into a cruise destination pin.

Verification: unit coverage checks explicit publication, review deadlines, invalid review windows and required public fields. Run typecheck, lint, build and unit tests; check `/cruises` filters, official links, navigation and mobile layout after deployment.
