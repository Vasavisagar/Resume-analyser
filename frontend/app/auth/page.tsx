"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type AuthMode = "signin" | "signup" | "reset";

export default function AuthPage() {
  const router = useRouter();
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "signup") setMode("signup");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const supabase = createClient(url, key);
      setClient(supabase);
      const { data } = supabase.auth.onAuthStateChange(event => {
        if (event === "PASSWORD_RECOVERY") setMode("reset");
      });
      return () => data.subscription.unsubscribe();
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (!client) return;
    if (mode !== "signin" && password !== confirmPassword) { setError("Those passwords do not match."); return; }
    setBusy(true);
    try {
      if (mode === "signin") {
        const result = await client.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        router.push("/analyze");
      } else if (mode === "signup") {
        const result = await client.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth` } });
        if (result.error) throw result.error;
        if (result.data.session) router.push("/analyze");
        else setMessage("Your account is ready. Check your email to confirm it, then sign in.");
      } else {
        const result = await client.auth.updateUser({ password });
        if (result.error) throw result.error;
        router.push("/analyze");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn’t complete that request. Please try again.");
    } finally { setBusy(false); }
  }

  async function resetPassword() {
    setError(""); setMessage("");
    if (!client) { setError("Password recovery becomes available after Supabase is configured."); return; }
    if (!email) { setError("Enter your email address first."); return; }
    setBusy(true);
    try {
      const result = await client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth` });
      if (result.error) throw result.error;
      setMessage("If an account exists for that email, a password reset link is on its way.");
    } catch (err) { setError(err instanceof Error ? err.message : "We couldn’t send the reset link."); }
    finally { setBusy(false); }
  }

  return <main className="auth-page">
    <header className="journey-header"><div className="journey-header-inner"><Link className="journey-brand" href="/"><span className="journey-brand-mark">C</span><span>clearfit</span></Link><Link className="auth-back" href="/">← Back to home</Link></div></header>
    <section className="auth-layout">
      <div className="auth-story"><span className="journey-kicker"><i/> A CLEARER WAY TO PREPARE</span><h1>Make the next<br/><em>step feel clearer.</em></h1><p>Keep your resume review focused on the role, the evidence, and the choices you want to make.</p><div className="auth-story-route"><span>RESUME</span><i>→</i><span>ROLE</span><i>→</i><span>CLARITY</span></div><div className="auth-story-note"><b>Private by default</b><small>Your resume is processed for analysis and is not saved. Report history is always opt in.</small></div></div>
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-tabs"><button type="button" className={mode === "signin" ? "selected" : ""} onClick={() => {setMode("signin");setError("");setMessage("")}}>Sign in</button><button type="button" className={mode === "signup" ? "selected" : ""} onClick={() => {setMode("signup");setError("");setMessage("")}}>Create account</button></div>
        <div className="auth-card-heading"><span className="journey-overline">WELCOME TO CLEARFIT</span><h2 id="auth-title">{mode === "signin" ? "Good to see you again." : mode === "signup" ? "Start with a clearer view." : "Choose a new password."}</h2><p>{mode === "signin" ? "Sign in to continue to your resume workspace." : mode === "signup" ? "Create an account to keep your analysis history when you choose to save it." : "Choose a new password for your Clearfit account."}</p></div>
        <form className="journey-auth-form" onSubmit={submit}>
          {mode !== "reset" && <label>Email address<input type="email" autoComplete="email" required disabled={!client || busy} value={email} onChange={event=>setEmail(event.target.value)} placeholder="you@example.com"/></label>}
          <label>{mode === "reset" ? "New password" : "Password"}<input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={8} disabled={!client || busy} value={password} onChange={event=>setPassword(event.target.value)} placeholder="At least 8 characters"/></label>
          {mode !== "signin" && <label>Confirm password<input type="password" autoComplete="new-password" required minLength={8} disabled={!client || busy} value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)} placeholder="Enter your password again"/></label>}
          {mode === "signin" && <button className="auth-forgot" type="button" onClick={resetPassword} disabled={!client || busy}>Forgot password?</button>}
          {client && error && <p className="auth-feedback auth-feedback-error" role="alert">{error}</p>}{message && <p className="auth-feedback auth-feedback-success" role="status">{message}</p>}
          {!client && <p className="auth-setup-note">Supabase sign-in is not configured. Add its publishable key to your local <code>.env</code> and restart the app.</p>}
          <button className="journey-auth-submit" type="submit" disabled={!client || busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in to Clearfit" : mode === "signup" ? "Create my account" : "Update password"}<span aria-hidden="true">→</span></button>
        </form>
        {mode !== "reset" && <p className="auth-switch">{mode === "signin" ? "New to Clearfit?" : "Already have an account?"} <button type="button" onClick={() => {setMode(mode === "signin" ? "signup" : "signin");setError("");setMessage("")}}>{mode === "signin" ? "Create an account" : "Sign in"}</button></p>}
        <div className="auth-card-footer"><span>For informational use</span><span>·</span><span>Human review matters</span></div>
      </section>
    </section>
  </main>;
}
