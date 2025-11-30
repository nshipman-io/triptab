from datetime import datetime
from sqlalchemy import String, DateTime, Text, Integer, Float, ForeignKey, Enum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
import uuid
import secrets
import enum


class GuideVisibility(str, enum.Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    UNLISTED = "unlisted"


class Guide(Base):
    __tablename__ = "guides"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    destination: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    cover_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    visibility: Mapped[GuideVisibility] = mapped_column(
        Enum(GuideVisibility),
        default=GuideVisibility.PUBLIC,
        nullable=False
    )
    share_code: Mapped[str] = mapped_column(
        String(12),
        unique=True,
        index=True,
        default=lambda: secrets.token_urlsafe(8)
    )
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tags: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    location_tags: Mapped[list] = mapped_column(JSON, nullable=False, default=list)  # For location-based search
    author_id: Mapped[str] = mapped_column(
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
    author = relationship("User", back_populates="guides")
    sections = relationship(
        "GuideSection",
        back_populates="guide",
        cascade="all, delete-orphan",
        order_by="GuideSection.order"
    )


class GuideSection(Base):
    __tablename__ = "guide_sections"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    guide_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("guides.id", ondelete="CASCADE"),
        nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
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
    guide = relationship("Guide", back_populates="sections")
    places = relationship(
        "GuidePlace",
        back_populates="section",
        cascade="all, delete-orphan",
        order_by="GuidePlace.order"
    )


class GuidePlace(Base):
    __tablename__ = "guide_places"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    section_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("guide_sections.id", ondelete="CASCADE"),
        nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    place_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    place_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    tips: Mapped[str | None] = mapped_column(Text, nullable=True)
    price_range: Mapped[str | None] = mapped_column(String(50), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
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
    section = relationship("GuideSection", back_populates="places")
