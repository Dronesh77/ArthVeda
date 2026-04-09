from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"] = Field(..., description="Chat role")
    content: str = Field(..., min_length=1)


class Instrument(BaseModel):
    name: str
    category: str | None = None
    historicalReturns: str | None = None
    standardDeviation: str | None = None
    minInvestment: str | None = None
    liquidity: str | None = None
    riskLevel: str | None = None
    idealHorizon: str | None = None


class ChatContext(BaseModel):
    userName: str | None = None
    goalId: str | None = None
    riskId: str | None = None
    horizonId: str | None = None
    monthlySurplus: str | None = None
    taxPreference: str | None = None
    instruments: list[Instrument] = Field(default_factory=list)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(default_factory=list)
    context: ChatContext


class ChatResponse(BaseModel):
    message: str


class JourneyProfile(BaseModel):
    userName: str | None = None
    goalId: str | None = None
    riskId: str | None = None
    horizonId: str | None = None
    monthlySurplus: str | None = None
    taxPreference: str | None = None


class JourneyProfileResponse(BaseModel):
    profile: JourneyProfile | None


class TransactionCreate(BaseModel):
    date: str
    type: Literal["sip", "buy", "sell", "dividend", "fee"]
    instrument: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)
    note: str | None = None


class Transaction(TransactionCreate):
    id: str
    createdAt: str


class TransactionsResponse(BaseModel):
    transactions: list[Transaction] = Field(default_factory=list)


class TransactionBulkCreate(BaseModel):
    transactions: list[TransactionCreate] = Field(default_factory=list)


class PortfolioPlanItemCreate(BaseModel):
    instrumentId: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    category: str | None = None
    riskLevel: str | None = None
    historicalReturns: str | None = None
    minInvestment: str | None = None
    liquidity: str | None = None
    idealHorizon: str | None = None
    details: str | None = None
    riskId: str | None = None


class PortfolioPlanItem(PortfolioPlanItemCreate):
    id: str
    createdAt: str
    updatedAt: str


class PortfolioPlanResponse(BaseModel):
    items: list[PortfolioPlanItem] = Field(default_factory=list)
