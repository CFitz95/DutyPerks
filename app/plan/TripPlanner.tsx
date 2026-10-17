'use client';
import Link from 'next/link';
import {useState} from 'react';
import {dayDate,directionsUrl,reorderItem,savedOfferStatus} from '../../lib/itinerary-core.mjs';
import {useTrip,type Trip} from '../components/useTrip';
export default function TripPlanner(){
 const {trip,error,update}=useTrip(),[message,setMessage]=useState('');
 if(!trip)return <p role="status">{error||'Loading your saved trip…'}</p>;
 const current=trip;
 function saveDetails(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();const f=new FormData(event.currentTarget),days=Number(f.get('days'));
  if(current.items.some(i=>i.day>days)){setMessage('Move offers off the later days before shortening your trip.');return;}
  if(update(p=>({...p,name:String(f.get('name')).trim(),destination:String(f.get('destination')).trim(),startDate:String(f.get('startDate')),days,notes:String(f.get('notes'))})))setMessage('Trip details saved on this device.');
 }
 function itemChange(id:string,fields:Partial<Trip['items'][number]>){if(update(p=>({...p,items:p.items.map(i=>i.offer.id===id?{...i,...fields}:i)})))setMessage('Trip updated.');}
 return <>
  <div className="notice no-print"><strong>Saved on this device, in this browser.</strong><p>No account needed. Trips do not sync to other devices; clearing browser data can remove them. Saved offers are copies—confirm current terms and eligibility before visiting. Saving an offer does not reserve it.</p></div>
  <form className="form-stack trip-details no-print" onSubmit={saveDetails} key={`${trip.name}|${trip.destination}|${trip.startDate}|${trip.days}|${trip.notes}`}>
   <label>Trip name<input name="name" defaultValue={trip.name} maxLength={100} required/></label>
   <label>Destination<input name="destination" defaultValue={trip.destination} maxLength={120} placeholder="San Diego"/></label>
   <div className="trip-fields"><label>First day <small>Optional</small><input name="startDate" type="date" defaultValue={trip.startDate}/></label><label>Number of days<select name="days" defaultValue={trip.days}>{Array.from({length:14},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label></div>
   <label>Trip notes <small>Optional; avoid sensitive personal details</small><textarea name="notes" maxLength={1000} rows={3} defaultValue={trip.notes}/></label><button>Save trip details</button>
  </form>
  {(error||message)&&<p className="notice no-print" role="status">{error||message}</p>}
  <div className="actions no-print"><Link className="button-link" href={`/explore?location=${encodeURIComponent(trip.destination)}`}>Find offers to add</Link><button className="secondary" type="button" onClick={()=>window.print()}>Print / save as PDF</button><Link href="/feedback">Share trip feedback</Link></div>
  <section aria-label="Your itinerary"><h2>{trip.name}</h2><p>{trip.destination}{trip.startDate?` · ${trip.startDate}`:''} · {trip.items.length} saved {trip.items.length===1?'offer':'offers'}</p>
   {trip.notes&&<p>{trip.notes}</p>}
   {!trip.items.length&&<p className="notice">Your trip is empty. Find an offer and choose “Save to trip,” then arrange it here.</p>}
   {Array.from({length:trip.days},(_,index)=>{
    const day=index+1,date=dayDate(trip.startDate,day),items=trip.items.filter(i=>i.day===day);
    return <section className="trip-day" key={day} aria-labelledby={`trip-day-${day}`}><h3 id={`trip-day-${day}`}>Day {day}{date?` · ${date}`:''}</h3>
     {!items.length&&<p>No offers planned for this day.</p>}
     {items.map((item,pos)=><article className="card" key={item.offer.id} aria-label={item.offer.title}>
      <p className="eyebrow">{item.time?`${item.time} · `:''}{item.offer.city}, {item.offer.state}</p><h4>{item.offer.business_name}</h4><p>{item.offer.title}</p>
      <p className="trip-offer-status">{savedOfferStatus(item.offer,date)}</p><p>Source checked {item.offer.verified_at.slice(0,10)}{item.offer.expires_at?` · Offer ends ${item.offer.expires_at}`:''}.</p>
      {item.offer.requirements&&<details><summary>Saved eligibility and requirements</summary><p>{item.offer.requirements}</p></details>}
      <form className="trip-item-form no-print" key={`${item.offer.id}|${item.day}|${item.time}|${item.notes}`} onSubmit={event=>{event.preventDefault();const f=new FormData(event.currentTarget);itemChange(item.offer.id,{day:Number(f.get('day')),time:String(f.get('time')),notes:String(f.get('notes'))});}}>
       <div className="trip-fields"><label>Day<select name="day" defaultValue={item.day}>{Array.from({length:trip.days},(_,i)=><option key={i+1} value={i+1}>Day {i+1}</option>)}</select></label><label>Time <small>Optional; your schedule only</small><input name="time" type="time" defaultValue={item.time}/></label></div>
       <label>Notes<textarea name="notes" defaultValue={item.notes} maxLength={500} rows={2}/></label><button>Save stop</button>
      </form>
      {item.notes&&<p>{item.notes}</p>}
      <div className="actions no-print"><button type="button" className="secondary" disabled={pos===0} aria-label={`Move ${item.offer.business_name} earlier`} onClick={()=>update(p=>reorderItem(p,item.offer.id,-1))}>Move earlier</button><button type="button" className="secondary" disabled={pos===items.length-1} aria-label={`Move ${item.offer.business_name} later`} onClick={()=>update(p=>reorderItem(p,item.offer.id,1))}>Move later</button><button type="button" className="secondary" aria-label={`Remove ${item.offer.title} from trip`} onClick={()=>{if(update(p=>({...p,items:p.items.filter(i=>i.offer.id!==item.offer.id)})))setMessage('Offer removed. You can add it again from Find offers.');}}>Remove</button></div>
      <div className="actions trip-links"><a href={item.offer.source_url} target="_blank" rel="noopener noreferrer">Check official terms ↗</a><a href={directionsUrl(item.offer)} target="_blank" rel="noopener noreferrer">Open directions ↗</a><Link href={`/explore?location=${encodeURIComponent(item.offer.city)}`}>Check current local offers</Link></div>
     </article>)}
    </section>;
   })}
  </section><p>Times are your schedule, not confirmed reservations. Directions search by venue name and city; confirm the exact entrance or tour meeting point before setting out.</p>
 </>;
}
