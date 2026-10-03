"use client";
import { useState } from "react";

export default function PlanTrip() {
  const [result,setResult] = useState<any>(null);
  const [loading,setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true);
    const f = new FormData(e.currentTarget);
    const payload = Object.fromEntries(f.entries());
    const res = await fetch("/api/trips/generate", {
      method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload)
    });
    setResult(await res.json()); setLoading(false);
  }

  return (
    <main>
      <h1>Plan a military-benefit optimized trip</h1>
      <form onSubmit={submit} style={{display:"grid",gap:12,maxWidth:520}}>
        <input name="destination" placeholder="Destination (e.g. Las Vegas, NV)" required/>
        <input name="startDate" type="date" required/>
        <input name="endDate" type="date" required/>
        <input name="budget" type="number" min="0" placeholder="Total budget" required/>
        <input name="travelers" type="number" min="1" defaultValue="2" required/>
        <select name="status"><option>Active Duty</option><option>Reserve / Guard</option><option>Veteran</option><option>Retired</option><option>Military Family</option></select>
        <input name="interests" placeholder="Food, shows, outdoors..."/>
        <select name="transport"><option>Driving</option><option>Flying</option><option>Either</option></select>
        <button disabled={loading}>{loading ? "Building…" : "Build trip"}</button>
      </form>
      {result && <pre style={{whiteSpace:"pre-wrap",marginTop:24}}>{JSON.stringify(result,null,2)}</pre>}
    </main>
  );
}
