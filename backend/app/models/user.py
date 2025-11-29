from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
import uuid


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    owned_trips = relationship("Trip", back_populates="owner", cascade="all, delete-orphan")
    trip_memberships = relationship("TripMember", back_populates="user", cascade="all, delete-orphan")
    created_checklists = relationship("Checklist", back_populates="created_by")
    assigned_checklist_items = relationship("ChecklistItem", back_populates="assigned_to")
    paid_expenses = relationship("Expense", back_populates="paid_by")
    expense_splits = relationship("ExpenseSplit", back_populates="user")
    import_logs = relationship("ImportLog", back_populates="user")
