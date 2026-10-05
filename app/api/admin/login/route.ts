import { NextResponse } from "next/server";
import { sameOrigin, sessionCookie } from "../../../../lib/admin-auth";
import { supabaseServer } from "../../../../lib/supabase";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  try {
    const form = await request.formData();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    if (!process.env.ADMIN_EMAIL || email !== process.env.ADMIN_EMAIL.trim().toLowerCase() || password.length > 200) {
      return NextResponse.redirect(new URL("/admin?notice=login", request.url), 303);
    }
    const { data, error } = await supabaseServer().auth.signInWithPassword({ email, password });
    if (error || !data.session || !data.user.email_confirmed_at) return NextResponse.redirect(new URL("/admin?notice=login", request.url), 303);
    const response = NextResponse.redirect(new URL("/admin", request.url), 303);
    response.cookies.set(sessionCookie, data.session.access_token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: Math.min(data.session.expires_in, 3600) });
    return response;
  } catch { return NextResponse.redirect(new URL("/admin?notice=setup", request.url), 303); }
}
