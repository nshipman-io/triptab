from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.models.trip import Trip, TripMember, MemberRole
from app.models.itinerary import ItineraryItem
from app.schemas.itinerary import ItineraryItemCreate, ItineraryItemUpdate, ItineraryItemResponse

router = APIRouter(prefix="/trips/{trip_id}/itinerary", tags=["itinerary"])


async def check_trip_access(trip_id: str, user_id: str, db: DbSession, require_edit: bool = False):
    """Check if user has access to trip"""
    # First check if user is owner
    result = await db.execute(
        select(Trip).where(Trip.id == trip_id, Trip.owner_id == user_id)
    )
    trip = result.scalar_one_or_none()

    if trip:
        return trip

    # If not owner, check if user is a member
    if require_edit:
        # Need editor or owner role
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
        # Any member role is fine
        result = await db.execute(
            select(Trip)
            .join(TripMember)
            .where(Trip.id == trip_id, TripMember.user_id == user_id)
        )

    trip = result.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    return trip


# Request/Response models for batch operations
class ReorderRequest(BaseModel):
    item_ids: list[str]


class MoveItemRequest(BaseModel):
    item_id: str
    new_date: str  # ISO date string (YYYY-MM-DD)
    new_order: int = 0


@router.get("", response_model=list[ItineraryItemResponse])
async def get_itinerary_items(trip_id: str, current_user: CurrentUser, db: DbSession):
    await check_trip_access(trip_id, current_user.id, db)

    result = await db.execute(
        select(ItineraryItem)
        .where(ItineraryItem.trip_id == trip_id)
        .order_by(ItineraryItem.start_time, ItineraryItem.order)
    )
    items = result.scalars().all()

    return items


@router.post("", response_model=ItineraryItemResponse)
async def create_itinerary_item(
    trip_id: str,
    item_data: ItineraryItemCreate,
    current_user: CurrentUser,
    db: DbSession
):
    await check_trip_access(trip_id, current_user.id, db, require_edit=True)

    item = ItineraryItem(
        trip_id=trip_id,
        **item_data.model_dump()
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)

    return item


# IMPORTANT: Static routes must come BEFORE dynamic /{item_id} routes
@router.put("/reorder", response_model=list[ItineraryItemResponse])
async def reorder_itinerary_items(
    trip_id: str,
    request: ReorderRequest,
    current_user: CurrentUser,
    db: DbSession
):
    """Reorder multiple itinerary items at once."""
    await check_trip_access(trip_id, current_user.id, db, require_edit=True)

    # Update order for each item
    for index, item_id in enumerate(request.item_ids):
        result = await db.execute(
            select(ItineraryItem)
            .where(ItineraryItem.id == item_id, ItineraryItem.trip_id == trip_id)
        )
        item = result.scalar_one_or_none()
        if item:
            item.order = index

    await db.flush()

    # Return updated items
    result = await db.execute(
        select(ItineraryItem)
        .where(ItineraryItem.trip_id == trip_id)
        .order_by(ItineraryItem.start_time, ItineraryItem.order)
    )
    return result.scalars().all()


@router.put("/move", response_model=ItineraryItemResponse)
async def move_itinerary_item(
    trip_id: str,
    request: MoveItemRequest,
    current_user: CurrentUser,
    db: DbSession
):
    """Move an itinerary item to a different date."""
    await check_trip_access(trip_id, current_user.id, db, require_edit=True)

    result = await db.execute(
        select(ItineraryItem)
        .where(ItineraryItem.id == request.item_id, ItineraryItem.trip_id == trip_id)
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    # Parse the new date and update start_time while preserving time component
    try:
        new_date = datetime.strptime(request.new_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format. Use YYYY-MM-DD")

    # Preserve the time component, change the date
    old_time = item.start_time.time() if item.start_time else datetime.min.time()
    item.start_time = datetime.combine(new_date, old_time)
    item.order = request.new_order

    # If there's an end_time, adjust it by the same delta
    if item.end_time:
        old_end_time = item.end_time.time()
        item.end_time = datetime.combine(new_date, old_end_time)

    await db.flush()
    await db.refresh(item)

    return item


# Dynamic routes with {item_id} parameter come AFTER static routes
@router.get("/{item_id}", response_model=ItineraryItemResponse)
async def get_itinerary_item(
    trip_id: str,
    item_id: str,
    current_user: CurrentUser,
    db: DbSession
):
    await check_trip_access(trip_id, current_user.id, db)

    result = await db.execute(
        select(ItineraryItem)
        .where(ItineraryItem.id == item_id, ItineraryItem.trip_id == trip_id)
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    return item


@router.put("/{item_id}", response_model=ItineraryItemResponse)
async def update_itinerary_item(
    trip_id: str,
    item_id: str,
    item_data: ItineraryItemUpdate,
    current_user: CurrentUser,
    db: DbSession
):
    await check_trip_access(trip_id, current_user.id, db, require_edit=True)

    result = await db.execute(
        select(ItineraryItem)
        .where(ItineraryItem.id == item_id, ItineraryItem.trip_id == trip_id)
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    update_data = item_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    await db.flush()
    await db.refresh(item)

    return item


@router.delete("/{item_id}")
async def delete_itinerary_item(
    trip_id: str,
    item_id: str,
    current_user: CurrentUser,
    db: DbSession
):
    await check_trip_access(trip_id, current_user.id, db, require_edit=True)

    result = await db.execute(
        select(ItineraryItem)
        .where(ItineraryItem.id == item_id, ItineraryItem.trip_id == trip_id)
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    await db.delete(item)
    await db.flush()

    return {"message": "Item deleted"}


@router.put("/{item_id}/reorder")
async def reorder_single_itinerary_item(
    trip_id: str,
    item_id: str,
    new_order: int,
    current_user: CurrentUser,
    db: DbSession
):
    await check_trip_access(trip_id, current_user.id, db, require_edit=True)

    result = await db.execute(
        select(ItineraryItem)
        .where(ItineraryItem.id == item_id, ItineraryItem.trip_id == trip_id)
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    item.order = new_order
    await db.flush()

    return {"message": "Item reordered"}
