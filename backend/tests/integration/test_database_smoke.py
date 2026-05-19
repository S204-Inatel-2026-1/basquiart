import os

import pytest


pytestmark = pytest.mark.skipif(
    os.getenv("RUN_DB_TESTS") != "1",
    reason="Set RUN_DB_TESTS=1 and DATABASE_URL to run database integration tests",
)


@pytest.mark.asyncio
async def test_prisma_connects_to_database():
    """Smoke test for the real Prisma/PostgreSQL connection."""
    if not os.getenv("DATABASE_URL"):
        pytest.skip("DATABASE_URL is required for database integration tests")

    try:
        from prisma import Prisma
    except RuntimeError as exc:
        pytest.skip(f"Prisma client is not generated: {exc}")

    db = Prisma()
    await db.connect()
    try:
        users = await db.user.find_many(take=1)
        assert isinstance(users, list)
    finally:
        await db.disconnect()
