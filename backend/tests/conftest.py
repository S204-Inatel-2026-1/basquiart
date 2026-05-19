import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Mock Prisma BEFORE any imports that use it
sys.modules['prisma'] = MagicMock()
sys.modules['prisma.types'] = MagicMock()

import pytest
from types import SimpleNamespace
import os

# Ensure JWT handler has a secret during tests
os.environ.setdefault("SECRET_KEY", "test-secret-key")

from features.auth.service import AuthService
from features.core.jwt_handler import JWTHandler


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
    handler = MagicMock(spec=JWTHandler)
    handler.create_token.return_value = "fake-jwt-token"
    handler.create_refresh_token.return_value = "fake-refresh-token"
    return handler


@pytest.fixture
def auth_service(mock_db, mock_jwt_handler):
    return AuthService(mock_db, mock_jwt_handler)
