"use client";
import { useState } from "react";

export default function PlanTrip() {
  const [result,setResult] = useState<unknown>(null);
  const [error,setError] = useState<string | null>(null);
  const [loading,setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError(null); setResult(null);
    const f = new FormData(e.currentTarget);
    const payload = Object.fromEntries(f.entries());
    try {
    const res = await fetch("/api/trips/generate", {
      method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload)
    });
    const data: unknown = await res.json();
    if (!res.ok) { setError("Please check all fields and ensure the end date is on or after the start date."); return; }
    setResult(data);
    } catch { setError("Unable to submit your request. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <main>
      <h1>Plan a military-benefit optimized trip</h1>
      <p>Prototype: validates your request only. It does not generate or save an itinerary yet.</p>
      <form onSubmit={submit} style={{display:"grid",gap:12,maxWidth:520}}>
        <input name="destination" placeholder="Destination (e.g. Las Vegas, NV)" required/>
        <input name="startDate" type="date" required/>
        <input name="endDate" type="date" required/>
        <input name="budget" type="number" min="0.01" step="0.01" placeholder="Total budget" required/>
        <input name="travelers" type="number" min="1" defaultValue="2" required/>
        <select name="status"><option>Active Duty</option><option>Reserve / Guard</option><option>Veteran</option><option>Retired</option><option>Military Family</option></select>
        <input name="interests" placeholder="Food, shows, outdoors..."/>
        <select name="transport"><option>Driving</option><option>Flying</option><option>Either</option></select>
        <button disabled={loading}>{loading ? "Building…" : "Build trip"}</button>
      </form>
      {error && <p role="alert">{error}</p>}
      {result !== null && <pre style={{whiteSpace:"pre-wrap",marginTop:24}}>{JSON.stringify(result,null,2)}</pre>}
    </main>
  );
}
