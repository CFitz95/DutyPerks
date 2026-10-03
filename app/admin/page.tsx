
const sample = [
  ["USS Midway Museum","Military admission","Pending verification"],
  ["Navy SEAL Museum San Diego","Military admission","Pending verification"],
  ["SeaWorld San Diego","Waves of Honor","Pending verification"],
  ["The Gondola Company","Veterans Day 50% offer","Pending verification"],
  ["Wild Pacific Whale Watch","November 50% offer","Pending verification"]
];

export default function AdminPage() {
  const rows = sample;
  return <main>
    <h1>Verification queue</h1>
    <p>Demo queue only. These sample records are unverified; no database records are displayed or changed here. Admin authentication and editing are not implemented.</p>
    <table cellPadding={10} style={{borderCollapse:"collapse",width:"100%"}}>
      <thead><tr><th align="left">Business</th><th align="left">Benefit</th><th align="left">State</th></tr></thead>
      <tbody>{rows.map((r,i)=><tr key={i} style={{borderTop:"1px solid #ddd"}}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody>
    </table>
  </main>
}
