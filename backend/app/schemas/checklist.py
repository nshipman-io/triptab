from pydantic import BaseModel
from datetime import datetime
from typing import Literal


ChecklistTypeEnum = Literal["packing", "todo", "shopping"]


class ChecklistItemCreate(BaseModel):
    content: str
    assigned_to_id: str | None = None
    order: int = 0


class ChecklistItemUpdate(BaseModel):
    content: str | None = None
    is_completed: bool | None = None
    assigned_to_id: str | None = None
    order: int | None = None


class ChecklistItemResponse(BaseModel):
    id: str
    checklist_id: str
    content: str
    is_completed: bool
    assigned_to_id: str | None
    order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChecklistCreate(BaseModel):
    name: str
    type: ChecklistTypeEnum = "todo"
    order: int = 0


class ChecklistUpdate(BaseModel):
    name: str | None = None
    type: ChecklistTypeEnum | None = None
    order: int | None = None


class ChecklistResponse(BaseModel):
    id: str
    trip_id: str
    name: str
    type: str
    created_by_id: str
    order: int
    created_at: datetime
    updated_at: datetime
    items: list[ChecklistItemResponse] = []

    class Config:
        from_attributes = True


class ReorderRequest(BaseModel):
    item_ids: list[str]
