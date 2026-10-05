import Link from "next/link";
import { getAdmin } from "../../lib/admin-auth";
import { privateSupabase } from "../../lib/private-supabase";
import { isMwrSource, safeSourceUrl } from "../../lib/discovery-core.mjs";
import ReviewForm from "./ReviewForm";
export const dynamic = "force-dynamic";
const notices: Record<string,string> = {
  "reset-sent": "If this email matches the administrator account, a password-reset email has been requested. Open its link to choose a new password.",
  "reset-unavailable": "The reset email could not be sent. Check Supabase email delivery settings and try again shortly.",
  login: "Sign-in failed. Check your admin email and password.",
  setup: "Automation setup is incomplete or unavailable. Check the database migration and server environment settings.",
  review: "Offer not saved. Check required fields, expiration choice, and eligibility. The source may have changed or this review may already be closed.",
  saved: "Verified offer saved. You can save another distinct offer from this page, or finish reviewing it.",
  closed: "Review closed.", run: "Source check completed.", partial: "Some sites could not be checked. See the run and source status below.",
  busy: "A source check is already running."
};
export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const params = await searchParams;
  const notice = typeof params.notice === "string" ? notices[params.notice] : undefined;
  const admin = await getAdmin();
  if (!admin) return <main>
    <Link href="/">← DutyPerks home</Link><h1>Offer review sign-in</h1>
    <p>Sign in with the Supabase account configured as the DutyPerks administrator. Sessions last up to one hour.</p>
    {notice && <p role="alert">{notice}</p>}
    <form action="/api/admin/login" method="post" style={{display:"grid",gap:12,maxWidth:400}}>
      <label>Email <input name="email" type="email" autoComplete="username" required /></label>
      <label>Password <input name="password" type="password" autoComplete="current-password" required /></label>
      <button>Sign in</button>
    </form>
    <details style={{marginTop:24}}><summary>Forgot your password?</summary>
      <form action="/api/admin/password-reset" method="post" style={{display:"grid",gap:12,maxWidth:400}}>
        <label>Admin email <input name="email" type="email" autoComplete="username" required /></label>
        <button>Send password-reset email</button>
      </form>
    </details>
  </main>;
  try {
    const db = privateSupabase();
    const results = await Promise.all([
      db.from("discovery_sources").select("id,url,business_id,location_id,last_hash,last_checked_at,last_error,enabled").order("url"),
      db.from("discovery_candidates").select("*").eq("state","pending").order("discovered_at",{ascending:false}).limit(100),
      db.from("discovery_runs").select("*").order("started_at",{ascending:false}).limit(10),
      db.from("benefits").select("id,business_id,location_id,title,description,requirements,category,starts_at,expires_at,normal_price,military_price").limit(500),
      db.from("benefit_eligibility").select("benefit_id,status").limit(2000),
      db.from("businesses").select("id,name").limit(500)
    ]);
    if (results.some(r => r.error)) throw new Error("Queue query failed");
    const sources=results[0].data ?? [], candidates=results[1].data ?? [], runs=results[2].data ?? [];
    const offers=results[3].data ?? [], eligibility=results[4].data ?? [], businesses=results[5].data ?? [];
    return <main>
      <Link href="/">← DutyPerks home</Link><h1>Offer review queue</h1>
      <p>Weekly checks run Mondays at 13:00 UTC (9 AM Eastern during daylight saving time, 8 AM in winter). New finds stay private until you verify and save them.</p>
      <p>This checks selected official San Diego and Whidbey Island websites, including public MWR ticket pages and PDFs. New businesses found through research must be added as approved sources.</p>
      {notice && <p role="status">{notice}</p>}
      <div style={{display:"flex",gap:20}}>
        <form action="/api/admin/run" method="post"><button>Check sources now</button></form>
        <form action="/api/admin/logout" method="post"><button>Sign out</button></form>
      </div>
      <h2>Pending reviews ({candidates.length})</h2>
      {candidates.length === 0 && <p>No pending finds. Run a source check to begin.</p>}
      {candidates.map(candidate => {
        const source = sources.find(s => s.id === candidate.source_id);
        if (!source) return null;
        let url: string;
        try { url = safeSourceUrl(source.url); } catch { return <p key={candidate.id}>Unsupported source URL. Disable it in discovery_sources before running checks.</p>; }
        const name = businesses.find(b => b.id === source.business_id)?.name ?? "Business";
        const stale = candidate.fingerprint !== source.last_hash;
        const mwrReference = isMwrSource(url);
        const choices = offers.filter(o => o.business_id === source.business_id && o.location_id === source.location_id).map(o => ({
          id:o.id,title:o.title,description:o.description,requirements:o.requirements,category:o.category,
          starts_at:o.starts_at,expires_at:o.expires_at,normal_price:o.normal_price,military_price:o.military_price,
          eligibility:eligibility.filter(e => e.benefit_id === o.id).map(e => e.status)
        }));
        return <article key={candidate.id} style={{border:"1px solid #ddd",borderRadius:8,padding:16,margin:"20px 0"}}>
          <h3>{name}: {candidate.title}</h3><p>Review reason: {candidate.kind} · Found {candidate.discovered_at.slice(0,10)}</p>
          <a href={url} target="_blank" rel="noopener noreferrer">Open official source</a>
          <p>Extracted text is evidence to check, not verified terms. Navigation, unrelated prices, or conflicting wording may be included.</p>
          {mwrReference && <p>This is an MWR reference page or ticket catalog. Open it to check current prices and eligibility. Individual attraction offers need their own destination and terms before they can be added; finishing this review does not publish tickets.</p>}
          <details><summary>Source excerpt</summary><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{candidate.excerpt || "Previously detected military wording is no longer present."}</pre></details>
          {stale ? <p>This page has newer evidence. Use its newest pending review.</p> :
            candidate.kind !== "removed" && !mwrReference && <ReviewForm candidate={candidate.id} offers={choices} />}
          {<div style={{display:"flex",gap:12,marginTop:16}}>
            {!stale && <form action="/api/admin/review" method="post"><input type="hidden" name="candidate" value={candidate.id}/><button name="action" value="done">Finish reviewing this page</button></form>}
            <form action="/api/admin/review" method="post"><input type="hidden" name="candidate" value={candidate.id}/><button name="action" value="dismiss">Dismiss this find</button></form>
          </div>}
          <p>Saving keeps this page open so you can separate multiple offers. Finishing or dismissing does not publish an offer. Changed sources stay hidden until their offers are reverified.</p>
        </article>;
      })}
      <h2>Recent runs</h2>
      {runs.length === 0 ? <p>No checks yet.</p> : <ul>{runs.map(run => <li key={run.id}>{run.started_at.slice(0,16)} UTC · {run.state} · {run.checked} sources checked · {run.queued} review events
        {Array.isArray(run.errors) && run.errors.length > 0 && <ul>{run.errors.map((issue: string,index: number) => <li key={index}>{issue}</li>)}</ul>}
      </li>)}</ul>}
      <h2>Monitored sources</h2>
      <ul>{sources.map(source => <li key={source.id}>{source.url} · {source.enabled ? "Enabled" : "Disabled"} · {source.last_checked_at ? source.last_checked_at.slice(0,16)+" UTC" : "Not checked yet"}{source.last_error ? " · "+source.last_error : ""}</li>)}</ul>
    </main>;
  } catch { return <main><h1>Offer review queue</h1><p role="alert">The private queue could not load. Check the automation database setup and server secret.</p><Link href="/admin">Try again</Link></main>; }
}
