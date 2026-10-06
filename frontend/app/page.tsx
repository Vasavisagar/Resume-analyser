import Link from "next/link";

const features = [
  { icon: "01", title: "ATS readability", text: "See whether resume text and common sections can be extracted from your document." },
  { icon: "02", title: "Role specific matching", text: "Compare your skills with the requirements in one target job description." },
  { icon: "03", title: "Evidence in context", text: "Distinguish a skill shown in a project or experience from a skill listed on its own." },
  { icon: "04", title: "Clear skill gaps", text: "Review detected, missing, required, and preferred skills in one place." },
  { icon: "05", title: "Practical next steps", text: "Get suggestions based on the gaps the analysis found. Keep every claim accurate." },
  { icon: "06", title: "Optional AI guidance", text: "Choose whether to request additional role tailored feedback from NVIDIA." },
];

const steps = [
  { number: "01", title: "Add your resume", text: "Upload a PDF or DOCX. The file is processed for this request and not saved." },
  { number: "02", title: "Choose a role", text: "Paste the job description you want to compare with your experience." },
  { number: "03", title: "Explore the evidence", text: "Review compatibility estimates, matching skills, gaps, and parsing risks." },
  { number: "04", title: "Plan your next edit", text: "Use grounded recommendations to decide what deserves more attention." },
];

const signals = ["Python", "SQL", "Projects", "Experience", "Required skills", "Preferred skills", "ATS structure"];

export default function Home() {
  return <main className="journey-page" id="top">
    <header className="journey-header">
      <div className="journey-header-inner">
        <Link className="journey-brand" href="/" aria-label="Clearfit home"><span className="journey-brand-mark">C</span><span>clearfit</span></Link>
        <nav className="journey-nav" aria-label="Main navigation">
          <Link className="active" href="#top">Home</Link>
          <Link href="#what-you-get">What you get</Link>
          <Link href="#how-it-works">How it works</Link>
          <Link href="#privacy">Privacy</Link>
        </nav>
        <div className="journey-header-actions"><Link className="journey-signin" href="/auth">Sign in</Link><Link className="journey-get-started" href="/auth?mode=signup">Get started <span aria-hidden="true">↗</span></Link></div>
      </div>
    </header>

    <section className="journey-hero">
      <div className="journey-hero-scene" aria-hidden="true">
        <div className="scene-glow"/><div className="scene-mountain mountain-back"/><div className="scene-mountain mountain-mid"/><div className="scene-mountain mountain-front"/>
        <svg className="scene-path" viewBox="0 0 760 470" preserveAspectRatio="none"><defs><linearGradient id="pathGlow" x1="0" x2="1"><stop offset="0" stopColor="#43f0cf"/><stop offset="1" stopColor="#22a9ff"/></linearGradient></defs><path className="path-shadow" d="M20 420 C130 410 122 330 220 326 S314 278 360 267 S416 218 480 222 S548 145 602 144 S652 75 735 55"/><path className="path-line" d="M20 420 C130 410 122 330 220 326 S314 278 360 267 S416 218 480 222 S548 145 602 144 S652 75 735 55"/></svg>
        <span className="scene-star star-one">✦</span><span className="scene-star star-two">✦</span>
        <div className="route-node node-one"><i>↑</i><b>Resume</b></div><div className="route-node node-two"><i>⌕</i><b>Role</b></div><div className="route-node node-three"><i>✓</i><b>Evidence</b></div><div className="route-node node-four"><i>↗</i><b>Next step</b></div>
        <div className="scene-caption">One role at a time. A clearer way forward.</div>
      </div>
      <div className="journey-shell journey-hero-content">
        <div className="journey-hero-copy">
          <span className="journey-kicker"><i/> A CLEARER WAY TO PREPARE</span>
          <h1>Your next step,<br/><em>mapped with clarity.</em></h1>
          <p>Understand how your resume lines up with a specific role, what evidence stands out, and what you could improve before applying.</p>
          <div className="journey-hero-actions"><Link className="journey-button journey-button-bright" href="/analyze">Analyze my resume <span aria-hidden="true">→</span></Link><Link className="journey-button journey-button-outline" href="#how-it-works"><span className="play-icon">▶</span> See how it works</Link></div>
          <div className="journey-promises"><span><i>✓</i> Job specific</span><span><i>✓</i> Evidence aware</span><span><i>✓</i> Private by default</span></div>
        </div>
        <aside className="journey-hero-card"><span className="hero-card-label">YOUR APPLICATION REVIEW</span><h2>See the signals<br/>behind the score.</h2><div className="hero-card-row"><span className="hero-card-icon">01</span><span><b>ATS parsability</b><small>Is the document readable?</small></span><i>↗</i></div><div className="hero-card-row"><span className="hero-card-icon blue">02</span><span><b>Job match</b><small>How does it fit this role?</small></span><i>↗</i></div><div className="hero-card-foot"><span className="pulse-dot"/> No mystery score. Review the evidence.</div></aside>
      </div>
      <div className="journey-shell journey-hero-bottom"><span>YOUR EXPERIENCE IS MORE THAN A SCORE</span><span>Use estimates as one input. Keep human judgement in the loop.</span></div>
    </section>

    <section className="journey-section journey-features" id="what-you-get">
      <div className="journey-shell">
        <div className="journey-section-heading"><span className="journey-overline">EXPLORE YOUR APPLICATION</span><h2>Everything you need to<br/><em>review a role with confidence.</em></h2><p>One focused review that explains what the system can see and where its estimates come from.</p></div>
        <div className="journey-feature-grid">{features.map(feature=><article className="journey-feature" key={feature.icon}><span className="feature-icon">{feature.icon}</span><span className="feature-arrow" aria-hidden="true">↗</span><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div>
      </div>
    </section>

    <section className="journey-process" id="how-it-works"><div className="journey-shell"><div className="journey-section-heading"><span className="journey-overline">A SIMPLE WORKFLOW</span><h2>Plan your application<br/><em>with the evidence in view.</em></h2><p>Start with the resume you have today, then see what the target role asks for.</p></div><div className="journey-step-grid">{steps.map((step,index)=><article className="journey-step" key={step.number}><span className={`step-number step-tone-${index+1}`}>{step.number}</span><div className="step-symbol">{["↑","⌕","◎","↗"][index]}</div><h3>{step.title}</h3><p>{step.text}</p>{index<steps.length-1&&<span className="step-connector" aria-hidden="true">→</span>}</article>)}</div></div></section>

    <section className="journey-map-section"><div className="journey-shell"><div className="journey-map-head"><div><span className="journey-overline">SEE THE JOURNEY</span><h2>From resume to a more informed next step.</h2><p>A transparent review of your document against one role at a time.</p></div><span className="illustrative-label">HOW THE REVIEW FLOWS</span></div><div className="journey-track">{["Resume", "Job description", "Skill match", "Context", "Recommendations"].map((item,i)=><div className="track-item" key={item}><span className="track-icon">{["▤","⌕","✳","◎","↗"][i]}</span><b>{item}</b>{i<4&&<i className="track-arrow">→</i>}</div>)}</div><div className="signal-row"><div><b>Signals considered</b><div className="signal-chips">{signals.map(signal=><span key={signal}>{signal}</span>)}</div></div><div className="signal-note">Compatibility estimates explain this system’s findings. They are not an employer’s proprietary ATS score.</div></div></div></section>

    <section className="journey-section journey-benefits" id="privacy"><div className="journey-shell"><div className="journey-section-heading"><span className="journey-overline">BUILT FOR A THOUGHTFUL REVIEW</span><h2>Useful context.<br/><em>Your choices stay yours.</em></h2></div><div className="journey-benefit-grid"><article><span className="benefit-symbol mint">⌁</span><div><h3>Resume stays private by default</h3><p>Your uploaded document is processed for the analysis and discarded. Saving a report is a separate choice.</p></div></article><article><span className="benefit-symbol sky">▤</span><div><h3>See why a result appears</h3><p>Review component scores, matched requirements, missing skills, and parsing risks together.</p></div></article><article><span className="benefit-symbol violet">◎</span><div><h3>Optional AI feedback</h3><p>NVIDIA guidance is opt in, role conditioned, and advisory. Deterministic scores remain unchanged.</p></div></article><article><span className="benefit-symbol amber">↗</span><div><h3>Make your own decisions</h3><p>Use recommendations as a starting point and only include experience you can stand behind.</p></div></article></div>
      <div className="journey-cta-band"><span className="cta-mark">C</span><div><b>Your next application can start with clarity.</b><small>Review one resume against one role and see what stands out.</small></div><Link className="journey-button journey-button-bright" href="/analyze">Analyze a resume <span aria-hidden="true">→</span></Link><Link className="journey-button journey-button-outline" href="/auth?mode=signup">Create account</Link></div>
    </div></section>

    <footer className="journey-footer"><div className="journey-shell"><div className="footer-top"><div className="footer-brand-column"><Link className="journey-brand" href="/"><span className="journey-brand-mark">C</span><span>clearfit</span></Link><p>Resume compatibility,<br/>made understandable.</p><span className="footer-note">For informational use · Human review matters</span></div><div className="footer-column"><b>Explore</b><Link href="/analyze">Analyze a resume</Link><Link href="#what-you-get">What you get</Link><Link href="#how-it-works">How it works</Link></div><div className="footer-column"><b>Your account</b><Link href="/auth">Sign in</Link><Link href="/auth?mode=signup">Create account</Link><Link href="/analyze">Analysis workspace</Link></div><div className="footer-column"><b>About Clearfit</b><a href="#privacy">Privacy choices</a><a href="#top">Compatibility estimates</a><a href="#how-it-works">How the review works</a></div></div><div className="footer-bottom"><span>© 2026 Clearfit. Resume compatibility, made understandable.</span><span>Estimated ATS compatibility · Not an employer ATS score</span></div></div></footer>
  </main>;
}
