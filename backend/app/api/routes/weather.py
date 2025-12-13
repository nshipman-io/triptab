"""Weather API routes for trip weather forecasts."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, or_

from app.api.deps import DbSession, CurrentUser, CurrentUserOptional
from app.models.trip import Trip, TripMember
from app.schemas.weather import WeatherResponse
from app.services.weather import WeatherService
from app.core.config import settings

router = APIRouter(prefix="/trips", tags=["weather"])


async def get_trip_with_access(
    trip_id: str,
    db: DbSession,
    user: CurrentUser | None,
) -> Trip:
    """Get trip if user has access (owner, member, or via share code check elsewhere)."""
    if user:
        # Check if owner
        result = await db.execute(
            select(Trip).where(Trip.id == trip_id, Trip.owner_id == user.id)
        )
        trip = result.scalar_one_or_none()

        # If not owner, check if member
        if not trip:
            result = await db.execute(
                select(Trip)
                .join(TripMember)
                .where(Trip.id == trip_id, TripMember.user_id == user.id)
            )
            trip = result.scalar_one_or_none()

        if trip:
            return trip

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Trip not found"
    )


@router.get("/{trip_id}/weather", response_model=WeatherResponse)
async def get_trip_weather(
    trip_id: str,
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Get weather forecast for a trip.

    Returns weather data for the trip's destination and date range.
    Data is cached for 6 hours to minimize API calls.
    """
    if not settings.WEATHER_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Weather service is disabled"
        )

    trip = await get_trip_with_access(trip_id, db, current_user)

    weather_service = WeatherService(db)
    weather = await weather_service.get_weather_for_trip(
        destination=trip.destination,
        start_date=trip.start_date,
        end_date=trip.end_date,
        user_id=current_user.id,
        trip_id=trip_id,
    )

    return weather


@router.post("/{trip_id}/weather/refresh", response_model=WeatherResponse)
async def refresh_trip_weather(
    trip_id: str,
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Force refresh weather data for a trip.

    This bypasses the cache and fetches fresh data from the weather API.
    Use sparingly to avoid hitting API rate limits.
    """
    if not settings.WEATHER_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Weather service is disabled"
        )

    if not settings.OPENWEATHERMAP_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Weather API key not configured"
        )

    trip = await get_trip_with_access(trip_id, db, current_user)

    weather_service = WeatherService(db)
    weather = await weather_service.refresh_weather(
        destination=trip.destination,
        start_date=trip.start_date,
        end_date=trip.end_date,
        user_id=current_user.id,
        trip_id=trip_id,
    )

    return weather


@router.get("/share/{share_code}/weather", response_model=WeatherResponse)
async def get_shared_trip_weather(
    share_code: str,
    db: DbSession,
    current_user: CurrentUserOptional = None,
):
    """
    Get weather forecast for a shared trip.

    Allows anonymous access to weather data for shared trips.
    """
    if not settings.WEATHER_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Weather service is disabled"
        )

    result = await db.execute(select(Trip).where(Trip.share_code == share_code))
    trip = result.scalar_one_or_none()

    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )

    weather_service = WeatherService(db)
    weather = await weather_service.get_weather_for_trip(
        destination=trip.destination,
        start_date=trip.start_date,
        end_date=trip.end_date,
        user_id=current_user.id if current_user else None,
        trip_id=trip.id,
    )

    return weather
