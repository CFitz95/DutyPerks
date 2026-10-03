import "server-only";
import { createClient } from "@supabase/supabase-js";

export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || url.includes("your-project") || key === "your-publishable-key") {
    throw new Error("Supabase is not configured. Set the project URL and publishable key in environment settings.");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
