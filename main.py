from contextlib import asynccontextmanager

from fastapi import FastAPI

from features.auth.router import router as auth_router
from features.core.database import db


@asynccontextmanager
async def lifespan(_):
    # Startup
    await db.connect()

    yield

    # Shutdown
    await db.disconnect()


app = FastAPI(lifespan=lifespan)

app.include_router(auth_router)
