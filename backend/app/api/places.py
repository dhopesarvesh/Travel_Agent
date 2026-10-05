from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.api.deps import get_current_user, require_admin
from app.db.database import get_db
from app.integrations.weather_api import get_weather_forecast
from app.models import Destination, Expense, Place, SavedPlace, Trip, User
from app.schemas import (
    AdminStatsOut,
    AdminUserOut,
    AdminTripOut,
    DestinationCreate,
    DestinationOut,
    PlaceCreate,
    PlaceOut,
    SavedPlaceCreate,
    SavedPlaceOut,
)

router = APIRouter(tags=["places"])


@router.get("/destinations", response_model=list[DestinationOut])
def list_destinations(db: Session = Depends(get_db)):
    return db.query(Destination).options(joinedload(Destination.places)).order_by(Destination.name).all()


@router.get("/destinations/{destination_id}", response_model=DestinationOut)
def get_destination(destination_id: int, db: Session = Depends(get_db)):
    dest = db.query(Destination).options(joinedload(Destination.places)).filter(Destination.id == destination_id).first()
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found")
    return dest


@router.get("/places", response_model=list[PlaceOut])
def list_places(
    destination: str | None = None,
    q: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Place)
    if destination:
        dest = db.query(Destination).filter(Destination.name.ilike(f"%{destination}%")).first()
        if dest:
            query = query.filter(Place.destination_id == dest.id)
        else:
            query = query.filter(Place.name.ilike(f"%{destination}%"))
    if category and category.lower() != "all":
        query = query.filter(Place.category == category.lower())
    if q:
        query = query.filter(Place.name.ilike(f"%{q}%") | Place.description.ilike(f"%{q}%") | Place.tags.ilike(f"%{q}%"))
    return query.order_by(Place.rating.desc()).all()


@router.get("/places/{place_id}", response_model=PlaceOut)
def get_place(place_id: int, db: Session = Depends(get_db)):
    place = db.query(Place).filter(Place.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    return place


# Weather Endpoints
@router.get("/weather")
async def get_weather(
    destination: str | None = None,
    lat: float | None = None,
    lon: float | None = None,
    days: int = Query(default=7, ge=1, le=16),
    db: Session = Depends(get_db),
):
    if lat is not None and lon is not None:
        return await get_weather_forecast(lat, lon, days)
    if destination:
        dest = db.query(Destination).filter(Destination.name.ilike(f"%{destination}%")).first()
        if dest and dest.latitude is not None and dest.longitude is not None:
            return await get_weather_forecast(dest.latitude, dest.longitude, days)
        # Fallback default coordinates if destination is unknown
        return await get_weather_forecast(15.2993, 74.1240, days)
    raise HTTPException(status_code=400, detail="Provide destination name or latitude and longitude")


@router.get("/destinations/{destination_id}/weather")
async def get_destination_weather(
    destination_id: int,
    days: int = Query(default=7, ge=1, le=16),
    db: Session = Depends(get_db),
):
    dest = db.query(Destination).filter(Destination.id == destination_id).first()
    if not dest or dest.latitude is None or dest.longitude is None:
        raise HTTPException(status_code=404, detail="Destination coordinates not found")
    return await get_weather_forecast(dest.latitude, dest.longitude, days)


# Saved Places
@router.get("/saved-places", response_model=list[SavedPlaceOut])
def list_saved(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(SavedPlace)
        .options(joinedload(SavedPlace.place))
        .filter(SavedPlace.user_id == user.id)
        .order_by(SavedPlace.created_at.desc())
        .all()
    )


@router.post("/saved-places", response_model=SavedPlaceOut, status_code=status.HTTP_201_CREATED)
def save_place(
    payload: SavedPlaceCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    place = db.query(Place).filter(Place.id == payload.place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    existing = (
        db.query(SavedPlace)
        .filter(SavedPlace.user_id == user.id, SavedPlace.place_id == payload.place_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Place already saved")
    saved = SavedPlace(user_id=user.id, place_id=payload.place_id, notes=payload.notes)
    db.add(saved)
    db.commit()
    db.refresh(saved)
    return (
        db.query(SavedPlace)
        .options(joinedload(SavedPlace.place))
        .filter(SavedPlace.id == saved.id)
        .first()
    )


@router.delete("/saved-places/{saved_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_place(
    saved_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    saved = db.query(SavedPlace).filter(SavedPlace.id == saved_id, SavedPlace.user_id == user.id).first()
    if not saved:
        raise HTTPException(status_code=404, detail="Saved place not found")
    db.delete(saved)
    db.commit()
    return None


# Admin Management Endpoints
@router.get("/admin/destinations", response_model=list[DestinationOut])
def admin_destinations(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(Destination).options(joinedload(Destination.places)).order_by(Destination.name).all()


@router.post("/admin/destinations", response_model=DestinationOut, status_code=status.HTTP_201_CREATED)
def admin_create_destination(
    payload: DestinationCreate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(Destination).filter(Destination.name.ilike(payload.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Destination with this name already exists")
    destination = Destination(**payload.model_dump())
    db.add(destination)
    db.commit()
    db.refresh(destination)
    return destination


@router.delete("/admin/destinations/{destination_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_destination(
    destination_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    dest = db.query(Destination).filter(Destination.id == destination_id).first()
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found")
    db.delete(dest)
    db.commit()
    return None


@router.post("/admin/places", response_model=PlaceOut, status_code=status.HTTP_201_CREATED)
def admin_create_place(
    payload: PlaceCreate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    dest = db.query(Destination).filter(Destination.id == payload.destination_id).first()
    if not dest:
        raise HTTPException(status_code=404, detail="Parent destination not found")
    place = Place(**payload.model_dump())
    db.add(place)
    db.commit()
    db.refresh(place)
    return place


@router.delete("/admin/places/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_place(
    place_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    place = db.query(Place).filter(Place.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    db.delete(place)
    db.commit()
    return None


@router.get("/admin/stats", response_model=AdminStatsOut)
def admin_stats(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return AdminStatsOut(
        total_users=db.query(User).count(),
        total_trips=db.query(Trip).count(),
        total_destinations=db.query(Destination).count(),
        total_places=db.query(Place).count(),
        total_expenses=db.query(Expense).count(),
    )


@router.get("/admin/users", response_model=list[AdminUserOut])
def admin_list_users(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        trip_count = db.query(func.count(Trip.id)).filter(Trip.user_id == u.id).scalar() or 0
        result.append(AdminUserOut(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at,
            trip_count=trip_count,
        ))
    return result


@router.patch("/admin/users/{user_id}/toggle-active")
def admin_toggle_user_active(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    user.is_active = not user.is_active
    db.commit()
    return {"id": user.id, "is_active": user.is_active}


@router.get("/admin/trips", response_model=list[AdminTripOut])
def admin_list_trips(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    trips = (
        db.query(Trip)
        .options(joinedload(Trip.owner))
        .order_by(Trip.created_at.desc())
        .all()
    )
    result = []
    for t in trips:
        expense_total = (
            db.query(func.coalesce(func.sum(Expense.amount), 0.0))
            .filter(Expense.trip_id == t.id)
            .scalar()
        )
        result.append(AdminTripOut(
            id=t.id,
            title=t.title,
            destination=t.destination,
            start_date=t.start_date,
            end_date=t.end_date,
            travelers=t.travelers,
            budget=t.budget,
            status=t.status,
            created_at=t.created_at,
            user_email=t.owner.email if t.owner else "unknown",
            user_name=t.owner.full_name if t.owner else "Unknown",
            total_expenses=float(expense_total),
        ))
    return result
