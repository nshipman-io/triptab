from fastapi import APIRouter, HTTPException, status, Query
from sqlalchemy import select, or_, func, cast, String
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser, CurrentUserOptional
from app.models.guide import Guide, GuideSection, GuidePlace, GuideVisibility
from app.schemas.guide import (
    GuideCreate,
    GuideUpdate,
    GuideResponse,
    GuideSummaryResponse,
    GuideSectionCreate,
    GuideSectionUpdate,
    GuideSectionResponse,
    GuidePlaceCreate,
    GuidePlaceUpdate,
    GuidePlaceResponse,
    ReorderRequest,
)

router = APIRouter(prefix="/guides", tags=["guides"])


def check_guide_author(guide: Guide, user_id: str):
    """Verify user is the author of the guide."""
    if guide.author_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this guide"
        )


# ============ Guide Routes ============

@router.get("", response_model=list[GuideSummaryResponse])
async def list_public_guides(
    db: DbSession,
    destination: str | None = Query(None, description="Filter by destination"),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
):
    """List public guides, optionally filtered by destination."""
    query = (
        select(Guide)
        .options(selectinload(Guide.author))
        .where(Guide.visibility == GuideVisibility.PUBLIC)
        .order_by(Guide.view_count.desc(), Guide.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    if destination:
        # Extract the first part before comma for more flexible matching
        # e.g., "Costa Rica, Costa Rica" -> "Costa Rica"
        # e.g., "Tokyo, Japan" -> "Tokyo"
        search_term = destination.split(",")[0].strip().lower()

        # Search in:
        # 1. Guide destination field (ILIKE for case-insensitive)
        # 2. Location tags array (cast to text and use ILIKE)
        query = query.where(
            or_(
                Guide.destination.ilike(f"%{search_term}%"),
                Guide.destination.ilike(f"%{destination}%"),
                # Search in location_tags JSON array - cast to text for ILIKE search
                cast(Guide.location_tags, String).ilike(f"%{search_term}%"),
            )
        )

    result = await db.execute(query)
    guides = result.scalars().all()

    return guides


@router.get("/my", response_model=list[GuideSummaryResponse])
async def list_my_guides(
    current_user: CurrentUser,
    db: DbSession,
):
    """List guides created by the current user."""
    result = await db.execute(
        select(Guide)
        .options(selectinload(Guide.author))
        .where(Guide.author_id == current_user.id)
        .order_by(Guide.updated_at.desc())
    )
    guides = result.scalars().all()

    return guides


@router.post("", response_model=GuideResponse, status_code=status.HTTP_201_CREATED)
async def create_guide(
    guide_data: GuideCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Create a new guide."""
    guide = Guide(
        title=guide_data.title,
        description=guide_data.description,
        destination=guide_data.destination,
        cover_image_url=guide_data.cover_image_url,
        visibility=GuideVisibility(guide_data.visibility),
        tags=guide_data.tags,
        author_id=current_user.id,
    )
    db.add(guide)
    await db.flush()
    await db.refresh(guide, ["author", "sections"])

    return guide


@router.get("/{guide_id}", response_model=GuideResponse)
async def get_guide(
    guide_id: str,
    current_user: CurrentUserOptional,
    db: DbSession,
):
    """Get a guide by ID. Public guides are accessible to anyone."""
    result = await db.execute(
        select(Guide)
        .options(
            selectinload(Guide.author),
            selectinload(Guide.sections).selectinload(GuideSection.places)
        )
        .where(Guide.id == guide_id)
    )
    guide = result.scalar_one_or_none()

    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")

    # Check visibility
    if guide.visibility == GuideVisibility.PRIVATE:
        if not current_user or guide.author_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")

    return guide


@router.get("/share/{share_code}", response_model=GuideResponse)
async def get_guide_by_share_code(
    share_code: str,
    db: DbSession,
):
    """Get a guide by its share code. Works for public and unlisted guides."""
    result = await db.execute(
        select(Guide)
        .options(
            selectinload(Guide.author),
            selectinload(Guide.sections).selectinload(GuideSection.places)
        )
        .where(Guide.share_code == share_code)
    )
    guide = result.scalar_one_or_none()

    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")

    # Private guides cannot be accessed via share code
    if guide.visibility == GuideVisibility.PRIVATE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")

    return guide


@router.put("/{guide_id}", response_model=GuideResponse)
async def update_guide(
    guide_id: str,
    guide_data: GuideUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Update a guide. Only the author can update."""
    result = await db.execute(
        select(Guide)
        .options(
            selectinload(Guide.author),
            selectinload(Guide.sections).selectinload(GuideSection.places)
        )
        .where(Guide.id == guide_id)
    )
    guide = result.scalar_one_or_none()

    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")

    check_guide_author(guide, current_user.id)

    update_data = guide_data.model_dump(exclude_unset=True)
    if "visibility" in update_data:
        update_data["visibility"] = GuideVisibility(update_data["visibility"])

    for field, value in update_data.items():
        setattr(guide, field, value)

    await db.flush()
    await db.refresh(guide)

    return guide


@router.delete("/{guide_id}")
async def delete_guide(
    guide_id: str,
    current_user: CurrentUser,
    db: DbSession,
):
    """Delete a guide and all its sections/places."""
    result = await db.execute(
        select(Guide).where(Guide.id == guide_id)
    )
    guide = result.scalar_one_or_none()

    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")

    check_guide_author(guide, current_user.id)

    await db.delete(guide)
    await db.flush()

    return {"message": "Guide deleted"}


@router.post("/{guide_id}/view")
async def increment_view_count(
    guide_id: str,
    db: DbSession,
):
    """Increment the view count for a guide."""
    result = await db.execute(
        select(Guide).where(Guide.id == guide_id)
    )
    guide = result.scalar_one_or_none()

    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")

    guide.view_count += 1
    await db.flush()

    return {"view_count": guide.view_count}


# ============ Section Routes ============

@router.post("/{guide_id}/sections", response_model=GuideSectionResponse, status_code=status.HTTP_201_CREATED)
async def create_section(
    guide_id: str,
    section_data: GuideSectionCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Add a section to a guide."""
    result = await db.execute(
        select(Guide).where(Guide.id == guide_id)
    )
    guide = result.scalar_one_or_none()

    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")

    check_guide_author(guide, current_user.id)

    section = GuideSection(
        guide_id=guide_id,
        title=section_data.title,
        description=section_data.description,
        order=section_data.order,
    )
    db.add(section)
    await db.flush()
    await db.refresh(section, ["places"])

    return section


@router.put("/{guide_id}/sections/{section_id}", response_model=GuideSectionResponse)
async def update_section(
    guide_id: str,
    section_id: str,
    section_data: GuideSectionUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Update a section."""
    result = await db.execute(
        select(Guide).where(Guide.id == guide_id)
    )
    guide = result.scalar_one_or_none()

    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")

    check_guide_author(guide, current_user.id)

    result = await db.execute(
        select(GuideSection)
        .options(selectinload(GuideSection.places))
        .where(GuideSection.id == section_id, GuideSection.guide_id == guide_id)
    )
    section = result.scalar_one_or_none()

    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")

    update_data = section_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(section, field, value)

    await db.flush()
    await db.refresh(section)

    return section


@router.delete("/{guide_id}/sections/{section_id}")
async def delete_section(
    guide_id: str,
    section_id: str,
    current_user: CurrentUser,
    db: DbSession,
):
    """Delete a section and all its places."""
    result = await db.execute(
        select(Guide).where(Guide.id == guide_id)
    )
    guide = result.scalar_one_or_none()

    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")

    check_guide_author(guide, current_user.id)

    result = await db.execute(
        select(GuideSection)
        .where(GuideSection.id == section_id, GuideSection.guide_id == guide_id)
    )
    section = result.scalar_one_or_none()

    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")

    await db.delete(section)
    await db.flush()

    return {"message": "Section deleted"}


@router.put("/{guide_id}/sections/reorder")
async def reorder_sections(
    guide_id: str,
    reorder_data: ReorderRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    """Reorder sections in a guide."""
    result = await db.execute(
        select(Guide).where(Guide.id == guide_id)
    )
    guide = result.scalar_one_or_none()

    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")

    check_guide_author(guide, current_user.id)

    for order, section_id in enumerate(reorder_data.item_ids):
        result = await db.execute(
            select(GuideSection)
            .where(GuideSection.id == section_id, GuideSection.guide_id == guide_id)
        )
        section = result.scalar_one_or_none()
        if section:
            section.order = order

    await db.flush()

    return {"message": "Sections reordered"}


# ============ Place Routes ============

@router.post("/{guide_id}/sections/{section_id}/places", response_model=GuidePlaceResponse, status_code=status.HTTP_201_CREATED)
async def create_place(
    guide_id: str,
    section_id: str,
    place_data: GuidePlaceCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Add a place to a section."""
    result = await db.execute(
        select(Guide).where(Guide.id == guide_id)
    )
    guide = result.scalar_one_or_none()

    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")

    check_guide_author(guide, current_user.id)

    result = await db.execute(
        select(GuideSection)
        .where(GuideSection.id == section_id, GuideSection.guide_id == guide_id)
    )
    section = result.scalar_one_or_none()

    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")

    place = GuidePlace(
        section_id=section_id,
        name=place_data.name,
        description=place_data.description,
        category=place_data.category,
        address=place_data.address,
        latitude=place_data.latitude,
        longitude=place_data.longitude,
        place_id=place_data.place_id,
        place_data=place_data.place_data,
        notes=place_data.notes,
        tips=place_data.tips,
        price_range=place_data.price_range,
        photo_url=place_data.photo_url,
        order=place_data.order,
    )
    db.add(place)
    await db.flush()
    await db.refresh(place)

    return place


@router.put("/{guide_id}/sections/{section_id}/places/{place_id}", response_model=GuidePlaceResponse)
async def update_place(
    guide_id: str,
    section_id: str,
    place_id: str,
    place_data: GuidePlaceUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Update a place."""
    result = await db.execute(
        select(Guide).where(Guide.id == guide_id)
    )
    guide = result.scalar_one_or_none()

    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")

    check_guide_author(guide, current_user.id)

    result = await db.execute(
        select(GuidePlace)
        .join(GuideSection)
        .where(
            GuidePlace.id == place_id,
            GuidePlace.section_id == section_id,
            GuideSection.guide_id == guide_id
        )
    )
    place = result.scalar_one_or_none()

    if not place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")

    update_data = place_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(place, field, value)

    await db.flush()
    await db.refresh(place)

    return place


@router.delete("/{guide_id}/sections/{section_id}/places/{place_id}")
async def delete_place(
    guide_id: str,
    section_id: str,
    place_id: str,
    current_user: CurrentUser,
    db: DbSession,
):
    """Delete a place."""
    result = await db.execute(
        select(Guide).where(Guide.id == guide_id)
    )
    guide = result.scalar_one_or_none()

    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")

    check_guide_author(guide, current_user.id)

    result = await db.execute(
        select(GuidePlace)
        .join(GuideSection)
        .where(
            GuidePlace.id == place_id,
            GuidePlace.section_id == section_id,
            GuideSection.guide_id == guide_id
        )
    )
    place = result.scalar_one_or_none()

    if not place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")

    await db.delete(place)
    await db.flush()

    return {"message": "Place deleted"}


@router.put("/{guide_id}/sections/{section_id}/places/reorder")
async def reorder_places(
    guide_id: str,
    section_id: str,
    reorder_data: ReorderRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    """Reorder places in a section."""
    result = await db.execute(
        select(Guide).where(Guide.id == guide_id)
    )
    guide = result.scalar_one_or_none()

    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")

    check_guide_author(guide, current_user.id)

    result = await db.execute(
        select(GuideSection)
        .where(GuideSection.id == section_id, GuideSection.guide_id == guide_id)
    )
    section = result.scalar_one_or_none()

    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")

    for order, place_id in enumerate(reorder_data.item_ids):
        result = await db.execute(
            select(GuidePlace)
            .where(GuidePlace.id == place_id, GuidePlace.section_id == section_id)
        )
        place = result.scalar_one_or_none()
        if place:
            place.order = order

    await db.flush()

    return {"message": "Places reordered"}
