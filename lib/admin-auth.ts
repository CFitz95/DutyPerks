import "server-only";
import { cookies } from "next/headers";
import { supabaseServer } from "./supabase";

export const sessionCookie = "dutyperks-admin";
export async function getAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!email || !token) return null;
  try {
    const { data, error } = await supabaseServer().auth.getUser(token);
    if (error || !data.user?.email_confirmed_at || data.user.email?.toLowerCase() !== email) return null;
    return data.user;
  } catch { return null; }
}
export function sameOrigin(request: Request) {
  try {
    const origin = new URL(request.headers.get("origin") ?? "");
    const host = request.headers.get("host") ?? new URL(request.url).host;
    const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ?? new URL(request.url).protocol.slice(0,-1);
    return origin.host === host && origin.protocol === protocol + ":";
  } catch { return false; }
}
