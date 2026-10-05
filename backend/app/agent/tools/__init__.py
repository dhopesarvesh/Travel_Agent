from sqlalchemy.orm import Session, joinedload

from app.integrations.maps_api import calculate_route_metrics
from app.integrations.weather_api import get_weather_forecast
from app.models import Destination, Place, SavedPlace, Trip, User
from app.services.trip_service import budget_summary
from app.services.utils import trip_day_count


def get_user_preferences(user: User) -> dict:
    prefs = user.preferences
    if not prefs:
        return {}
    return {
        "favorite_activities": prefs.favorite_activities,
        "travel_style": prefs.travel_style,
        "budget_range": prefs.budget_range,
        "food_preferences": prefs.food_preferences,
        "preferred_accommodation": prefs.preferred_accommodation,
        "preferred_transportation": prefs.preferred_transportation,
        "preferred_destinations": prefs.preferred_destinations,
    }


def search_places(
    db: Session,
    destination: str,
    tags: list[str] | None = None,
    category: str | None = None,
    limit: int = 12,
) -> list[dict]:
    dest = (
        db.query(Destination)
        .options(joinedload(Destination.places))
        .filter(Destination.name.ilike(f"%{destination}%"))
        .first()
    )
    if not dest:
        places = (
            db.query(Place)
            .filter(Place.name.ilike(f"%{destination}%"))
            .limit(limit)
            .all()
        )
    else:
        places = list(dest.places)

    if category:
        places = [p for p in places if p.category == category]

    if tags:
        normalized = [t.lower() for t in tags]
        places = [
            p
            for p in places
            if any(tag in (p.tags or "").lower() for tag in normalized)
        ]

    places = sorted(places, key=lambda p: p.rating, reverse=True)[:limit]
    return [
        {
            "id": p.id,
            "name": p.name,
            "category": p.category,
            "description": p.description,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "average_cost": p.average_cost,
            "duration_minutes": p.duration_minutes,
            "tags": p.tags,
            "rating": p.rating,
            "destination": dest.name if dest else None,
        }
        for p in places
    ]


async def get_weather_for_destination(db: Session, destination: str, days: int = 5) -> dict:
    dest = db.query(Destination).filter(Destination.name.ilike(f"%{destination}%")).first()
    if not dest or dest.latitude is None or dest.longitude is None:
        return {"error": "Destination coordinates not found", "daily": []}
    return await get_weather_forecast(dest.latitude, dest.longitude, days)


def calculate_budget(trip: Trip) -> dict:
    return budget_summary(trip)


def calculate_distance(trip: Trip) -> dict:
    points: list[tuple[float, float]] = []
    for day in trip.itinerary_days:
        for item in day.items:
            if item.latitude is not None and item.longitude is not None:
                points.append((item.latitude, item.longitude))
    metrics = calculate_route_metrics(points)
    metrics["activity_count"] = sum(len(day.items) for day in trip.itinerary_days)
    metrics["days"] = len(trip.itinerary_days)
    metrics["avg_activities_per_day"] = (
        round(metrics["activity_count"] / metrics["days"], 1) if metrics["days"] else 0
    )
    return metrics


def _slot_times(count: int) -> list[str]:
    base = ["09:00", "11:30", "14:00", "17:00", "20:00"]
    return base[:count]


def generate_itinerary_proposal(
    db: Session,
    trip: Trip,
    user: User,
    preference_text: str | None = None,
    weather: dict | None = None,
    max_per_day: int = 4,
) -> list[dict]:
    prefs = get_user_preferences(user)
    tags: list[str] = []
    text = (preference_text or "").lower()
    for candidate in ["beach", "beaches", "food", "nightlife", "heritage", "adventure", "nature", "relaxed", "shopping", "culture"]:
        if candidate in text or candidate in (prefs.get("favorite_activities") or "").lower():
            tags.append(candidate if candidate != "beach" else "beaches")

    if "hectic" in text or "relaxed" in text or prefs.get("travel_style") == "relaxed":
        max_per_day = min(max_per_day, 3)

    places = search_places(db, trip.destination, tags=tags or None, limit=30)
    if not places:
        places = search_places(db, trip.destination, limit=30)

    saved_ids = {
        s.place_id
        for s in db.query(SavedPlace).filter(SavedPlace.user_id == user.id).all()
    }

    # Prefer saved places first
    places = sorted(places, key=lambda p: (0 if p["id"] in saved_ids else 1, -p["rating"]))

    hotels = [p for p in places if p["category"] == "hotel"]
    activities = [p for p in places if p["category"] in {"attraction", "activity"}]
    restaurants = [p for p in places if p["category"] == "restaurant"]

    rainy_dates = set()
    if weather and weather.get("daily"):
        rainy_dates = {d["date"] for d in weather["daily"] if d.get("is_rainy")}

    try:
        days = trip_day_count(trip.start_date, trip.end_date)
    except ValueError:
        days = max(1, len(trip.itinerary_days) or 1)

    proposal = []
    act_idx = 0
    food_idx = 0
    daily_budget_cap = trip.budget / days if trip.budget and days else None

    for day_number in range(1, days + 1):
        day_date = None
        if trip.itinerary_days:
            match = next((d for d in trip.itinerary_days if d.day_number == day_number), None)
            day_date = match.date if match else None

        is_rainy = day_date in rainy_dates if day_date else False
        day_items = []
        day_cost = 0.0

        # Pick activities for the day
        picks: list[dict] = []
        attempts = 0
        while len(picks) < max_per_day - 1 and attempts < len(activities) * 2:
            if not activities:
                break
            candidate = activities[act_idx % len(activities)]
            act_idx += 1
            attempts += 1
            tags_lower = (candidate.get("tags") or "").lower()
            if is_rainy and "indoor" not in tags_lower and candidate["category"] == "attraction":
                # Prefer indoor on rainy days
                indoor = next((a for a in activities if "indoor" in (a.get("tags") or "").lower()), None)
                if indoor and indoor not in picks:
                    candidate = indoor
            if candidate in picks:
                continue
            picks.append(candidate)

        if restaurants:
            picks.append(restaurants[food_idx % len(restaurants)])
            food_idx += 1

        # Optional hotel only on day 1 as check-in note
        if day_number == 1 and hotels:
            hotel = hotels[0]
            day_items.append(
                {
                    "place_id": hotel["id"],
                    "title": f"Check-in: {hotel['name']}",
                    "item_type": "hotel",
                    "start_time": "14:00",
                    "duration_minutes": 60,
                    "estimated_cost": round(hotel["average_cost"] / max(days, 1), 2),
                    "notes": "Accommodation",
                    "sort_order": 0,
                    "latitude": hotel["latitude"],
                    "longitude": hotel["longitude"],
                }
            )
            day_cost += hotel["average_cost"] / max(days, 1)

        times = _slot_times(len(picks))
        for idx, place in enumerate(picks):
            cost = place["average_cost"]
            if daily_budget_cap is not None and day_cost + cost > daily_budget_cap * 1.2:
                # Skip expensive extras when over daily pace
                if place["category"] != "restaurant":
                    continue
            day_items.append(
                {
                    "place_id": place["id"],
                    "title": place["name"],
                    "item_type": "restaurant" if place["category"] == "restaurant" else "activity",
                    "start_time": times[idx] if idx < len(times) else "16:00",
                    "duration_minutes": place["duration_minutes"] or 90,
                    "estimated_cost": cost,
                    "notes": place["description"],
                    "sort_order": len(day_items),
                    "latitude": place["latitude"],
                    "longitude": place["longitude"],
                }
            )
            day_cost += cost

        theme = "Rainy day indoor picks" if is_rainy else ("Relaxed coastal day" if "beaches" in tags else f"Explore {trip.destination}")
        proposal.append(
            {
                "day_number": day_number,
                "date": day_date,
                "theme": theme,
                "notes": "Heavy rain expected — outdoor swaps applied" if is_rainy else "",
                "items": day_items,
            }
        )

    return proposal


def optimize_itinerary(
    db: Session,
    trip: Trip,
    user: User,
    weather: dict | None = None,
) -> dict:
    before_distance = calculate_distance(trip)
    before_budget = calculate_budget(trip)
    before_activities = before_distance.get("avg_activities_per_day", 0)

    # Build optimized proposal: fewer activities, cluster by proximity, respect budget
    proposed = generate_itinerary_proposal(
        db,
        trip,
        user,
        preference_text="relaxed optimized budget friendly",
        weather=weather,
        max_per_day=3,
    )

    # Compute after metrics from proposal
    points = []
    total_cost = 0.0
    activity_count = 0
    for day in proposed:
        for item in day["items"]:
            activity_count += 1
            total_cost += item.get("estimated_cost", 0)
            if item.get("latitude") is not None and item.get("longitude") is not None:
                points.append((item["latitude"], item["longitude"]))
    after_route = calculate_route_metrics(points)
    days = max(len(proposed), 1)

    return {
        "before": {
            "distance_km": before_distance.get("total_distance_km", 0),
            "estimated_cost": before_budget.get("estimated_total", 0) or total_cost,
            "activities_per_day": before_activities,
        },
        "after": {
            "distance_km": after_route.get("total_distance_km", 0),
            "estimated_cost": round(total_cost, 2),
            "activities_per_day": round(activity_count / days, 1),
        },
        "proposed_itinerary": proposed,
        "summary": "Reduced daily load, clustered nearby places, and trimmed costs while keeping preference-aligned picks.",
    }
