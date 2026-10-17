import Link from 'next/link';
import type { Metadata } from 'next';
import programs from '../../lib/cruise-programs.json';
import { currentCruisePrograms, cruiseTypes } from '../../lib/cruises-core.mjs';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Military cruise offers | DutyPerks',
  description: 'Compare military cruise fare offers and onboard credits, check eligibility and extra costs, and visit official cruise line sources.',
};
type Params = Record<string, string | string[] | undefined>;
export default async function Cruises({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const type = typeof params.type === 'string' && cruiseTypes.some(t => t.value === params.type) ? params.type : '';
  const current = currentCruisePrograms(programs);
  const offers = current.filter(offer => !type || offer.type === type);
  return <main>
    <p className="eyebrow">Military travel benefits</p>
    <h1>Explore military cruise offers.</h1>
    <p>Compare cruise fare savings and onboard spending credits. Check who qualifies, what costs extra and how to use each program.</p>
    <aside className="notice" aria-label="Before you choose a cruise">
      <strong>A $0 cruise fare still comes with costs.</strong>
      <p>Taxes, port expenses, gratuities, transportation and extras may be payable. DutyPerks shares program information; availability, eligibility and bookings are handled by the cruise line. Compare the final total before paying.</p>
    </aside>
    <form className="cruise-filter" action="/cruises" method="get">
      <label>Offer type<select key={type} name="type" defaultValue={type}>
        <option value="">All cruise offers</option>
        {cruiseTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select></label>
      <button>Show offers</button>
      {type && <Link href="/cruises">Clear filter</Link>}
    </form>
    <p>{offers.length} cruise {offers.length === 1 ? 'program' : 'programs'} shown. These are program summaries, not live cabin prices or confirmed sailings.</p>
    {current.length < programs.filter(p => p.published).length && <p className="notice">Some program summaries are temporarily hidden while their terms await a fresh review.</p>}
    {!offers.length && <section className="card"><h2>No current programs in this view</h2><p>Try another offer type or check back after the next terms review.</p><Link href="/cruises">View all cruise offers</Link></section>}
    <div className="card-grid cruise-grid">
      {offers.map(offer => <article className="card" key={offer.id} aria-labelledby={`cruise-${offer.id}`}>
        <p className="cruise-kind">{cruiseTypes.find(t => t.value === offer.type)?.label}</p>
        <h2 id={`cruise-${offer.id}`}>{offer.name}</h2>
        <p className="cruise-program">{offer.program}</p>
        <h3>{offer.headline}</h3><p>{offer.summary}</p>
        <p><strong>Who may qualify:</strong> {offer.eligibility}</p>
        <p><strong>Costs to check:</strong> {offer.costs}</p>
        <details><summary>How to use it and important limits</summary><p>{offer.redemption}</p><p>{offer.restrictions}</p></details>
        <p className="cruise-reviewed">Official terms checked <time dateTime={offer.checkedAt}>{offer.checkedAt}</time>. Confirm current terms with the provider.</p>
        <a className="button-link" href={offer.url} target="_blank" rel="noopener noreferrer" aria-label={`View ${offer.name} official offer (opens a new tab)`}>View official offer ↗</a>
      </article>)}
    </div>
    <section className="card"><h2>Plan the rest of your trip</h2><p>Check the actual departure terminal and boarding time before planning nearby activities. Leave room for travel delays and check required travel documents with your cruise line.</p><div className="actions"><Link href="/explore">Find local offers</Link><Link href="/feedback">Suggest a cruise offer or report a change</Link></div></section>
  </main>;
}
