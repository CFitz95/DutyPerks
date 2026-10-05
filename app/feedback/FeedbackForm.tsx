"use client";
import { useState } from "react";
export default function FeedbackForm({initialMessage=""}:{initialMessage?:string}) {
  const [message,setMessage]=useState(initialMessage),[busy,setBusy]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();if(busy) return;const form=event.currentTarget;setBusy(true);setMessage("");
    const body=new URLSearchParams();new FormData(form).forEach((value,key)=>body.append(key,String(value)));
    try {
      const response=await fetch("/api/feedback",{method:"POST",headers:{Accept:"application/json"},body});
      const result=await response.json();setMessage(result.message??"Feedback could not be sent. Please try again.");
      if(response.ok) form.reset();
    } catch {setMessage("Could not connect. Your feedback is still in the form—please try again when you’re online.");}
    finally{setBusy(false);}
  }
  return <form className="form-stack" action="/api/feedback" method="post" onSubmit={submit}>
    <label>Which area did you try?<select name="region" required defaultValue=""><option value="" disabled>Choose an area</option><option value="san_diego">San Diego</option><option value="whidbey">Whidbey Island</option><option value="other">Another area</option></select></label>
    <label>What would you like to share?<select name="kind" defaultValue="experience"><option value="experience">My experience using DutyPerks</option><option value="problem">Something didn’t work</option><option value="offer_issue">An offer has incorrect information</option><option value="suggestion">An idea or missing offer</option></select></label>
    <label>How easy was it to find a useful offer? <small>Optional</small><select name="rating" defaultValue=""><option value="">Skip this question</option><option value="1">1 — Very difficult</option><option value="2">2 — Difficult</option><option value="3">3 — Okay</option><option value="4">4 — Easy</option><option value="5">5 — Very easy</option></select></label>
    <label>Tell us what you tried and what happened<textarea name="message" minLength={10} maxLength={2000} rows={6} required placeholder="I searched for…" /></label>
    <label>Email <small>Optional. Include it only if you’d like us to be able to follow up.</small><input name="email" type="email" maxLength={254} autoComplete="email" /></label>
    <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <p id="feedback-privacy">Your message, area, optional rating and email are stored privately for DutyPerks administrators to improve the app or follow up. Please leave out passwords, military ID numbers and documents. A temporary address hash helps limit spam; the form does not store your raw IP address.</p>
    <button disabled={busy}>{busy?"Sending…":"Send feedback"}</button>
    {message && <p className="notice" role="status" aria-live="polite">{message}</p>}
  </form>;
}
