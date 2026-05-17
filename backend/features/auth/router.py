from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Request, status

from features.auth.service import AuthService
from features.auth.schema import UserCreate, UserLogin, RefreshTokenBody
from features.core.database import db
from features.core.jwt_handler import JWTHandler

router = APIRouter(prefix="/auth", tags=["auth"])
auth_service = AuthService(db, JWTHandler())

# --- Simple in-memory rate limiter (5 requests / minute per IP) ---
_rate_store: dict[str, list] = defaultdict(list)
_RATE_WINDOW = timedelta(minutes=1)
_RATE_LIMIT = 5


def _check_rate_limit(request: Request):
    ip = request.client.host if request.client else "unknown"
    now = datetime.utcnow()
    cutoff = now - _RATE_WINDOW
    _rate_store[ip] = [t for t in _rate_store[ip] if t > cutoff]
    if len(_rate_store[ip]) >= _RATE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas. Tente novamente em 1 minuto.",
        )
    _rate_store[ip].append(now)


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(request: Request, body: UserCreate):
    _check_rate_limit(request)
    try:
        access, refresh, user = await auth_service.register(body.username, body.password)
        return {"JWT": access, "refresh_token": refresh, "user": user}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(request: Request, body: UserLogin):
    _check_rate_limit(request)
    try:
        access, refresh, user = await auth_service.login(body.username, body.password)
        return {"JWT": access, "refresh_token": refresh, "user": user}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/refresh")
async def refresh(body: RefreshTokenBody):
    try:
        access = await auth_service.refresh(body.refresh_token)
        return {"JWT": access}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
