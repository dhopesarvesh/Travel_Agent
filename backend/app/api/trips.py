from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models import User
from app.schemas import TripCreate, TripOut, TripSummary, TripUpdate
from app.services import trip_service

router = APIRouter(prefix="/trips", tags=["trips"])


@router.get("", response_model=list[TripSummary])
def list_trips(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return trip_service.list_trips(db, user)


@router.post("", response_model=TripOut, status_code=status.HTTP_201_CREATED)
def create_trip(
    payload: TripCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return trip_service.create_trip(db, user, payload)


@router.get("/{trip_id}", response_model=TripOut)
def get_trip(trip_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return trip_service.get_user_trip(db, trip_id, user)


@router.put("/{trip_id}", response_model=TripOut)
def update_trip(
    trip_id: int,
    payload: TripUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = trip_service.get_user_trip(db, trip_id, user)
    return trip_service.update_trip(db, user, trip, payload)


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(trip_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = trip_service.get_user_trip(db, trip_id, user)
    trip_service.delete_trip(db, trip)
    return None


@router.post("/{trip_id}/duplicate", response_model=TripOut)
def duplicate_trip(
    trip_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = trip_service.get_user_trip(db, trip_id, user)
    return trip_service.duplicate_trip(db, trip, user)
