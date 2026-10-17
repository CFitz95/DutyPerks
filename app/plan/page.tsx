import type {Metadata} from 'next';
import TripPlanner from './TripPlanner';
export const metadata:Metadata={title:'My trip | DutyPerks',description:'Save military offers and arrange a day-by-day itinerary on your device.'};
export default function PlanTrip(){return <main><p className="eyebrow">Plan a day out or a longer stay</p><h1>My trip</h1><p>Save offers from Find offers, arrange them by day, and check directions when you’re ready.</p><TripPlanner/></main>;}
