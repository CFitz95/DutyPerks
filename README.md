import Link from "next/link";
import { z } from "zod";
import { supabaseServer } from "../../lib/supabase";

export const dynamic = "force-dynamic";

const statuses = [
  ["active_duty", "Active Duty"], ["reserve_guard", "Reserve / Guard"],
  ["veteran", "Veteran"], ["retired", "Retired"], ["family", "Military Family"]
] as const;
const categories = [
  ["food", "Food"], ["hotel", "Hotels"], ["attraction", "Attractions"],
  ["tour", "Tours"], ["entertainment", "Entertainment"], ["shopping", "Shopping"],
  ["automotive", "Automotive"], ["fitness", "Fitness"], ["education", "Education"],
  ["financial", "Financial"]
] as const;
const SourceUrl = z.string().url().refine(url => new URL(url).protocol === "https:");
const Benefits = z.array(z.object({
  id: z.string().uuid(), title: z.string(), description: z.string(),
  category: z.string(), requirements: z.string().nullable(),
  business_name: z.string(), city: z.string(), state: z.string(),
  postal_code: z.string().nullable(), eligibility: z.array(z.string()),
  source_url: SourceUrl, source_name: z.string().nullable(),
  verified_at: z.string().datetime({ offset: true }),
  expires_at: z.string().date().nullable()
})).max(100);
type Params = Record<string, string | string[] | undefined>;
const single = (value: Params[string]) => typeof value === "string" ? value : "";
const dateLabel = (value: string) => value.slice(0, 10);
const eligibilityLabel = (value: string) => statuses.find(([key]) => key === value)?.[1] ?? value;

export default async function Explore({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const location = single(params.location).trim();
  const status = single(params.status);
  const category = single(params.category);
  const invalid = location.length > 120 ||
    (status !== "" && !statuses.some(([key]) => key === status)) ||
    (category !== "" && !categories.some(([key]) => key === category)) ||
    ["location", "status", "category"].some(key => Array.isArray(params[key]));
  let benefits: z.infer<typeof Benefits> = [];
  let error: string | null = invalid ? "Please use a city or ZIP and select one of the listed filters." : null;
  if (!invalid) {
    let stage = "configuration";
    try {
      const client = supabaseServer();
      stage = "connection";
      const { data, error: queryError, status: responseStatus } = await client.rpc("search_verified_benefits", {
        p_location: location, p_status: status, p_category: category
      });
      if (queryError) {
        console.error("DutyPerks Explore query failed", {
          status: responseStatus,
          code: /^[A-Z0-9]{1,24}$/.test(queryError.code ?? "") ? queryError.code : "unavailable"
        });
        throw new Error("Benefits query failed");
      }
      stage = "response validation";
      benefits = Benefits.parse(data);
    } catch {
      console.error("DutyPerks Explore failure", { stage });
      error = "We couldn’t load benefits right now. Please try again shortly.";
    }
  }
  return (
    <main>
      <Link href="/">← DutyPerks home</Link>
      <h1>Explore verified benefits</h1>
      <p>Search by city or ZIP and military status. Only currently valid, verified offers appear.</p>
      <p>City and ZIP searches are exact matches. Distance and nearby-radius search are coming later.</p>
      <form action="/explore" method="get" style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <label>City or ZIP<br />
          <input name="location" defaultValue={location.slice(0, 120)} maxLength={120} placeholder="San Diego, CA or 92101" />
        </label>
        <label>Military status<br />
          <select name="status" defaultValue={statuses.some(([key]) => key === status) ? status : ""}>
            <option value="">All statuses</option>
            {statuses.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label>Category<br />
          <select name="category" defaultValue={categories.some(([key]) => key === category) ? category : ""}>
            <option value="">All categories</option>
            {categories.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <button type="submit">Find benefits</button>
        <Link href="/explore">Clear filters</Link>
      </form>
      <section aria-label="Search results" style={{ marginTop: 24 }}>
        {error ? <p role="alert">{error} <Link href="/explore">Try again</Link></p> :
          benefits.length === 0 ? <p role="status">No verified benefits match your search yet. Try another city or clear the filters. Unverified offers are kept hidden.</p> :
          <>
            <p>{benefits.length === 100 ? "Showing the first 100 matches. Use filters to narrow your search." : `${benefits.length} verified ${benefits.length === 1 ? "benefit" : "benefits"} found.`}</p>
            {benefits.map(benefit => (
              <article key={benefit.id} style={{ border: "1px solid #ddd", padding: 16, marginBottom: 16, borderRadius: 8 }}>
                <p><strong>{benefit.business_name}</strong> · {benefit.city}, {benefit.state}</p>
                <h2>{benefit.title}</h2>
                <p>{benefit.description}</p>
                <p><strong>Eligibility:</strong> {benefit.eligibility.length ? benefit.eligibility.map(eligibilityLabel).join(", ") : "Check the source for eligibility."}</p>
                {benefit.requirements && <p><strong>Requirements:</strong> {benefit.requirements}</p>}
                <p>Verified {dateLabel(benefit.verified_at)}{benefit.expires_at ? ` · Offer ends ${benefit.expires_at}` : ""}</p>
                <a href={benefit.source_url} target="_blank" rel="noopener noreferrer">View verification source{benefit.source_name ? `: ${benefit.source_name}` : ""}</a>
                <p>Confirm terms with the provider before booking.</p>
              </article>
            ))}
          </>}
      </section>
    </main>
  );
}
