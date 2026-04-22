from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random

from github_fetcher import fetch_repo_files
from rag_engine import RAGEngine
from interviewer import (
    generate_question,
    conduct_turn,
    generate_transition,
    evaluate_answer,
    generate_session_summary,
    explain_answer,
)

# ── App setup ──────────────────────────────────────────────────────────────
app = FastAPI(title="GitInterview API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global state ───────────────────────────────────────────────────────────
# These are RESET every time /analyze is called with a new repo.
rag              = None          # RAGEngine instance — None until first /analyze
repo_loaded      = False
current_repo_url = ""            # tracks which repo is currently loaded


# ── Request models ─────────────────────────────────────────────────────────

class RepoRequest(BaseModel):
    repo_url: str

class QuestionRequest(BaseModel):
    difficulty:         str       = "medium"
    candidate_level:    str       = "mid"
    previous_questions: list[str] = []

class AnswerRequest(BaseModel):
    question: str
    answer:   str

class InterviewTurnRequest(BaseModel):
    history:          list[dict]
    context_summary:  str  = ""
    current_question: str
    candidate_level:  str  = "mid"
    difficulty:       str  = "medium"
    mode:             str  = "practice"
    is_stuck:         bool = False
    follow_up_count:  int  = 0
    max_follow_ups:   int  = 1

class TransitionRequest(BaseModel):
    candidate_level: str        = "mid"
    scores_so_far:   list[dict] = []

class SummaryRequest(BaseModel):
    scores:          list[dict]
    candidate_level: str       = "mid"
    questions_asked: list[str] = []


# ── Helpers ────────────────────────────────────────────────────────────────

def _require_repo():
    """Raise 400 if no repo has been loaded yet."""
    if not repo_loaded or rag is None:
        raise HTTPException(
            status_code=400,
            detail="No repository loaded. Call POST /analyze first."
        )

def _get_context(query: str = "core logic", n: int = 4) -> tuple[list[str], str]:
    """Retrieve chunks from the current RAG index."""
    chunks  = rag.retrieve(query)
    chunks  = chunks[:n]
    summary = "\n\n---\n\n".join(chunks)
    return chunks, summary


RETRIEVAL_QUERIES = [
    "core logic",
    "important functions",
    "main algorithm",
    "code implementation",
    "business logic",
    "data processing",
    "error handling",
    "API endpoints",
]


# ── Endpoints ──────────────────────────────────────────────────────────────

@app.get("/")
def home():
    return {
        "message": "GitInterview backend running 🚀",
        "repo_loaded": repo_loaded,
        "current_repo": current_repo_url,
    }


@app.post("/analyze")
def analyze_repo(data: RepoRequest):
    """
    Fetch + index a GitHub repo.

    IMPORTANT: Every call COMPLETELY REPLACES the previous index.
    A fresh RAGEngine is created so no chunks from the old repo survive.
    """
    global rag, repo_loaded, current_repo_url

    # ── Step 1: Tear down the old index completely ──────────────────────────
    rag              = RAGEngine()   # brand-new instance — old BMI data is gone
    repo_loaded      = False
    current_repo_url = ""

    # ── Step 2: Fetch and index the new repo ────────────────────────────────
    files = fetch_repo_files(data.repo_url)

    if not files:
        raise HTTPException(
            status_code=400,
            detail="No valid code files found in the repository."
        )

    rag.build_index(files)

    # ── Step 3: Mark ready ──────────────────────────────────────────────────
    repo_loaded      = True
    current_repo_url = data.repo_url

    return {
        "message":         "Repository analyzed successfully.",
        "repo_url":        data.repo_url,
        "files_processed": len(files),
    }


@app.post("/generate-question")
def create_question(data: QuestionRequest):
    _require_repo()

    query       = random.choice(RETRIEVAL_QUERIES)
    chunks, _   = _get_context(query)

    question = generate_question(
        context_chunks=chunks,
        difficulty=data.difficulty,
        candidate_level=data.candidate_level,
        previous_questions=data.previous_questions,
    )

    return {"question": question}


# ── Legacy endpoints ───────────────────────────────────────────────────────

@app.post("/evaluate")
def evaluate(data: AnswerRequest):
    result = evaluate_answer(data.question, data.answer)
    return {"evaluation": result}


@app.post("/explain")
def explain(data: AnswerRequest):
    explanation = explain_answer(data.question, data.answer)
    return {"explanation": explanation}


# ── New human-interviewer endpoints ───────────────────────────────────────

@app.post("/interview/turn")
def interview_turn(data: InterviewTurnRequest):
    _require_repo()

    if data.context_summary:
        context_summary = data.context_summary
    else:
        _, context_summary = _get_context(random.choice(RETRIEVAL_QUERIES))

    result = conduct_turn(
        history=data.history,
        context_summary=context_summary,
        current_question=data.current_question,
        candidate_level=data.candidate_level,
        difficulty=data.difficulty,
        mode=data.mode,
        is_stuck=data.is_stuck,
        follow_up_count=data.follow_up_count,
        max_follow_ups=data.max_follow_ups,
    )

    return result


@app.post("/interview/transition")
def interview_transition(data: TransitionRequest):
    _require_repo()

    _, context_summary = _get_context(random.choice(RETRIEVAL_QUERIES), n=2)

    line = generate_transition(
        candidate_level=data.candidate_level,
        scores_so_far=data.scores_so_far,
        context_summary=context_summary,
    )

    return {"transition": line}


@app.post("/interview/summary")
def interview_summary(data: SummaryRequest):
    summary = generate_session_summary(
        scores=data.scores,
        candidate_level=data.candidate_level,
        questions_asked=data.questions_asked,
    )

    return summary


@app.get("/health")
def health():
    return {
        "status":        "ok",
        "repo_loaded":   repo_loaded,
        "current_repo":  current_repo_url,
    }