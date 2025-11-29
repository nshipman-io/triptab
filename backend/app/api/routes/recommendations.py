from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.models.trip import Trip, TripMember, MemberRole
from app.models.itinerary import ItineraryItem
from app.schemas.recommendations import (
    RecommendationResponse,
    RecommendationsRequest,
    AddToItineraryRequest,
    Location,
)
from app.services.ai.recommendations import get_trip_recommendations

router = APIRouter(prefix="/trips/{trip_id}/recommendations", tags=["recommendations"])


async def check_trip_access(trip_id: str, user_id: str, db: DbSession, require_edit: bool = False):
    """Check if user has access to trip."""
    query = (
        select(Trip)
        .outerjoin(TripMember)
        .where(
            Trip.id == trip_id,
            (Trip.owner_id == user_id) | (TripMember.user_id == user_id)
        )
    )

    if require_edit:
        query = query.where(
            (Trip.owner_id == user_id) |
            (TripMember.role.in_([MemberRole.OWNER, MemberRole.EDITOR]))
        )

    result = await db.execute(query)
    trip = result.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    return trip


@router.get("", response_model=list[RecommendationResponse])
async def get_recommendations(
    trip_id: str,
    current_user: CurrentUser,
    db: DbSession,
    category: str = "activities",
    count: int = 5,
):
    """Get AI-powered recommendations for the trip."""
    trip = await check_trip_access(trip_id, current_user.id, db)

    # Get existing itinerary items to avoid duplicates
    result = await db.execute(
        select(ItineraryItem)
        .where(ItineraryItem.trip_id == trip_id)
    )
    existing_items = result.scalars().all()
    existing_activities = [item.title for item in existing_items]

    # Get trip preferences
    preferences = trip.preferences or {}

    try:
        recommendations = await get_trip_recommendations(
            destination=trip.destination,
            start_date=trip.start_date.isoformat(),
            end_date=trip.end_date.isoformat(),
            category=category,
            preferences=preferences,
            existing_activities=existing_activities,
            count=count,
        )

        return [
            RecommendationResponse(
                name=rec.name,
                category=rec.category,
                description=rec.description,
                why_recommended=rec.why_recommended,
                estimated_cost=rec.estimated_cost,
                duration=rec.duration,
                location=Location(
                    lat=rec.location.lat,
                    lng=rec.location.lng,
                    address=rec.location.address,
                ) if rec.location else None,
                rating=rec.rating,
                tags=rec.tags,
            )
            for rec in recommendations
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recommendations: {str(e)}"
        )


@router.post("/add")
async def add_recommendation_to_itinerary(
    trip_id: str,
    add_request: AddToItineraryRequest,
    current_user: CurrentUser,
    db: DbSession
):
    """Add a recommendation to the trip itinerary."""
    await check_trip_access(trip_id, current_user.id, db, require_edit=True)

    rec = add_request.recommendation

    # Parse date and optional time
    start_dt = datetime.fromisoformat(add_request.date)
    if add_request.time:
        time_parts = datetime.fromisoformat(add_request.time).time()
        start_dt = datetime.combine(start_dt.date(), time_parts)

    # Map category to itinerary type
    type_mapping = {
        "restaurants": "restaurant",
        "activities": "experience",
        "attractions": "experience",
        "hotels": "hotel",
    }
    item_type = type_mapping.get(rec.category, "experience")

    # Build description
    description_parts = [rec.description]
    if rec.why_recommended:
        description_parts.append(f"\nWhy we recommend it: {rec.why_recommended}")
    if rec.estimated_cost:
        description_parts.append(f"\nEstimated cost: {rec.estimated_cost}")
    if rec.duration:
        description_parts.append(f"\nDuration: {rec.duration}")

    description = "".join(description_parts)

    # Create itinerary item
    item = ItineraryItem(
        trip_id=trip_id,
        type=item_type,
        title=rec.name,
        description=description,
        location=rec.location.address if rec.location else None,
        start_time=start_dt,
        booking_confirmed=False,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)

    return {
        "message": "Recommendation added to itinerary",
        "item_id": item.id
    }
