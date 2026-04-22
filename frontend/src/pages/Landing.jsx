import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* ─── STYLES ─────────────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  :root {
    --bg:           #080C14;
    --surface:      #0E1420;
    --surface2:     #141C2E;
    --border:       rgba(255,255,255,0.07);
    --border2:      rgba(255,255,255,0.12);
    --text:         #F0F4FF;
    --muted:        #7A86A0;
    --accent:       #4F7FFF;
    --accent2:      #7B5CFA;
    --accent-glow:  rgba(79,127,255,0.15);
    --green:        #22D3A0;
    --green-glow:   rgba(34,211,160,0.12);
    --font-display: 'Syne', sans-serif;
    --font-body:    'DM Sans', sans-serif;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  .root { background: var(--bg); color: var(--text); font-family: var(--font-body); min-height: 100vh; }

  /* ── ANIMATIONS ── */
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes typing   { 0%,80%,100%{opacity:.2;transform:scale(.85)} 40%{opacity:1;transform:scale(1)} }
  @keyframes fadeUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes orb1     { 0%,100%{transform:translate(0,0)} 50%{transform:translate(40px,-30px)} }
  @keyframes orb2     { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,20px)} }
  @keyframes shimmer  { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
  @keyframes rotatePill { 0%,20%{opacity:0;transform:translateY(6px)} 30%,70%{opacity:1;transform:translateY(0)} 80%,100%{opacity:0;transform:translateY(-6px)} }

  .fade-up { animation: fadeUp .6s ease both; }
  .fade-up-1 { animation: fadeUp .6s .1s ease both; }
  .fade-up-2 { animation: fadeUp .6s .2s ease both; }
  .fade-up-3 { animation: fadeUp .6s .3s ease both; }
  .fade-up-4 { animation: fadeUp .6s .4s ease both; }

  .reveal { opacity:0; transform:translateY(20px); transition:opacity .6s ease, transform .6s ease; }
  .reveal.visible { opacity:1; transform:translateY(0); }

  /* ── NAV ── */
  .nav {
    display: flex; justify-content: space-between; align-items: center;
    padding: 1.1rem 3rem;
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(16px);
    position: sticky; top: 0; z-index: 200;
    background: rgba(8,12,20,0.85);
    transition: border-color .3s ease;
  }
  .nav.scrolled { border-bottom-color: var(--border2); }
  .nav-logo {
    font-family: var(--font-display); font-weight: 700; font-size: 1.05rem;
    display: flex; align-items: center; gap: 8px;
    letter-spacing: -.01em; color: var(--text); text-decoration: none;
  }
  .nav-dot {
    width: 7px; height: 7px; border-radius: 50%; background: var(--accent);
    box-shadow: 0 0 8px var(--accent);
    animation: pulse 2s ease-in-out infinite;
  }
  .nav-links { display: flex; align-items: center; gap: .25rem; }
  .nav-link {
    color: var(--muted); text-decoration: none; font-size: .875rem;
    padding: .4rem .75rem; border-radius: 8px;
    transition: color .25s ease, background .25s ease;
  }
  .nav-link:hover { color: var(--text); background: rgba(255,255,255,.05); }
  .nav-cta-mini {
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    color: #fff; border: none;
    padding: .45rem 1rem; border-radius: 8px;
    font-family: var(--font-body); font-size: .8rem; font-weight: 500;
    cursor: pointer; margin-left: .5rem;
    opacity: 0; pointer-events: none;
    transition: opacity .35s ease, transform .2s ease, box-shadow .2s ease;
  }
  .nav-cta-mini.visible { opacity: 1; pointer-events: auto; }
  .nav-cta-mini:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(79,127,255,.35); }

  /* ── HERO ── */
  .hero {
    max-width: 1100px; margin: 0 auto;
    padding: 7rem 3rem 6rem;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 4rem; align-items: center;
    position: relative;
  }
  .hero-orb1, .hero-orb2 {
    position: absolute; border-radius: 50%;
    pointer-events: none; filter: blur(80px);
  }
  .hero-orb1 {
    width: 420px; height: 420px; top: -60px; left: -80px;
    background: radial-gradient(circle, rgba(79,127,255,.1) 0%, transparent 70%);
    animation: orb1 12s ease-in-out infinite;
  }
  .hero-orb2 {
    width: 320px; height: 320px; bottom: 0; right: -40px;
    background: radial-gradient(circle, rgba(123,92,250,.08) 0%, transparent 70%);
    animation: orb2 15s ease-in-out infinite;
  }
  .hero-left { position: relative; z-index: 1; }
  .eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: .72rem; font-weight: 500; color: var(--accent);
    background: var(--accent-glow); border: 1px solid rgba(79,127,255,.25);
    padding: .28rem .75rem; border-radius: 100px;
    margin-bottom: 1.5rem; letter-spacing: .06em; text-transform: uppercase;
  }
  .eyebrow-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); animation: pulse 2s ease-in-out infinite; }
  .h1 {
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 4.5vw, 3.6rem);
    font-weight: 800; line-height: 1.07;
    letter-spacing: -.035em; margin-bottom: 1.5rem;
  }
  .h1-accent {
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .hero-sub {
    color: var(--muted); font-size: 1.05rem; font-weight: 300;
    max-width: 440px; margin-bottom: 2rem; line-height: 1.8;
  }
  .hero-sub strong { color: var(--text); font-weight: 500; }

  .hero-cta-group { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem; }
  .btn-primary {
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    color: #fff; border: none;
    padding: .9rem 2rem; border-radius: 12px;
    font-family: var(--font-body); font-size: .95rem; font-weight: 500;
    cursor: pointer; white-space: nowrap;
    transition: opacity .25s ease, transform .2s ease, box-shadow .25s ease;
    box-shadow: 0 4px 20px rgba(79,127,255,.3);
    position: relative; overflow: hidden;
  }
  .btn-primary::after {
    content: ''; position: absolute; top: 0; left: 0; width: 40%;
    height: 100%; background: rgba(255,255,255,.12);
    transform: translateX(-100%) skewX(-20deg);
    transition: transform .5s ease;
  }
  .btn-primary:hover::after { transform: translateX(280%) skewX(-20deg); }
  .btn-primary:hover { opacity: .92; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(79,127,255,.4); }
  .btn-primary:active { transform: translateY(0); }

  .btn-ghost {
    color: var(--muted); background: none; border: none;
    font-family: var(--font-body); font-size: .9rem;
    cursor: pointer; padding: 0;
    transition: color .25s ease;
    text-decoration: underline; text-decoration-color: transparent;
    text-underline-offset: 3px;
  }
  .btn-ghost:hover { color: var(--text); text-decoration-color: var(--border2); }

  .trust-chips { display: flex; gap: 1.25rem; flex-wrap: wrap; }
  .trust-chip { display: flex; align-items: center; gap: 5px; font-size: .78rem; color: var(--muted); }
  .trust-chip svg { flex-shrink: 0; }

  /* HERO CARD */
  .hero-card {
    background: var(--surface); border: 1px solid var(--border2);
    border-radius: 18px; padding: 1.5rem; position: relative;
    overflow: hidden; z-index: 1;
  }
  .hero-card::before {
    content: ''; position: absolute; top: -50px; right: -50px;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(79,127,255,.1) 0%, transparent 70%);
    pointer-events: none;
  }
  .card-repo-bar {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 1.25rem;
  }
  .repo-badge {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: .8rem; color: var(--muted);
    background: var(--surface2); border: 1px solid var(--border);
    padding: .28rem .65rem; border-radius: 6px;
  }
  .repo-name { color: var(--text); font-weight: 500; }
  .diff-badge {
    font-size: .7rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: .06em; padding: .2rem .6rem; border-radius: 100px;
  }
  .diff-medium { background: rgba(250,180,50,.12); color: #FAB432; border: 1px solid rgba(250,180,50,.25); }
  .diff-easy   { background: rgba(34,211,160,.12); color: var(--green); border: 1px solid rgba(34,211,160,.25); }
  .diff-hard   { background: rgba(255,90,90,.12);  color: #FF7070;     border: 1px solid rgba(255,90,90,.25); }

  .q-box {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 12px; padding: 1rem 1.1rem; margin-bottom: .875rem;
  }
  .q-label {
    font-size: .7rem; color: var(--accent); font-weight: 500;
    text-transform: uppercase; letter-spacing: .08em; margin-bottom: .5rem;
    display: flex; align-items: center; gap: 6px;
  }
  .q-timer {
    margin-left: auto; font-size: .7rem; color: var(--muted);
    background: var(--surface); border: 1px solid var(--border);
    padding: .1rem .5rem; border-radius: 100px;
  }
  .q-text { font-size: .95rem; color: var(--text); line-height: 1.6; min-height: 3.5rem; }
  .a-box {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 12px; padding: .9rem 1.1rem;
    font-size: .875rem; color: var(--muted); line-height: 1.65; min-height: 4rem;
  }
  .typing { display: inline-flex; gap: 4px; align-items: center; margin-top: .4rem; }
  .typing-dot {
    width: 5px; height: 5px; background: var(--accent);
    border-radius: 50%; animation: typing 1.4s ease-in-out infinite;
  }
  .typing-dot:nth-child(2) { animation-delay: .2s; }
  .typing-dot:nth-child(3) { animation-delay: .4s; }
  .card-nav { display: flex; align-items: center; justify-content: space-between; margin-top: .875rem; }
  .card-dots { display: flex; gap: 5px; }
  .card-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border2); cursor: pointer; transition: background .25s ease; }
  .card-dot.active { background: var(--accent); }
  .card-next-btn {
    font-size: .78rem; color: var(--muted); background: var(--surface2);
    border: 1px solid var(--border); padding: .3rem .75rem;
    border-radius: 6px; cursor: pointer; font-family: var(--font-body);
    transition: color .25s ease, border-color .25s ease;
  }
  .card-next-btn:hover { color: var(--text); border-color: var(--border2); }

  /* REPO TYPE PILL */
  .repo-type-wrap { height: 22px; overflow: hidden; position: relative; display: inline-block; }
  .repo-type-pill {
    display: inline-block; font-size: .72rem; font-weight: 500;
    color: var(--accent2); background: rgba(123,92,250,.1);
    border: 1px solid rgba(123,92,250,.2);
    padding: .18rem .6rem; border-radius: 100px;
    animation: rotatePill 3s ease-in-out infinite;
  }

  /* ── SOCIAL PROOF STRIP ── */
  .proof-strip {
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .proof-inner {
    max-width: 1100px; margin: 0 auto;
    padding: 1.5rem 3rem;
    display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;
  }
  .proof-label { font-size: .8rem; color: var(--muted); white-space: nowrap; }
  .proof-logos { display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap; }
  .proof-logo {
    font-family: var(--font-display); font-weight: 700; font-size: .95rem;
    color: rgba(255,255,255,.2); letter-spacing: -.02em;
    transition: color .3s ease;
  }
  .proof-logo:hover { color: rgba(255,255,255,.45); }

  /* ── SECTIONS ── */
  .section { max-width: 1100px; margin: 0 auto; padding: 5.5rem 3rem; }
  .section-label {
    font-size: .72rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: .12em; color: var(--accent); margin-bottom: .75rem;
  }
  .h2 {
    font-family: var(--font-display);
    font-size: clamp(1.9rem, 3vw, 2.7rem);
    font-weight: 700; letter-spacing: -.03em;
    margin-bottom: 3rem; line-height: 1.1;
  }
  .divider { border: none; border-top: 1px solid var(--border); }

  /* ── HOW IT WORKS ── */
  .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
  .step-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; padding: 1.75rem 1.5rem;
    transition: border-color .3s ease, transform .3s ease;
    position: relative; overflow: hidden;
  }
  .step-card::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(79,127,255,.04) 0%, transparent 60%);
    opacity: 0; transition: opacity .3s ease;
  }
  .step-card:hover { border-color: rgba(79,127,255,.3); transform: translateY(-4px); }
  .step-card:hover::after { opacity: 1; }
  .step-num {
    font-family: var(--font-display); font-size: 2.75rem; font-weight: 800;
    color: transparent; line-height: 1; margin-bottom: .875rem;
    letter-spacing: -.04em;
    -webkit-text-stroke: 1px rgba(255,255,255,.1);
  }
  .step-title { font-family: var(--font-display); font-size: 1rem; font-weight: 600; margin-bottom: .5rem; color: var(--text); }
  .step-desc { font-size: .9rem; color: var(--muted); line-height: 1.7; }
  .step-note { margin-top: .875rem; font-size: .78rem; color: var(--accent); opacity: .7; }

  /* ── EXAMPLE SECTION ── */
  .example-section { background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
  .example-inner { max-width: 820px; margin: 0 auto; padding: 5.5rem 3rem; }
  .example-intro { text-align: center; margin-bottom: 2.5rem; }
  .example-sub { color: var(--muted); font-size: 1rem; font-weight: 300; max-width: 480px; margin: -.5rem auto 0; line-height: 1.75; }
  .example-card {
    background: var(--bg); border: 1px solid var(--border2);
    border-radius: 18px; padding: 2rem; position: relative; overflow: hidden;
  }
  .example-card::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(79,127,255,.03) 0%, transparent 50%);
    pointer-events: none;
  }
  .example-q { font-size: 1.1rem; font-weight: 500; margin: .875rem 0 1.25rem; line-height: 1.55; color: var(--text); }
  .example-a {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; padding: 1rem 1.1rem;
    font-size: .9rem; color: var(--muted); line-height: 1.75; font-style: italic;
  }
  .example-tabs { display: flex; gap: .5rem; margin-top: 1.25rem; flex-wrap: wrap; }
  .example-tab {
    font-size: .78rem; color: var(--muted);
    background: var(--surface2); border: 1px solid var(--border);
    padding: .3rem .75rem; border-radius: 6px; cursor: pointer;
    font-family: var(--font-body); transition: color .2s ease, border-color .2s ease, background .2s ease;
  }
  .example-tab.active { color: var(--accent); border-color: rgba(79,127,255,.35); background: rgba(79,127,255,.07); }
  .example-tab:hover:not(.active) { color: var(--text); border-color: var(--border2); }

  /* ── TESTIMONIALS ── */
  .testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
  .testi-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; padding: 1.5rem;
    transition: border-color .3s ease, transform .3s ease;
  }
  .testi-card:hover { border-color: rgba(79,127,255,.25); transform: translateY(-3px); }
  .testi-quote { font-size: .9rem; color: var(--muted); line-height: 1.75; margin-bottom: 1.25rem; font-style: italic; }
  .testi-quote strong { color: var(--text); font-style: normal; }
  .testi-author { display: flex; align-items: center; gap: .75rem; }
  .testi-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: .72rem; font-weight: 600; flex-shrink: 0;
  }
  .av-a { background: rgba(79,127,255,.2); color: var(--accent); }
  .av-b { background: rgba(34,211,160,.15); color: var(--green); }
  .av-c { background: rgba(123,92,250,.2); color: #A78BFA; }
  .testi-name { font-size: .85rem; font-weight: 500; color: var(--text); }
  .testi-role { font-size: .78rem; color: var(--muted); }

  /* ── COMPARISON ── */
  .compare-wrap {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; overflow: hidden; margin-top: -.5rem;
  }
  .compare-table { width: 100%; border-collapse: collapse; }
  .compare-table th {
    padding: 1rem 1.5rem; text-align: left; font-size: .8rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: .08em; color: var(--muted);
    border-bottom: 1px solid var(--border);
  }
  .compare-table th:not(:first-child) { text-align: center; }
  .compare-table td {
    padding: .9rem 1.5rem; font-size: .9rem; color: var(--muted);
    border-bottom: 1px solid var(--border);
  }
  .compare-table tr:last-child td { border-bottom: none; }
  .compare-table td:not(:first-child) { text-align: center; }
  .compare-table td:nth-child(2) { color: var(--text); }
  .compare-col-us {
    background: rgba(79,127,255,.04);
    border-left: 1px solid rgba(79,127,255,.15);
    border-right: 1px solid rgba(79,127,255,.15);
  }
  .compare-col-head { background: rgba(79,127,255,.07) !important; }
  .check-yes { color: var(--green); font-size: 1rem; }
  .check-no  { color: rgba(255,255,255,.2); font-size: 1rem; }

  /* ── SECURITY ── */
  .trust-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
  .trust-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; padding: 1.5rem;
    display: flex; gap: 1rem; align-items: flex-start;
    transition: border-color .3s ease, transform .3s ease;
  }
  .trust-card:hover { border-color: rgba(34,211,160,.3); transform: translateY(-3px); }
  .trust-icon {
    width: 38px; height: 38px; border-radius: 10px;
    background: var(--green-glow); border: 1px solid rgba(34,211,160,.2);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .trust-title { font-weight: 600; font-size: .95rem; margin-bottom: .35rem; color: var(--text); }
  .trust-desc { font-size: .875rem; color: var(--muted); line-height: 1.65; }
  .trust-stats {
    display: flex; gap: 2.5rem; margin-top: 2.5rem;
    padding: 2rem 2rem; flex-wrap: wrap;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px;
  }
  .stat { display: flex; flex-direction: column; gap: 3px; }
  .stat-num {
    font-family: var(--font-display); font-size: 2rem; font-weight: 800;
    letter-spacing: -.04em;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .stat-label { font-size: .82rem; color: var(--muted); }

  /* ── FINAL CTA ── */
  .cta-section {
    text-align: center; padding: 7rem 3rem;
    max-width: 700px; margin: 0 auto;
    position: relative;
  }
  .cta-section::before {
    content: ''; position: absolute;
    top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 500px; height: 300px;
    background: radial-gradient(ellipse, rgba(79,127,255,.07) 0%, transparent 70%);
    pointer-events: none;
  }
  .cta-sub { color: var(--muted); font-size: 1rem; margin-bottom: 2.25rem; font-weight: 300; line-height: 1.8; }
  .cta-sub strong { color: var(--text); font-weight: 500; }
  .cta-note { margin-top: .875rem; font-size: .78rem; color: var(--muted); }
  .cta-note span { margin: 0 .4rem; opacity: .4; }

  /* ── FOOTER ── */
  .footer {
    border-top: 1px solid var(--border);
    padding: 2.5rem 3rem;
    display: flex; align-items: center; justify-content: space-between; flex-wrap: gap;
  }
  .footer-brand { font-family: var(--font-display); font-weight: 700; font-size: .95rem; color: var(--text); }
  .footer-copy { font-size: .82rem; color: var(--muted); }

  /* ── RESPONSIVE ── */
  @media (max-width: 900px) {
    .hero { grid-template-columns: 1fr; padding: 4rem 1.5rem; gap: 3rem; }
    .hero-orb1, .hero-orb2 { display: none; }
    .steps-grid { grid-template-columns: 1fr; }
    .testi-grid { grid-template-columns: 1fr; }
    .trust-grid { grid-template-columns: 1fr; }
    .section { padding: 4rem 1.5rem; }
    .example-inner { padding: 4rem 1.5rem; }
    .nav { padding: 1rem 1.5rem; }
    .nav-links { gap: 0; }
    .trust-stats { gap: 1.5rem; }
    .footer { flex-direction: column; gap: .75rem; text-align: center; padding: 2rem 1.5rem; }
    .proof-inner { padding: 1.25rem 1.5rem; }
    .cta-section { padding: 5rem 1.5rem; }
    .compare-wrap { overflow-x: auto; }
  }
`;

/* ─── DATA ───────────────────────────────────────────────────── */
const EXAMPLE_QUESTIONS = [
  {
    repo: "react-ecommerce",
    diff: "medium",
    q: "Why did you choose Context API instead of Redux for managing global state here?",
    a: "Context API was sufficient because the application state was small and didn't require complex middleware. Redux would have added boilerplate without meaningful benefit at this scale.",
    topic: "State management",
  },
  {
    repo: "node-auth-api",
    diff: "hard",
    q: "Your token refresh logic runs in a middleware — what failure scenario does this introduce and how would you fix it?",
    a: "If the refresh endpoint itself returns a 401, the middleware can get into an infinite retry loop. You'd guard against it by checking the request path before attempting a refresh...",
    topic: "Auth flow",
  },
  {
    repo: "ml-price-predictor",
    diff: "medium",
    q: "You're using a linear regression model here — what made you rule out tree-based methods for this dataset?",
    a: "The feature relationships were largely linear after log-transforming the skewed columns. Tree-based models offered marginal accuracy gains but made the output far harder to explain...",
    topic: "ML decisions",
  },
  {
    repo: "cli-deploy-tool",
    diff: "easy",
    q: "Why did you use Commander.js over yargs for the CLI argument parsing?",
    a: "Commander's API felt cleaner for defining subcommands — the chaining syntax matched how I was mentally modeling the tool's interface, and the bundle size was smaller for a CLI use case.",
    topic: "Library choice",
  },
];

const REPO_TYPES = ["React app", "Node API", "ML project", "CLI tool", "Go service", "Django app"];

/* ─── ICONS ──────────────────────────────────────────────────── */
const GithubIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);
const CheckIcon = ({ color = "var(--green)" }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

/* ─── HOOKS ──────────────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ─── NAVBAR ─────────────────────────────────────────────────── */
function Navbar({ onCTA }) {
  const [scrolled, setScrolled]         = useState(false);
  const [ctaVisible, setCtaVisible]     = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      setCtaVisible(window.scrollY > 480);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-logo">
        <span className="nav-dot" />
        AI GitHub Interviewer
      </div>
      <div className="nav-links">
        <a href="#how"      className="nav-link">How it works</a>
        <a href="#example"  className="nav-link">Example</a>
        <a href="#security" className="nav-link">Security</a>
        <button className={`nav-cta-mini ${ctaVisible ? "visible" : ""}`} onClick={onCTA}>
          Try it →
        </button>
      </div>
    </nav>
  );
}

/* ─── HERO ───────────────────────────────────────────────────── */
function Hero({ onCTA }) {
  const [qIdx,     setQIdx]     = useState(0);
  const [repoType, setRepoType] = useState(0);
  const [typing,   setTyping]   = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setTyping(true);
      setTimeout(() => {
        setQIdx((i) => (i + 1) % EXAMPLE_QUESTIONS.length);
        setTyping(false);
      }, 900);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRepoType((i) => (i + 1) % REPO_TYPES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const q = EXAMPLE_QUESTIONS[qIdx];

  return (
    <section className="hero">
      <div className="hero-orb1" />
      <div className="hero-orb2" />

      <div className="hero-left">
        <div className="eyebrow fade-up">
          <span className="eyebrow-dot" />
          Interview prep that knows your code
        </div>

        <h1 className="h1 fade-up-1">
          The question<br />
          they'll ask is<br />
          <span className="h1-accent">already in your<br />GitHub.</span>
        </h1>

        <p className="hero-sub fade-up-2">
          Interviewers look at your repos. Our AI does the same —
          asking questions about <strong>your architecture choices</strong>,{" "}
          <strong>your tradeoffs</strong>, your actual code.
          Not someone else's LeetCode solution.
        </p>

        <div className="hero-cta-group fade-up-3">
          <button className="btn-primary" onClick={onCTA}>
            See what they'll ask you →
          </button>
          <button className="btn-ghost" onClick={() => document.getElementById("example")?.scrollIntoView({ behavior: "smooth" })}>
            See an example session ↓
          </button>
        </div>

        <div className="trust-chips fade-up-4">
          <span className="trust-chip"><CheckIcon /> No account needed</span>
          <span className="trust-chip"><CheckIcon /> Read-only access</span>
          <span className="trust-chip"><CheckIcon /> Free to use</span>
        </div>
      </div>

      {/* ── ANIMATED CARD ── */}
      <div className="hero-card fade-up-2">
        <div className="card-repo-bar">
          <div className="repo-badge">
            <GithubIcon />
            <span className="repo-name">{q.repo}</span>
          </div>
          <div className="repo-type-wrap">
            <span className="repo-type-pill" key={repoType}>{REPO_TYPES[repoType]}</span>
          </div>
          <span className={`diff-badge diff-${q.diff}`}>{q.diff}</span>
        </div>

        <div className="q-box">
          <div className="q-label">
            Interview question
            <span className="q-timer">⏱ 2 min</span>
          </div>
          <div className="q-text" style={{ opacity: typing ? 0.4 : 1, transition: "opacity .3s ease" }}>
            {q.q}
          </div>
        </div>

        <div className="a-box">
          {typing ? (
            <div className="typing">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          ) : (
            <span style={{ animation: "fadeIn .4s ease" }}>{q.a}</span>
          )}
        </div>

        <div className="card-nav">
          <div className="card-dots">
            {EXAMPLE_QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={`card-dot ${i === qIdx ? "active" : ""}`}
                onClick={() => { setQIdx(i); setTyping(false); }}
              />
            ))}
          </div>
          <button className="card-next-btn" onClick={() => { setTyping(true); setTimeout(() => { setQIdx((i) => (i + 1) % EXAMPLE_QUESTIONS.length); setTyping(false); }, 300); }}>
            next question →
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── SOCIAL PROOF STRIP ─────────────────────────────────────── */
function ProofStrip() {
  return (
    <div className="proof-strip">
      <div className="proof-inner">
        <span className="proof-label">Our users prep for interviews at</span>
        <div className="proof-logos">
          {["Stripe", "Vercel", "Shopify", "Notion", "Linear", "Figma"].map((co) => (
            <span key={co} className="proof-logo">{co}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── HOW IT WORKS ───────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Point it at a project you built",
      desc: "Paste any public GitHub URL — React app, Python API, CLI tool, whatever you're proud of. No account required.",
      note: "→ Easy, Medium, or Hard difficulty",
    },
    {
      num: "02",
      title: "It reads your code like an interviewer would",
      desc: "The AI reviews your architecture patterns, library choices, and structural decisions — the same signals a senior engineer looks for.",
      note: "→ Analyzes in under 10 seconds",
    },
    {
      num: "03",
      title: "Answer questions about decisions you actually made",
      desc: "Not generic problems. Questions about the tradeoffs, constraints, and choices in your specific project — exactly what a real technical screen sounds like.",
      note: "→ ~5 questions per session",
    },
  ];

  return (
    <>
      <hr className="divider" />
      <div className="section" id="how">
        <div className="section-label reveal">Process</div>
        <h2 className="h2 reveal">Two minutes of setup.<br />Better prep than two weeks of grinding.</h2>
        <div className="steps-grid">
          {steps.map((s, i) => (
            <div className="step-card reveal" style={{ transitionDelay: `${i * 0.1}s` }} key={s.num}>
              <div className="step-num">{s.num}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
              <div className="step-note">{s.note}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ─── EXAMPLE SECTION ────────────────────────────────────────── */
function ExampleSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const q = EXAMPLE_QUESTIONS[activeIdx];

  return (
    <div className="example-section" id="example">
      <div className="example-inner">
        <div className="example-intro">
          <div className="section-label reveal">Example</div>
          <h2 className="h2 reveal" style={{ marginBottom: "1rem" }}>A session that feels<br />uncomfortably real.</h2>
          <p className="example-sub reveal">
            Switch between topics to see the range of questions the AI generates.
          </p>
        </div>

        <div className="example-card reveal">
          <div className="card-repo-bar">
            <div className="repo-badge">
              <GithubIcon />
              <span className="repo-name">{q.repo}</span>
            </div>
            <span className={`diff-badge diff-${q.diff}`}>{q.diff}</span>
          </div>
          <div className="q-label" style={{ fontSize: ".7rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--accent)", fontWeight: 600, marginBottom: ".25rem" }}>
            AI interview question
          </div>
          <p className="example-q">{q.q}</p>
          <div className="example-a">"{q.a}"</div>
          <div className="example-tabs">
            {EXAMPLE_QUESTIONS.map((eq, i) => (
              <button
                key={i}
                className={`example-tab ${i === activeIdx ? "active" : ""}`}
                onClick={() => setActiveIdx(i)}
              >
                {eq.topic}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── TESTIMONIALS ───────────────────────────────────────────── */
function Testimonials() {
  const items = [
    {
      quote: <>Got asked <strong>almost the exact question</strong> the AI generated — why I used Redux over Zustand. I had a crisp answer ready. The interviewer looked impressed.</>,
      name: "Priya S.",
      role: "SWE, recently hired at a Series B startup",
      av: "PS", cls: "av-a",
    },
    {
      quote: <>It found an <strong>architectural decision in my code I'd completely forgotten about</strong>. That's exactly what interviewers care about — and it's exactly what I wasn't preparing for.</>,
      name: "Marcus R.",
      role: "Senior frontend dev, L5 at a FAANG",
      av: "MR", cls: "av-b",
    },
    {
      quote: <>Every other prep tool throws generic questions at you. This one <strong>read my actual codebase</strong> and asked about my specific choices. Whole different experience.</>,
      name: "Tae-yang K.",
      role: "Backend engineer, passed his staff interview",
      av: "TK", cls: "av-c",
    },
  ];

  return (
    <>
      <hr className="divider" />
      <div className="section">
        <div className="section-label reveal">What people say</div>
        <h2 className="h2 reveal">They were ready<br />when it counted.</h2>
        <div className="testi-grid">
          {items.map((t, i) => (
            <div className="testi-card reveal" style={{ transitionDelay: `${i * 0.1}s` }} key={t.name}>
              <p className="testi-quote">{t.quote}</p>
              <div className="testi-author">
                <div className={`testi-avatar ${t.cls}`}>{t.av}</div>
                <div>
                  <div className="testi-name">{t.name}</div>
                  <div className="testi-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ─── COMPARISON ─────────────────────────────────────────────── */
function Comparison() {
  const rows = [
    { feat: "Questions based on your actual code",    us: true,  lc: false, mock: false },
    { feat: "No account or login required",           us: true,  lc: false, mock: true  },
    { feat: "Reflects your specific tradeoffs",       us: true,  lc: false, mock: false },
    { feat: "Works with any language or framework",   us: true,  lc: false, mock: true  },
    { feat: "Feels like a real technical screen",     us: true,  lc: false, mock: true  },
    { feat: "Infinite generic algorithm problems",    us: false, lc: true,  mock: false },
  ];

  return (
    <>
      <hr className="divider" />
      <div className="section">
        <div className="section-label reveal">Why it's different</div>
        <h2 className="h2 reveal">Generic prep vs.<br />prep that knows your work.</h2>
        <div className="compare-wrap reveal">
          <table className="compare-table">
            <thead>
              <tr>
                <th></th>
                <th className="compare-col-head compare-col-us" style={{ color: "var(--accent)" }}>AI GitHub Interviewer</th>
                <th>LeetCode / Blind</th>
                <th>Mock interviews</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.feat}>
                  <td>{r.feat}</td>
                  <td className="compare-col-us">
                    <span className={r.us ? "check-yes" : "check-no"}>{r.us ? "✓" : "✕"}</span>
                  </td>
                  <td><span className={r.lc ? "check-yes" : "check-no"}>{r.lc ? "✓" : "✕"}</span></td>
                  <td><span className={r.mock ? "check-yes" : "check-no"}>{r.mock ? "✓" : "✕"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ─── SECURITY ───────────────────────────────────────────────── */
function Security() {
  const items = [
    {
      icon: <ShieldIcon />,
      title: "Processed in memory. Gone when you close the tab.",
      desc: "No database entry is ever created for your code. Analysis happens in-session only — nothing is written to disk.",
    },
    {
      icon: <EyeIcon />,
      title: "Only the files we need, nothing else.",
      desc: "Same access as git clone — and we don't even keep the clone. Read-only, scoped to the files required to generate questions.",
    },
    {
      icon: <LockIcon />,
      title: "Each session is isolated.",
      desc: "Your interview can't see mine. Sessions run in separate environments with no shared state. No logs, no history.",
    },
    {
      icon: <TrashIcon />,
      title: "Session over? So is your data.",
      desc: "When you close the tab, everything is gone. No trace, no footprint, no possibility of a breach — there's nothing to breach.",
    },
  ];

  return (
    <>
      <hr className="divider" />
      <div className="section" id="security">
        <div className="section-label reveal">Security</div>
        <h2 className="h2 reveal">We read your code.<br />We don't keep it.</h2>
        <div className="trust-grid">
          {items.map((item, i) => (
            <div className="trust-card reveal" style={{ transitionDelay: `${i * 0.08}s` }} key={item.title}>
              <div className="trust-icon">{item.icon}</div>
              <div>
                <div className="trust-title">{item.title}</div>
                <div className="trust-desc">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="trust-stats reveal">
          <div className="stat">
            <span className="stat-num">0 bytes</span>
            <span className="stat-label">of your code ever stored</span>
          </div>
          <div className="stat">
            <span className="stat-num">Read-only</span>
            <span className="stat-label">GitHub access, always</span>
          </div>
          <div className="stat">
            <span className="stat-num">100%</span>
            <span className="stat-label">ephemeral by design</span>
          </div>
          <div className="stat">
            <span className="stat-num">&lt; 10s</span>
            <span className="stat-label">to your first question</span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── FINAL CTA ──────────────────────────────────────────────── */
function FinalCTA({ onCTA }) {
  return (
    <>
      <hr className="divider" />
      <div className="cta-section reveal">
        <div className="section-label">Get started</div>
        <h2 className="h2" style={{ marginBottom: "1.25rem" }}>
          You've shipped projects.<br />Now defend them.
        </h2>
        <p className="cta-sub">
          Every repo you've built contains real architectural decisions —
          decisions interviewers <strong>will</strong> probe. Practice explaining
          them before the call, not during it.
        </p>
        <button className="btn-primary" style={{ fontSize: "1rem", padding: "1rem 2.5rem" }} onClick={onCTA}>
          Run my first interview →
        </button>
        <p className="cta-note">
          No account <span>·</span> Takes 30 seconds <span>·</span> Free
        </p>
      </div>
    </>
  );
}

/* ─── FOOTER ─────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand">AI GitHub Interviewer</div>
      <div className="footer-copy">© 2026 AI GitHub Interviewer. All rights reserved.</div>
    </footer>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate(); // ✅ ADD THIS

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = styles;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  useReveal();

  const handleCTA = () => {
    navigate("/interview"); // ✅ now it works
  };

  return (
    <div className="root">
      <Navbar onCTA={handleCTA} />
      <Hero onCTA={handleCTA} />
      <ProofStrip />
      <HowItWorks />
      <ExampleSection />
      <Testimonials />
      <Comparison />
      <Security />
      <FinalCTA onCTA={handleCTA} />
      <Footer />
    </div>
  );
}