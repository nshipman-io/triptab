from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.models.trip import Trip, TripMember, MemberRole
from app.models.itinerary import ItineraryItem
from app.schemas.itinerary import ItineraryItemCreate, ItineraryItemUpdate, ItineraryItemResponse

router = APIRouter(prefix="/trips/{trip_id}/itinerary", tags=["itinerary"])


async def check_trip_access(trip_id: str, user_id: str, db: DbSession, require_edit: bool = False):
    """Check if user has access to trip"""
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
async def reorder_itinerary_item(
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
