from pydantic import BaseModel
from datetime import datetime
from typing import Literal


GuideVisibilityEnum = Literal["public", "private", "unlisted"]


# ============ GuidePlace Schemas ============

class GuidePlaceCreate(BaseModel):
    name: str
    description: str | None = None
    category: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    place_id: str | None = None
    place_data: dict | None = None
    notes: str | None = None
    tips: str | None = None
    price_range: str | None = None
    photo_url: str | None = None
    order: int = 0


class GuidePlaceUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    place_id: str | None = None
    place_data: dict | None = None
    notes: str | None = None
    tips: str | None = None
    price_range: str | None = None
    photo_url: str | None = None
    order: int | None = None


class GuidePlaceResponse(BaseModel):
    id: str
    section_id: str
    name: str
    description: str | None
    category: str | None
    address: str | None
    latitude: float | None
    longitude: float | None
    place_id: str | None
    place_data: dict | None
    notes: str | None
    tips: str | None
    price_range: str | None
    photo_url: str | None
    order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ GuideSection Schemas ============

class GuideSectionCreate(BaseModel):
    title: str
    description: str | None = None
    order: int = 0


class GuideSectionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    order: int | None = None


class GuideSectionResponse(BaseModel):
    id: str
    guide_id: str
    title: str
    description: str | None
    order: int
    created_at: datetime
    updated_at: datetime
    places: list[GuidePlaceResponse] = []

    class Config:
        from_attributes = True


# ============ Guide Schemas ============

class GuideCreate(BaseModel):
    title: str
    description: str | None = None
    destination: str
    cover_image_url: str | None = None
    visibility: GuideVisibilityEnum = "public"
    tags: list[str] = []
    location_tags: list[str] = []


class GuideUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    destination: str | None = None
    cover_image_url: str | None = None
    visibility: GuideVisibilityEnum | None = None
    tags: list[str] | None = None
    location_tags: list[str] | None = None


class AuthorResponse(BaseModel):
    id: str
    name: str
    avatar_url: str | None

    class Config:
        from_attributes = True


class GuideResponse(BaseModel):
    id: str
    title: str
    description: str | None
    destination: str
    cover_image_url: str | None
    visibility: str
    share_code: str
    view_count: int
    tags: list[str]
    location_tags: list[str]
    author_id: str
    author: AuthorResponse
    created_at: datetime
    updated_at: datetime
    sections: list[GuideSectionResponse] = []

    class Config:
        from_attributes = True


class GuideSummaryResponse(BaseModel):
    """Lighter response for list views without nested sections/places"""
    id: str
    title: str
    description: str | None
    destination: str
    cover_image_url: str | None
    visibility: str
    view_count: int
    tags: list[str]
    location_tags: list[str]
    author: AuthorResponse
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReorderRequest(BaseModel):
    item_ids: list[str]
