import { NextResponse } from "next/server";
import { sameOrigin } from "../../../../lib/admin-auth";
import { supabaseServer } from "../../../../lib/supabase";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  try {
    const form = await request.formData();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!adminEmail) throw new Error("Missing administrator configuration");
    if (email === adminEmail) {
      // Use the validated browser origin, rather than an internal proxy URL.
      const origin = new URL(request.headers.get("origin")!);
      const { error } = await supabaseServer().auth.resetPasswordForEmail(email, {
        redirectTo: new URL("/admin/reset-password", origin).href,
      });
      if (error) return NextResponse.redirect(new URL("/admin?notice=reset-unavailable", origin), 303);
    }
    return NextResponse.redirect(new URL("/admin?notice=reset-sent", request.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/admin?notice=reset-unavailable", request.url), 303);
  }
}

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  try {
    const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
    if (!token) return new Response("Unauthorized", { status: 401 });
    const client = supabaseServer();
    const { data, error } = await client.auth.getUser(token);
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (error || !adminEmail || !data.user?.email_confirmed_at || data.user.email?.toLowerCase() !== adminEmail) {
      return new Response("Unauthorized", { status: 401 });
    }
    const body = await request.json();
    if (typeof body.password !== "string" || body.password.length < 12 || body.password.length > 200) {
      return new Response("Choose a password between 12 and 200 characters.", { status: 400 });
    }
    // The user's recovery session authorizes this update; no server secret is needed.
    const { error: updateError } = await client.auth.setSession({ access_token: token, refresh_token: String(body.refreshToken ?? "") });
    if (updateError) return new Response("The reset link expired. Request a new one.", { status: 401 });
    const { error: passwordError } = await client.auth.updateUser({ password: body.password });
    if (passwordError) return new Response("Password could not be changed. Check Supabase password rules or request a new reset link.", { status: 400 });
    await client.auth.signOut({ scope: "global" });
    const response = NextResponse.json({ success: true });
    response.cookies.delete("dutyperks-admin");
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch { return new Response("Password reset unavailable. Please try again.", { status: 503 }); }
}
