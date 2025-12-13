from datetime import datetime, date, time
from sqlalchemy import String, DateTime, Date, Time, Float, Integer, Boolean, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
import uuid


class WeatherCache(Base):
    """Cached weather forecast data by location and date."""
    __tablename__ = "weather_cache"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    temp_high: Mapped[float | None] = mapped_column(Float, nullable=True)
    temp_low: Mapped[float | None] = mapped_column(Float, nullable=True)
    feels_like_high: Mapped[float | None] = mapped_column(Float, nullable=True)
    feels_like_low: Mapped[float | None] = mapped_column(Float, nullable=True)
    condition: Mapped[str | None] = mapped_column(String(50), nullable=True)
    condition_icon: Mapped[str | None] = mapped_column(String(10), nullable=True)
    precipitation_chance: Mapped[float | None] = mapped_column(Float, nullable=True)
    precipitation_mm: Mapped[float | None] = mapped_column(Float, nullable=True)
    humidity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    wind_speed: Mapped[float | None] = mapped_column(Float, nullable=True)
    wind_gust: Mapped[float | None] = mapped_column(Float, nullable=True)
    uv_index: Mapped[float | None] = mapped_column(Float, nullable=True)
    air_quality_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    visibility_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    sunrise: Mapped[time | None] = mapped_column(Time, nullable=True)
    sunset: Mapped[time | None] = mapped_column(Time, nullable=True)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
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

    __table_args__ = (
        Index('idx_weather_cache_location_date', 'location', 'date', unique=True),
        Index('idx_weather_cache_fetched_at', 'fetched_at'),
    )


class ApiCallLog(Base):
    """Log of external API calls for monitoring and rate limiting."""
    __tablename__ = "api_call_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    service: Mapped[str] = mapped_column(String(50), nullable=False)
    endpoint: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cache_hit: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    user_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    trip_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("trips.id", ondelete="SET NULL"),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    __table_args__ = (
        Index('idx_api_call_logs_service', 'service'),
        Index('idx_api_call_logs_created_at', 'created_at'),
    )
