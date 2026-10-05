from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import agent, auth, expenses, itinerary, places, trips, users
from app.core.config import get_settings
from app.db.database import Base, engine
from app.db.seed import seed_destinations_and_places

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure all tables are created and seed data is populated
    Base.metadata.create_all(bind=engine)
    seed_destinations_and_places()
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
    description="Agentic AI Travel Planning Platform with multi-step tool calling, PostgreSQL, and live weather optimization.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = settings.api_prefix
app.include_router(auth.router, prefix=api)
app.include_router(users.router, prefix=api)
app.include_router(trips.router, prefix=api)
app.include_router(itinerary.router, prefix=api)
app.include_router(places.router, prefix=api)
app.include_router(expenses.router, prefix=api)
app.include_router(agent.router, prefix=api)


@app.get("/")
def root():
    return {
        "name": settings.app_name,
        "docs": "/docs",
        "api": api,
        "status": "healthy",
    }


@app.get("/health")
def health():
    return {"status": "healthy", "database": "connected"}
