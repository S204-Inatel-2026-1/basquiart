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

    async def register(self, username: str, password: str) -> tuple:
        existing = await self.db.user.find_unique(where={"username": username})
        if existing:
            raise ValueError("Username already registered")

        user = await self.db.user.create(data={
            "username": username,
            "password": password,
        })

        token = self.jwtHandler.create_token(user.id)
        return token, self._serialize_user(user)

    async def login(self, username: str, password: str) -> tuple:
        user = await self.db.user.find_unique(where={"username": username})
        if not user:
            raise ValueError("Invalid credentials")
        if password != user.password:
            raise ValueError("Invalid credentials")

        token = self.jwtHandler.create_token(user.id)
        return token, self._serialize_user(user)
