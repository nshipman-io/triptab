from pydantic import BaseModel, Field
from datetime import datetime, date, time
from typing import Literal


class FlightDetails(BaseModel):
    airline: str | None = None
    flight_number: str | None = None
    departure_airport: str | None = None
    arrival_airport: str | None = None
    cabin_class: str | None = None


class HotelDetails(BaseModel):
    hotel_name: str | None = None
    address: str | None = None
    room_type: str | None = None
    check_in_time: str | None = None
    check_out_time: str | None = None


class CarRentalDetails(BaseModel):
    company: str | None = None
    car_type: str | None = None
    pickup_location: str | None = None
    dropoff_location: str | None = None


class ParseRequest(BaseModel):
    email_content: str = Field(min_length=10)


class ParsedReservationResponse(BaseModel):
    type: Literal["flight", "hotel", "car", "activity", "restaurant"]
    title: str
    start_date: date
    end_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None
    location: str | None = None
    confirmation_number: str | None = None
    flight_details: FlightDetails | None = None
    hotel_details: HotelDetails | None = None
    car_rental_details: CarRentalDetails | None = None
    notes: str | None = None
    confidence: float


class ConfirmImportRequest(BaseModel):
    parsed_data: ParsedReservationResponse
    adjustments: dict | None = None  # Optional manual adjustments


class ImportLogResponse(BaseModel):
    id: str
    trip_id: str
    user_id: str
    source: str
    status: str
    error_message: str | None
    created_items: list[str] | None
    created_at: datetime

    class Config:
        from_attributes = True
