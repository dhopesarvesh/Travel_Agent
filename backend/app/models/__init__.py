from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="USER", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)

    preferences = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    trips = relationship("Trip", back_populates="owner", cascade="all, delete-orphan")
    saved_places = relationship("SavedPlace", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    favorite_activities = Column(Text, default="")  # comma-separated
    travel_style = Column(String(100), default="balanced")
    budget_range = Column(String(50), default="medium")
    food_preferences = Column(Text, default="")
    preferred_accommodation = Column(String(100), default="hotel")
    preferred_transportation = Column(String(100), default="mixed")
    preferred_destinations = Column(Text, default="")

    user = relationship("User", back_populates="preferences")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False, index=True)
    start_date = Column(String(20), nullable=False)
    end_date = Column(String(20), nullable=False)
    travelers = Column(Integer, default=1)
    budget = Column(Float, default=0.0)
    status = Column(String(50), default="draft")  # draft | planned | active | completed
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    owner = relationship("User", back_populates="trips")
    itinerary_days = relationship(
        "ItineraryDay",
        back_populates="trip",
        cascade="all, delete-orphan",
        order_by="ItineraryDay.day_number",
    )
    expenses = relationship("Expense", back_populates="trip", cascade="all, delete-orphan")
    trip_travelers = relationship("TripTraveler", back_populates="trip", cascade="all, delete-orphan")


class TripTraveler(Base):
    __tablename__ = "trip_travelers"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=True)
    notes = Column(String(255), default="")

    trip = relationship("Trip", back_populates="trip_travelers")


class ItineraryDay(Base):
    __tablename__ = "itinerary_days"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False, index=True)
    day_number = Column(Integer, nullable=False)
    date = Column(String(20), nullable=True)
    theme = Column(String(255), default="")
    notes = Column(Text, default="")

    trip = relationship("Trip", back_populates="itinerary_days")
    items = relationship(
        "ItineraryItem",
        back_populates="day",
        cascade="all, delete-orphan",
        order_by="ItineraryItem.sort_order",
    )


class ItineraryItem(Base):
    __tablename__ = "itinerary_items"

    id = Column(Integer, primary_key=True, index=True)
    day_id = Column(Integer, ForeignKey("itinerary_days.id"), nullable=False, index=True)
    place_id = Column(Integer, ForeignKey("places.id"), nullable=True)
    title = Column(String(255), nullable=False)
    item_type = Column(String(50), default="activity")  # activity | restaurant | hotel | transport
    start_time = Column(String(10), default="09:00")
    duration_minutes = Column(Integer, default=60)
    estimated_cost = Column(Float, default=0.0)
    notes = Column(Text, default="")
    sort_order = Column(Integer, default=0)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    day = relationship("ItineraryDay", back_populates="items")
    place = relationship("Place")


class Destination(Base):
    __tablename__ = "destinations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    country = Column(String(100), default="India")
    description = Column(Text, default="")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    best_season = Column(String(100), default="")
    average_daily_budget = Column(Float, default=3000.0)

    places = relationship("Place", back_populates="destination", cascade="all, delete-orphan")


class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)
    destination_id = Column(Integer, ForeignKey("destinations.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(50), default="attraction")  # attraction | restaurant | hotel | activity
    description = Column(Text, default="")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    average_cost = Column(Float, default=0.0)
    duration_minutes = Column(Integer, default=90)
    tags = Column(Text, default="")  # beaches,food,nightlife
    rating = Column(Float, default=4.0)

    destination = relationship("Destination", back_populates="places")


class SavedPlace(Base):
    __tablename__ = "saved_places"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    place_id = Column(Integer, ForeignKey("places.id"), nullable=False)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="saved_places")
    place = relationship("Place")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False, index=True)
    category = Column(String(50), nullable=False)  # accommodation | food | transport | activities | miscellaneous
    title = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    is_estimated = Column(Boolean, default=False)
    spent_on = Column(String(20), nullable=True)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=utcnow)

    trip = relationship("Trip", back_populates="expenses")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="notifications")
