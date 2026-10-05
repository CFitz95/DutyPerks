import Link from "next/link";
import {getAdmin} from "../../../lib/admin-auth";
import {privateSupabase} from "../../../lib/private-supabase";
export const dynamic="force-dynamic";
const kinds:Record<string,string>={experience:"Experience",problem:"App problem",offer_issue:"Offer information",suggestion:"Suggestion"};
const regions:Record<string,string>={san_diego:"San Diego",whidbey:"Whidbey Island",other:"Another area"};
export default async function FeedbackInbox({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 if(!await getAdmin()) return <main><h1>Tester feedback</h1><p>Sign in as the administrator to read feedback.</p><Link href="/admin">Admin sign-in</Link></main>;
 const params=await searchParams;const state=params.state==="reviewed"?"reviewed":"new";
 try{
   const {data,error}=await privateSupabase().from("tester_feedback").select("id,kind,region,message,contact_email,rating,state,created_at").eq("state",state).order("created_at",{ascending:false}).limit(50);
   if(error) throw new Error("Inbox unavailable");
   return <main><Link href="/admin">← Offer review queue</Link><h1>Tester feedback</h1>
     <div className="actions"><Link href="/admin/feedback">New feedback</Link><Link href="/admin/feedback?state=reviewed">Reviewed feedback</Link></div>
     {params.notice==="saved"&&<p role="status">Feedback marked reviewed.</p>}{params.notice==="error"&&<p role="alert">Could not update feedback. Please try again.</p>}
     <p>Showing the newest {state} messages, up to 50. Feedback is unverified user input and does not change public offers.</p>
     {!data?.length&&<p>No {state} feedback yet.</p>}
     {(data??[]).map(item=><article className="card" key={item.id}>
       <h2>{kinds[item.kind]??item.kind} · {regions[item.region]??item.region}</h2><p>{item.created_at.slice(0,16)} UTC{item.rating?` · Ease of use: ${item.rating}/5`:""}</p>
       <p style={{whiteSpace:"pre-wrap"}}>{item.message}</p>{item.contact_email&&<p>Optional contact: {item.contact_email}</p>}
       {state==="new"&&<form action="/api/admin/feedback" method="post"><input type="hidden" name="id" value={item.id}/><button>Mark reviewed</button></form>}
     </article>)}
   </main>;
 }catch{return <main><h1>Tester feedback</h1><p role="alert">The feedback inbox could not load. Check the feedback database setup and server settings.</p><Link href="/admin">Return to admin</Link></main>;}
}
