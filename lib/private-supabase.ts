import "server-only";
import { createClient } from "@supabase/supabase-js";

export function privateSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret || new URL(url).pathname !== "/") throw new Error("Private database configuration missing");
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(15000) }) } });
}
