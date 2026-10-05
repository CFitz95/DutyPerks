import "server-only";
import { privateSupabase } from "./private-supabase";
import { extractEvidence, isMwrSource, pdfEvidence, robotsAllows, safeSourceUrl } from "./discovery-core.mjs";

async function fetchPage(value: string, maxBytes = 500000, allowed?: (url: string) => boolean) {
  let url = safeSourceUrl(value);
  for (let redirects = 0; redirects <= 3; redirects++) {
    if (allowed && !allowed(url)) throw new Error("Redirect destination disallowed by robots.txt");
    const response = await fetch(url, { redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(8000), headers: { "User-Agent": "DutyPerksBot/1.0 (official offer review; no authentication)" } });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirect missing location");
      const next = safeSourceUrl(new URL(location, url).href);
      if (new URL(next).hostname.replace(/^www\./, "") !== new URL(url).hostname.replace(/^www\./, "")) throw new Error("Cross-site redirect blocked");
      url = next; await response.body?.cancel(); continue;
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`HTTP ${response.status}`); }
    const type = response.headers.get("content-type") ?? "";
    const pdf = type.toLowerCase().includes('application/pdf') && isMwrSource(url) && maxBytes > 100000;
    if (!pdf && !/text\/|application\/xhtml/i.test(type)) { await response.body?.cancel(); throw new Error("Unsupported content type"); }
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Empty response");
    const chunks: Uint8Array[] = []; let size = 0;
    try {
      while (true) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > (pdf ? 3000000 : maxBytes)) throw new Error("Page exceeds size limit"); chunks.push(value); }
    } finally { await reader.cancel(); }
    const bytes = Buffer.concat(chunks);
    return { text: pdf ? '' : bytes.toString("utf8"), url, pdf: pdf ? bytes : null };
  }
  throw new Error("Too many redirects");
}

export async function runDiscovery() {
  const db = privateSupabase();
  const { data: runId, error: leaseError } = await db.rpc("begin_discovery_run");
  if (leaseError) throw new Error("Discovery database setup is incomplete");
  if (!runId) return { skipped: true, checked: 0, queued: 0, errors: [] };
  let checked = 0, queued = 0;
  const errors: string[] = [], robots = new Map<string, string>();
  const deadline = Date.now() + 230000;
  try {
    const { data: sources, error } = await db.from("discovery_sources").select("id,url,business_id,location_id,last_checked_at").eq("enabled", true).order("last_checked_at", { ascending: true, nullsFirst: true }).limit(12);
    if (error) throw new Error("Sources query failed");
    for (const source of sources ?? []) {
      if (Date.now() > deadline) { errors.push("Run time limit reached; remaining sources will be checked next run"); break; }
      try {
        const url = new URL(safeSourceUrl(source.url));
        if (!robots.has(url.origin)) {
          try { robots.set(url.origin, (await fetchPage(url.origin + "/robots.txt", 100000)).text); }
          catch (issue) { if (issue instanceof Error && issue.message === "HTTP 404") robots.set(url.origin, ""); else throw new Error("Unable to check robots.txt"); }
        }
        if (!robotsAllows(robots.get(url.origin)!, url.pathname + url.search)) throw new Error("Automated access disallowed by robots.txt");
        const page = await fetchPage(url.href, 500000, next => {
          const destination = new URL(next);
          return robotsAllows(robots.get(url.origin)!, destination.pathname + destination.search);
        });
        if (!robotsAllows(robots.get(url.origin)!, new URL(page.url).pathname + new URL(page.url).search)) throw new Error("Redirect destination disallowed by robots.txt");
        const evidence = page.pdf ? pdfEvidence(page.pdf, page.url) : extractEvidence(page.text, page.url);
        const { data: added, error: snapshotError } = await db.rpc("record_discovery_snapshot", {
          p_run: runId, p_source: source.id, p_hash: evidence.fingerprint,
          p_title: evidence.title, p_excerpt: evidence.excerpt, p_found: evidence.found
        });
        if (snapshotError) throw new Error("Snapshot save failed");
        checked++; if (added) queued++;
        // Follow at most two same-business public offer links, on the next scheduled run.
        for (const link of evidence.links) {
          const { error: linkError } = await db.from("discovery_sources").upsert({ url: link, business_id: source.business_id, location_id: source.location_id }, { onConflict: "url", ignoreDuplicates: true });
          if (linkError) errors.push(`${source.id}: offer link could not be saved`);
        }
      } catch (issue) {
        const known = issue instanceof Error && /^(HTTP \d{3}|Automated access disallowed|Redirect destination disallowed|Unable to check robots|Unsupported content|Page exceeds|Snapshot save|Cross-site|Too many|Unsupported official|Private or transactional)/.test(issue.message);
        const message = known ? (issue as Error).message : "Fetch failed or timed out";
        errors.push(`${source.id}: ${message}`);
        const { error: updateError } = await db.from("discovery_sources").update({ last_error: message, last_checked_at: new Date().toISOString() }).eq("id", source.id);
        if (updateError) errors.push(`${source.id}: failure status could not be saved`);
      }
    }
  } catch { errors.push("Discovery run failed; check private database configuration"); }
  const { error: finishError } = await db.rpc("finish_discovery_run", { p_run: runId, p_checked: checked, p_queued: queued, p_errors: errors });
  if (finishError) throw new Error("Discovery run could not be finalized");
  return { skipped: false, checked, queued, errors };
}
