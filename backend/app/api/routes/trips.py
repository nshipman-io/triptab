from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.models.trip import Trip, TripMember, MemberRole, MemberStatus
from app.schemas.trip import (
    TripCreate, TripUpdate, TripResponse,
    TripMemberUpdate, TripMemberResponse
)

router = APIRouter(prefix="/trips", tags=["trips"])


@router.get("", response_model=list[TripResponse])
async def get_trips(current_user: CurrentUser, db: DbSession):
    # Get trip IDs where user is a member
    member_trip_ids = select(TripMember.trip_id).where(
        TripMember.user_id == current_user.id
    )

    # Get trips where user is owner or member
    result = await db.execute(
        select(Trip)
        .where(
            or_(
                Trip.owner_id == current_user.id,
                Trip.id.in_(member_trip_ids)
            )
        )
        .order_by(Trip.created_at.desc())
    )
    trips = result.scalars().all()
    return trips


@router.post("", response_model=TripResponse)
async def create_trip(trip_data: TripCreate, current_user: CurrentUser, db: DbSession):
    trip = Trip(
        name=trip_data.name,
        description=trip_data.description,
        destination=trip_data.destination,
        start_date=trip_data.start_date,
        end_date=trip_data.end_date,
        preferences=trip_data.preferences.model_dump(),
        owner_id=current_user.id
    )
    db.add(trip)
    await db.flush()

    # Add owner as member
    member = TripMember(
        trip_id=trip.id,
        user_id=current_user.id,
        role=MemberRole.OWNER,
        status=MemberStatus.ACCEPTED
    )
    db.add(member)
    await db.flush()
    await db.refresh(trip)

    return trip


@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(trip_id: str, current_user: CurrentUser, db: DbSession):
    result = await db.execute(
        select(Trip)
        .outerjoin(TripMember)
        .where(
            Trip.id == trip_id,
            (Trip.owner_id == current_user.id) | (TripMember.user_id == current_user.id)
        )
    )
    trip = result.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    return trip


@router.get("/share/{share_code}", response_model=TripResponse)
async def get_trip_by_share_code(share_code: str, db: DbSession):
    result = await db.execute(select(Trip).where(Trip.share_code == share_code))
    trip = result.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    return trip


@router.put("/{trip_id}", response_model=TripResponse)
async def update_trip(
    trip_id: str,
    trip_data: TripUpdate,
    current_user: CurrentUser,
    db: DbSession
):
    result = await db.execute(
        select(Trip)
        .outerjoin(TripMember)
        .where(
            Trip.id == trip_id,
            (Trip.owner_id == current_user.id) |
            ((TripMember.user_id == current_user.id) & (TripMember.role.in_([MemberRole.OWNER, MemberRole.EDITOR])))
        )
    )
    trip = result.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    update_data = trip_data.model_dump(exclude_unset=True)
    if "preferences" in update_data and update_data["preferences"]:
        update_data["preferences"] = update_data["preferences"].model_dump() if hasattr(update_data["preferences"], "model_dump") else update_data["preferences"]

    for field, value in update_data.items():
        setattr(trip, field, value)

    await db.flush()
    await db.refresh(trip)

    return trip


@router.delete("/{trip_id}")
async def delete_trip(trip_id: str, current_user: CurrentUser, db: DbSession):
    result = await db.execute(
        select(Trip).where(Trip.id == trip_id, Trip.owner_id == current_user.id)
    )
    trip = result.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    await db.delete(trip)
    await db.flush()

    return {"message": "Trip deleted"}


@router.post("/join/{share_code}", response_model=TripMemberResponse)
async def join_trip(share_code: str, current_user: CurrentUser, db: DbSession):
    # Find trip
    result = await db.execute(select(Trip).where(Trip.share_code == share_code))
    trip = result.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    # Check if already a member
    result = await db.execute(
        select(TripMember)
        .where(TripMember.trip_id == trip.id, TripMember.user_id == current_user.id)
    )
    existing_member = result.scalar_one_or_none()

    if existing_member:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already a member of this trip")

    # Add as member
    member = TripMember(
        trip_id=trip.id,
        user_id=current_user.id,
        role=MemberRole.VIEWER,
        status=MemberStatus.ACCEPTED
    )
    db.add(member)
    await db.flush()
    await db.refresh(member, ["user"])

    return member


@router.get("/{trip_id}/members", response_model=list[TripMemberResponse])
async def get_trip_members(trip_id: str, current_user: CurrentUser, db: DbSession):
    # Check access
    result = await db.execute(
        select(Trip)
        .outerjoin(TripMember)
        .where(
            Trip.id == trip_id,
            (Trip.owner_id == current_user.id) | (TripMember.user_id == current_user.id)
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    # Get members
    result = await db.execute(
        select(TripMember)
        .options(selectinload(TripMember.user))
        .where(TripMember.trip_id == trip_id)
    )
    members = result.scalars().all()

    return members


@router.put("/{trip_id}/members/{member_id}", response_model=TripMemberResponse)
async def update_member(
    trip_id: str,
    member_id: str,
    member_data: TripMemberUpdate,
    current_user: CurrentUser,
    db: DbSession
):
    # Check if user is owner or the member themselves
    result = await db.execute(
        select(TripMember)
        .options(selectinload(TripMember.user))
        .where(TripMember.id == member_id, TripMember.trip_id == trip_id)
    )
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    # Check permissions
    result = await db.execute(
        select(Trip).where(Trip.id == trip_id, Trip.owner_id == current_user.id)
    )
    is_owner = result.scalar_one_or_none() is not None
    is_self = member.user_id == current_user.id

    if not is_owner and not is_self:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    # Update fields
    update_data = member_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(member, field, value)

    await db.flush()
    await db.refresh(member)

    return member


@router.delete("/{trip_id}/members/{member_id}")
async def remove_member(
    trip_id: str,
    member_id: str,
    current_user: CurrentUser,
    db: DbSession
):
    # Check if user is owner
    result = await db.execute(
        select(Trip).where(Trip.id == trip_id, Trip.owner_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    result = await db.execute(
        select(TripMember).where(TripMember.id == member_id, TripMember.trip_id == trip_id)
    )
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    if member.role == MemberRole.OWNER:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove owner")

    await db.delete(member)
    await db.flush()

    return {"message": "Member removed"}
