from fastapi import APIRouter, HTTPException, status

from features.auth.service import AuthService
from features.auth.schema import UserCreate, UserLogin
from features.core.database import db
from features.core.jwt_handler import JWTHandler

router = APIRouter(prefix="/auth", tags=["auth"])
auth_service = AuthService(db, JWTHandler())


def _serialize_user(user):
    return {
        "id": user.id,
        "username": user.username,
        "createdAt": user.createdAt,
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: UserCreate):
    try:
        token = await auth_service.register(body.username, body.password)
        user = await db.user.find_unique(where={"username": body.username})
        payload = {"JWT": token}
        if user:
            payload["user"] = _serialize_user(user)
        return payload
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(body: UserLogin):
    try:
        token = await auth_service.login(body.username, body.password)
        user = await db.user.find_unique(where={"username": body.username})
        payload = {"JWT": token}
        if user:
            payload["user"] = _serialize_user(user)
        return payload
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
