from pydantic import BaseModel
from datetime import date, time, datetime
from typing import Literal


AlertType = Literal[
    "rain", "snow", "extreme_heat", "extreme_cold",
    "high_wind", "poor_aqi", "high_uv", "low_visibility"
]
AlertSeverity = Literal["warning", "severe"]


class WeatherDay(BaseModel):
    """Weather forecast for a single day."""
    date: date
    temp_high: float | None = None
    temp_low: float | None = None
    feels_like_high: float | None = None
    feels_like_low: float | None = None
    condition: str | None = None
    condition_icon: str | None = None
    precipitation_chance: float | None = None
    precipitation_mm: float | None = None
    humidity: int | None = None
    wind_speed: float | None = None  # km/h
    wind_gust: float | None = None  # km/h
    uv_index: float | None = None
    air_quality_index: int | None = None  # 1-5 scale
    visibility_km: float | None = None
    sunrise: time | None = None
    sunset: time | None = None
    available: bool = True  # False if beyond forecast range

    class Config:
        from_attributes = True


class WeatherAlert(BaseModel):
    """Weather alert for a specific day."""
    date: date
    type: AlertType
    severity: AlertSeverity
    message: str


class WeatherSummary(BaseModel):
    """Aggregated weather summary for a trip."""
    temp_range_low: float | None = None
    temp_range_high: float | None = None
    dominant_condition: str | None = None
    dominant_condition_icon: str | None = None
    alert_count: int = 0
    top_alerts: list[WeatherAlert] = []


class WeatherResponse(BaseModel):
    """Complete weather response for a trip."""
    summary: WeatherSummary
    daily: list[WeatherDay]
    alerts: list[WeatherAlert]
    last_updated: datetime | None = None


class ApiUsageStats(BaseModel):
    """API usage statistics for admin dashboard."""
    service: str
    today_count: int
    month_count: int
    daily_limit: int | None = None
    cache_hit_rate: float
    avg_response_time_ms: float
    error_rate: float


class ApiUsageResponse(BaseModel):
    """API usage response for admin dashboard."""
    services: list[ApiUsageStats]
    daily_calls: list[dict]  # [{date, count, cache_hits}]
