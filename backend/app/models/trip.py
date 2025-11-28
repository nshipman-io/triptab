from datetime import datetime
from sqlalchemy import String, DateTime, Date, ForeignKey, Enum, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
import uuid
import secrets
import enum


class MemberRole(str, enum.Enum):
    OWNER = "owner"
    EDITOR = "editor"
    VIEWER = "viewer"


class MemberStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    destination: Mapped[str] = mapped_column(String(255), nullable=False)
    start_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    end_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    preferences: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    share_code: Mapped[str] = mapped_column(
        String(12),
        unique=True,
        index=True,
        default=lambda: secrets.token_urlsafe(8)
    )
    owner_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    owner = relationship("User", back_populates="owned_trips")
    members = relationship("TripMember", back_populates="trip", cascade="all, delete-orphan")
    itinerary_items = relationship("ItineraryItem", back_populates="trip", cascade="all, delete-orphan")


class TripMember(Base):
    __tablename__ = "trip_members"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    trip_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("trips.id", ondelete="CASCADE"),
        nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    role: Mapped[MemberRole] = mapped_column(
        Enum(MemberRole),
        default=MemberRole.VIEWER,
        nullable=False
    )
    status: Mapped[MemberStatus] = mapped_column(
        Enum(MemberStatus),
        default=MemberStatus.PENDING,
        nullable=False
    )
    tickets_confirmed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    trip = relationship("Trip", back_populates="members")
    user = relationship("User", back_populates="trip_memberships")
