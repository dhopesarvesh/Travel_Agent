from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


class UserRegister(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPreferenceUpdate(BaseModel):
    favorite_activities: str | None = None
    travel_style: str | None = None
    budget_range: str | None = None
    food_preferences: str | None = None
    preferred_accommodation: str | None = None
    preferred_transportation: str | None = None
    preferred_destinations: str | None = None


class UserPreferenceOut(BaseModel):
    favorite_activities: str
    travel_style: str
    budget_range: str
    food_preferences: str
    preferred_accommodation: str
    preferred_transportation: str
    preferred_destinations: str

    model_config = {"from_attributes": True}


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    preferences: UserPreferenceOut | None = None

    model_config = {"from_attributes": True}


class TravelerCreate(BaseModel):
    name: str
    age: int | None = None
    notes: str = ""


class TravelerOut(TravelerCreate):
    id: int

    model_config = {"from_attributes": True}


class TripCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    destination: str = Field(min_length=2, max_length=255)
    start_date: str
    end_date: str
    travelers: int = Field(default=1, ge=1, le=50)
    budget: float = Field(default=0, ge=0)
    notes: str = ""
    trip_travelers: list[TravelerCreate] = []


class TripUpdate(BaseModel):
    title: str | None = None
    destination: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    travelers: int | None = Field(default=None, ge=1, le=50)
    budget: float | None = Field(default=None, ge=0)
    status: str | None = None
    notes: str | None = None


class ItineraryItemCreate(BaseModel):
    title: str
    item_type: str = "activity"
    start_time: str = "09:00"
    duration_minutes: int = 60
    estimated_cost: float = 0
    notes: str = ""
    sort_order: int = 0
    place_id: int | None = None
    latitude: float | None = None
    longitude: float | None = None


class ItineraryItemUpdate(BaseModel):
    title: str | None = None
    item_type: str | None = None
    start_time: str | None = None
    duration_minutes: int | None = None
    estimated_cost: float | None = None
    notes: str | None = None
    sort_order: int | None = None
    place_id: int | None = None
    latitude: float | None = None
    longitude: float | None = None


class ItineraryDayUpdate(BaseModel):
    theme: str | None = None
    notes: str | None = None
    date: str | None = None


class ItineraryItemOut(BaseModel):
    id: int
    title: str
    item_type: str
    start_time: str
    duration_minutes: int
    estimated_cost: float
    notes: str
    sort_order: int
    place_id: int | None
    latitude: float | None
    longitude: float | None

    model_config = {"from_attributes": True}


class ItineraryDayOut(BaseModel):
    id: int
    day_number: int
    date: str | None
    theme: str
    notes: str
    items: list[ItineraryItemOut] = []

    model_config = {"from_attributes": True}


class TripOut(BaseModel):
    id: int
    title: str
    destination: str
    start_date: str
    end_date: str
    travelers: int
    budget: float
    status: str
    notes: str
    created_at: datetime
    updated_at: datetime
    trip_travelers: list[TravelerOut] = []
    itinerary_days: list[ItineraryDayOut] = []

    model_config = {"from_attributes": True}


class TripSummary(BaseModel):
    id: int
    title: str
    destination: str
    start_date: str
    end_date: str
    travelers: int
    budget: float
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PlaceCreate(BaseModel):
    destination_id: int
    name: str
    category: str = "attraction"
    description: str = ""
    latitude: float | None = None
    longitude: float | None = None
    average_cost: float = 0.0
    duration_minutes: int = 90
    tags: str = ""
    rating: float = 4.0


class PlaceOut(BaseModel):
    id: int
    destination_id: int
    name: str
    category: str
    description: str
    latitude: float | None
    longitude: float | None
    average_cost: float
    duration_minutes: int
    tags: str
    rating: float

    model_config = {"from_attributes": True}


class DestinationCreate(BaseModel):
    name: str
    country: str = "India"
    description: str = ""
    latitude: float | None = None
    longitude: float | None = None
    best_season: str = ""
    average_daily_budget: float = 3000.0


class DestinationOut(BaseModel):
    id: int
    name: str
    country: str
    description: str
    latitude: float | None
    longitude: float | None
    best_season: str
    average_daily_budget: float
    places: list[PlaceOut] = []

    model_config = {"from_attributes": True}


class ExpenseCreate(BaseModel):
    category: Literal["accommodation", "food", "transport", "activities", "miscellaneous"]
    title: str
    amount: float = Field(gt=0)
    is_estimated: bool = False
    spent_on: str | None = None
    notes: str = ""


class ExpenseOut(BaseModel):
    id: int
    category: str
    title: str
    amount: float
    is_estimated: bool
    spent_on: str | None
    notes: str
    created_at: datetime

    model_config = {"from_attributes": True}


class BudgetSummary(BaseModel):
    trip_budget: float
    estimated_total: float
    actual_total: float
    remaining: float
    by_category: dict[str, dict[str, float]]
    is_over_budget: bool


class SavedPlaceCreate(BaseModel):
    place_id: int
    notes: str = ""


class SavedPlaceOut(BaseModel):
    id: int
    place_id: int
    notes: str
    place: PlaceOut

    model_config = {"from_attributes": True}


class AgentChatRequest(BaseModel):
    message: str
    trip_id: int | None = None


class AgentPlanRequest(BaseModel):
    trip_id: int
    preferences_text: str | None = None


class AgentOptimizeRequest(BaseModel):
    trip_id: int


class AgentToolCall(BaseModel):
    name: str
    arguments: dict = {}
    result: dict | list | str | int | float | bool | None = None


class AgentResponse(BaseModel):
    reply: str
    tool_calls: list[AgentToolCall] = []
    proposed_itinerary: list[dict] | None = None
    optimization: dict | None = None
    requires_approval: bool = False


class ReorderItemsRequest(BaseModel):
    item_ids: list[int]


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminStatsOut(BaseModel):
    total_users: int
    total_trips: int
    total_destinations: int
    total_places: int
    total_expenses: int


class AdminUserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    trip_count: int = 0

    model_config = {"from_attributes": True}


class AdminTripOut(BaseModel):
    id: int
    title: str
    destination: str
    start_date: str
    end_date: str
    travelers: int
    budget: float
    status: str
    created_at: datetime
    user_email: str = ""
    user_name: str = ""
    total_expenses: float = 0.0

    model_config = {"from_attributes": True}
