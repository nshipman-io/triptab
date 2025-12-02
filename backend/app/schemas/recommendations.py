from pydantic import BaseModel, Field
from typing import Literal


class Location(BaseModel):
    lat: float
    lng: float
    address: str | None = None


class RecommendationResponse(BaseModel):
    name: str
    category: str
    description: str
    why_recommended: str
    estimated_cost: str | None = None
    duration: str | None = None
    location: Location | None = None
    rating: float | None = None
    tags: list[str] = []
    website_url: str | None = None


class RecommendationsRequest(BaseModel):
    category: Literal["restaurants", "activities", "attractions"] = "activities"
    count: int = Field(default=5, ge=1, le=10)
    preferences: dict | None = None


class AddToItineraryRequest(BaseModel):
    recommendation: RecommendationResponse
    date: str  # ISO date string
    time: str | None = None  # ISO time string
