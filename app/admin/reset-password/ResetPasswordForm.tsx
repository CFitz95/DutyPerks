"use client";
import { useEffect, useRef, useState } from "react";

export default function ResetPasswordForm() {
  const recovery = useRef<{accessToken: string; refreshToken: string} | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("Checking your reset link…");
  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = fragment.get("access_token");
    const refreshToken = fragment.get("refresh_token");
    // Remove recovery credentials from the address bar immediately; keep only in memory.
    window.history.replaceState(null, "", window.location.pathname);
    if (accessToken && refreshToken && fragment.get("type") === "recovery") {
      recovery.current = { accessToken, refreshToken };
      setReady(true);
      setMessage("Choose a password with at least 12 characters.");
    } else if (!recovery.current) {
      setMessage("Open the latest password-reset email link to choose a new password. If the link expired, return to sign-in and request another.");
    }
  }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!recovery.current || busy) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== form.get("confirm")) { setMessage("The passwords do not match."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/password-reset", {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${recovery.current.accessToken}` },
        body: JSON.stringify({ password, refreshToken: recovery.current.refreshToken }), cache: "no-store",
      });
      if (!response.ok) { setMessage(await response.text()); return; }
      recovery.current = null;
      setDone(true);
      setMessage("Password changed. Return to admin sign-in and use your new password.");
    } catch { setMessage("Could not connect. Please try again."); }
    finally { setBusy(false); }
  }
  return <><p role="status">{message}</p>{ready && !done && <form onSubmit={submit} style={{display:"grid",gap:12,maxWidth:400}}>
    <label>New password <input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={200} required /></label>
    <label>Confirm password <input name="confirm" type="password" autoComplete="new-password" minLength={12} maxLength={200} required /></label>
    <button disabled={busy}>{busy ? "Saving…" : "Save new password"}</button>
  </form>}</>;
}
