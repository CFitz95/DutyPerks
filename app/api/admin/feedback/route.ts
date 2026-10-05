import {NextResponse} from "next/server";
import {z} from "zod";
import {getAdmin,sameOrigin} from "../../../../lib/admin-auth";
import {privateSupabase} from "../../../../lib/private-supabase";
export async function POST(request:Request){
 if(!sameOrigin(request)) return new Response("Forbidden",{status:403});
 const admin=await getAdmin();if(!admin) return new Response("Unauthorized",{status:401});
 try{
   const form=await request.formData();const id=z.string().uuid().parse(form.get("id"));
   const {error}=await privateSupabase().from("tester_feedback").update({state:"reviewed",reviewed_at:new Date().toISOString(),reviewed_by:admin.id}).eq("id",id).eq("state","new");
   if(error) throw new Error("Update failed");
   return NextResponse.redirect(new URL("/admin/feedback?notice=saved",request.url),303);
 }catch{return NextResponse.redirect(new URL("/admin/feedback?notice=error",request.url),303);}
}
