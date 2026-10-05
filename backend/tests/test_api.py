import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.db.database import Base, get_db
from app.main import app

# In-memory SQLite for fast isolated testing
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True, scope="module")
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    from app.db.seed import DESTINATIONS_DATA
    from app.models import Destination, Place, User, UserPreference
    from app.core.security import hash_password

    # Seed destinations & places
    for dest in DESTINATIONS_DATA:
        dest_copy = dict(dest)
        places = dest_copy.pop("places")
        destination = Destination(**dest_copy)
        db.add(destination)
        db.flush()
        for p in places:
            db.add(Place(destination_id=destination.id, **p))

    # Seed an admin user for RBAC tests
    admin = User(
        email="admin@travel.com",
        full_name="Admin Supervisor",
        hashed_password=hash_password("adminpassword123"),
        role="ADMIN",
    )
    db.add(admin)
    db.flush()
    db.add(UserPreference(user_id=admin.id))
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "healthy", "database": "connected"}


def test_auth_and_user_flow(client):
    # Register
    reg_payload = {
        "email": "traveler@example.com",
        "full_name": "Alex Rover",
        "password": "securepassword123",
    }
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 201
    user_data = res.json()
    assert user_data["email"] == "traveler@example.com"

    # Duplicate register should fail
    res_dup = client.post("/api/auth/register", json=reg_payload)
    assert res_dup.status_code == 400

    # Login
    login_payload = {
        "email": "traveler@example.com",
        "password": "securepassword123",
    }
    res = client.post("/api/auth/login", json=login_payload)
    assert res.status_code == 200
    tokens = res.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]

    # Refresh
    res_ref = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert res_ref.status_code == 200
    assert "access_token" in res_ref.json()

    headers = {"Authorization": f"Bearer {access_token}"}

    # Get Me
    res_me = client.get("/api/users/me", headers=headers)
    assert res_me.status_code == 200
    assert res_me.json()["email"] == "traveler@example.com"

    # User Preferences update
    pref_payload = {
        "favorite_activities": "beaches,nightlife,food",
        "travel_style": "relaxed",
        "budget_range": "medium",
        "preferred_accommodation": "resort",
    }
    res_pref = client.put("/api/users/me/preferences", json=pref_payload, headers=headers)
    assert res_pref.status_code == 200
    assert res_pref.json()["travel_style"] == "relaxed"


def test_destinations_places_and_weather(client):
    # List destinations
    res_d = client.get("/api/destinations")
    assert res_d.status_code == 200
    dests = res_d.json()
    assert len(dests) >= 3
    goa_id = dests[0]["id"]

    # Get single destination
    res_single = client.get(f"/api/destinations/{goa_id}")
    assert res_single.status_code == 200
    assert res_single.json()["name"] == dests[0]["name"]

    # List places with query & category filter
    res_p = client.get("/api/places?destination=Goa&category=attraction")
    assert res_p.status_code == 200
    places = res_p.json()
    assert len(places) > 0
    assert places[0]["category"] == "attraction"

    # Direct Weather endpoint
    res_w = client.get("/api/weather?destination=Goa&days=5")
    assert res_w.status_code == 200
    weather = res_w.json()
    assert "daily" in weather

    # Destination weather endpoint
    res_dw = client.get(f"/api/destinations/{goa_id}/weather?days=4")
    assert res_dw.status_code == 200
    assert "daily" in res_dw.json()


def test_saved_places_flow(client):
    # Login
    res = client.post(
        "/api/auth/login",
        json={"email": "traveler@example.com", "password": "securepassword123"},
    )
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    # Get a place ID
    places_res = client.get("/api/places?destination=Goa")
    place_id = places_res.json()[0]["id"]

    # Save Place
    save_res = client.post("/api/saved-places", json={"place_id": place_id, "notes": "Must visit at sunset"}, headers=headers)
    assert save_res.status_code == 201
    saved_data = save_res.json()
    saved_id = saved_data["id"]
    assert saved_data["place_id"] == place_id

    # List saved places
    list_saved = client.get("/api/saved-places", headers=headers)
    assert list_saved.status_code == 200
    assert len(list_saved.json()) >= 1

    # Unsave place
    del_res = client.delete(f"/api/saved-places/{saved_id}", headers=headers)
    assert del_res.status_code == 204


def test_trip_and_itinerary_and_agent(client):
    # Auth user
    res = client.post(
        "/api/auth/login",
        json={"email": "traveler@example.com", "password": "securepassword123"},
    )
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    # Create Trip
    trip_payload = {
        "title": "Goa Beach Getaway",
        "destination": "Goa",
        "start_date": "2026-11-10",
        "end_date": "2026-11-14",
        "travelers": 2,
        "budget": 25000,
        "notes": "Looking forward to sunsets and coastal cuisine",
        "trip_travelers": [{"name": "Alex", "age": 28}, {"name": "Sam", "age": 27}],
    }
    res_trip = client.post("/api/trips", json=trip_payload, headers=headers)
    assert res_trip.status_code == 201
    trip = res_trip.json()
    trip_id = trip["id"]
    assert len(trip["itinerary_days"]) == 5  # Nov 10 to 14 inclusive = 5 days

    # Update day details
    first_day_id = trip["itinerary_days"][0]["id"]
    res_day_up = client.put(f"/api/itinerary/days/{first_day_id}", json={"theme": "Arrival & Beach Shacks"}, headers=headers)
    assert res_day_up.status_code == 200
    assert res_day_up.json()["theme"] == "Arrival & Beach Shacks"

    # Add custom Itinerary item
    item_payload = {
        "title": "Welcome Sunset Cocktails",
        "item_type": "restaurant",
        "start_time": "18:00",
        "duration_minutes": 90,
        "estimated_cost": 1500,
        "notes": "Reserve sea-facing table",
    }
    res_item = client.post(f"/api/trips/{trip_id}/itinerary/days/1/items", json=item_payload, headers=headers)
    assert res_item.status_code == 201
    item_id = res_item.json()["id"]

    # Update item
    res_up_item = client.put(f"/api/itinerary/items/{item_id}", json={"estimated_cost": 1800}, headers=headers)
    assert res_up_item.status_code == 200
    assert res_up_item.json()["estimated_cost"] == 1800

    # AI Agent - Plan Trip
    res_plan = client.post(
        "/api/agent/plan-trip",
        json={"trip_id": trip_id, "preferences_text": "I like beaches, food and nightlife with relaxed schedule"},
        headers=headers,
    )
    assert res_plan.status_code == 200
    plan_data = res_plan.json()
    assert "reply" in plan_data
    assert plan_data["requires_approval"] is True
    assert plan_data["proposed_itinerary"] is not None
    assert len(plan_data["tool_calls"]) > 0

    # Apply Proposed Itinerary
    res_apply = client.post(
        f"/api/agent/apply-itinerary/{trip_id}",
        json=plan_data["proposed_itinerary"],
        headers=headers,
    )
    assert res_apply.status_code == 200
    updated_trip = res_apply.json()
    assert len(updated_trip["itinerary_days"][0]["items"]) > 0

    # AI Agent - Optimize Trip
    res_opt = client.post(
        "/api/agent/optimize-trip",
        json={"trip_id": trip_id},
        headers=headers,
    )
    assert res_opt.status_code == 200
    opt_data = res_opt.json()
    assert opt_data["optimization"] is not None
    assert "before" in opt_data["optimization"]
    assert "after" in opt_data["optimization"]

    # AI Agent - Chat about general destination
    res_gen_chat = client.post(
        "/api/agent/chat",
        json={"message": "What places do you recommend in Manali?"},
        headers=headers,
    )
    assert res_gen_chat.status_code == 200
    assert "Manali" in res_gen_chat.json()["reply"]

    # Expenses and Budget Tracking
    exp_payload = {
        "category": "food",
        "title": "Dinner at Thalassa",
        "amount": 2400.0,
        "is_estimated": False,
        "spent_on": "2026-11-10",
        "notes": "Great sunset view",
    }
    res_exp = client.post(f"/api/trips/{trip_id}/expenses", json=exp_payload, headers=headers)
    assert res_exp.status_code == 201
    exp_id = res_exp.json()["id"]

    res_budget = client.get(f"/api/trips/{trip_id}/budget", headers=headers)
    assert res_budget.status_code == 200
    budget_data = res_budget.json()
    assert budget_data["actual_total"] == 2400.0
    assert budget_data["trip_budget"] == 25000.0

    # Delete expense
    res_del_exp = client.delete(f"/api/expenses/{exp_id}", headers=headers)
    assert res_del_exp.status_code == 204

    # Duplicate trip
    res_dup_trip = client.post(f"/api/trips/{trip_id}/duplicate", headers=headers)
    assert res_dup_trip.status_code == 200
    dup_trip = res_dup_trip.json()
    assert dup_trip["title"] == "Goa Beach Getaway (Copy)"


def test_admin_and_rbac(client):
    # Regular user trying to access admin route should get 403
    res_user = client.post(
        "/api/auth/login",
        json={"email": "traveler@example.com", "password": "securepassword123"},
    )
    user_headers = {"Authorization": f"Bearer {res_user.json()['access_token']}"}
    res_forbidden = client.get("/api/admin/destinations", headers=user_headers)
    assert res_forbidden.status_code == 403

    # Admin login
    res_admin = client.post(
        "/api/auth/login",
        json={"email": "admin@travel.com", "password": "adminpassword123"},
    )
    assert res_admin.status_code == 200
    admin_headers = {"Authorization": f"Bearer {res_admin.json()['access_token']}"}

    # Admin stats
    res_stats = client.get("/api/admin/stats", headers=admin_headers)
    assert res_stats.status_code == 200
    stats = res_stats.json()
    assert stats["total_users"] >= 2
    assert stats["total_destinations"] >= 3

    # Admin Create Destination
    new_dest_payload = {
        "name": "Kerala",
        "country": "India",
        "description": "God's Own Country with serene backwaters",
        "best_season": "Sep–Mar",
        "average_daily_budget": 3200,
    }
    res_new_dest = client.post("/api/admin/destinations", json=new_dest_payload, headers=admin_headers)
    assert res_new_dest.status_code == 201
    kerala_id = res_new_dest.json()["id"]

    # Admin Create Place in Kerala
    new_place_payload = {
        "destination_id": kerala_id,
        "name": "Alleppey Backwaters Cruise",
        "category": "activity",
        "description": "Houseboat ride on tranquil waters",
        "average_cost": 4500,
        "duration_minutes": 300,
        "tags": "nature,relaxation",
        "rating": 4.8,
    }
    res_new_place = client.post("/api/admin/places", json=new_place_payload, headers=admin_headers)
    assert res_new_place.status_code == 201
    place_id = res_new_place.json()["id"]

    # Admin Delete Place
    res_del_p = client.delete(f"/api/admin/places/{place_id}", headers=admin_headers)
    assert res_del_p.status_code == 204

    # Admin Delete Destination
    res_del_d = client.delete(f"/api/admin/destinations/{kerala_id}", headers=admin_headers)
    assert res_del_d.status_code == 204
