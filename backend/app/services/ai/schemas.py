from pydantic import BaseModel, Field
from typing import Literal
from datetime import date, time


class FlightDetails(BaseModel):
    """Details specific to flight reservations."""
    airline: str | None = None
    flight_number: str | None = None
    departure_airport: str | None = None
    arrival_airport: str | None = None
    cabin_class: str | None = None


class HotelDetails(BaseModel):
    """Details specific to hotel reservations."""
    hotel_name: str | None = None
    address: str | None = None
    room_type: str | None = None
    check_in_time: str | None = None
    check_out_time: str | None = None


class CarRentalDetails(BaseModel):
    """Details specific to car rental reservations."""
    company: str | None = None
    car_type: str | None = None
    pickup_location: str | None = None
    dropoff_location: str | None = None


class ParsedReservation(BaseModel):
    """Structured output for email parsing agent."""
    type: Literal["flight", "hotel", "car", "activity", "restaurant"]
    title: str = Field(description="Brief descriptive title for the reservation")
    start_date: date
    end_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None
    location: str | None = None
    confirmation_number: str | None = None
    flight_details: FlightDetails | None = None
    hotel_details: HotelDetails | None = None
    car_rental_details: CarRentalDetails | None = None
    notes: str | None = Field(default=None, description="Any additional relevant details")
    confidence: float = Field(ge=0, le=1, description="Confidence score 0-1 based on clarity of information")


class Location(BaseModel):
    """Geographic location with coordinates."""
    lat: float
    lng: float
    address: str | None = None


class Recommendation(BaseModel):
    """A single AI-generated recommendation."""
    name: str
    category: str
    description: str = Field(description="2-3 sentence description of the place or activity")
    why_recommended: str = Field(description="Why this fits the traveler's preferences")
    estimated_cost: str | None = Field(default=None, description="Price range like '$', '$$', '$$$' or specific amount")
    duration: str | None = Field(default=None, description="How long to spend here, e.g., '2 hours', 'half day'")
    location: Location | None = None
    rating: float | None = Field(ge=0, le=5, default=None)
    tags: list[str] = Field(default_factory=list, description="Tags like 'family-friendly', 'romantic', 'outdoor'")
    website_url: str | None = Field(default=None, description="Official website URL for the place/business. Must be a valid, working URL.")


class RecommendationList(BaseModel):
    """Wrapper for multiple recommendations."""
    recommendations: list[Recommendation] = Field(
        min_length=1,
        description="List of recommendations. MUST contain the exact number of items requested by the user."
    )
