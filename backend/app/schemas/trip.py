from pydantic import BaseModel
from datetime import date, datetime
from typing import Literal
from app.schemas.user import UserResponse


TravelType = Literal["solo", "couple", "friends", "family"]
BudgetRange = Literal["budget", "moderate", "luxury"]
ActivityPreference = Literal["adventure", "relaxation", "culture", "food", "nature", "nightlife"]
MemberRole = Literal["owner", "editor", "viewer"]
MemberStatus = Literal["pending", "accepted", "declined"]


class TripPreferences(BaseModel):
    travel_type: TravelType
    destination: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    budget_range: BudgetRange
    activities: list[ActivityPreference] = []
    num_travelers: int = 1
    special_requirements: str | None = None


class TripCreate(BaseModel):
    name: str
    description: str | None = None
    destination: str
    start_date: date
    end_date: date
    preferences: TripPreferences


class TripUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    destination: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    preferences: TripPreferences | None = None


class TripResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    destination: str
    start_date: date
    end_date: date
    preferences: dict
    share_code: str
    owner_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TripMemberCreate(BaseModel):
    user_id: str
    role: MemberRole = "viewer"


class TripMemberUpdate(BaseModel):
    role: MemberRole | None = None
    status: MemberStatus | None = None
    tickets_confirmed: bool | None = None


class TripMemberResponse(BaseModel):
    id: str
    trip_id: str
    user_id: str
    user: UserResponse
    role: str
    status: str
    tickets_confirmed: bool
    joined_at: datetime

    class Config:
        from_attributes = True
