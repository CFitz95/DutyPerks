import Link from "next/link";

export default function Home() {
  return (
    <main>
      <p className="eyebrow">Military offers · San Diego & Whidbey Island</p>
      <h1>Use more of the military benefits you already qualify for.</h1>
      <p>Explore verified offers, check who qualifies, and go straight to the official source.</p>
      <div className="actions" style={{marginTop:24}}>
        <Link className="button-link" href="/explore">Find an offer</Link>
        <Link className="button-link secondary" href="/install">Add to your phone</Link>
      </div>
      <section style={{marginTop:40}}><h2>Choose your area</h2><div className="card-grid">
        <article className="card"><h3>San Diego</h3><p>Find local military offers and official MWR ticket resources.</p><Link href="/explore?location=San%20Diego">Explore San Diego</Link></article>
        <article className="card"><h3>Whidbey Island</h3><p>Explore island offers and NAS Whidbey MWR ticket resources.</p><Link href="/explore?location=Whidbey%20Island">Explore Whidbey Island</Link></article>
      </div></section>
      <section className="card"><h2>Help shape DutyPerks</h2><p>We’re testing with the military community. Try finding an offer you would use, then tell us what worked or what was missing.</p><Link href="/feedback">Share your feedback</Link></section>
      <p>Trip planning is coming later. <Link href="/plan">View the planning preview</Link>.</p>
    </main>
  );
}
