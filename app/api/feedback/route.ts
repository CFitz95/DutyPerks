import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin } from "../../../lib/admin-auth";
import { privateSupabase } from "../../../lib/private-supabase";
const Feedback = z.object({
  kind:z.enum(["experience","problem","offer_issue","suggestion"]),
  region:z.enum(["san_diego","whidbey","other"]),
  message:z.string().trim().min(10).max(2000),
  email:z.union([z.literal(""),z.string().trim().email().max(254)]),
  rating:z.union([z.literal(""),z.enum(["1","2","3","4","5"])]),
});
const messages = {
  sent:"Thanks—your feedback has been sent to the DutyPerks team.",
  invalid:"Please check the form. Your message must have 10–2,000 characters and any email address must be valid.",
  busy:"Too many submissions right now. Please wait and try again later.",
  unavailable:"Feedback could not be sent right now. Please try again shortly.",
};
function reply(request: Request, notice: keyof typeof messages, status=200) {
  const response = request.headers.get("accept")?.includes("application/json")
    ? NextResponse.json({notice,message:messages[notice]}, {status})
    : NextResponse.redirect(new URL(`/feedback?notice=${notice}`, request.url),303);
  response.headers.set("Cache-Control","no-store");
  return response;
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden",{status:403});
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) return reply(request,"invalid",400);
  try {
    const reader=request.body?.getReader();
    if (!reader) return reply(request,"invalid",400);
    const chunks:Uint8Array[]=[];let bytes=0;
    try {while (true) {const part=await reader.read();if(part.done) break;bytes+=part.value.byteLength;if(bytes>16000) return reply(request,"invalid",413);chunks.push(part.value);}}
    finally {await reader.cancel();}
    const form=new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
    // Bot trap: report a generic success without creating a record.
    if (form.get("website")) return reply(request,"sent");
    const parsed=Feedback.safeParse({kind:form.get("kind"),region:form.get("region"),message:form.get("message"),email:form.get("email")??"",rating:form.get("rating")??""});
    if (!parsed.success) return reply(request,"invalid",400);
    const signingKey=process.env.CRON_SECRET;
    if (!signingKey || signingKey.length<32) return reply(request,"unavailable",503);
    // Vercel supplies the proxy address. Store only its keyed hash, never the raw address.
    const address=(request.headers.get("x-vercel-forwarded-for")??request.headers.get("x-forwarded-for")??"unknown").split(",")[0].trim().slice(0,128);
    const bucket=createHmac("sha256",signingKey).update("feedback-v1:"+address).digest("hex");
    const value=parsed.data;
    const {data,error}=await privateSupabase().rpc("submit_tester_feedback",{
      p_bucket:bucket,p_kind:value.kind,p_region:value.region,p_message:value.message,
      p_email:value.email || null,p_rating:value.rating ? Number(value.rating) : null,
    });
    if(error) return reply(request,"unavailable",503);
    if(!data) return reply(request,"busy",429);
    return reply(request,"sent");
  } catch {return reply(request,"unavailable",503);}
}
