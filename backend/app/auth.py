from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache

from fastapi import Header, HTTPException

from .database import upsert_user
from .settings import settings

try:
    import firebase_admin
    from firebase_admin import auth as fb_auth
    from firebase_admin import credentials
except Exception:  # pragma: no cover
    firebase_admin = None
    fb_auth = None
    credentials = None


@dataclass(frozen=True)
class CurrentUser:
    uid: str
    email: str | None
    name: str | None
    photo_url: str | None


@lru_cache(maxsize=1)
def _ensure_firebase_initialized() -> bool:
    if firebase_admin is None or fb_auth is None or credentials is None:
        raise HTTPException(
            status_code=500,
            detail="Firebase Admin SDK is not installed. Add firebase-admin to backend requirements.",
        )

    if firebase_admin._apps:  # type: ignore[attr-defined]
        return True

    if settings.firebase_service_account_json:
        info = json.loads(settings.firebase_service_account_json)
        cred = credentials.Certificate(info)
        firebase_admin.initialize_app(cred)
        return True

    if settings.firebase_service_account_file:
        cred = credentials.Certificate(settings.firebase_service_account_file)
        firebase_admin.initialize_app(cred)
        return True

    raise HTTPException(
        status_code=500,
        detail=(
            "Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_FILE or "
            "FIREBASE_SERVICE_ACCOUNT_JSON in backend/.env."
        ),
    )


def get_current_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")

    _ensure_firebase_initialized()
    try:
        decoded = fb_auth.verify_id_token(token)  # type: ignore[union-attr]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    uid = str(decoded.get("uid") or "")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = CurrentUser(
        uid=uid,
        email=(decoded.get("email") if isinstance(decoded.get("email"), str) else None),
        name=(decoded.get("name") if isinstance(decoded.get("name"), str) else None),
        photo_url=(decoded.get("picture") if isinstance(decoded.get("picture"), str) else None),
    )
    upsert_user(uid=user.uid, email=user.email, name=user.name, photo_url=user.photo_url)
    return user
