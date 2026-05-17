import bcrypt
from prisma import Prisma
from features.core.jwt_handler import JWTHandler


class AuthService:
    def __init__(self, db: Prisma, jwtHandler: JWTHandler):
        self.db = db
        self.jwtHandler = jwtHandler

    @staticmethod
    def _serialize_user(user):
        return {
            "id": user.id,
            "username": user.username,
            "createdAt": user.createdAt,
        }

    @staticmethod
    def _hash_password(plain: str) -> str:
        return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

    @staticmethod
    def _verify_password(plain: str, hashed: str) -> bool:
        return bcrypt.checkpw(plain.encode(), hashed.encode())

    def _issue_tokens(self, user_id: int) -> tuple[str, str]:
        access = self.jwtHandler.create_token(user_id)
        refresh = self.jwtHandler.create_refresh_token(user_id)
        return access, refresh

    async def register(self, username: str, password: str) -> tuple:
        existing = await self.db.user.find_unique(where={"username": username})
        if existing:
            raise ValueError("Username already registered")

        hashed = self._hash_password(password)
        user = await self.db.user.create(data={
            "username": username,
            "password": hashed,
        })

        access, refresh = self._issue_tokens(user.id)
        return access, refresh, self._serialize_user(user)

    async def login(self, username: str, password: str) -> tuple:
        user = await self.db.user.find_unique(where={"username": username})
        if not user:
            raise ValueError("Invalid credentials")

        stored = user.password
        if stored.startswith("$2"):
            # Bcrypt hash — verify normally
            if not self._verify_password(password, stored):
                raise ValueError("Invalid credentials")
        else:
            # Legacy plaintext — compare and migrate to bcrypt on success
            if password != stored:
                raise ValueError("Invalid credentials")
            new_hash = self._hash_password(password)
            await self.db.user.update(
                where={"id": user.id},
                data={"password": new_hash},
            )

        access, refresh = self._issue_tokens(user.id)
        return access, refresh, self._serialize_user(user)

    async def refresh(self, refresh_token: str) -> str:
        user_id = self.jwtHandler.get_user_id(refresh_token, expected_type="refresh")
        user = await self.db.user.find_unique(where={"id": user_id})
        if not user:
            raise ValueError("Invalid credentials")
        return self.jwtHandler.create_token(user_id)
