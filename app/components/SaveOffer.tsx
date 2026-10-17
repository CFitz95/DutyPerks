'use client';
import Link from 'next/link';
import {useState} from 'react';
import {addOffer} from '../../lib/itinerary-core.mjs';
import {useTrip,type SavedOffer} from './useTrip';
export default function SaveOffer({offer}:{offer:SavedOffer}){
 const {trip,error,update}=useTrip(),[message,setMessage]=useState('');
 const saved=trip?.items.some(i=>i.offer.id===offer.id);
 return <div className="save-offer no-print"><div className="actions"><button type="button" disabled={!trip||saved} aria-label={`${saved?'Saved':'Save'}: ${offer.title}`} onClick={()=>{if(update(p=>addOffer(p,offer)))setMessage('Saved to Day 1. Arrange it in My trip.');}}>{saved?'Saved to trip':'Save to trip'}</button><Link href="/plan">View my trip</Link></div>{(error||message)&&<p role="status">{error||message}</p>}</div>;
}
