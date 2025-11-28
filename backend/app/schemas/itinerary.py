from pydantic import BaseModel
from datetime import datetime
from typing import Literal


ItineraryItemType = Literal["flight", "hotel", "experience", "restaurant", "transport"]


class ItineraryItemCreate(BaseModel):
    type: ItineraryItemType
    title: str
    description: str | None = None
    location: str | None = None
    start_time: datetime
    end_time: datetime | None = None
    price: float | None = None
    currency: str | None = "USD"
    booking_url: str | None = None
    booking_confirmed: bool = False
    notes: str | None = None
    order: int = 0


class ItineraryItemUpdate(BaseModel):
    type: ItineraryItemType | None = None
    title: str | None = None
    description: str | None = None
    location: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    price: float | None = None
    currency: str | None = None
    booking_url: str | None = None
    booking_confirmed: bool | None = None
    notes: str | None = None
    order: int | None = None


class ItineraryItemResponse(BaseModel):
    id: str
    trip_id: str
    type: str
    title: str
    description: str | None = None
    location: str | None = None
    start_time: datetime
    end_time: datetime | None = None
    price: float | None = None
    currency: str | None = None
    booking_url: str | None = None
    booking_confirmed: bool
    notes: str | None = None
    order: int

    class Config:
        from_attributes = True
