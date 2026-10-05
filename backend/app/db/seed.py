import copy
from app.core.security import hash_password
from app.db.database import SessionLocal
from app.models import Destination, Expense, ItineraryDay, ItineraryItem, Place, Trip, TripTraveler, User, UserPreference


DESTINATIONS_DATA = [
    {
        "name": "Goa",
        "country": "India",
        "description": "Beaches, nightlife, Portuguese heritage and seafood.",
        "latitude": 15.2993,
        "longitude": 74.1240,
        "best_season": "Nov–Mar",
        "average_daily_budget": 3500.0,
        "places": [
            {"name": "Baga Beach", "category": "attraction", "description": "Popular beach with water sports.", "latitude": 15.5553, "longitude": 73.7517, "average_cost": 500, "duration_minutes": 180, "tags": "beaches,nightlife", "rating": 4.4},
            {"name": "Calangute Beach", "category": "attraction", "description": "Queen of beaches — lively and scenic.", "latitude": 15.5439, "longitude": 73.7554, "average_cost": 300, "duration_minutes": 150, "tags": "beaches", "rating": 4.3},
            {"name": "Fort Aguada", "category": "attraction", "description": "17th-century Portuguese fort with sea views.", "latitude": 15.4922, "longitude": 73.7735, "average_cost": 100, "duration_minutes": 90, "tags": "heritage,views", "rating": 4.5},
            {"name": "Anjuna Flea Market", "category": "activity", "description": "Weekly market with crafts and street food.", "latitude": 15.5752, "longitude": 73.7405, "average_cost": 800, "duration_minutes": 120, "tags": "shopping,food", "rating": 4.2},
            {"name": "Thalassa", "category": "restaurant", "description": "Greek restaurant with cliff-side sunset views.", "latitude": 15.6025, "longitude": 73.7368, "average_cost": 1800, "duration_minutes": 90, "tags": "food,nightlife", "rating": 4.6},
            {"name": "Gunpowder", "category": "restaurant", "description": "South Indian coastal cuisine.", "latitude": 15.5950, "longitude": 73.7450, "average_cost": 1200, "duration_minutes": 75, "tags": "food", "rating": 4.5},
            {"name": "Club Cubana", "category": "activity", "description": "Hilltop nightclub popular with travellers.", "latitude": 15.5758, "longitude": 73.7409, "average_cost": 1500, "duration_minutes": 180, "tags": "nightlife", "rating": 4.1},
            {"name": "Dudhsagar Falls", "category": "attraction", "description": "Majestic four-tiered waterfall trek.", "latitude": 15.3144, "longitude": 74.3145, "average_cost": 2000, "duration_minutes": 360, "tags": "nature,adventure", "rating": 4.7},
            {"name": "Old Goa Churches", "category": "attraction", "description": "UNESCO heritage churches in Old Goa.", "latitude": 15.5009, "longitude": 73.9116, "average_cost": 0, "duration_minutes": 120, "tags": "heritage", "rating": 4.6},
            {"name": "Spice Plantation Tour", "category": "activity", "description": "Guided tour with lunch at a spice farm.", "latitude": 15.4000, "longitude": 74.0200, "average_cost": 900, "duration_minutes": 180, "tags": "food,nature", "rating": 4.3},
            {"name": "Taj Fort Aguada Resort", "category": "hotel", "description": "Luxury beachfront resort.", "latitude": 15.4950, "longitude": 73.7680, "average_cost": 12000, "duration_minutes": 0, "tags": "accommodation,luxury", "rating": 4.8},
            {"name": "Zostel Goa", "category": "hotel", "description": "Budget-friendly hostel for backpackers.", "latitude": 15.5500, "longitude": 73.7600, "average_cost": 1200, "duration_minutes": 0, "tags": "accommodation,budget", "rating": 4.2},
            {"name": "Casino Cruise", "category": "activity", "description": "Evening casino experience on Mandovi river.", "latitude": 15.4989, "longitude": 73.8280, "average_cost": 2500, "duration_minutes": 180, "tags": "nightlife", "rating": 4.0},
            {"name": "Palolem Beach", "category": "attraction", "description": "Quiet crescent beach in South Goa.", "latitude": 15.0100, "longitude": 74.0230, "average_cost": 400, "duration_minutes": 240, "tags": "beaches,relaxed", "rating": 4.7},
            {"name": "Indoor Art Cafe", "category": "restaurant", "description": "Cozy cafe — good rainy-day option.", "latitude": 15.5400, "longitude": 73.7650, "average_cost": 700, "duration_minutes": 60, "tags": "food,indoor", "rating": 4.4},
            {"name": "Museum of Goa", "category": "attraction", "description": "Contemporary art museum — indoor.", "latitude": 15.5250, "longitude": 73.8300, "average_cost": 200, "duration_minutes": 90, "tags": "culture,indoor", "rating": 4.3},
        ],
    },
    {
        "name": "Manali",
        "country": "India",
        "description": "Himalayan hill station with adventure sports and snow views.",
        "latitude": 32.2396,
        "longitude": 77.1887,
        "best_season": "Mar–Jun, Oct–Feb",
        "average_daily_budget": 3000.0,
        "places": [
            {"name": "Hadimba Temple", "category": "attraction", "description": "Ancient wooden temple in cedar forest.", "latitude": 32.2664, "longitude": 77.1873, "average_cost": 50, "duration_minutes": 60, "tags": "heritage,nature", "rating": 4.5},
            {"name": "Solang Valley", "category": "activity", "description": "Paragliding, skiing and adventure sports.", "latitude": 32.3160, "longitude": 77.1570, "average_cost": 2500, "duration_minutes": 240, "tags": "adventure", "rating": 4.6},
            {"name": "Old Manali Cafe Street", "category": "restaurant", "description": "Hip cafes and backpacker food scene.", "latitude": 32.2500, "longitude": 77.1800, "average_cost": 600, "duration_minutes": 90, "tags": "food", "rating": 4.4},
            {"name": "Rohtang Pass", "category": "attraction", "description": "High mountain pass with snow views.", "latitude": 32.3725, "longitude": 77.2481, "average_cost": 3000, "duration_minutes": 360, "tags": "nature,adventure", "rating": 4.7},
            {"name": "Jogini Falls", "category": "attraction", "description": "Short trek to a scenic waterfall.", "latitude": 32.2700, "longitude": 77.2100, "average_cost": 0, "duration_minutes": 180, "tags": "nature,relaxed", "rating": 4.3},
            {"name": "The Himalayan", "category": "hotel", "description": "Boutique hotel with mountain views.", "latitude": 32.2450, "longitude": 77.1900, "average_cost": 5000, "duration_minutes": 0, "tags": "accommodation", "rating": 4.5},
            {"name": "Mall Road", "category": "activity", "description": "Shopping and evening stroll.", "latitude": 32.2430, "longitude": 77.1890, "average_cost": 500, "duration_minutes": 120, "tags": "shopping,nightlife", "rating": 4.2},
            {"name": "Cafe 1947", "category": "restaurant", "description": "Riverside dining with live music.", "latitude": 32.2520, "longitude": 77.1780, "average_cost": 1000, "duration_minutes": 90, "tags": "food,nightlife", "rating": 4.5},
        ],
    },
    {
        "name": "Jaipur",
        "country": "India",
        "description": "Pink City — forts, palaces, bazaars and Rajasthani food.",
        "latitude": 26.9124,
        "longitude": 75.7873,
        "best_season": "Oct–Mar",
        "average_daily_budget": 2800.0,
        "places": [
            {"name": "Amber Fort", "category": "attraction", "description": "Hilltop fort with stunning architecture.", "latitude": 26.9855, "longitude": 75.8513, "average_cost": 500, "duration_minutes": 180, "tags": "heritage", "rating": 4.8},
            {"name": "City Palace", "category": "attraction", "description": "Royal residence in the heart of Jaipur.", "latitude": 26.9258, "longitude": 75.8236, "average_cost": 700, "duration_minutes": 120, "tags": "heritage", "rating": 4.6},
            {"name": "Hawa Mahal", "category": "attraction", "description": "Iconic Palace of Winds facade.", "latitude": 26.9239, "longitude": 75.8267, "average_cost": 200, "duration_minutes": 45, "tags": "heritage", "rating": 4.4},
            {"name": "Johari Bazaar", "category": "activity", "description": "Jewellery and textile shopping.", "latitude": 26.9240, "longitude": 75.8250, "average_cost": 1500, "duration_minutes": 120, "tags": "shopping", "rating": 4.3},
            {"name": "Laxmi Misthan Bhandar", "category": "restaurant", "description": "Famous for Rajasthani sweets and thali.", "latitude": 26.9200, "longitude": 75.8255, "average_cost": 400, "duration_minutes": 60, "tags": "food", "rating": 4.5},
            {"name": "Chokhi Dhani", "category": "activity", "description": "Cultural village dinner experience.", "latitude": 26.7660, "longitude": 75.8350, "average_cost": 1500, "duration_minutes": 180, "tags": "food,culture,nightlife", "rating": 4.4},
            {"name": "Albert Hall Museum", "category": "attraction", "description": "Indo-Saracenic museum — great indoor option.", "latitude": 26.9117, "longitude": 75.8195, "average_cost": 300, "duration_minutes": 90, "tags": "culture,indoor", "rating": 4.5},
            {"name": "Hotel Pearl Palace", "category": "hotel", "description": "Popular mid-range heritage-style hotel.", "latitude": 26.9150, "longitude": 75.8100, "average_cost": 2500, "duration_minutes": 0, "tags": "accommodation", "rating": 4.6},
        ],
    },
]

SEED_DATA = DESTINATIONS_DATA


def seed_destinations_and_places() -> None:
    db = SessionLocal()
    try:
        # Seed destinations if empty
        if db.query(Destination).count() == 0:
            for item in DESTINATIONS_DATA:
                dest_copy = copy.deepcopy(item)
                places = dest_copy.pop("places", [])
                destination = Destination(**dest_copy)
                db.add(destination)
                db.flush()
                for place in places:
                    db.add(Place(destination_id=destination.id, **place))
            db.commit()

        # Seed demo user
        demo_user = db.query(User).filter(User.email == "traveler@example.com").first()
        if not demo_user:
            demo_user = User(
                email="traveler@example.com",
                full_name="Demo Traveler",
                hashed_password=hash_password("securepassword123"),
                role="USER",
            )
            db.add(demo_user)
            db.flush()
            db.add(
                UserPreference(
                    user_id=demo_user.id,
                    favorite_activities="beaches, nightlife, food, heritage",
                    travel_style="balanced",
                    budget_range="medium",
                    food_preferences="Seafood, local cuisines, beach cafes",
                    preferred_accommodation="hotel",
                    preferred_transportation="mixed",
                    preferred_destinations="Goa, Manali, Jaipur",
                )
            )
            db.commit()
            db.refresh(demo_user)
        else:
            # Ensure preferences exist
            if not demo_user.preferences:
                db.add(
                    UserPreference(
                        user_id=demo_user.id,
                        favorite_activities="beaches, nightlife, food, heritage",
                        travel_style="balanced",
                        budget_range="medium",
                        food_preferences="Seafood, local cuisines, beach cafes",
                        preferred_accommodation="hotel",
                        preferred_transportation="mixed",
                        preferred_destinations="Goa, Manali, Jaipur",
                    )
                )
                db.commit()

        # Seed admin user
        admin_user = db.query(User).filter(User.email == "admin@travel.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@travel.com",
                full_name="Admin Supervisor",
                hashed_password=hash_password("adminpassword123"),
                role="ADMIN",
            )
            db.add(admin_user)
            db.flush()
            db.add(
                UserPreference(
                    user_id=admin_user.id,
                    favorite_activities="nature, heritage, food",
                    travel_style="luxury",
                    budget_range="luxury",
                    food_preferences="Fine dining",
                    preferred_accommodation="hotel",
                    preferred_transportation="cab",
                    preferred_destinations="Goa, Jaipur",
                )
            )
            db.commit()

        # Seed a sample trip for demo user if none exists
        if demo_user and db.query(Trip).filter(Trip.user_id == demo_user.id).count() == 0:
            trip = Trip(
                user_id=demo_user.id,
                title="Goa Sun & Heritage Getaway",
                destination="Goa",
                start_date="2026-11-10",
                end_date="2026-11-13",
                travelers=2,
                budget=25000.0,
                status="planned",
                notes="Relaxed coastal trip with Portuguese heritage, beach sunset and seafood.",
            )
            db.add(trip)
            db.flush()

            db.add(TripTraveler(trip_id=trip.id, name="Demo Traveler", age=28, notes="Trip Lead"))
            db.add(TripTraveler(trip_id=trip.id, name="Travel Partner", age=27, notes="Companion"))

            # Days
            day1 = ItineraryDay(trip_id=trip.id, day_number=1, date="2026-11-10", theme="Arrival & North Goa Beaches")
            day2 = ItineraryDay(trip_id=trip.id, day_number=2, date="2026-11-11", theme="Heritage Forts & Sunset Dining")
            day3 = ItineraryDay(trip_id=trip.id, day_number=3, date="2026-11-12", theme="Nature Waterfall & Spice Plantation")
            day4 = ItineraryDay(trip_id=trip.id, day_number=4, date="2026-11-13", theme="Relaxed South Goa & Departure")
            db.add_all([day1, day2, day3, day4])
            db.flush()

            # Items for Day 1
            db.add(ItineraryItem(day_id=day1.id, title="Check-in: Zostel Goa", item_type="hotel", start_time="12:00", duration_minutes=60, estimated_cost=1200.0, notes="Drop luggage and check in", sort_order=0, latitude=15.5500, longitude=73.7600))
            db.add(ItineraryItem(day_id=day1.id, title="Baga Beach", item_type="activity", start_time="14:00", duration_minutes=180, estimated_cost=500.0, notes="Beach relaxation and water sports", sort_order=1, latitude=15.5553, longitude=73.7517))
            db.add(ItineraryItem(day_id=day1.id, title="Thalassa", item_type="restaurant", start_time="19:00", duration_minutes=90, estimated_cost=1800.0, notes="Sunset Greek dinner", sort_order=2, latitude=15.6025, longitude=73.7368))

            # Items for Day 2
            db.add(ItineraryItem(day_id=day2.id, title="Fort Aguada", item_type="activity", start_time="09:30", duration_minutes=90, estimated_cost=100.0, notes="17th-century fort sea views", sort_order=0, latitude=15.4922, longitude=73.7735))
            db.add(ItineraryItem(day_id=day2.id, title="Gunpowder", item_type="restaurant", start_time="13:00", duration_minutes=75, estimated_cost=1200.0, notes="South Indian coastal lunch", sort_order=1, latitude=15.5950, longitude=73.7450))
            db.add(ItineraryItem(day_id=day2.id, title="Anjuna Flea Market", item_type="activity", start_time="16:00", duration_minutes=120, estimated_cost=800.0, notes="Shopping and souvenirs", sort_order=2, latitude=15.5752, longitude=73.7405))

            # Expenses
            db.add(Expense(trip_id=trip.id, category="accommodation", title="Hotel Booking (3 nights)", amount=3600.0, is_estimated=False, spent_on="2026-11-10", notes="Pre-booked stay"))
            db.add(Expense(trip_id=trip.id, category="transport", title="Airport Taxi (Round trip)", amount=2200.0, is_estimated=False, spent_on="2026-11-10", notes="Cab transfer"))
            db.add(Expense(trip_id=trip.id, category="activities", title="Water Sports pass", amount=1500.0, is_estimated=True, notes="Jet ski and parasailing"))

            db.commit()

    finally:
        db.close()
