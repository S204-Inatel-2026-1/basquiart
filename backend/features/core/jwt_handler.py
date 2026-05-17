from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from dotenv import load_dotenv
import os

load_dotenv()


class JWTHandler:
    def __init__(
        self,
        secret_key: str = os.getenv("SECRET_KEY"),
        algorithm: str = os.getenv("ALGORITHM", "HS256"),
        expiration_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60)),
        refresh_expiration_minutes: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES", 10_080)),
    ):
        if not secret_key:
            raise ValueError("SECRET_KEY is not set in environment variables")

        self.secret_key = secret_key
        self.algorithm = algorithm
        self.expiration_minutes = expiration_minutes
        self.refresh_expiration_minutes = refresh_expiration_minutes

    def _create_token(self, user_id: int, token_type: str, expiration_minutes: int) -> str:
        payload = {
            "sub": str(user_id),
            "type": token_type,
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=expiration_minutes),
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def create_token(self, user_id: int) -> str:
        """Generate a short-lived access JWT (60 min by default)."""
        return self._create_token(user_id, "access", self.expiration_minutes)

    def create_refresh_token(self, user_id: int) -> str:
        """Generate a long-lived refresh JWT (7 days by default)."""
        return self._create_token(user_id, "refresh", self.refresh_expiration_minutes)

    def decode_token(self, token: str) -> dict:
        """Decode and validate a JWT. Raises ValueError on failure."""
        try:
            return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
        except JWTError as e:
            raise ValueError(f"Invalid or expired token: {e}")

    def get_user_id(self, token: str, expected_type: str = "access") -> int:
        """Extract the user ID from a valid JWT, enforcing the token type."""
        payload = self.decode_token(token)
        if payload.get("type") != expected_type:
            raise ValueError(f"Expected '{expected_type}' token")
        user_id = payload.get("sub")
        if user_id is None:
            raise ValueError("Token is missing 'sub' claim")
        return int(user_id)

    def is_valid(self, token: str) -> bool:
        """Return True if the token is valid, False otherwise."""
        try:
            self.decode_token(token)
            return True
        except ValueError:
            return False
