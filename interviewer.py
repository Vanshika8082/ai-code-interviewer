"""
interview.py — Human-like AI interviewer engine.

Architecture:
  Single entry point: conduct_turn()
  The AI sees the full conversation history and decides what to do next:
    react     → short conversational reaction + follow-up question
    hint      → subtle hint without revealing the answer
    evaluate  → full structured evaluation (marks this question done)
    next      → transition to a new question

The frontend drives the loop. The AI is the conductor.
"""

import os
import re
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ── Level guidance ────────────────────────────────────────────────────────────
LEVEL_PROFILE = {
    "junior": {
        "expectation": "basic understanding of what the code does and why design choices were made",
        "question_style": "straightforward, focused on logic and basic concepts",
        "challenge_threshold": "If they answer well, ask one follow-up about an edge case. Do not go deep into architecture.",
        "hint_style": "generous — give clear directional hints early",
    },
    "mid": {
        "expectation": "solid understanding of trade-offs, data flow, and common failure modes",
        "question_style": "applied — ask about design decisions and real-world usage",
        "challenge_threshold": "Push with one or two follow-ups. Go deeper if they handle the first well.",
        "hint_style": "moderate — give one Socratic nudge before a clearer hint",
    },
    "senior": {
        "expectation": "deep architectural reasoning, edge cases, scalability, and production-readiness",
        "question_style": "systemic — probe for trade-offs, failure modes, and alternative approaches",
        "challenge_threshold": "Challenge aggressively. Ask about scale, security, and alternatives.",
        "hint_style": "minimal — only a light nudge, never a direct hint",
    },
}

DIFFICULTY_GUIDANCE = {
    "easy":   "Focus on surface-level logic: what the code does, variable roles, basic flow.",
    "medium": "Ask about design decisions, data flow, and how components interact.",
    "hard":   "Probe edge cases, performance trade-offs, architectural choices, and failure modes.",
}


# ── Internal parser ───────────────────────────────────────────────────────────
def _extract_field(text: str, field: str, default: str = "") -> str:
    """Extract a labelled field from the structured response."""
    pattern = rf"^{re.escape(field)}:\s*(.+?)(?=\n[A-Z_]+:|$)"
    m = re.search(pattern, text, re.IGNORECASE | re.MULTILINE | re.DOTALL)
    return m.group(1).strip() if m else default


def _extract_score(text: str, field: str) -> int | None:
    m = re.search(rf"{re.escape(field)}:\s*(\d+)", text, re.IGNORECASE)
    return int(m.group(1)) if m else None


def parse_turn_response(raw: str) -> dict:
    """
    Parse the structured interviewer response into a clean dict.
    Returns keys: type, message, scores (optional), what_right, what_missed
    """
    turn_type = _extract_field(raw, "TYPE", "react").lower().strip()
    message   = _extract_field(raw, "MESSAGE", raw.split("\n")[0])

    result = {"type": turn_type, "message": message}

    if turn_type == "evaluate":
        result["scores"] = {
            "correctness":        _extract_score(raw, "CORRECTNESS"),
            "correctness_reason": _extract_field(raw, "CORRECTNESS_REASON"),
            "clarity":            _extract_score(raw, "CLARITY"),
            "clarity_reason":     _extract_field(raw, "CLARITY_REASON"),
            "depth":              _extract_score(raw, "DEPTH"),
            "depth_reason":       _extract_field(raw, "DEPTH_REASON"),
        }
        result["what_right"]  = _extract_field(raw, "WHAT_RIGHT",  "See feedback.")
        result["what_missed"] = _extract_field(raw, "WHAT_MISSED", "See feedback.")

    return result


# ── Core functions ─────────────────────────────────────────────────────────────

def generate_question(
    context_chunks: list[str],
    difficulty: str = "medium",
    candidate_level: str = "mid",
    previous_questions: list[str] | None = None,
) -> str:
    """
    Generate ONE high-quality engineering interview question from the codebase.

    Focuses exclusively on:
      - State management & data flow
      - Event handling & user interactions
      - Performance & scalability
      - Edge cases & failure modes
      - Architecture decisions

    Explicitly avoids:
      - CSS / styling questions
      - Syntax / "what does this property do?" questions
      - Trivial memorisation questions
    """
    if not context_chunks:
        raise ValueError("context_chunks must not be empty")

    context_text  = "\n\n---\n\n".join(context_chunks)
    level_profile = LEVEL_PROFILE.get(candidate_level, LEVEL_PROFILE["mid"])
    guidance      = DIFFICULTY_GUIDANCE.get(difficulty, DIFFICULTY_GUIDANCE["medium"])

    prev_block = ""
    if previous_questions:
        prev_block = (
            "ALREADY ASKED — do NOT repeat, rephrase, or overlap with any of these:\n"
            + "\n".join(f"  - {q}" for q in previous_questions)
        )

    # Determine which question category to use this turn so questions rotate
    # across the 5 types rather than clustering on one type.
    asked_count = len(previous_questions) if previous_questions else 0
    question_types = [
        "Project Overview & Objectives — Ask them to explain the project, what problem it solves, and what the main goal was.",
        "Technical Implementation — Ask them to explain the architecture, how the system works end-to-end, or why they used the specific technologies seen in the code.",
        "Design Decisions & Trade-offs — Ask why they chose the specific approach seen in the code over alternatives, and what trade-offs were made.",
        "Challenges & Problem Solving — Ask about the hardest technical challenge they faced here, or how they handled specific errors and edge cases.",
        "Scale & Deep-Dive — Ask a cross-question about how this system would scale (e.g., to 1 million users), its limitations, or future improvements.",
    ]
    target_type = question_types[asked_count % len(question_types)]

    system_prompt = """
You are a senior software engineer conducting a real technical interview.
Your job is to evaluate the candidate's engineering thinking.

STRICT RULES — violations mean the question is rejected and regenerated:
  ✗ DO NOT ask about CSS, colors, margins, rgba, font sizes, or any styling
  ✗ DO NOT ask "what does this property/keyword do?" type questions
  ✗ DO NOT ask questions answerable by simple memorisation
  ✗ DO NOT produce generic questions that could apply to any app
  ✗ DO NOT use phrases like "In the provided code" or "Looking at the code". The candidate wrote this code in the past but does NOT have it open right now.

  ✓ Ask the question naturally as if referencing their past work (e.g., "I see in your repository...", or "When you built front-end components..."). Provide enough context so they know what part of the app you are talking about.
  ✓ ONLY ask questions that require reasoning about HOW the app works
  ✓ Every question must be rooted in the actual code provided
  ✓ Questions must reveal engineering thinking, not syntax recall
""".strip()

    user_prompt = f"""
CANDIDATE LEVEL: {candidate_level.upper()}
DIFFICULTY: {difficulty.upper()} — {guidance}
EXPECTED DEPTH: {level_profile['expectation']}
QUESTION STYLE: {level_profile['question_style']}
TARGET QUESTION TYPE THIS TURN: {target_type}

{prev_block}

--- CODE FROM CANDIDATE'S REPOSITORY ---
{context_text}
-----------------------------------------

From the code above, identify:
  1. The core logic (what is the app actually doing?)
  2. Key user interactions and state changes
  3. Data structures being used
  4. Potential failure points or edge cases

Then generate EXACTLY ONE interview question of type: {target_type}

The question MUST:
  - Anchor the question in the specific context of the code provided. Reference actual domains, features, or architectural structures from the snippet to show you've read their code.
  - Sound like a real human software engineer discussing a project. For example: "I noticed you used [Technology/Function] here. What was the main goal behind this choice?" or "In the [Feature Area], what would happen if the system gets 1 million users?"
  - Require the candidate to reason about trade-offs or constraints, not just recite an explanation.
  - Be appropriate for a {candidate_level}-level engineer.
  - Be conversational and VERY short (maximum 1 short sentence). DO NOT make it long.
  - End with a question mark.

BANNED topics (instant reject): CSS, styling, colors, layout, fonts, margins, padding,
rgba, hex colors, display properties, any visual/UI property question.

Return ONLY the question — no label, no preamble, no explanation.
""".strip()

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        temperature=0.55,
        max_tokens=120,
    )

    raw = response.choices[0].message.content.strip().split("\n")[0]

    # Strip any label prefixes the model may have added
    for prefix in ("Question:", "Q:", "Interview question:", "Technical question:"):
        if raw.lower().startswith(prefix.lower()):
            raw = raw[len(prefix):].strip()

    # Safety net: if the model produced a styling question anyway, raise so
    # the caller can retry with a different chunk.
    STYLE_KEYWORDS = {"css", "color", "colour", "margin", "padding", "rgba", "font",
                      "background", "border-radius", "flex", "grid", "display", "width",
                      "height", "px", "rem", "em", "style", "className", "styled"}
    lower = raw.lower()
    if any(kw in lower for kw in STYLE_KEYWORDS):
        # Retry once with explicit override
        retry_prompt = user_prompt + (
            "\n\nWARNING: Your previous output was about styling. "
            "That is forbidden. Ask ONLY about logic, state, or behaviour."
        )
        retry_resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": retry_prompt},
            ],
            temperature=0.6,
            max_tokens=120,
        )
        raw = retry_resp.choices[0].message.content.strip().split("\n")[0]
        for prefix in ("Question:", "Q:", "Interview question:", "Technical question:"):
            if raw.lower().startswith(prefix.lower()):
                raw = raw[len(prefix):].strip()

    return raw


def conduct_turn(
    history: list[dict],
    context_summary: str,
    current_question: str,
    candidate_level: str = "mid",
    difficulty: str = "medium",
    mode: str = "practice",
    is_stuck: bool = False,
    follow_up_count: int = 0,
    max_follow_ups: int = 2,
) -> dict:
    """
    The main interviewer engine. Called after every candidate answer.

    history format: [{"role": "interviewer"|"candidate", "content": "..."}]

    Returns a parsed dict with keys: type, message, scores (if evaluate), what_right, what_missed
    """
    level_profile = LEVEL_PROFILE.get(candidate_level, LEVEL_PROFILE["mid"])
    guidance      = DIFFICULTY_GUIDANCE.get(difficulty, DIFFICULTY_GUIDANCE["medium"])

    # Determine what the interviewer should do next
    if is_stuck:
        action_instruction = f"""
The candidate is stuck or silent. Give a HINT — not the answer.
{level_profile['hint_style']}.
The hint should nudge them toward the answer without giving it away.
Use the TYPE: hint format.
"""
    elif follow_up_count >= max_follow_ups:
        action_instruction = """
You have asked enough follow-ups. Now evaluate this question fully.
Use the TYPE: evaluate format with all score fields.
"""
    else:
        action_instruction = f"""
Analyse the candidate's last answer carefully. Then decide:
  - If the answer is incomplete or has a clear gap → TYPE: react (short reaction + 1 follow-up)
  - If the answer is very weak or off-topic → TYPE: hint (guide without revealing)
  - If the answer is complete enough (follow_up_count >= 1 and answer is solid) → TYPE: evaluate

{level_profile['challenge_threshold']}
This candidate is {candidate_level}-level. Adjust your expectations accordingly.
"""

    # Format history for the prompt
    history_text = ""
    for turn in history:
        role  = "Interviewer" if turn["role"] == "interviewer" else "Candidate"
        history_text += f"{role}: {turn['content']}\n\n"

    system_prompt = f"""
You are a senior software engineer conducting a real technical interview.
Candidate level: {candidate_level.upper()}
Interview mode: {mode.upper()}
Current question difficulty: {difficulty.upper()} — {guidance}

PERSONALITY:
- Conversational, engaged, and highly realistic. Act exactly like a real senior engineer interviewing a peer.
- Start your response by acknowledging precisely what they just said before asking the follow-up or giving the hint. Use phrases like "That makes sense", "I see what you mean", "Interesting approach, but...", or "Let's dig into that".
- Direct but fair — absolutely no empty praise, robotic confirmations, or generic text generation filler.
- Challenge when the answer is incomplete, highlights a flaw, or misses an edge case.
- Sound like a real person, not a grading machine.
- Keep MESSAGE VERY short (1–2 sentences max) — this will be read aloud. Do not be overly verbose.
- NEVER say "in the provided code". Reference their past work naturally (e.g., "I noticed in your repository...", "When you built this feature...").

SCORING RULES (only for evaluate):
- CRITICAL: If the candidate says "I don't know", "I'm not sure", or does not genuinely attempt the question, output 0 for ALL THREE SCORES.
- Correctness: did they answer correctly?
  0–2 wrong/off-topic | 3–6 partial | 7–8 mostly correct | 9–10 complete
- Clarity: how well did they address the question? (NOT grammar)
  0 ignored question | 1–4 unclear attempt | 5–7 clear | 8–10 precise and structured
- Depth: did they go beyond surface level?
  0–3 surface/none | 4–7 some detail | 8–10 thorough with nuance
- ALWAYS reference what the candidate actually said
- NEVER give generic feedback

RESPONSE FORMAT — you MUST use EXACTLY this structure, no extra text outside it:

For react/hint:
TYPE: react
MESSAGE: <2–4 sentence conversational response + follow-up question>

For hint:
TYPE: hint
MESSAGE: <subtle hint that guides without revealing>

For evaluate:
TYPE: evaluate
MESSAGE: <1–2 sentence spoken transition like "Okay, let me give you my thoughts on that.">
CORRECTNESS: <0–10>
CORRECTNESS_REASON: <one sentence referencing their actual answer>
CLARITY: <0–10>
CLARITY_REASON: <one sentence referencing their actual answer>
DEPTH: <0–10>
DEPTH_REASON: <one sentence referencing their actual answer>
WHAT_RIGHT: <one sentence — specific to what they said>
WHAT_MISSED: <one or two sentences — specific gaps in their answer>
""".strip()

    user_prompt = f"""
Code context (candidate's repository):
{context_summary}

Current interview question:
{current_question}

Interview transcript so far:
{history_text}
Follow-up questions asked so far: {follow_up_count}

{action_instruction}

Respond now as the interviewer.
""".strip()

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        temperature=0.35,
        max_tokens=350,
    )

    raw = response.choices[0].message.content.strip()
    return parse_turn_response(raw)


def generate_transition(
    candidate_level: str,
    scores_so_far: list[dict],
    context_summary: str,
) -> str:
    """
    Generate a short natural transition line the interviewer says before asking the next question.
    e.g. "Alright, let's move on — I want to ask you about something else in your code."
    """
    avg = 0
    if scores_so_far:
        all_scores = [s.get("correctness", 0) for s in scores_so_far if s.get("correctness") is not None]
        avg = sum(all_scores) / len(all_scores) if all_scores else 0

    tone = "encouraging" if avg >= 7 else "neutral" if avg >= 4 else "redirecting"

    system_prompt = "You are a technical interviewer. Speak naturally and briefly."
    user_prompt = f"""
Write ONE natural transition sentence an interviewer would say before asking the next question.
Tone: {tone}. Candidate level: {candidate_level}.
Examples:
- "Good. Let me switch gears — I want to look at another part of your code."
- "Okay, moving on. I noticed something interesting elsewhere in your project."
- "Right, let's look at a different area."
Return ONLY the one sentence.
""".strip()

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        temperature=0.5,
        max_tokens=50,
    )
    return response.choices[0].message.content.strip().split("\n")[0]


def generate_session_summary(
    scores: list[dict],
    candidate_level: str,
    questions_asked: list[str],
) -> dict:
    """
    Generate a final session summary after all questions are done.
    Returns: overall_feedback, strengths, gaps, recommendation
    """
    if not scores:
        return {"overall_feedback": "No answers recorded.", "strengths": "", "gaps": "", "recommendation": ""}

    avg_correctness = sum(s.get("correctness", 0) for s in scores) / len(scores)
    avg_clarity     = sum(s.get("clarity",     0) for s in scores) / len(scores)
    avg_depth       = sum(s.get("depth",        0) for s in scores) / len(scores)
    weakest_dim     = min(
        [("correctness", avg_correctness), ("clarity", avg_clarity), ("depth", avg_depth)],
        key=lambda x: x[1]
    )[0]

    system_prompt = "You are a senior interviewer writing a concise post-interview summary."
    user_prompt = f"""
Candidate level: {candidate_level}
Questions asked: {len(questions_asked)}
Average scores — Correctness: {avg_correctness:.1f}/10, Clarity: {avg_clarity:.1f}/10, Depth: {avg_depth:.1f}/10
Weakest dimension: {weakest_dim}

Write a honest, specific end-of-session summary in this EXACT format:
OVERALL: <2 sentences overall assessment>
STRENGTHS: <one sentence on what they did well>
GAPS: <one sentence on their biggest gap>
RECOMMENDATION: <one sentence — hire/maybe/not yet + why>
""".strip()

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        temperature=0.3,
        max_tokens=200,
    )

    raw = response.choices[0].message.content.strip()
    return {
        "overall_feedback": _extract_field(raw, "OVERALL",         "Session complete."),
        "strengths":        _extract_field(raw, "STRENGTHS",       ""),
        "gaps":             _extract_field(raw, "GAPS",            ""),
        "recommendation":   _extract_field(raw, "RECOMMENDATION",  ""),
        "avg_correctness":  round(avg_correctness, 1),
        "avg_clarity":      round(avg_clarity,     1),
        "avg_depth":        round(avg_depth,        1),
        "weakest_dim":      weakest_dim,
    }


def evaluate_answer(question: str, answer: str) -> str:
    """
    Legacy single-shot evaluation used by POST /evaluate.

    Returns a structured string:
      Correctness: X/10
      Clarity: X/10
      Depth: X/10
      What you got right: ...
      What you missed: ...

    Clarity = how well the answer addresses the question (NOT grammar).
    An off-topic or "I don't know" reply scores 0 on ALL dimensions.
    """
    system_prompt = (
        "You are a strict senior engineer grading interview answers. "
        "IMPORTANT: Clarity scores HOW WELL the answer addresses the question — "
        "NOT whether the sentence is grammatically clear. "
        "A grammatically clear sentence that ignores the question scores 0 on Clarity. "
        "Answers like 'I don't know' or 'give me the answer' score 0 on ALL three dimensions."
    )

    user_prompt = f"""
Question:
{question}

Candidate's answer:
{answer}

STEP 1 — Relevance check (do this first):
Does the candidate's answer make a genuine attempt to answer the technical question?
If NO (e.g. "I don't know", "give me the answer", blank, off-topic, joke):
  → Output all three scores as 0/10 and skip to the feedback lines.

STEP 2 — Score (only if genuinely attempted):
  Correctness  0–2 wrong  | 3–6 partial  | 7–8 mostly correct  | 9–10 complete
  Clarity      0 ignores question | 1–4 attempts but unclear | 5–7 addresses it clearly | 8–10 precise and structured
  Depth        0–3 surface/none  | 4–7 some detail  | 8–10 thorough

Output format — EXACTLY this, no extra lines:
Correctness: X/10
Clarity: X/10
Depth: X/10
What you got right: <one sentence — or "Nothing — the answer did not address the question." if all zeros>
What you missed: <one or two sentences on the key gap>
""".strip()

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        temperature=0.15,
        max_tokens=200,
    )

    return response.choices[0].message.content.strip()


def explain_answer(question: str, answer: str) -> str:
    """
    Legacy model-answer explanation used by POST /explain.

    Returns a structured string with three sections:
      Correct Concept: ...
      What You Missed: ...
      Example Fix: ...
    """
    system_prompt = (
        "You are a senior developer who gives concise, educational explanations. "
        "You never repeat the candidate's answer verbatim or include scores."
    )

    user_prompt = f"""
Question:
{question}

Candidate's answer (for reference only — do NOT quote or evaluate it):
{answer}

Write the ideal explanation in this exact structure:

Correct Concept:
<Explain the right answer in 2–4 sentences. Be precise and educational.>

What You Missed:
<Describe one or two key gaps in the candidate's understanding.>

Example Fix:
<Provide a short code snippet or concrete example illustrating the correct approach.>

Rules:
- Do NOT evaluate or score
- Do NOT quote the candidate's words
- Do NOT add preamble or closing remarks
- Keep total response under 280 words
""".strip()

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        temperature=0.4,
        max_tokens=400,
    )

    return response.choices[0].message.content.strip()