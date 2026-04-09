from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .auth import CurrentUser, get_current_user
from .database import (
    add_transaction,
    add_transactions_bulk,
    get_journey_profile,
    init_db,
    list_portfolio_plan,
    list_transactions,
    upsert_journey_profile,
    upsert_portfolio_plan_item,
)
from .gemini_client import GeminiNotConfiguredError, generate_text, list_models
from .schemas import (
    ChatRequest,
    ChatResponse,
    JourneyProfile,
    JourneyProfileResponse,
    PortfolioPlanItem,
    PortfolioPlanItemCreate,
    PortfolioPlanResponse,
    Transaction,
    TransactionBulkCreate,
    TransactionCreate,
    TransactionsResponse,
)
from .settings import settings

app = FastAPI(title="Bharat Invest AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/sync")
def auth_sync(current_user: CurrentUser = Depends(get_current_user)):
    return {
        "uid": current_user.uid,
        "email": current_user.email,
        "name": current_user.name,
        "photoUrl": current_user.photo_url,
    }


@app.get("/models")
def models():
    try:
        return {"models": list_models(), "active_model": settings.gemini_model}
    except GeminiNotConfiguredError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/me/profile", response_model=JourneyProfileResponse)
def me_profile(current_user: CurrentUser = Depends(get_current_user)):
    return JourneyProfileResponse(profile=get_journey_profile(current_user.uid))


@app.put("/me/profile", response_model=JourneyProfileResponse)
def upsert_me_profile(
    payload: JourneyProfile,
    current_user: CurrentUser = Depends(get_current_user),
):
    saved = upsert_journey_profile(current_user.uid, payload.model_dump())
    return JourneyProfileResponse(profile=JourneyProfile(**saved))


@app.get("/me/transactions", response_model=TransactionsResponse)
def me_transactions(current_user: CurrentUser = Depends(get_current_user)):
    rows = list_transactions(current_user.uid)
    return TransactionsResponse(transactions=[Transaction(**row) for row in rows])


@app.post("/me/transactions", response_model=Transaction)
def create_transaction(
    payload: TransactionCreate,
    current_user: CurrentUser = Depends(get_current_user),
):
    row = add_transaction(current_user.uid, payload.model_dump())
    return Transaction(**row)


@app.post("/me/transactions/bulk", response_model=TransactionsResponse)
def create_transactions_bulk(
    payload: TransactionBulkCreate,
    current_user: CurrentUser = Depends(get_current_user),
):
    rows = add_transactions_bulk(
        current_user.uid,
        [item.model_dump() for item in payload.transactions],
    )
    return TransactionsResponse(transactions=[Transaction(**row) for row in rows])


@app.get("/me/portfolio-plan", response_model=PortfolioPlanResponse)
def me_portfolio_plan(current_user: CurrentUser = Depends(get_current_user)):
    rows = list_portfolio_plan(current_user.uid)
    return PortfolioPlanResponse(items=[PortfolioPlanItem(**row) for row in rows])


@app.post("/me/portfolio-plan", response_model=PortfolioPlanItem)
def add_portfolio_plan(
    payload: PortfolioPlanItemCreate,
    current_user: CurrentUser = Depends(get_current_user),
):
    row = upsert_portfolio_plan_item(current_user.uid, payload.model_dump())
    return PortfolioPlanItem(**row)


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, current_user: CurrentUser = Depends(get_current_user)):
    """
    Prototype chat endpoint.
    Frontend sends the user profile + a list of eligible instruments (hard-coded on client).
    Backend uses Gemini to produce a personalised, safe, educational response.
    """
    ctx = req.context
    instruments = ctx.instruments or []
    instrument_lines = "\n".join(
        [
            f"- {i.name} | risk={i.riskLevel or 'n/a'} | min={i.minInvestment or 'n/a'} | returns={i.historicalReturns or 'n/a'} | stdev={i.standardDeviation or 'n/a'} | horizon={i.idealHorizon or 'n/a'}"
            for i in instruments
        ]
    ).strip()

    system = (
        "You are FinPilot AI, an educational investment assistant for India.\n"
        "Rules:\n"
        "- Do NOT provide legal/SEBI-regulated advice or guarantees.\n"
        "- Do NOT recommend specific stocks. Only suggest broad categories/instruments provided by the app.\n"
        "- Be concise and structured. Use bullet points.\n"
        "- Ask for missing critical info if needed.\n"
    )

    profile = (
        f"User name: {ctx.userName or 'unknown'}\n"
        f"Goal: {ctx.goalId or 'unknown'}\n"
        f"Risk appetite: {ctx.riskId or 'unknown'}\n"
        f"Horizon: {ctx.horizonId or 'unknown'}\n"
        f"Monthly invest: {ctx.monthlySurplus or 'unknown'}\n"
        f"Tax preference: {ctx.taxPreference or 'unknown'}\n"
    )

    history = "\n".join([f"{m.role.upper()}: {m.content}" for m in (req.messages or [])][-10:])
    user_prompt = (
        "Create a personalised suggestion using ONLY the provided instruments.\n\n"
        f"{profile}\n"
        "Eligible instruments:\n"
        f"{instrument_lines or '- (none provided)'}\n\n"
        "Conversation (most recent):\n"
        f"{history or '(none)'}\n\n"
        "Output format:\n"
        "1) Summary (1-2 lines)\n"
        "2) Top picks (max 2) with why\n"
        "3) Risks & watch-outs\n"
        "4) Next steps (3 bullets)\n"
    )

    # Persist latest user profile context whenever chat is called.
    upsert_journey_profile(
        current_user.uid,
        {
            "userName": ctx.userName,
            "goalId": ctx.goalId,
            "riskId": ctx.riskId,
            "horizonId": ctx.horizonId,
            "monthlySurplus": ctx.monthlySurplus,
            "taxPreference": ctx.taxPreference,
        },
    )

    try:
        text = generate_text(system=system, user=user_prompt)
    except GeminiNotConfiguredError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:  # pragma: no cover
        msg = f"Gemini call failed: {e}"
        code = 500
        if " 429 " in msg or "RESOURCE_EXHAUSTED" in msg or "code': 429" in msg:
            code = 429
        raise HTTPException(status_code=code, detail=msg)

    return ChatResponse(message=text)
