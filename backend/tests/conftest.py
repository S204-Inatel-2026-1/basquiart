import sys
import os
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Mock Prisma by default so unit tests do not require a generated client.
# Set RUN_DB_TESTS=1 when running integration tests against a real database.
if os.getenv("RUN_DB_TESTS") != "1":
    sys.modules["prisma"] = MagicMock()
    sys.modules["prisma.types"] = MagicMock()

import pytest
from types import SimpleNamespace

# Ensure JWT handler has a secret during tests
os.environ.setdefault("SECRET_KEY", "test-secret-key")


@pytest.fixture
def mock_db():
    return SimpleNamespace(
        user=SimpleNamespace(
            find_unique=AsyncMock(),
            create=AsyncMock(),
            update=AsyncMock(),
        ),
    )


@pytest.fixture
def mock_jwt_handler():
    from features.core.jwt_handler import JWTHandler

    handler = MagicMock(spec=JWTHandler)
    handler.create_token.return_value = "fake-jwt-token"
    handler.create_refresh_token.return_value = "fake-refresh-token"
    return handler


@pytest.fixture
def auth_service(mock_db, mock_jwt_handler):
    from features.auth.service import AuthService

    return AuthService(mock_db, mock_jwt_handler)
