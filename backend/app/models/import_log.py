from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Enum, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
import uuid
import enum


class ImportSource(str, enum.Enum):
    EMAIL_PASTE = "email_paste"
    EMAIL_FORWARD = "email_forward"


class ImportStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"


class ImportLog(Base):
    __tablename__ = "import_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    trip_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("trips.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    source: Mapped[ImportSource] = mapped_column(
        Enum(ImportSource),
        default=ImportSource.EMAIL_PASTE,
        nullable=False
    )
    raw_content: Mapped[str] = mapped_column(Text, nullable=False)
    parsed_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[ImportStatus] = mapped_column(
        Enum(ImportStatus),
        default=ImportStatus.PENDING,
        nullable=False
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_items: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    trip = relationship("Trip", back_populates="import_logs")
    user = relationship("User", back_populates="import_logs")
