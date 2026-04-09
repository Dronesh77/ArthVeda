from __future__ import annotations

import sqlite3
from datetime import UTC, datetime
from functools import lru_cache
from pathlib import Path
from typing import Any
from uuid import uuid4

from .settings import settings

try:
    from pymongo import ASCENDING, MongoClient
except Exception:  # pragma: no cover
    ASCENDING = 1
    MongoClient = None

DB_PATH = Path(__file__).resolve().parents[1] / "data" / "app.db"
USE_MONGO = bool(settings.mongo_uri)


def _now() -> datetime:
    return datetime.now(UTC)


def _iso(ts: datetime | str | None) -> str:
    if isinstance(ts, datetime):
        return ts.astimezone(UTC).isoformat()
    if isinstance(ts, str) and ts:
        return ts
    return _now().isoformat()


@lru_cache(maxsize=1)
def _mongo_db():
    if MongoClient is None:
        raise RuntimeError("pymongo is not installed. Install backend requirements.")
    if not settings.mongo_uri:
        raise RuntimeError("MONGO_URI is not configured in backend/.env.")
    client = MongoClient(settings.mongo_uri)
    return client[settings.mongo_db_name]


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _sqlite_columns(conn: sqlite3.Connection, table: str) -> set[str]:
    rows = conn.execute(f"PRAGMA table_info({table})").fetchall()
    return {str(r[1]) for r in rows}


def _ensure_sqlite_column(conn: sqlite3.Connection, table: str, column: str, sql_type: str) -> None:
    cols = _sqlite_columns(conn, table)
    if column in cols:
        return
    conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {sql_type}")


def init_db() -> None:
    if USE_MONGO:
        db = _mongo_db()
        db.users.create_index([("uid", ASCENDING)], unique=True)
        db.journey_profiles.create_index([("uid", ASCENDING)], unique=True)
        db.transactions.create_index([("uid", ASCENDING), ("date", ASCENDING)])
        db.transactions.create_index([("id", ASCENDING)], unique=True)
        db.portfolio_plan.create_index([("uid", ASCENDING), ("instrumentId", ASCENDING)], unique=True)
        return

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_conn() as conn:
        conn.execute("PRAGMA foreign_keys=OFF")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                uid TEXT PRIMARY KEY,
                email TEXT,
                name TEXT,
                photo_url TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        # Migrate older local schemas to current auth schema.
        _ensure_sqlite_column(conn, "users", "uid", "TEXT")
        _ensure_sqlite_column(conn, "users", "email", "TEXT")
        _ensure_sqlite_column(conn, "users", "photo_url", "TEXT")
        conn.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS idx_users_uid_unique
            ON users(uid)
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS journey_profiles (
                uid TEXT PRIMARY KEY,
                user_name TEXT,
                goal_id TEXT,
                risk_id TEXT,
                horizon_id TEXT,
                monthly_surplus TEXT,
                tax_preference TEXT,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(uid) REFERENCES users(uid) ON DELETE CASCADE
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                uid TEXT NOT NULL,
                date TEXT NOT NULL,
                type TEXT NOT NULL,
                instrument TEXT NOT NULL,
                amount REAL NOT NULL,
                note TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(uid) REFERENCES users(uid) ON DELETE CASCADE
            )
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_transactions_uid_date
            ON transactions(uid, date DESC)
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS portfolio_plan (
                id TEXT PRIMARY KEY,
                uid TEXT NOT NULL,
                instrument_id TEXT NOT NULL,
                name TEXT NOT NULL,
                category TEXT,
                risk_level TEXT,
                historical_returns TEXT,
                min_investment TEXT,
                liquidity TEXT,
                ideal_horizon TEXT,
                details TEXT,
                risk_id TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(uid, instrument_id),
                FOREIGN KEY(uid) REFERENCES users(uid) ON DELETE CASCADE
            )
            """
        )
        conn.execute("PRAGMA foreign_keys=ON")
        conn.commit()


def upsert_user(*, uid: str, email: str | None, name: str | None, photo_url: str | None) -> None:
    if USE_MONGO:
        now = _now()
        db = _mongo_db()
        db.users.update_one(
            {"uid": uid},
            {
                "$set": {
                    "uid": uid,
                    "email": email,
                    "name": name,
                    "photo_url": photo_url,
                    "updated_at": now,
                },
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )
        return

    with get_conn() as conn:
        cols = _sqlite_columns(conn, "users")
        legacy_phone = "phone_e164" in cols
        conn.execute(
            (
                """
                INSERT INTO users(uid, email, name, photo_url, phone_e164)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(uid) DO UPDATE SET
                    email=excluded.email,
                    name=excluded.name,
                    photo_url=excluded.photo_url,
                    phone_e164=excluded.phone_e164,
                    updated_at=CURRENT_TIMESTAMP
                """
                if legacy_phone
                else """
                INSERT INTO users(uid, email, name, photo_url)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(uid) DO UPDATE SET
                    email=excluded.email,
                    name=excluded.name,
                    photo_url=excluded.photo_url,
                    updated_at=CURRENT_TIMESTAMP
                """
            ),
            (
                uid,
                email,
                name,
                photo_url,
                f"uid:{uid}",
            )
            if legacy_phone
            else (uid, email, name, photo_url),
        )
        conn.commit()


def get_journey_profile(uid: str) -> dict[str, Any] | None:
    if USE_MONGO:
        db = _mongo_db()
        doc = db.journey_profiles.find_one(
            {"uid": uid},
            {
                "_id": 0,
                "userName": 1,
                "goalId": 1,
                "riskId": 1,
                "horizonId": 1,
                "monthlySurplus": 1,
                "taxPreference": 1,
            },
        )
        if not doc:
            return None
        return {
            "userName": doc.get("userName"),
            "goalId": doc.get("goalId"),
            "riskId": doc.get("riskId"),
            "horizonId": doc.get("horizonId"),
            "monthlySurplus": doc.get("monthlySurplus"),
            "taxPreference": doc.get("taxPreference"),
        }

    with get_conn() as conn:
        row = conn.execute(
            """
            SELECT user_name, goal_id, risk_id, horizon_id, monthly_surplus, tax_preference
            FROM journey_profiles
            WHERE uid = ?
            """,
            (uid,),
        ).fetchone()
    if row is None:
        return None
    return {
        "userName": row["user_name"],
        "goalId": row["goal_id"],
        "riskId": row["risk_id"],
        "horizonId": row["horizon_id"],
        "monthlySurplus": row["monthly_surplus"],
        "taxPreference": row["tax_preference"],
    }


def upsert_journey_profile(uid: str, data: dict[str, Any]) -> dict[str, Any]:
    if USE_MONGO:
        now = _now()
        db = _mongo_db()
        db.journey_profiles.update_one(
            {"uid": uid},
            {
                "$set": {
                    "uid": uid,
                    "userName": data.get("userName"),
                    "goalId": data.get("goalId"),
                    "riskId": data.get("riskId"),
                    "horizonId": data.get("horizonId"),
                    "monthlySurplus": data.get("monthlySurplus"),
                    "taxPreference": data.get("taxPreference"),
                    "updated_at": now,
                },
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )
        return get_journey_profile(uid) or {}

    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO journey_profiles(
                uid, user_name, goal_id, risk_id, horizon_id, monthly_surplus, tax_preference
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(uid) DO UPDATE SET
                user_name=excluded.user_name,
                goal_id=excluded.goal_id,
                risk_id=excluded.risk_id,
                horizon_id=excluded.horizon_id,
                monthly_surplus=excluded.monthly_surplus,
                tax_preference=excluded.tax_preference,
                updated_at=CURRENT_TIMESTAMP
            """,
            (
                uid,
                data.get("userName"),
                data.get("goalId"),
                data.get("riskId"),
                data.get("horizonId"),
                data.get("monthlySurplus"),
                data.get("taxPreference"),
            ),
        )
        conn.commit()
    return get_journey_profile(uid) or {}


def list_transactions(uid: str) -> list[dict[str, Any]]:
    if USE_MONGO:
        db = _mongo_db()
        docs = list(
            db.transactions.find({"uid": uid}, {"_id": 0}).sort([("date", -1), ("createdAt", -1)])
        )
        return [
            {
                "id": doc.get("id", ""),
                "date": doc.get("date", ""),
                "type": doc.get("type", "buy"),
                "instrument": doc.get("instrument", ""),
                "amount": float(doc.get("amount", 0)),
                "note": doc.get("note"),
                "createdAt": _iso(doc.get("createdAt")),
            }
            for doc in docs
        ]

    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT id, date, type, instrument, amount, note, created_at
            FROM transactions
            WHERE uid = ?
            ORDER BY date DESC, created_at DESC
            """,
            (uid,),
        ).fetchall()
    return [
        {
            "id": row["id"],
            "date": row["date"],
            "type": row["type"],
            "instrument": row["instrument"],
            "amount": float(row["amount"]),
            "note": row["note"],
            "createdAt": _iso(row["created_at"]),
        }
        for row in rows
    ]


def add_transaction(uid: str, data: dict[str, Any]) -> dict[str, Any]:
    tx_id = str(uuid4())
    now = _now()
    record = {
        "id": tx_id,
        "uid": uid,
        "date": str(data.get("date") or ""),
        "type": str(data.get("type") or "buy"),
        "instrument": str(data.get("instrument") or ""),
        "amount": float(data.get("amount") or 0),
        "note": data.get("note"),
        "createdAt": now.isoformat(),
    }

    if USE_MONGO:
        db = _mongo_db()
        db.transactions.insert_one(record)
        return {
            "id": record["id"],
            "date": record["date"],
            "type": record["type"],
            "instrument": record["instrument"],
            "amount": record["amount"],
            "note": record.get("note"),
            "createdAt": record["createdAt"],
        }

    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO transactions(id, uid, date, type, instrument, amount, note, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                tx_id,
                uid,
                record["date"],
                record["type"],
                record["instrument"],
                record["amount"],
                record.get("note"),
                record["createdAt"],
            ),
        )
        conn.commit()
    return {
        "id": tx_id,
        "date": record["date"],
        "type": record["type"],
        "instrument": record["instrument"],
        "amount": record["amount"],
        "note": record.get("note"),
        "createdAt": record["createdAt"],
    }


def add_transactions_bulk(uid: str, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [add_transaction(uid, item) for item in items]


def list_portfolio_plan(uid: str) -> list[dict[str, Any]]:
    if USE_MONGO:
        db = _mongo_db()
        docs = list(db.portfolio_plan.find({"uid": uid}, {"_id": 0}).sort([("updatedAt", -1)]))
        return [
            {
                "id": doc.get("id", ""),
                "instrumentId": doc.get("instrumentId", ""),
                "name": doc.get("name", ""),
                "category": doc.get("category"),
                "riskLevel": doc.get("riskLevel"),
                "historicalReturns": doc.get("historicalReturns"),
                "minInvestment": doc.get("minInvestment"),
                "liquidity": doc.get("liquidity"),
                "idealHorizon": doc.get("idealHorizon"),
                "details": doc.get("details"),
                "riskId": doc.get("riskId"),
                "createdAt": _iso(doc.get("createdAt")),
                "updatedAt": _iso(doc.get("updatedAt")),
            }
            for doc in docs
        ]

    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT
                id, instrument_id, name, category, risk_level, historical_returns,
                min_investment, liquidity, ideal_horizon, details, risk_id, created_at, updated_at
            FROM portfolio_plan
            WHERE uid = ?
            ORDER BY updated_at DESC
            """,
            (uid,),
        ).fetchall()
    return [
        {
            "id": row["id"],
            "instrumentId": row["instrument_id"],
            "name": row["name"],
            "category": row["category"],
            "riskLevel": row["risk_level"],
            "historicalReturns": row["historical_returns"],
            "minInvestment": row["min_investment"],
            "liquidity": row["liquidity"],
            "idealHorizon": row["ideal_horizon"],
            "details": row["details"],
            "riskId": row["risk_id"],
            "createdAt": _iso(row["created_at"]),
            "updatedAt": _iso(row["updated_at"]),
        }
        for row in rows
    ]


def upsert_portfolio_plan_item(uid: str, data: dict[str, Any]) -> dict[str, Any]:
    now = _now().isoformat()
    item_id = str(uuid4())
    instrument_id = str(data.get("instrumentId") or "")

    if USE_MONGO:
        db = _mongo_db()
        db.portfolio_plan.update_one(
            {"uid": uid, "instrumentId": instrument_id},
            {
                "$set": {
                    "uid": uid,
                    "instrumentId": instrument_id,
                    "name": data.get("name"),
                    "category": data.get("category"),
                    "riskLevel": data.get("riskLevel"),
                    "historicalReturns": data.get("historicalReturns"),
                    "minInvestment": data.get("minInvestment"),
                    "liquidity": data.get("liquidity"),
                    "idealHorizon": data.get("idealHorizon"),
                    "details": data.get("details"),
                    "riskId": data.get("riskId"),
                    "updatedAt": now,
                },
                "$setOnInsert": {"id": item_id, "createdAt": now},
            },
            upsert=True,
        )
        doc = db.portfolio_plan.find_one({"uid": uid, "instrumentId": instrument_id}, {"_id": 0}) or {}
        return {
            "id": doc.get("id", item_id),
            "instrumentId": instrument_id,
            "name": doc.get("name", data.get("name")),
            "category": doc.get("category"),
            "riskLevel": doc.get("riskLevel"),
            "historicalReturns": doc.get("historicalReturns"),
            "minInvestment": doc.get("minInvestment"),
            "liquidity": doc.get("liquidity"),
            "idealHorizon": doc.get("idealHorizon"),
            "details": doc.get("details"),
            "riskId": doc.get("riskId"),
            "createdAt": _iso(doc.get("createdAt") or now),
            "updatedAt": _iso(doc.get("updatedAt") or now),
        }

    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO portfolio_plan(
                id, uid, instrument_id, name, category, risk_level, historical_returns,
                min_investment, liquidity, ideal_horizon, details, risk_id, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(uid, instrument_id) DO UPDATE SET
                name=excluded.name,
                category=excluded.category,
                risk_level=excluded.risk_level,
                historical_returns=excluded.historical_returns,
                min_investment=excluded.min_investment,
                liquidity=excluded.liquidity,
                ideal_horizon=excluded.ideal_horizon,
                details=excluded.details,
                risk_id=excluded.risk_id,
                updated_at=excluded.updated_at
            """,
            (
                item_id,
                uid,
                instrument_id,
                data.get("name"),
                data.get("category"),
                data.get("riskLevel"),
                data.get("historicalReturns"),
                data.get("minInvestment"),
                data.get("liquidity"),
                data.get("idealHorizon"),
                data.get("details"),
                data.get("riskId"),
                now,
                now,
            ),
        )
        conn.commit()

        row = conn.execute(
            """
            SELECT
                id, instrument_id, name, category, risk_level, historical_returns,
                min_investment, liquidity, ideal_horizon, details, risk_id, created_at, updated_at
            FROM portfolio_plan
            WHERE uid = ? AND instrument_id = ?
            """,
            (uid, instrument_id),
        ).fetchone()

    return {
        "id": row["id"],
        "instrumentId": row["instrument_id"],
        "name": row["name"],
        "category": row["category"],
        "riskLevel": row["risk_level"],
        "historicalReturns": row["historical_returns"],
        "minInvestment": row["min_investment"],
        "liquidity": row["liquidity"],
        "idealHorizon": row["ideal_horizon"],
        "details": row["details"],
        "riskId": row["risk_id"],
        "createdAt": _iso(row["created_at"]),
        "updatedAt": _iso(row["updated_at"]),
    }
