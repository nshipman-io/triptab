from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.models.trip import Trip, TripMember, MemberRole
from app.models.itinerary import ItineraryItem
from app.models.import_log import ImportLog, ImportSource, ImportStatus
from app.schemas.imports import (
    ParseRequest,
    ParsedReservationResponse,
    ConfirmImportRequest,
    ImportLogResponse,
)
from app.services.ai.email_parser import parse_reservation_email

router = APIRouter(prefix="/trips/{trip_id}/import", tags=["import"])


async def check_trip_access(trip_id: str, user_id: str, db: DbSession, require_edit: bool = False):
    """Check if user has access to trip."""
    # First check if user is owner
    result = await db.execute(
        select(Trip).where(Trip.id == trip_id, Trip.owner_id == user_id)
    )
    trip = result.scalar_one_or_none()

    if trip:
        return trip

    # If not owner, check if user is a member
    if require_edit:
        result = await db.execute(
            select(Trip)
            .join(TripMember)
            .where(
                Trip.id == trip_id,
                TripMember.user_id == user_id,
                TripMember.role.in_([MemberRole.OWNER, MemberRole.EDITOR])
            )
        )
    else:
        result = await db.execute(
            select(Trip)
            .join(TripMember)
            .where(Trip.id == trip_id, TripMember.user_id == user_id)
        )

    trip = result.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    return trip


@router.post("/parse", response_model=ParsedReservationResponse)
async def parse_email(
    trip_id: str,
    parse_request: ParseRequest,
    current_user: CurrentUser,
    db: DbSession
):
    """Parse email content and return structured reservation data (preview)."""
    await check_trip_access(trip_id, current_user.id, db, require_edit=True)

    try:
        parsed = await parse_reservation_email(parse_request.email_content)

        # Convert to response format
        return ParsedReservationResponse(
            type=parsed.type,
            title=parsed.title,
            start_date=parsed.start_date,
            end_date=parsed.end_date,
            start_time=parsed.start_time,
            end_time=parsed.end_time,
            location=parsed.location,
            confirmation_number=parsed.confirmation_number,
            flight_details=parsed.flight_details.model_dump() if parsed.flight_details else None,
            hotel_details=parsed.hotel_details.model_dump() if parsed.hotel_details else None,
            car_rental_details=parsed.car_rental_details.model_dump() if parsed.car_rental_details else None,
            notes=parsed.notes,
            confidence=parsed.confidence,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse email: {str(e)}"
        )


@router.post("/confirm", response_model=ImportLogResponse)
async def confirm_import(
    trip_id: str,
    confirm_request: ConfirmImportRequest,
    current_user: CurrentUser,
    db: DbSession
):
    """Confirm parsed data and create itinerary item."""
    await check_trip_access(trip_id, current_user.id, db, require_edit=True)

    parsed = confirm_request.parsed_data
    adjustments = confirm_request.adjustments or {}

    # Apply adjustments
    title = adjustments.get("title", parsed.title)
    location = adjustments.get("location", parsed.location)
    booking_confirmed = adjustments.get("booking_confirmed", True)  # Default to True for imports

    # Build start_time datetime
    start_dt = datetime.combine(
        parsed.start_date,
        parsed.start_time or datetime.min.time()
    )

    # Build end_time datetime
    end_dt = None
    if parsed.end_date:
        end_dt = datetime.combine(
            parsed.end_date,
            parsed.end_time or datetime.min.time()
        )
    elif parsed.end_time:
        end_dt = datetime.combine(parsed.start_date, parsed.end_time)

    # Map reservation type to itinerary type
    type_mapping = {
        "flight": "flight",
        "hotel": "hotel",
        "car": "transport",
        "activity": "experience",
        "restaurant": "restaurant",
    }
    item_type = type_mapping.get(parsed.type, "experience")

    # Build notes/description
    notes_parts = []
    if parsed.confirmation_number:
        notes_parts.append(f"Confirmation: {parsed.confirmation_number}")
    if parsed.notes:
        notes_parts.append(parsed.notes)

    if parsed.flight_details:
        fd = parsed.flight_details
        if fd.airline and fd.flight_number:
            notes_parts.append(f"Flight: {fd.airline} {fd.flight_number}")
        if fd.departure_airport and fd.arrival_airport:
            notes_parts.append(f"Route: {fd.departure_airport} → {fd.arrival_airport}")

    if parsed.hotel_details:
        hd = parsed.hotel_details
        if hd.hotel_name:
            notes_parts.append(f"Hotel: {hd.hotel_name}")
        if hd.room_type:
            notes_parts.append(f"Room: {hd.room_type}")

    notes = "\n".join(notes_parts) if notes_parts else None

    # Create itinerary item
    item = ItineraryItem(
        trip_id=trip_id,
        type=item_type,
        title=title,
        description=None,
        location=location,
        start_time=start_dt,
        end_time=end_dt,
        booking_confirmed=booking_confirmed,
        notes=notes,
    )
    db.add(item)
    await db.flush()

    # Create import log
    import_log = ImportLog(
        trip_id=trip_id,
        user_id=current_user.id,
        source=ImportSource.EMAIL_PASTE,
        raw_content="[Content not stored for privacy]",
        parsed_data=parsed.model_dump(mode="json"),
        status=ImportStatus.SUCCESS,
        created_items=[item.id],
    )
    db.add(import_log)
    await db.flush()
    await db.refresh(import_log)

    return import_log


@router.get("/history", response_model=list[ImportLogResponse])
async def get_import_history(
    trip_id: str,
    current_user: CurrentUser,
    db: DbSession
):
    """Get import history for a trip."""
    await check_trip_access(trip_id, current_user.id, db)

    result = await db.execute(
        select(ImportLog)
        .where(ImportLog.trip_id == trip_id)
        .order_by(ImportLog.created_at.desc())
        .limit(50)
    )
    logs = result.scalars().all()

    return logs
