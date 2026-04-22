/**
 * Interview.jsx — GitInterview
 *
 * Architecture:
 *   - The AI is the conductor. It decides react / hint / evaluate / next.
 *   - Frontend tracks: conversationHistory, currentQuestion, followUpCount,
 *     questionScores, sessionScores, interviewState
 *
 * Interview states:
 *   idle       → start screen
 *   analyzing  → repo loading
 *   thinking   → question appearing (3s pause before answer unlocks)
 *   answering  → answer box active
 *   responding → AI is generating its response
 *   evaluating → eval card shown, waiting for next/retry
 *   summary    → session complete
 */

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Styles ────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:         #060a10;
    --bg-card:    #0b1018;
    --bg-input:   #0e1520;
    --border:     #161f2e;
    --border-mid: #1d2d42;
    --text:       #dde4ef;
    --muted:      #4a617a;
    --dim:        #1e2d3e;
    --accent:     #3a7bfd;
    --accent-bg:  #0e1f3d;
    --accent-glow:rgba(58,123,253,0.14);
    --green:      #2dd98a;
    --green-bg:   #0a2018;
    --purple:     #9d6ef7;
    --purple-bg:  #160e2e;
    --red:        #f76e6e;
    --red-bg:     #220d0d;
    --warn:       #f7a94e;
    --warn-bg:    #241508;
    --teal:       #2ec4b6;
  }

  body, #root { font-family:'Syne',sans-serif; background:var(--bg); color:var(--text); min-height:100vh; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-thumb { background:var(--border-mid); border-radius:10px; }
  input:focus, textarea:focus { outline:none; border-color:var(--accent)!important; box-shadow:0 0 0 3px var(--accent-glow)!important; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  @keyframes pulse  { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
  @keyframes wave   { 0%,100%{height:4px} 50%{height:16px} }
  @keyframes recordRing { 0%{box-shadow:0 0 0 0 rgba(247,110,110,.5)} 70%{box-shadow:0 0 0 10px rgba(247,110,110,0)} 100%{box-shadow:0 0 0 0 rgba(247,110,110,0)} }
  @keyframes scoreIn    { 0%{transform:scale(.5);opacity:0} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
  @keyframes ttsPulse   { 0%,100%{opacity:.6} 50%{opacity:1} }
  @keyframes thinkDot   { 0%,100%{opacity:.2} 50%{opacity:1} }
  @keyframes orbPulse { 0%,100%{transform:scale(1);box-shadow:0 0 20px 5px var(--accent-glow);} 50%{transform:scale(1.05);box-shadow:0 0 40px 15px rgba(58,123,253,0.3);} }
  @keyframes orbListen { 0%,100%{transform:scale(1);border-color:var(--green);box-shadow:0 0 15px rgba(45,217,138,0.2);} 50%{transform:scale(1.02);border-color:var(--green);box-shadow:0 0 25px rgba(45,217,138,0.4);} }

  .enter  { animation:fadeUp .28s ease forwards; }
  .fadein { animation:fadeIn .2s ease forwards; }

  .dot { display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--muted);animation:pulse 1.4s infinite; }
  .dot:nth-child(2){animation-delay:.18s}.dot:nth-child(3){animation-delay:.36s}

  .wbar { width:3px;border-radius:3px;background:var(--red);animation:wave .5s ease infinite; }
  .wbar:nth-child(1){animation-delay:0s}.wbar:nth-child(2){animation-delay:.1s}
  .wbar:nth-child(3){animation-delay:.2s}.wbar:nth-child(4){animation-delay:.1s}.wbar:nth-child(5){animation-delay:0s}

  .btn-primary { background:var(--accent);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-family:'Syne',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:background .15s,transform .1s,box-shadow .15s; }
  .btn-primary:hover { background:#2968e8;box-shadow:0 4px 18px rgba(58,123,253,.3); }
  .btn-primary:active { transform:scale(.97); }
  .btn-primary:disabled { opacity:.35;cursor:not-allowed;pointer-events:none; }

  .btn-ghost { background:transparent;color:var(--muted);border:1px solid var(--border-mid);padding:10px 20px;border-radius:8px;font-family:'Syne',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:all .15s; }
  .btn-ghost:hover { background:var(--bg-card);color:var(--text);border-color:#2a3f58; }

  .btn-warn { background:var(--warn-bg);color:var(--warn);border:1px solid #3a2500;padding:8px 16px;border-radius:8px;font-family:'Syne',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s; }
  .btn-warn:hover { background:#2e1c06; }

  .tag { display:inline-flex;align-items:center;background:var(--accent-bg);border:1px solid #1a3868;color:var(--accent);border-radius:5px;padding:2px 9px;font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase; }
  .tag-green { background:var(--green-bg);border-color:#0e2e1a;color:var(--green); }
  .tag-purple{ background:var(--purple-bg);border-color:#200e40;color:var(--purple); }
  .tag-warn  { background:var(--warn-bg);border-color:#3a2500;color:var(--warn); }
  .tag-red   { background:var(--red-bg);border-color:#3a1010;color:var(--red); }

  .input-field { background:var(--bg-input);border:1px solid var(--border-mid);color:var(--text);border-radius:10px;padding:12px 16px;font-family:'Syne',sans-serif;font-size:14px;width:100%;transition:border-color .15s,box-shadow .15s; }
  .input-field::placeholder { color:var(--dim); }

  .score-ring { width:58px;height:58px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:500;animation:scoreIn .4s ease forwards; }

  .think-bar { display:flex;gap:5px;align-items:center; }
  .think-bar span { width:6px;height:6px;border-radius:50%;background:var(--accent);animation:thinkDot 1.2s ease infinite; }
  .think-bar span:nth-child(2){animation-delay:.2s}.think-bar span:nth-child(3){animation-delay:.4s}
`;

// ─── Voice helpers ─────────────────────────────────────────────────────────
function pickVoice(gender) {
  const voices = window.speechSynthesis?.getVoices() || [];
  const maleHints   = ["male","david","alex","daniel","james","george","fred","aaron","ryan","guy","andrew"];
  const femaleHints = ["female","samantha","victoria","karen","emma","zira","lisa","alice","susan","aria","jenny"];
  const hints = gender === "male" ? maleHints : femaleHints;
  
  let match = voices.find(v => v.lang.startsWith("en") && 
    (v.name.includes("Natural") || v.name.includes("Online") || v.name.includes("Premium") || v.name.includes("Google")) && 
    hints.some(h => v.name.toLowerCase().includes(h)));
    
  if (!match) {
    match = voices.find(v => v.lang.startsWith("en") && hints.some(h => v.name.toLowerCase().includes(h)));
  }
  
  if (match) return match;
  const en = voices.filter(v => v.lang.startsWith("en"));
  return gender === "male" ? (en[1] || en[0]) : (en[0] || en[1]);
}

function useTTS(gender) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const speak = useCallback((text) => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    const v = pickVoice(gender);
    if (v) utt.voice = v;
    utt.rate  = gender === "male" ? 0.92 : 0.97;
    utt.pitch = gender === "male" ? 0.85 : 1.1;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend   = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, [isSupported, gender]);
  const stop = useCallback(() => { window.speechSynthesis?.cancel(); setIsSpeaking(false); }, []);
  return { speak, stop, isSpeaking, isSupported };
}

function useSpeechRecognition({ onResult, onError }) {
  const ref = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setIsSupported(true);
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    rec.onresult = (e) => {
      let final = "", interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        e.results[i].isFinal ? (final += t) : (interim += t);
      }
      onResult({ final, interim });
    };
    rec.onerror = (e) => { if (e.error !== "aborted") onError?.(e.error); setIsRecording(false); };
    rec.onend   = () => setIsRecording(false);
    ref.current = rec;
  }, []);
  const start  = useCallback(() => { ref.current?.start();  setIsRecording(true);  }, []);
  const stop   = useCallback(() => { ref.current?.stop();   setIsRecording(false); }, []);
  const toggle = useCallback(() => isRecording ? stop() : start(), [isRecording]);
  return { isRecording, isSupported, start, stop, toggle };
}

// ─── Score helpers ─────────────────────────────────────────────────────────
function scoreStyle(n) {
  if (n == null) return { color: "var(--muted)", border: "var(--border-mid)", label: "–" };
  if (n <= 0)    return { color: "var(--muted)", border: "var(--border-mid)", label: "No attempt" };
  if (n <= 3)    return { color: "var(--red)",   border: "#3a1010",           label: "Missed" };
  if (n <= 6)    return { color: "var(--warn)",  border: "#3a2500",           label: "Partial" };
  if (n <= 8)    return { color: "var(--accent)",border: "#1a3868",           label: "Strong" };
  return               { color: "var(--green)", border: "#0e2e1a",           label: "Nailed it" };
}

// ─── Bubbles ───────────────────────────────────────────────────────────────
function AIVisualizer({ state, isSpeaking, isRecording }) {
  let mode = "idle";
  if (state === "thinking" || state === "responding") mode = "thinking";
  else if (isSpeaking) mode = "speaking";
  else if (isRecording) mode = "listening";
  
  const orbStyle = {
    width: 130, height: 130, borderRadius: "50%",
    background: "linear-gradient(135deg, #1e4bd4, #3a7bfd)",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.5s ease",
    margin: "0 auto", border: "3px solid transparent",
    animation: "none"
  };

  if (mode === "speaking") {
    orbStyle.animation = "orbPulse 1.2s ease-in-out infinite alternate";
  } else if (mode === "thinking") {
    orbStyle.animation = "orbPulse 2s ease-in-out infinite alternate";
    orbStyle.opacity = 0.6;
    orbStyle.background = "linear-gradient(135deg, #2a3f58, #4a617a)";
  } else if (mode === "listening") {
    orbStyle.animation = "orbListen 2s ease-in-out infinite alternate";
    orbStyle.background = "linear-gradient(135deg, #1c7a54, #2dd98a)";
  }

  return (
    <div className="fadein" style={{ padding: "60px 0 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <div style={orbStyle}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
           {mode === "listening" ? (
             <><path d="M12 1a4 4 0 014 4v7a4 4 0 01-8 0V5a4 4 0 014-4z" stroke="white" strokeWidth="1.5"/><path d="M19 12a7 7 0 01-14 0M12 19v4M8 23h8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></>
           ) : mode === "thinking" ? (
             <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" strokeDasharray="16 16" style={{animation:"spin 3s linear infinite"}}/>
           ) : (
             <><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="8" r="4" stroke="white" strokeWidth="1.5"/></>
           )}
        </svg>
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
        {mode === "speaking" ? "Interviewer Speaking" : mode === "listening" ? "Listening to you..." : mode === "thinking" ? "Thinking..." : "AI Interviewer ready"}
      </div>
    </div>
  );
}

function EvaluationCard({ scores, whatRight, whatMissed }) {
  const dims = [
    { key:"correctness", label:"Correctness", value: scores?.correctness,  reason: scores?.correctness_reason, delay:0   },
    { key:"clarity",     label:"Clarity",     value: scores?.clarity,      reason: scores?.clarity_reason,     delay:80  },
    { key:"depth",       label:"Depth",       value: scores?.depth,        reason: scores?.depth_reason,       delay:160 },
  ];

  return (
    <div className="enter" style={{ maxWidth:620 }}>
      <div style={{ background:"var(--bg-card)", border:"1px solid var(--border-mid)", borderRadius:14, overflow:"hidden" }}>
        <div style={{ padding:"10px 18px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--green)" }}/>
          <span style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".07em", fontWeight:700 }}>Evaluation</span>
        </div>
        <div style={{ padding:"20px" }}>
          {/* Score rings */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20, paddingBottom:20, marginBottom:20, borderBottom:"1px solid var(--border)" }}>
            {dims.map(d => {
              const s = scoreStyle(d.value);
              return (
                <div key={d.key} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                  <div className="score-ring" style={{ background:"var(--bg)", border:`1.5px solid ${s.border}`, animationDelay:`${d.delay}ms` }}>
                    <span style={{ color:s.color }}>{d.value != null ? `${d.value}/10` : "–"}</span>
                  </div>
                  <span style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".06em" }}>{d.label}</span>
                  <span style={{ fontSize:10, color:s.color }}>{s.label}</span>
                  {d.reason && <span style={{ fontSize:11, color:"var(--muted)", textAlign:"center", lineHeight:1.5, marginTop:2 }}>{d.reason}</span>}
                </div>
              );
            })}
          </div>

          {/* What you got right */}
          {whatRight && (
            <div style={{ background:"var(--green-bg)", border:"1px solid #0e2e1a", borderLeft:"3px solid var(--green)", borderRadius:8, padding:"10px 14px", marginBottom:10 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--green)", marginBottom:4, textTransform:"uppercase", letterSpacing:".05em" }}>✓ What you got right</div>
              <p style={{ margin:0, fontSize:13, color:"#7dbf9a", lineHeight:1.7 }}>{whatRight}</p>
            </div>
          )}

          {/* What you missed */}
          {whatMissed && (
            <div style={{ background:"var(--warn-bg)", border:"1px solid #3a2500", borderLeft:"3px solid var(--warn)", borderRadius:8, padding:"10px 14px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--warn)", marginBottom:4, textTransform:"uppercase", letterSpacing:".05em" }}>! What you missed</div>
              <p style={{ margin:0, fontSize:13, color:"#c89060", lineHeight:1.7 }}>{whatMissed}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionSummaryCard({ summary, onRestart }) {
  const dims = [
    { label:"Correctness", value: summary.avg_correctness },
    { label:"Clarity",     value: summary.avg_clarity     },
    { label:"Depth",       value: summary.avg_depth       },
  ];
  return (
    <div className="enter" style={{ maxWidth:660 }}>
      <div style={{ background:"var(--bg-card)", border:"1px solid var(--border-mid)", borderRadius:16, overflow:"hidden" }}>
        <div style={{ padding:"12px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--purple)" }}/>
            <span style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".07em", fontWeight:700 }}>Session complete</span>
          </div>
          <span className="tag-purple">Interview done</span>
        </div>
        <div style={{ padding:"22px 20px" }}>
          {/* Avg scores */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:20, paddingBottom:20, borderBottom:"1px solid var(--border)" }}>
            {dims.map(d => {
              const s = scoreStyle(d.value);
              return (
                <div key={d.label} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:26, fontWeight:700, color:s.color, fontFamily:"'JetBrains Mono',monospace" }}>{d.value}</div>
                  <div style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".06em", marginTop:4 }}>{d.label}</div>
                </div>
              );
            })}
          </div>

          {/* Written summary */}
          {summary.overall_feedback && (
            <p style={{ fontSize:14, color:"#c8d4e8", lineHeight:1.8, marginBottom:14 }}>{summary.overall_feedback}</p>
          )}
          {summary.strengths && (
            <div style={{ background:"var(--green-bg)", border:"1px solid #0e2e1a", borderLeft:"3px solid var(--green)", borderRadius:8, padding:"9px 13px", marginBottom:10 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--green)", marginBottom:3, textTransform:"uppercase" }}>Strengths</div>
              <p style={{ margin:0, fontSize:13, color:"#7dbf9a", lineHeight:1.6 }}>{summary.strengths}</p>
            </div>
          )}
          {summary.gaps && (
            <div style={{ background:"var(--warn-bg)", border:"1px solid #3a2500", borderLeft:"3px solid var(--warn)", borderRadius:8, padding:"9px 13px", marginBottom:10 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--warn)", marginBottom:3, textTransform:"uppercase" }}>Focus on next time</div>
              <p style={{ margin:0, fontSize:13, color:"#c89060", lineHeight:1.6 }}>{summary.gaps}</p>
            </div>
          )}
          {summary.recommendation && (
            <div style={{ background:"var(--purple-bg)", border:"1px solid #200e40", borderLeft:"3px solid var(--purple)", borderRadius:8, padding:"9px 13px", marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--purple)", marginBottom:3, textTransform:"uppercase" }}>Interviewer recommendation</div>
              <p style={{ margin:0, fontSize:13, color:"#a87ef0", lineHeight:1.6 }}>{summary.recommendation}</p>
            </div>
          )}

          <button onClick={onRestart} className="btn-primary" style={{ width:"100%", padding:"13px" }}>
            Start a new session →
          </button>
        </div>
      </div>
    </div>
  );
}



function ProgressBar({ state, questionNumber, totalQuestions }) {
  const steps = ["Repo linked", "Question", "Answer", "Feedback", "Next"];
  const stateMap = { analyzing:0, thinking:1, answering:2, responding:2, evaluating:3, summary:4 };
  const activeStep = stateMap[state] ?? 1;
  return (
    <div style={{ display:"flex", gap:4, alignItems:"center", flex:1 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", flex:1, gap:4 }}>
          <div style={{
            flex:1, height:3, borderRadius:2,
            background: i <= activeStep ? "var(--accent)" : "var(--border-mid)",
            transition:"background .3s"
          }}/>
          {i === 0 && (
            <span style={{ fontSize:10, color: i <= activeStep ? "var(--accent)" : "var(--muted)", whiteSpace:"nowrap", flexShrink:0 }}>
              {s}
            </span>
          )}
        </div>
      ))}
      <span style={{ fontSize:11, color:"var(--muted)", whiteSpace:"nowrap", marginLeft:4 }}>
        Q{questionNumber}{totalQuestions ? `/${totalQuestions}` : ""}
      </span>
    </div>
  );
}

// ─── Loading Screen ────────────────────────────────────────────────────────
function LoadingScreen({ repoUrl }) {
  const [step, setStep] = useState(0);
  const steps = ["Cloning repository...", "Parsing source files...", "Indexing code chunks...", "Building interview context..."];
  useEffect(() => {
    const id = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 900);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", flexDirection:"column", gap:28 }}>
      <div style={{ width:52, height:52, borderRadius:"50%", border:"2px solid var(--border-mid)", borderTopColor:"var(--accent)", animation:"spin .75s linear infinite" }}/>
      <div style={{ textAlign:"center", maxWidth:340 }}>
        <p style={{ fontWeight:700, color:"var(--text)", fontSize:16 }}>Analyzing repository</p>
        <p style={{ marginTop:6, fontSize:12, color:"var(--muted)", fontFamily:"'JetBrains Mono',monospace" }}>{repoUrl}</p>
        <div style={{ marginTop:20, display:"flex", flexDirection:"column", gap:8, alignItems:"flex-start" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, opacity: i <= step ? 1 : 0.2, transition:"opacity .4s" }}>
              <div style={{ width:16, height:16, borderRadius:"50%", flexShrink:0, background: i < step ? "var(--green)" : i === step ? "var(--accent)" : "var(--border-mid)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {i < step && <svg width="8" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#060a10" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              </div>
              <span style={{ fontSize:13, color: i === step ? "var(--text)" : "var(--muted)" }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
        {["Private — answers never stored","Questions from your actual code","Powered by Groq"].map((t,i) => (
          <span key={i} style={{ fontSize:11, color:"var(--muted)", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:6, padding:"3px 9px" }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Start Screen ──────────────────────────────────────────────────────────
function StartScreen({ repoUrl, setRepoUrl, difficulty, setDifficulty, candidateLevel, setCandidateLevel, interviewMode, setInterviewMode, onStart }) {
  const levels = [
    { value:"junior", label:"Junior",   sub:"0–2 yrs" },
    { value:"mid",    label:"Mid",      sub:"2–5 yrs" },
    { value:"senior", label:"Senior",   sub:"5+ yrs"  },
  ];
  const difficulties = [
    { value:"easy",   label:"Easy"   },
    { value:"medium", label:"Medium" },
    { value:"hard",   label:"Hard"   },
  ];
  const modes = [
    { value:"practice", label:"Practice", sub:"Hints on" },
    { value:"timed",    label:"Timed",    sub:"2 min/Q"  },
    { value:"real",     label:"Real",     sub:"No hints" },
  ];

  const tileStyle = (active) => ({
    background: active ? "var(--accent-bg)" : "var(--bg-input)",
    border: `1.5px solid ${active ? "var(--accent)" : "var(--border-mid)"}`,
    color: active ? "var(--accent)" : "var(--muted)",
    borderRadius:9, padding:"10px 8px", cursor:"pointer", textAlign:"center",
    transition:"all .15s", fontFamily:"'Syne',sans-serif"
  });

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", padding:24, backgroundImage:"radial-gradient(ellipse 70% 50% at 50% -5%,rgba(58,123,253,.07),transparent)" }}>
      <div style={{ width:"100%", maxWidth:480 }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:36 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:"linear-gradient(145deg,#1e4bd4,#3a7bfd)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 32px rgba(58,123,253,.22)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <p style={{ fontWeight:700, fontSize:17, color:"var(--text)", letterSpacing:"-.02em" }}>GitInterview</p>
            <p style={{ fontSize:11, color:"var(--muted)" }}>AI interview from your actual code</p>
          </div>
        </div>

        <h1 style={{ fontSize:26, fontWeight:700, color:"#edf2fb", letterSpacing:"-.03em", marginBottom:8 }}>Practice interviews from your code</h1>
        <p style={{ fontSize:14, color:"var(--muted)", marginBottom:32, lineHeight:1.65 }}>Paste a GitHub repo. The AI reads your code and interviews you like a real senior engineer — with follow-up questions, hints, and honest feedback.</p>

        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          {/* Repo URL */}
          <div>
            <label style={{ display:"block", fontSize:11, color:"var(--muted)", marginBottom:7, fontWeight:700, letterSpacing:".06em" }}>REPOSITORY URL</label>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"var(--muted)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77A5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </span>
              <input type="text" placeholder="https://github.com/username/repo" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && onStart()} className="input-field" style={{ paddingLeft:38 }} />
            </div>
          </div>

          {/* Level */}
          <div>
            <label style={{ display:"block", fontSize:11, color:"var(--muted)", marginBottom:7, fontWeight:700, letterSpacing:".06em" }}>YOUR EXPERIENCE LEVEL</label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
              {levels.map(l => (
                <button key={l.value} onClick={() => setCandidateLevel(l.value)} style={tileStyle(candidateLevel === l.value)}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{l.label}</div>
                  <div style={{ fontSize:10, marginTop:2, opacity:.7 }}>{l.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Mode + Difficulty row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={{ display:"block", fontSize:11, color:"var(--muted)", marginBottom:7, fontWeight:700, letterSpacing:".06em" }}>MODE</label>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {modes.map(m => (
                  <button key={m.value} onClick={() => setInterviewMode(m.value)} style={{ ...tileStyle(interviewMode === m.value), display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px" }}>
                    <span style={{ fontSize:12, fontWeight:600 }}>{m.label}</span>
                    <span style={{ fontSize:10, opacity:.7 }}>{m.sub}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, color:"var(--muted)", marginBottom:7, fontWeight:700, letterSpacing:".06em" }}>DIFFICULTY</label>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {difficulties.map(d => (
                  <button key={d.value} onClick={() => setDifficulty(d.value)} style={{ ...tileStyle(difficulty === d.value), padding:"8px 12px" }}>
                    <span style={{ fontSize:12, fontWeight:600 }}>{d.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={onStart} className="btn-primary" disabled={!repoUrl.trim()} style={{ padding:"14px", fontSize:15, marginTop:4 }}>
            Analyze my repo and start →
          </button>
        </div>

        <div style={{ marginTop:16, display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
          {["Private · never stored","Questions from your code","Real follow-up questions"].map((t,i) => (
            <span key={i} style={{ fontSize:11, color:"var(--muted)", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:6, padding:"3px 9px" }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Constants ─────────────────────────────────────────────────────────────
const API            = import.meta.env.VITE_API_URL || "http://localhost:8000";
const TOTAL_QUESTIONS = 5;
const THINK_SECONDS   = 3;
const TIMED_SECONDS   = 120;

// ─── Main ──────────────────────────────────────────────────────────────────
export default function Interview() {
  const [repoUrl,        setRepoUrl]        = useState("");
  const [difficulty,     setDifficulty]     = useState("medium");
  const [candidateLevel, setCandidateLevel] = useState("mid");
  const [interviewMode,  setInterviewMode]  = useState("practice");
  const [interviewState, setInterviewState] = useState("idle"); // idle|analyzing|thinking|answering|responding|evaluating|summary
  const [voiceGender,    setVoiceGender]    = useState("female");

  // Content
  const [messages,          setMessages]          = useState([]);
  const [input,             setInput]             = useState("");
  const [interimText,       setInterimText]       = useState("");
  const [currentQuestion,   setCurrentQuestion]   = useState("");
  const [conversationHistory, setConversationHistory] = useState([]); // for AI context
  const [questionNumber,    setQuestionNumber]    = useState(1);
  const [followUpCount,     setFollowUpCount]     = useState(0);
  const [sessionScores,     setSessionScores]     = useState([]);
  const [previousQuestions, setPreviousQuestions] = useState([]);
  const [contextSummary,    setContextSummary]    = useState("");
  const [sessionSummary,    setSessionSummary]    = useState(null);

  // Timer
  const [thinkCountdown, setThinkCountdown] = useState(THINK_SECONDS);
  const [answerTimer,    setAnswerTimer]    = useState(TIMED_SECONDS);
  const timerRef = useRef(null);

  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [hasSpokenTurn, setHasSpokenTurn] = useState(false);
  const [micCountdown,  setMicCountdown]  = useState(0);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const finalVoiceRef = useRef("");

  const tts = useTTS(voiceGender);
  const stt = useSpeechRecognition({
    onResult: ({ final, interim }) => {
      if (final) { finalVoiceRef.current += (finalVoiceRef.current ? " " : "") + final; setInput(finalVoiceRef.current); }
      setInterimText(interim);
    },
    onError: err => console.error("STT:", err),
  });

  useEffect(() => { if (stt.isRecording) tts.stop(); }, [stt.isRecording]);
  useEffect(() => { if (!tts.isSpeaking)  setSpeakingIdx(null); }, [tts.isSpeaking]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, interimText]);

  // ── Thinking pause countdown ──
  useEffect(() => {
    if (interviewState !== "thinking") return;
    setThinkCountdown(THINK_SECONDS);
    const id = setInterval(() => {
      setThinkCountdown(t => {
        if (t <= 1) { clearInterval(id); setInterviewState("answering"); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [interviewState]);

  // ── Answer timer (timed mode) ──
  useEffect(() => {
    if (interviewMode !== "timed" || interviewState !== "answering") return;
    setAnswerTimer(TIMED_SECONDS);
    timerRef.current = setInterval(() => {
      setAnswerTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [interviewState, interviewMode]);

  // ── Push interviewer message to chat ──
  const pushInterviewer = (text, msgType, extras = {}) => {
    setMessages(prev => [...prev, { role:"interviewer", text, msgType, ...extras }]);
  };

  // ── Speak + push ──
  const speakAndPush = (text, msgType, idx) => {
    pushInterviewer(text, msgType);
    if (tts.isSupported) { tts.speak(text); setSpeakingIdx(idx); }
  };

  // ── Generate first question ──
  const startQuestion = async (qNum, prevQs, prevScores, ctxSummary) => {
    setInterviewState("thinking");
    try {
      const res  = await fetch(`${API}/generate-question`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ difficulty, candidate_level: candidateLevel, previous_questions: prevQs }),
      });
      const data = await res.json();
      if (!data.question) throw new Error("No question");

      setCurrentQuestion(data.question);
      setPreviousQuestions(p => [...p, data.question]);
      setConversationHistory([{ role:"interviewer", content: data.question }]);
      setFollowUpCount(0);
      const idx = messages.length + (messages.length > 0 ? 1 : 0);
      speakAndPush(data.question, "question", idx);
    } catch (err) {
      console.error(err);
      pushInterviewer("⚠️ Could not generate a question. Check backend.", "question");
      setInterviewState("answering");
    }
  };

  // ── Analyze repo ──
  const analyzeRepository = async () => {
    if (!repoUrl.trim()) return;
    setInterviewState("analyzing");
    try {
      const res = await fetch(`${API}/analyze`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ repo_url: repoUrl }),
      });
      if (!res.ok) throw new Error("Analyze failed");
      const data = await res.json();
      const ctx = data.context_summary || "";
      setContextSummary(ctx);
      await startQuestion(1, [], [], ctx);
    } catch (err) {
      console.error(err);
      alert("❌ Backend not reachable. Make sure the server is running on port 8000.");
      setInterviewState("idle");
    }
  };

  // ── Submit answer ──
  const handleSubmit = async () => {
    const text = (input + (interimText ? " " + interimText : "")).trim();
    if (!text) return;

    clearInterval(timerRef.current);
    if (stt.isRecording) { stt.stop(); setInterimText(""); }
    finalVoiceRef.current = "";

    setMessages(prev => [...prev, { role:"candidate", text }]);
    setInput("");
    setInterviewState("responding");

    const newHistory = [...conversationHistory, { role:"candidate", content: text }];
    setConversationHistory(newHistory);

    try {
      const res  = await fetch(`${API}/interview/turn`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          history: newHistory,
          context_summary: contextSummary,
          current_question: currentQuestion,
          candidate_level: candidateLevel,
          difficulty,
          mode: interviewMode,
          is_stuck: false,
          follow_up_count: followUpCount,
          max_follow_ups: candidateLevel === "senior" ? 3 : 2,
        }),
      });
      const turn = await res.json();

      if (turn.type === "evaluate") {
        // Push conversational transition line, then evaluation card
        if (turn.message) pushInterviewer(turn.message, "react");
        setMessages(prev => [...prev, {
          role:"evaluation",
          scores:    turn.scores,
          whatRight: turn.what_right,
          whatMissed:turn.what_missed,
        }]);
        if (turn.scores) setSessionScores(prev => [...prev, turn.scores]);
        setConversationHistory(prev => [...prev, { role:"interviewer", content: turn.message }]);
        setInterviewState("evaluating");
      } else {
        // react or hint
        const msgType = turn.type === "hint" ? "hint" : "react";
        pushInterviewer(turn.message, msgType);
        if (tts.isSupported) tts.speak(turn.message);
        setConversationHistory(prev => [...prev, { role:"interviewer", content: turn.message }]);
        setFollowUpCount(f => f + 1);
        setInterviewState("answering");
      }
    } catch (err) {
      console.error(err);
      pushInterviewer("Something went wrong. Let's move on.", "react");
      setInterviewState("evaluating");
    }
  };

  // ── "I'm stuck" ──
  const handleStuck = async () => {
    setInterviewState("responding");
    try {
      const res  = await fetch(`${API}/interview/turn`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          history: conversationHistory,
          context_summary: contextSummary,
          current_question: currentQuestion,
          candidate_level: candidateLevel,
          difficulty,
          mode: interviewMode,
          is_stuck: true,
          follow_up_count: followUpCount,
        }),
      });
      const turn = await res.json();
      pushInterviewer(turn.message, "hint");
      if (tts.isSupported) tts.speak(turn.message);
      setConversationHistory(prev => [...prev, { role:"interviewer", content: turn.message }]);
      setInterviewState("answering");
    } catch (err) {
      console.error(err);
      setInterviewState("answering");
    }
  };

  // ── Next question ──
  const handleNext = async () => {
    if (questionNumber >= TOTAL_QUESTIONS) {
      // End session
      setInterviewState("responding");
      try {
        const res  = await fetch(`${API}/interview/summary`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ scores: sessionScores, candidate_level: candidateLevel, questions_asked: previousQuestions }),
        });
        const data = await res.json();
        setSessionSummary(data);
        setMessages(prev => [...prev, { role:"summary", summary: data }]);
        setInterviewState("summary");
      } catch (err) {
        console.error(err);
        setInterviewState("summary");
      }
      return;
    }

    // Transition to next question
    setInterviewState("responding");
    try {
      const res  = await fetch(`${API}/interview/transition`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ candidate_level: candidateLevel, scores_so_far: sessionScores }),
      });
      const data = await res.json();
      if (data.transition) pushInterviewer(data.transition, "transition");
    } catch {}

    const nextNum = questionNumber + 1;
    setQuestionNumber(nextNum);
    await startQuestion(nextNum, previousQuestions, sessionScores, contextSummary);
  };

  const handleRestart = () => {
    setInterviewState("idle");
    setMessages([]); setInput(""); setInterimText("");
    setCurrentQuestion(""); setConversationHistory([]);
    setQuestionNumber(1); setFollowUpCount(0);
    setSessionScores([]); setPreviousQuestions([]);
    setSessionSummary(null); setContextSummary("");
  };

  const handleSpeakMsg = (text, idx) => {
    if (tts.isSpeaking) { tts.stop(); setSpeakingIdx(null); }
    else { tts.speak(text); setSpeakingIdx(idx); }
  };

  const handleMicToggle = () => {
    if (stt.isRecording) { stt.stop(); setInterimText(""); }
    else { finalVoiceRef.current = input; stt.start(); }
  };

  // ── Timer display ──
  const timerDisplay = () => {
    const m = Math.floor(answerTimer / 60);
    const s = answerTimer % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };
  const timerColor = answerTimer > 45 ? "var(--muted)" : answerTimer > 15 ? "var(--warn)" : "var(--red)";

  // ── Auto-start mic when AI is done speaking ──
  useEffect(() => {
    if (tts.isSpeaking) {
      setHasSpokenTurn(false);
      setMicCountdown(0);
    }
  }, [tts.isSpeaking]);

  useEffect(() => {
    if (interviewState === "answering" && !tts.isSpeaking && tts.isSupported && stt.isSupported && !hasSpokenTurn) {
      setHasSpokenTurn(true);
      if (!stt.isRecording) {
        setMicCountdown(4);
      }
    }
  }, [interviewState, tts.isSpeaking, stt.isSupported, tts.isSupported, stt.isRecording, hasSpokenTurn]);

  useEffect(() => {
    if (micCountdown > 0) {
      const id = setInterval(() => {
        setMicCountdown(prev => {
          if (prev <= 1) {
            clearInterval(id);
            try { stt.start(); } catch(e){}
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(id);
    }
  }, [micCountdown, stt]);

  // ── Auto-submit on silence ──
  useEffect(() => {
    if (interviewState !== "answering" || !stt.isRecording) return;
    if (!input.trim() && !interimText.trim()) return;

    const timeoutId = setTimeout(() => {
      if (input.trim() || interimText.trim()) {
        handleSubmit();
      }
    }, 2800);

    return () => clearTimeout(timeoutId);
  }, [input, interimText, interviewState, stt.isRecording]);

  // ── Render guards ──
  if (interviewState === "idle") return (
    <><style>{STYLES}</style>
      <StartScreen repoUrl={repoUrl} setRepoUrl={setRepoUrl} difficulty={difficulty} setDifficulty={setDifficulty}
        candidateLevel={candidateLevel} setCandidateLevel={setCandidateLevel}
        interviewMode={interviewMode} setInterviewMode={setInterviewMode}
        onStart={analyzeRepository}
      />
    </>
  );

  if (interviewState === "analyzing") return (
    <><style>{STYLES}</style><LoadingScreen repoUrl={repoUrl} /></>
  );

  const isAnswering  = interviewState === "answering";
  const isResponding = interviewState === "responding";
  const isEvaluating = interviewState === "evaluating";
  const isSummary    = interviewState === "summary";

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:"var(--bg)" }}>

        {/* ── Top bar ── */}
        <div style={{ borderBottom:"1px solid var(--border)", padding:"11px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, background:"var(--bg)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(145deg,#1e4bd4,#3a7bfd)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>GitInterview</span>
          </div>

          <ProgressBar state={interviewState} questionNumber={questionNumber} totalQuestions={TOTAL_QUESTIONS} />

          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            {/* Voice gender toggle */}
            {tts.isSupported && (
              <div style={{ display:"flex", gap:4 }}>
                {["male","female"].map(g => (
                  <button key={g} onClick={() => setVoiceGender(g)} style={{
                    padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:500,
                    border:"1px solid", cursor:"pointer", transition:"all .15s", fontFamily:"'Syne',sans-serif",
                    borderColor: voiceGender === g ? "var(--accent)" : "var(--border-mid)",
                    background:  voiceGender === g ? "var(--accent-bg)" : "transparent",
                    color:       voiceGender === g ? "var(--accent)" : "var(--muted)",
                  }}>{g.charAt(0).toUpperCase() + g.slice(1)}</button>
                ))}
              </div>
            )}
            <span className="tag" style={{ fontSize:10 }}>{candidateLevel}</span>
            <span className="tag" style={{ fontSize:10, background:"var(--purple-bg)", borderColor:"#200e40", color:"var(--purple)" }}>{interviewMode}</span>
            {interviewMode === "timed" && isAnswering && (
              <span style={{ fontSize:12, fontFamily:"'JetBrains Mono',monospace", color:timerColor, background:"var(--bg-card)", border:`1px solid ${timerColor}40`, borderRadius:6, padding:"3px 8px" }}>
                {timerDisplay()}
              </span>
            )}
          </div>
        </div>

        {/* ── Messages ── */}
        <div style={{ flex:1, overflowY:"auto", padding:"28px 20px" }}>
          <div style={{ maxWidth:760, margin:"0 auto", display:"flex", flexDirection:"column", gap:18 }}>

            {messages.map((msg, i) => {
              if (msg.role === "interviewer") return (
                <div key={i} className="fadein" style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 20 }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(145deg,#1e4bd4,#3a7bfd)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink: 0, marginTop: 2 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-mid)", padding: "14px 18px", borderRadius: "2px 14px 14px 14px", color: "var(--text)", fontSize: 15, lineHeight: 1.6 }}>
                    {msg.text}
                  </div>
                </div>
              );
              if (msg.role === "candidate") return (
                <div key={i} className="fadein" style={{ display: "flex", gap: 12, alignItems: "flex-start", flexDirection: "row-reverse", marginBottom: 20 }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:"var(--border-mid)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink: 0, marginTop: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>YOU</span>
                  </div>
                  <div style={{ background: "var(--bg-input)", border: "1px solid var(--border)", padding: "14px 18px", borderRadius: "14px 2px 14px 14px", color: "var(--text)", fontSize: 15, lineHeight: 1.6 }}>
                    {msg.text}
                  </div>
                </div>
              );
              if (msg.role === "evaluation") return (
                <div key={i} className="fadein" style={{ marginBottom: 20, display:"flex", justifyContent:"center" }}>
                  <EvaluationCard scores={msg.scores} whatRight={msg.whatRight} whatMissed={msg.whatMissed} />
                </div>
              );
              if (msg.role === "summary") return (
                <div key={i} className="fadein" style={{ marginBottom: 20, display:"flex", justifyContent:"center" }}>
                  <SessionSummaryCard summary={msg.summary} onRestart={handleRestart} />
                </div>
              );
              return null;
            })}

            {!isSummary && !isEvaluating && (
               <div style={{ marginTop: 20 }}>
                 <AIVisualizer state={interviewState} isSpeaking={tts.isSpeaking} isRecording={stt.isRecording} />
                 
                 <div className="fadein" style={{ textAlign:"center", maxWidth: 660, margin: "0 auto" }}>
                   {!currentQuestion && (
                     <h2 style={{ fontSize:18, fontWeight:600, color:"var(--dim)", lineHeight:1.5 }}>
                       Getting ready...
                     </h2>
                   )}
                   {interviewState === "thinking" && thinkCountdown > 0 && (
                     <p style={{ marginTop: 12, color: "var(--accent)", fontSize:14 }}>Thinking... answer unlocks in {thinkCountdown}s</p>
                   )}
                   {micCountdown > 0 && (
                     <p className="enter" style={{ marginTop: 12, color: "var(--warn)", fontSize:15, fontWeight:600 }}>Get ready to speak in {micCountdown}...</p>
                   )}
                 </div>
               </div>
            )}
            
            {/* Candidate's current answer preview */}
            {!isSummary && !isEvaluating && (input || interimText) && (
              <div className="fadein" style={{ textAlign:"left", maxWidth: 660, margin: "30px auto 0", color:"#e2e8f0", fontSize:16, lineHeight: 1.6, padding: "16px 20px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12 }}>
                <span style={{ fontSize:11, color:"var(--muted)", display:"block", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:700 }}>Your Answer</span>
                {input}
                {interimText && (
                  <span style={{ color:"var(--muted)", fontStyle:"italic" }}>
                    {input ? " " : ""}{interimText}
                  </span>
                )}
              </div>
            )}

            {/* Post-evaluation actions */}
            {isEvaluating && (
              <div className="enter" style={{ display:"flex", gap:10, flexWrap:"wrap", paddingTop:4 }}>
                <button onClick={handleNext} className="btn-primary" style={{ fontSize:13, padding:"9px 20px" }}>
                  {questionNumber >= TOTAL_QUESTIONS ? "End session →" : "Next question →"}
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── Input bar ── */}
        {!isSummary && (
          <div style={{ borderTop:"1px solid var(--border)", padding:"13px 20px 17px", background:"var(--bg)" }}>
            {stt.isRecording && (
              <div style={{ maxWidth:760, margin:"0 auto 10px", display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:"var(--red)", animation:"recordRing 1.2s ease infinite" }}/>
                <span style={{ fontSize:12, color:"var(--red)", fontWeight:600 }}>Recording</span>
                <span style={{ fontSize:11, color:"var(--muted)" }}>— speak your answer, click mic to stop</span>
              </div>
            )}

            <div style={{ maxWidth:760, margin:"0 auto", display:"flex", gap:8, alignItems:"flex-end" }}>
              {/* Stuck button (practice mode only) */}
              {interviewMode === "practice" && isAnswering && (
                <button onClick={handleStuck} className="btn-warn" style={{ flexShrink:0, height:42, padding:"0 12px", fontSize:12 }}>
                  I'm stuck
                </button>
              )}

              {/* Mic */}
              {stt.isSupported && (
                <button onClick={handleMicToggle} disabled={!isAnswering}
                  style={{
                    width:42, height:42, borderRadius:10, flexShrink:0,
                    border:`1.5px solid ${stt.isRecording ? "var(--red)" : "var(--border-mid)"}`,
                    background: stt.isRecording ? "var(--red-bg)" : "var(--bg-input)",
                    color: stt.isRecording ? "var(--red)" : "var(--muted)",
                    cursor: isAnswering ? "pointer" : "not-allowed",
                    opacity: isAnswering ? 1 : 0.4,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    animation: stt.isRecording ? "recordRing 1.2s ease infinite" : "none",
                    transition:"all .2s"
                  }}
                >
                  {stt.isRecording
                    ? <div style={{ display:"flex", alignItems:"center", gap:2, height:18 }}>
                        <div className="wbar"/><div className="wbar"/><div className="wbar"/><div className="wbar"/><div className="wbar"/>
                      </div>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 1a4 4 0 014 4v7a4 4 0 01-8 0V5a4 4 0 014-4z" stroke="currentColor" strokeWidth="1.5"/><path d="M19 12a7 7 0 01-14 0M12 19v4M8 23h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  }
                </button>
              )}

              <textarea
                ref={inputRef}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder={
                  isAnswering
                    ? stt.isRecording
                      ? "Listening... speak your answer"
                      : "Explain your answer as you would to a senior engineer on a code review..."
                    : interviewState === "thinking"
                      ? "Think before you write — answer unlocks shortly..."
                      : "Waiting for the next question..."
                }
                disabled={!isAnswering}
                rows={1}
                style={{
                  flex:1, resize:"none", overflow:"hidden",
                  background: stt.isRecording ? "#0d1a24" : isAnswering ? "var(--bg-input)" : "var(--bg-card)",
                  border:`1px solid ${stt.isRecording ? "#1a3040" : "var(--border-mid)"}`,
                  color:"var(--text)", borderRadius:10,
                  padding:"11px 14px",
                  fontFamily:"'Syne',sans-serif", fontSize:14, lineHeight:1.65,
                  transition:"all .15s",
                  opacity: isAnswering ? 1 : 0.5,
                }}
              />

              {/* Word count badge */}
              {input.trim() && (
                <span style={{ fontSize:11, color:"var(--muted)", whiteSpace:"nowrap", alignSelf:"center", fontFamily:"'JetBrains Mono',monospace" }}>
                  {input.trim().split(/\s+/).filter(Boolean).length}w
                </span>
              )}

              <button onClick={handleSubmit} disabled={(!input.trim() && !interimText) || !isAnswering} className="btn-primary" style={{ padding:"11px 16px", flexShrink:0, height:42 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display:"block" }}>
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <p style={{ textAlign:"center", margin:"9px 0 0", fontSize:11, color:"var(--dim)" }}>
              Groq · llama-3.1-8b-instant
              {stt.isSupported  ? " · Voice input"  : ""}
              {tts.isSupported  ? ` · ${voiceGender} voice` : ""}
              {" · Answers not stored"}
            </p>
          </div>
        )}
      </div>
    </>
  );
}