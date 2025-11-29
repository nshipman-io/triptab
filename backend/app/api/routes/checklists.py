from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.models.trip import Trip, TripMember, MemberRole
from app.models.checklist import Checklist, ChecklistItem, ChecklistType
from app.schemas.checklist import (
    ChecklistCreate,
    ChecklistUpdate,
    ChecklistResponse,
    ChecklistItemCreate,
    ChecklistItemUpdate,
    ChecklistItemResponse,
    ReorderRequest,
)

router = APIRouter(prefix="/trips/{trip_id}/checklists", tags=["checklists"])


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


@router.get("", response_model=list[ChecklistResponse])
async def get_checklists(trip_id: str, current_user: CurrentUser, db: DbSession):
    """Get all checklists for a trip."""
    await check_trip_access(trip_id, current_user.id, db)

    result = await db.execute(
        select(Checklist)
        .options(selectinload(Checklist.items))
        .where(Checklist.trip_id == trip_id)
        .order_by(Checklist.order, Checklist.created_at)
    )
    checklists = result.scalars().all()

    return checklists


@router.post("", response_model=ChecklistResponse, status_code=status.HTTP_201_CREATED)
async def create_checklist(
    trip_id: str,
    checklist_data: ChecklistCreate,
    current_user: CurrentUser,
    db: DbSession
):
    """Create a new checklist."""
    await check_trip_access(trip_id, current_user.id, db, require_edit=True)

    checklist = Checklist(
        trip_id=trip_id,
        created_by_id=current_user.id,
        name=checklist_data.name,
        type=ChecklistType(checklist_data.type),
        order=checklist_data.order,
    )
    db.add(checklist)
    await db.flush()
    await db.refresh(checklist, ["items"])

    return checklist


@router.get("/{checklist_id}", response_model=ChecklistResponse)
async def get_checklist(
    trip_id: str,
    checklist_id: str,
    current_user: CurrentUser,
    db: DbSession
):
    """Get a specific checklist."""
    await check_trip_access(trip_id, current_user.id, db)

    result = await db.execute(
        select(Checklist)
        .options(selectinload(Checklist.items))
        .where(Checklist.id == checklist_id, Checklist.trip_id == trip_id)
    )
    checklist = result.scalar_one_or_none()

    if not checklist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist not found")

    return checklist


@router.put("/{checklist_id}", response_model=ChecklistResponse)
async def update_checklist(
    trip_id: str,
    checklist_id: str,
    checklist_data: ChecklistUpdate,
    current_user: CurrentUser,
    db: DbSession
):
    """Update a checklist."""
    await check_trip_access(trip_id, current_user.id, db, require_edit=True)

    result = await db.execute(
        select(Checklist)
        .options(selectinload(Checklist.items))
        .where(Checklist.id == checklist_id, Checklist.trip_id == trip_id)
    )
    checklist = result.scalar_one_or_none()

    if not checklist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist not found")

    update_data = checklist_data.model_dump(exclude_unset=True)
    if "type" in update_data:
        update_data["type"] = ChecklistType(update_data["type"])

    for field, value in update_data.items():
        setattr(checklist, field, value)

    await db.flush()
    await db.refresh(checklist)

    return checklist


@router.delete("/{checklist_id}")
async def delete_checklist(
    trip_id: str,
    checklist_id: str,
    current_user: CurrentUser,
    db: DbSession
):
    """Delete a checklist and all its items."""
    await check_trip_access(trip_id, current_user.id, db, require_edit=True)

    result = await db.execute(
        select(Checklist)
        .where(Checklist.id == checklist_id, Checklist.trip_id == trip_id)
    )
    checklist = result.scalar_one_or_none()

    if not checklist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist not found")

    await db.delete(checklist)
    await db.flush()

    return {"message": "Checklist deleted"}


# Checklist Items


@router.post("/{checklist_id}/items", response_model=ChecklistItemResponse, status_code=status.HTTP_201_CREATED)
async def create_checklist_item(
    trip_id: str,
    checklist_id: str,
    item_data: ChecklistItemCreate,
    current_user: CurrentUser,
    db: DbSession
):
    """Add an item to a checklist."""
    await check_trip_access(trip_id, current_user.id, db, require_edit=True)

    # Verify checklist exists
    result = await db.execute(
        select(Checklist)
        .where(Checklist.id == checklist_id, Checklist.trip_id == trip_id)
    )
    checklist = result.scalar_one_or_none()

    if not checklist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist not found")

    item = ChecklistItem(
        checklist_id=checklist_id,
        content=item_data.content,
        assigned_to_id=item_data.assigned_to_id,
        order=item_data.order,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)

    return item


@router.put("/{checklist_id}/items/{item_id}", response_model=ChecklistItemResponse)
async def update_checklist_item(
    trip_id: str,
    checklist_id: str,
    item_id: str,
    item_data: ChecklistItemUpdate,
    current_user: CurrentUser,
    db: DbSession
):
    """Update a checklist item."""
    await check_trip_access(trip_id, current_user.id, db, require_edit=True)

    result = await db.execute(
        select(ChecklistItem)
        .join(Checklist)
        .where(
            ChecklistItem.id == item_id,
            ChecklistItem.checklist_id == checklist_id,
            Checklist.trip_id == trip_id
        )
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


@router.delete("/{checklist_id}/items/{item_id}")
async def delete_checklist_item(
    trip_id: str,
    checklist_id: str,
    item_id: str,
    current_user: CurrentUser,
    db: DbSession
):
    """Delete a checklist item."""
    await check_trip_access(trip_id, current_user.id, db, require_edit=True)

    result = await db.execute(
        select(ChecklistItem)
        .join(Checklist)
        .where(
            ChecklistItem.id == item_id,
            ChecklistItem.checklist_id == checklist_id,
            Checklist.trip_id == trip_id
        )
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    await db.delete(item)
    await db.flush()

    return {"message": "Item deleted"}


@router.put("/{checklist_id}/reorder")
async def reorder_checklist_items(
    trip_id: str,
    checklist_id: str,
    reorder_data: ReorderRequest,
    current_user: CurrentUser,
    db: DbSession
):
    """Reorder items in a checklist."""
    await check_trip_access(trip_id, current_user.id, db, require_edit=True)

    # Verify checklist exists
    result = await db.execute(
        select(Checklist)
        .where(Checklist.id == checklist_id, Checklist.trip_id == trip_id)
    )
    checklist = result.scalar_one_or_none()

    if not checklist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist not found")

    # Update order for each item
    for order, item_id in enumerate(reorder_data.item_ids):
        result = await db.execute(
            select(ChecklistItem)
            .where(ChecklistItem.id == item_id, ChecklistItem.checklist_id == checklist_id)
        )
        item = result.scalar_one_or_none()
        if item:
            item.order = order

    await db.flush()

    return {"message": "Items reordered"}
