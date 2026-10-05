from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models import ItineraryDay, ItineraryItem, User
from app.schemas import (
    ItineraryDayOut,
    ItineraryDayUpdate,
    ItineraryItemCreate,
    ItineraryItemOut,
    ItineraryItemUpdate,
    ReorderItemsRequest,
)
from app.services import trip_service

router = APIRouter(tags=["itinerary"])


@router.get("/trips/{trip_id}/itinerary", response_model=list[ItineraryDayOut])
def get_itinerary(trip_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = trip_service.get_user_trip(db, trip_id, user)
    return sorted(trip.itinerary_days, key=lambda d: d.day_number)


@router.post(
    "/trips/{trip_id}/itinerary/days/{day_number}/items",
    response_model=ItineraryItemOut,
    status_code=status.HTTP_201_CREATED,
)
def add_item(
    trip_id: int,
    day_number: int,
    payload: ItineraryItemCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = trip_service.get_user_trip(db, trip_id, user)
    day = next((d for d in trip.itinerary_days if d.day_number == day_number), None)
    if not day:
        raise HTTPException(status_code=404, detail="Itinerary day not found")

    data = payload.model_dump()
    if not data.get("sort_order") and day.items:
        data["sort_order"] = len(day.items)

    item = ItineraryItem(day_id=day.id, **data)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/itinerary/items/{item_id}", response_model=ItineraryItemOut)
def update_item(
    item_id: int,
    payload: ItineraryItemUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(ItineraryItem).filter(ItineraryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    trip_service.get_user_trip(db, item.day.trip_id, user)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/itinerary/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(ItineraryItem).filter(ItineraryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    trip_service.get_user_trip(db, item.day.trip_id, user)
    db.delete(item)
    db.commit()
    return None


@router.put("/itinerary/days/{day_id}", response_model=ItineraryDayOut)
def update_day(
    day_id: int,
    payload: ItineraryDayUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    day = db.query(ItineraryDay).filter(ItineraryDay.id == day_id).first()
    if not day:
        raise HTTPException(status_code=404, detail="Day not found")
    trip_service.get_user_trip(db, day.trip_id, user)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(day, key, value)
    db.commit()
    db.refresh(day)
    return day


@router.put("/itinerary/days/{day_id}/reorder", response_model=list[ItineraryItemOut])
def reorder_items(
    day_id: int,
    payload: ReorderItemsRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    day = db.query(ItineraryDay).filter(ItineraryDay.id == day_id).first()
    if not day:
        raise HTTPException(status_code=404, detail="Day not found")
    trip_service.get_user_trip(db, day.trip_id, user)
    items = {item.id: item for item in day.items}
    for index, item_id in enumerate(payload.item_ids):
        if item_id in items:
            items[item_id].sort_order = index
    db.commit()
    db.refresh(day)
    return sorted(day.items, key=lambda i: i.sort_order)
