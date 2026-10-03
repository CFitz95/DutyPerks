import Link from "next/link";

export default function Home() {
  return (
    <main>
      <p style={{fontWeight:700}}>DUTYPERKS</p>
      <h1>Use more of the military benefits you already qualify for.</h1>
      <p>Find verified benefits near you or build a trip around eligible savings.</p>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:24}}>
        <Link href="/explore">Explore nearby benefits</Link>
        <Link href="/plan">Plan a trip</Link>
      </div>
      <hr style={{margin:"32px 0"}}/>
      <p><strong>Trust rule:</strong> AI may organize recommendations, but only verified benefit records can be presented as military benefits.</p>
    </main>
  );
}
