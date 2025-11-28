from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Enum, Float, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
import uuid
import enum


class ItineraryItemType(str, enum.Enum):
    FLIGHT = "flight"
    HOTEL = "hotel"
    EXPERIENCE = "experience"
    RESTAURANT = "restaurant"
    TRANSPORT = "transport"


class ItineraryItem(Base):
    __tablename__ = "itinerary_items"

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
    type: Mapped[ItineraryItemType] = mapped_column(Enum(ItineraryItemType), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    location: Mapped[str | None] = mapped_column(String(500), nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    price: Mapped[float | None] = mapped_column(Float, nullable=True)
    currency: Mapped[str | None] = mapped_column(String(3), nullable=True, default="USD")
    booking_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    booking_confirmed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    trip = relationship("Trip", back_populates="itinerary_items")
