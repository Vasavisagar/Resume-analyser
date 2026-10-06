"use client";

import { useEffect, useState } from "react";
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

type Report = {
  scores: { ats_parsability: number; job_match: number; application_readiness: number; components: Record<string, number> };
  skills: { detected: string[]; required_matched: string[]; required_missing: string[]; preferred_matched: string[]; preferred_missing: string[]; context_evidence: string[] };
  sections_detected: string[]; experience: { status: string; note: string }; ats_risks: { level: string; message: string }[];
  recommendations: string[]; explanation: string; limitations: string[]; extraction?: { characters: number; quality: string };
  nvidia_guidance?: string; nvidia_error?: string; saved_analysis_id?: string; demo?: boolean;
};
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [file, setFile] = useState<File | null>(null), [jd, setJd] = useState(""), [report, setReport] = useState<Report | null>(null), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null), [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin"), [email, setEmail] = useState(""), [password, setPassword] = useState(""), [authError, setAuthError] = useState("");
  const [guestMode, setGuestMode] = useState(false);
  const [nvidiaAvailable, setNvidiaAvailable] = useState(false), [nvidiaConsent, setNvidiaConsent] = useState(false), [saveHistory, setSaveHistory] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    fetch(`${API}/health`).then(r => r.json()).then(cfg => {
      setNvidiaAvailable(Boolean(cfg.nvidia_configured));
      if (cfg.supabase_configured) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) { setAuthError("Supabase is configured on the API, but its frontend public settings are missing."); return; }
        const client = createClient(url, key); setSupabase(client);
        client.auth.getSession().then(({ data }) => setSession(data.session));
        const auth = client.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
        unsubscribe = () => auth.data.subscription.unsubscribe();
      }
    }).catch(() => undefined);
    return () => unsubscribe?.();
  }, []);

  async function authSubmit(e: React.FormEvent) {
    e.preventDefault(); setAuthError("");
    if (!supabase) { setAuthError("Supabase sign-in is not configured."); return; }
    const result = authMode === "signin" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    if (result.error) setAuthError(result.error.message);
    else if (authMode === "signup" && !result.data.session) setAuthError("Check your email to confirm your account, then sign in.");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setReport(null);
    if (!file || jd.trim().length < 40) { setError("Add a resume and a job description with at least 40 characters."); return; }
    setBusy(true);
    const data = new FormData(); data.append("resume", file); data.append("job_description", jd);
    data.append("save_analysis", String(saveHistory)); data.append("nvidia_enhance", String(nvidiaConsent));
    try {
      const headers: HeadersInit = {};
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      const res = await fetch(`${API}/api/analyze-upload`, { method: "POST", headers, body: data });
      const body = await res.json();
      if (!res.ok) throw new Error(body.detail || "Analysis failed. Please try again.");
      setReport(body);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not reach the analysis service."); }
    finally { setBusy(false); }
  }

  async function loadDemo() {
    setError(""); setReport(null); setBusy(true);
    try {
      const res = await fetch(`${API}/api/demo`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.detail || "The sample report could not be loaded.");
      setReport(body);
    } catch (err) { setError(err instanceof Error ? err.message : "The sample report could not be loaded."); }
    finally { setBusy(false); }
  }

  return <main>
    <header className="top"><a className="brand" href="#top"><span className="mark">C</span> clearfit</a>
      {session ? <div className="auth-status"><span>{session.user.email}</span><button type="button" onClick={() => supabase?.auth.signOut()}>Sign out</button></div> : <span className="privacy">⌑ &nbsp;Private by design</span>}
    </header>
    <section className="hero" id="top"><p className="eyebrow">A clearer way to prepare</p><h1>Know where your resume<br/>stands <em>for this role.</em></h1><p className="intro">See what aligns, what may be missing, and how readable your resume is to automated systems. No mystery score. No hiring guarantees.</p><div className="steps"><span><b>01</b> Add resume</span><i>→</i><span><b>02</b> Add job description</span><i>→</i><span><b>03</b> Explore your match</span></div><button type="button" className="demo-button" disabled={busy} onClick={loadDemo}>View a sample report</button></section>

    {supabase && !session && !guestMode && <section className="auth-box"><form onSubmit={authSubmit}>
      <div className="auth-heading"><b>{authMode === "signin" ? "Sign in to Clearfit" : "Create your account"}</b><small>Sign in to save analysis history privately.</small></div>
      <label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label>
      <label>Password<input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={authMode === "signin" ? "current-password" : "new-password"}/></label>
      <button className="auth-button">{authMode === "signin" ? "Sign in" : "Create account"}</button>
      <button type="button" className="text-button" onClick={()=>{setAuthMode(authMode === "signin" ? "signup" : "signin");setAuthError("")}}>{authMode === "signin" ? "Create an account" : "I already have an account"}</button>
      <button type="button" className="text-button guest-button" onClick={()=>setGuestMode(true)}>Continue as guest</button>
      {authError&&<p className="auth-error" role="alert">{authError}</p>}
    </form></section>}
    {supabase && !session && guestMode && <section className="auth-box guest-mode-note"><div><b>Guest mode</b><p>Try resume analysis without an account. Your report is not saved.</p></div><button type="button" className="text-button" onClick={()=>setGuestMode(false)}>Sign in to save reports</button></section>}
    {!supabase && authError && <div className="error" role="status">{authError}</div>}

    <section className="workspace"><form onSubmit={submit} className="inputs">
      <div className="panel"><div className="panel-title"><span className="num">01</span><div><h2>Your resume</h2><p>PDF or DOCX · up to 8 MB</p></div></div><label className="drop" htmlFor="resume" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();setFile(e.dataTransfer.files?.[0]||null)}}><span className="upload-icon">↑</span><strong>{file ? file.name : "Choose a file or drop it here"}</strong><span>{file ? `${(file.size / 1024).toFixed(0)} KB · ready to analyze` : "Your file is processed for this analysis and not saved."}</span><input id="resume" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => setFile(e.target.files?.[0] || null)}/></label></div>
      <div className="panel"><div className="panel-title"><span className="num">02</span><div><h2>Target job</h2><p>Paste the complete job description</p></div></div><label className="sr" htmlFor="jd">Job description</label><textarea id="jd" value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste the job description here…" maxLength={30000}/><div className="counter">{jd.length.toLocaleString()} / 30,000</div></div>
      {session && <label className="option"><input type="checkbox" checked={saveHistory} onChange={e=>setSaveHistory(e.target.checked)}/> Save this analysis to my Supabase account. The resume file itself will not be saved.</label>}
      {nvidiaAvailable && <label className="option"><input type="checkbox" checked={nvidiaConsent} onChange={e=>setNvidiaConsent(e.target.checked)}/> Use NVIDIA role-specific guidance. I understand resume text with email addresses, phone numbers, and URLs removed, plus the job description, will be sent to NVIDIA. My name and other details may remain.</label>}
      {error && <div className="error" role="alert">{error}</div>}<button className="submit" disabled={busy}>{busy ? <><span className="spinner"/> Analyzing your resume…</> : "Analyze my resume　→"}</button><p className="fine">By analyzing, you agree that this tool provides estimates for informational purposes only.</p>
    </form>
    <aside className="side"><div className="side-label">WHAT YOU’LL GET</div><h3>A useful picture,<br/>not a verdict.</h3><ul><li><span>✓</span><div><b>ATS parsability</b><small>Can text and sections be read?</small></div></li><li><span>✓</span><div><b>Job match</b><small>How requirements align with evidence</small></div></li><li><span>✓</span><div><b>Clear next steps</b><small>Practical suggestions grounded in gaps</small></div></li></ul><div className="side-note">Your score is generated by this system. It is not the score from Workday, Greenhouse, or another employer ATS.</div></aside></section>

    {report && <section className="results" aria-live="polite"><div className="result-head"><div><p className="eyebrow">{report.demo ? "SAMPLE REPORT" : "YOUR ANALYSIS"}</p><h2>{report.demo ? "A sample resume and role, analyzed." : "A starting point for a stronger application."}</h2></div><span className="extract">Extracted {report.extraction?.characters.toLocaleString()} characters</span></div>
      {report.saved_analysis_id&&<p className="saved">Saved privately to your account.</p>}
      {report.nvidia_guidance&&<article className="result-card nvidia-card"><h3>NVIDIA role-specific guidance</h3><p className="muted">AI guidance is advisory; deterministic scores above are unchanged.</p><pre>{report.nvidia_guidance}</pre></article>}
      {report.nvidia_error&&<p className="error" role="status">NVIDIA guidance was unavailable: {report.nvidia_error} The deterministic analysis is still available below.</p>}
      <div className="score-grid"><Score title="ATS parsability" value={report.scores.ats_parsability} detail="Text and structure"/><Score title="Job match" value={report.scores.job_match} detail="Specific to this job"/><Score title="Application readiness" value={report.scores.application_readiness} detail="Combined indicator"/></div>
      <div className="result-grid"><article className="result-card"><h3>Skills alignment</h3><p className="muted">Detected skills are based on a limited built-in vocabulary.</p><div className="skillrow"><b>Matched requirements</b>{chips(report.skills.required_matched,"good")}</div><div className="skillrow"><b>Not detected</b>{chips(report.skills.required_missing,"warn")}</div><div className="skillrow"><b>Preferred matched</b>{chips(report.skills.preferred_matched,"good")}</div><div className="skillrow"><b>Preferred not detected</b>{chips(report.skills.preferred_missing,"neutral")}</div><div className="skillrow"><b>Context evidence</b>{chips(report.skills.context_evidence,"good")}</div></article>
      <article className="result-card"><h3>Score breakdown</h3><p className="muted">Transparent engineering baseline; weights are not calibrated.</p>{Object.entries(report.scores.components).map(([k,v])=><div className="barrow" key={k}><div><span>{k.replaceAll("_"," ")}</span><b>{v}/100</b></div><div className="track"><i style={{width:`${v}%`}}/></div></div>)}<p className="formula">{report.explanation}</p></article>
      <article className="result-card"><h3>Resume structure & risks</h3><p className="muted">Sections detected: {report.sections_detected.join(", ") || "none confidently detected"}.</p><p><b>Experience assessment:</b> {report.experience.status}. {report.experience.note}</p>{report.ats_risks.length ? report.ats_risks.map(r=><p className="risk" key={r.message}><b>{r.level.toUpperCase()}</b> {r.message}</p>) : <p>No heuristic parsing risks detected.</p>}</article>
      <article className="result-card"><h3>Suggested next steps</h3>{report.recommendations.length ? <ol>{report.recommendations.map(x=><li key={x}>{x}</li>)}</ol> : <p>No specific recommendations from these heuristics.</p>}<p className="muted">Only include claims that accurately reflect your experience.</p></article></div><p className="limitations">{report.limitations.join(" ")}</p></section>}
    <footer><span>clearfit <small>Resume compatibility, made understandable.</small></span><small>For informational use · Human review matters</small></footer>
  </main>;
}

function Score({title,value,detail}:{title:string;value:number;detail:string}) { return <article className="score"><span>{title}</span><strong>{value}<small>/100</small></strong><i><b style={{width:`${value}%`}}/></i><small>{detail}</small></article>; }
function chips(items:string[],cls:string) { return items.length ? <div className="chips">{items.map(x=><span className={cls} key={x}>{x}</span>)}</div> : <span className="muted">None detected</span>; }
