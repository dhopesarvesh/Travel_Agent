from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models import Expense, ItineraryDay, ItineraryItem, Trip, TripTraveler, User
from app.schemas import ExpenseCreate, TripCreate, TripUpdate
from app.services.utils import date_for_day, trip_day_count


def get_user_trip(db: Session, trip_id: int, user: User) -> Trip:
    trip = (
        db.query(Trip)
        .options(
            joinedload(Trip.itinerary_days).joinedload(ItineraryDay.items),
            joinedload(Trip.trip_travelers),
            joinedload(Trip.expenses),
        )
        .filter(Trip.id == trip_id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    if trip.user_id != user.id and user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this trip")
    return trip


def create_trip(db: Session, user: User, payload: TripCreate) -> Trip:
    try:
        days = trip_day_count(payload.start_date, payload.end_date)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    trip = Trip(
        user_id=user.id,
        title=payload.title,
        destination=payload.destination,
        start_date=payload.start_date,
        end_date=payload.end_date,
        travelers=payload.travelers,
        budget=payload.budget,
        notes=payload.notes,
        status="draft",
    )
    db.add(trip)
    db.flush()

    for traveler in payload.trip_travelers:
        db.add(TripTraveler(trip_id=trip.id, **traveler.model_dump()))

    for day_number in range(1, days + 1):
        db.add(
            ItineraryDay(
                trip_id=trip.id,
                day_number=day_number,
                date=date_for_day(payload.start_date, day_number),
                theme=f"Day {day_number}",
            )
        )

    db.commit()
    return get_user_trip(db, trip.id, user)


def update_trip(db: Session, user: User, trip: Trip, payload: TripUpdate) -> Trip:
    data = payload.model_dump(exclude_unset=True)
    start = data.get("start_date", trip.start_date)
    end = data.get("end_date", trip.end_date)
    try:
        new_days = trip_day_count(start, end)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    for key, value in data.items():
        setattr(trip, key, value)

    existing_days = {d.day_number: d for d in trip.itinerary_days}
    for day_number in range(1, new_days + 1):
        if day_number not in existing_days:
            db.add(
                ItineraryDay(
                    trip_id=trip.id,
                    day_number=day_number,
                    date=date_for_day(start, day_number),
                    theme=f"Day {day_number}",
                )
            )
        else:
            existing_days[day_number].date = date_for_day(start, day_number)

    for day_number, day in list(existing_days.items()):
        if day_number > new_days:
            db.delete(day)

    db.commit()
    return get_user_trip(db, trip.id, user)


def list_trips(db: Session, user: User) -> list[Trip]:
    return db.query(Trip).filter(Trip.user_id == user.id).order_by(Trip.created_at.desc()).all()


def delete_trip(db: Session, trip: Trip) -> None:
    db.delete(trip)
    db.commit()


def duplicate_trip(db: Session, trip: Trip, user: User) -> Trip:
    new_trip = Trip(
        user_id=user.id,
        title=f"{trip.title} (Copy)",
        destination=trip.destination,
        start_date=trip.start_date,
        end_date=trip.end_date,
        travelers=trip.travelers,
        budget=trip.budget,
        notes=trip.notes,
        status="draft",
    )
    db.add(new_trip)
    db.flush()

    for traveler in trip.trip_travelers:
        db.add(
            TripTraveler(
                trip_id=new_trip.id,
                name=traveler.name,
                age=traveler.age,
                notes=traveler.notes,
            )
        )

    for day in trip.itinerary_days:
        new_day = ItineraryDay(
            trip_id=new_trip.id,
            day_number=day.day_number,
            date=day.date,
            theme=day.theme,
            notes=day.notes,
        )
        db.add(new_day)
        db.flush()
        for item in day.items:
            db.add(
                ItineraryItem(
                    day_id=new_day.id,
                    place_id=item.place_id,
                    title=item.title,
                    item_type=item.item_type,
                    start_time=item.start_time,
                    duration_minutes=item.duration_minutes,
                    estimated_cost=item.estimated_cost,
                    notes=item.notes,
                    sort_order=item.sort_order,
                    latitude=item.latitude,
                    longitude=item.longitude,
                )
            )

    db.commit()
    return get_user_trip(db, new_trip.id, user)


def add_expense(db: Session, trip: Trip, payload: ExpenseCreate) -> Expense:
    expense = Expense(trip_id=trip.id, **payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def budget_summary(trip: Trip) -> dict:
    categories = ["accommodation", "food", "transport", "activities", "miscellaneous"]
    by_category = {c: {"estimated": 0.0, "actual": 0.0} for c in categories}

    for expense in trip.expenses:
        bucket = "estimated" if expense.is_estimated else "actual"
        if expense.category not in by_category:
            by_category[expense.category] = {"estimated": 0.0, "actual": 0.0}
        by_category[expense.category][bucket] += expense.amount

    itinerary_estimate = sum(item.estimated_cost for day in trip.itinerary_days for item in day.items)
    if by_category["activities"]["estimated"] == 0 and itinerary_estimate:
        by_category["activities"]["estimated"] = itinerary_estimate

    estimated_total = sum(v["estimated"] for v in by_category.values())
    actual_total = sum(v["actual"] for v in by_category.values())
    spent_or_planned = actual_total if actual_total > 0 else estimated_total

    return {
        "trip_budget": trip.budget,
        "estimated_total": estimated_total,
        "actual_total": actual_total,
        "remaining": trip.budget - spent_or_planned,
        "by_category": by_category,
        "is_over_budget": spent_or_planned > trip.budget if trip.budget else False,
    }


def replace_itinerary_from_proposal(db: Session, user: User, trip: Trip, proposed_days: list[dict]) -> Trip:
    for day in list(trip.itinerary_days):
        db.delete(day)
    db.flush()

    for day_data in proposed_days:
        day = ItineraryDay(
            trip_id=trip.id,
            day_number=day_data["day_number"],
            date=day_data.get("date") or date_for_day(trip.start_date, day_data["day_number"]),
            theme=day_data.get("theme", f"Day {day_data['day_number']}"),
            notes=day_data.get("notes", ""),
        )
        db.add(day)
        db.flush()
        for idx, item in enumerate(day_data.get("items", [])):
            db.add(
                ItineraryItem(
                    day_id=day.id,
                    place_id=item.get("place_id"),
                    title=item["title"],
                    item_type=item.get("item_type", "activity"),
                    start_time=item.get("start_time", "09:00"),
                    duration_minutes=item.get("duration_minutes", 90),
                    estimated_cost=item.get("estimated_cost", 0),
                    notes=item.get("notes", ""),
                    sort_order=item.get("sort_order", idx),
                    latitude=item.get("latitude"),
                    longitude=item.get("longitude"),
                )
            )
    trip.status = "planned"
    db.commit()
    return get_user_trip(db, trip.id, user)
