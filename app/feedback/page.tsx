import FeedbackForm from "./FeedbackForm";
export const dynamic="force-dynamic";
const notices:Record<string,string>={sent:"Thanks—your feedback has been sent to the DutyPerks team.",invalid:"Please check the form and try again.",busy:"Too many submissions right now. Please wait and try again later.",unavailable:"Feedback could not be sent right now. Please try again shortly."};
export default async function FeedbackPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;
 return <main><p className="eyebrow">Help us improve</p><h1>How did DutyPerks work for you?</h1><p>You don’t need an account. We’d like to hear what helped, what was confusing, or which local offers you couldn’t find.</p>
   <FeedbackForm initialMessage={typeof params.notice==="string"?notices[params.notice]:undefined}/>
 </main>;
}
