from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agent.travel_agent import TravelAgent
from app.api.deps import get_current_user
from app.db.database import get_db
from app.models import User
from app.schemas import (
    AgentChatRequest,
    AgentOptimizeRequest,
    AgentPlanRequest,
    AgentResponse,
    TripOut,
)
from app.services import trip_service

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/chat", response_model=AgentResponse)
async def agent_chat(
    payload: AgentChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = trip_service.get_user_trip(db, payload.trip_id, user) if payload.trip_id else None
    agent = TravelAgent(db, user, trip)
    return await agent.chat(payload.message)


@router.post("/plan-trip", response_model=AgentResponse)
async def plan_trip(
    payload: AgentPlanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = trip_service.get_user_trip(db, payload.trip_id, user)
    agent = TravelAgent(db, user, trip)
    return await agent.plan_trip(preferences_text=payload.preferences_text)


@router.post("/optimize-trip", response_model=AgentResponse)
async def optimize_trip(
    payload: AgentOptimizeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = trip_service.get_user_trip(db, payload.trip_id, user)
    agent = TravelAgent(db, user, trip)
    return await agent.optimize_trip()


@router.post("/apply-itinerary/{trip_id}", response_model=TripOut)
def apply_itinerary(
    trip_id: int,
    proposed_itinerary: list[dict],
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = trip_service.get_user_trip(db, trip_id, user)
    return trip_service.replace_itinerary_from_proposal(db, user, trip, proposed_itinerary)
