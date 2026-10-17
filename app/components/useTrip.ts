'use client';
import {useEffect,useState} from 'react';
import {emptyTrip,parseTrip,PLAN_KEY} from '../../lib/itinerary-core.mjs';
export type Trip=ReturnType<typeof emptyTrip>;
export type SavedOffer=Trip['items'][number]['offer'];
const changed='dutyperks-trip-changed';
export function useTrip(){
 const [trip,setTrip]=useState<Trip|null>(null),[error,setError]=useState('');
 useEffect(()=>{
  const read=()=>{try{setTrip(parseTrip(localStorage.getItem(PLAN_KEY)));setError('');}catch{setTrip(null);setError('Your saved trip could not be read. Data has not been replaced. Check whether browser storage is available.');}};
  const storage=(event:StorageEvent)=>{if(event.key===PLAN_KEY||event.key===null)read();};
  read();window.addEventListener(changed,read);window.addEventListener('storage',storage);
  return ()=>{window.removeEventListener(changed,read);window.removeEventListener('storage',storage);};
 },[]);
 function update(change:(current:Trip)=>Trip){
  try{const current=parseTrip(localStorage.getItem(PLAN_KEY)),next=parseTrip(JSON.stringify(change(current)));localStorage.setItem(PLAN_KEY,JSON.stringify(next));window.dispatchEvent(new Event(changed));setTrip(next);setError('');return true;}
  catch(issue){setError(issue instanceof Error?issue.message:'Could not save your trip.');return false;}
 }
 return {trip,error,update};
}
