"""OpenWeatherMap API integration for weather forecasts."""

import logging
from datetime import datetime, date, time, timedelta
from collections import Counter
import httpx
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.weather import WeatherCache, ApiCallLog
from app.schemas.weather import (
    WeatherDay, WeatherAlert, WeatherSummary, WeatherResponse
)

logger = logging.getLogger(__name__)

# OpenWeatherMap API endpoints
OWM_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"
OWM_AIR_POLLUTION_URL = "https://api.openweathermap.org/data/2.5/air_pollution/forecast"
OWM_GEOCODING_URL = "https://api.openweathermap.org/geo/1.0/direct"
OWM_UV_URL = "https://api.openweathermap.org/data/2.5/uvi/forecast"

# Alert thresholds
THRESHOLDS = {
    "precipitation_chance": 30,  # >30% = rain/snow warning
    "extreme_heat_c": 35,  # >35°C = extreme heat
    "extreme_cold_c": 0,  # <0°C = extreme cold
    "high_wind_kmh": 50,  # >50 km/h = high wind
    "poor_aqi": 4,  # AQI >=4 = poor air quality
    "high_uv": 8,  # UV >=8 = high UV
    "low_visibility_km": 1,  # <1km = low visibility
}


class WeatherService:
    """Service for fetching and caching weather forecasts."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.api_key = settings.OPENWEATHERMAP_API_KEY
        self.cache_ttl_hours = settings.WEATHER_CACHE_TTL_HOURS

    async def get_weather_for_trip(
        self,
        destination: str,
        start_date: date,
        end_date: date,
        user_id: str | None = None,
        trip_id: str | None = None,
    ) -> WeatherResponse:
        """
        Get weather forecast for a trip's destination and date range.

        Returns cached data if available and fresh, otherwise fetches from API.
        """
        if not settings.WEATHER_ENABLED:
            return self._empty_response(start_date, end_date)

        # Generate list of dates for the trip
        trip_dates = self._get_date_range(start_date, end_date)
        today = date.today()

        # Filter to only future dates (can't get forecast for past)
        forecast_dates = [d for d in trip_dates if d >= today]

        if not forecast_dates:
            # Trip is entirely in the past
            return self._empty_response(start_date, end_date, message="Trip dates are in the past")

        # Check cache for existing data
        cached_weather = await self._get_cached_weather(destination, forecast_dates)

        # Determine which dates need fetching
        cached_dates = {w.date for w in cached_weather if self._is_cache_fresh(w)}
        dates_to_fetch = [d for d in forecast_dates if d not in cached_dates]

        # Fetch missing data from API if needed
        if dates_to_fetch and self.api_key:
            await self._fetch_and_cache_weather(
                destination,
                dates_to_fetch,
                user_id=user_id,
                trip_id=trip_id,
            )
            # Re-fetch from cache to get updated data
            cached_weather = await self._get_cached_weather(destination, forecast_dates)

        # Build response
        daily_weather = self._build_daily_weather(trip_dates, cached_weather, today)
        alerts = self._generate_alerts(daily_weather)
        summary = self._build_summary(daily_weather, alerts)

        # Get last updated time
        last_updated = None
        if cached_weather:
            last_updated = max(w.fetched_at for w in cached_weather)

        return WeatherResponse(
            summary=summary,
            daily=daily_weather,
            alerts=alerts,
            last_updated=last_updated,
        )

    async def refresh_weather(
        self,
        destination: str,
        start_date: date,
        end_date: date,
        user_id: str | None = None,
        trip_id: str | None = None,
    ) -> WeatherResponse:
        """Force refresh weather data from API."""
        if not self.api_key:
            logger.warning("OPENWEATHERMAP_API_KEY not configured")
            return self._empty_response(start_date, end_date)

        trip_dates = self._get_date_range(start_date, end_date)
        today = date.today()
        forecast_dates = [d for d in trip_dates if d >= today]

        if forecast_dates:
            await self._fetch_and_cache_weather(
                destination,
                forecast_dates,
                user_id=user_id,
                trip_id=trip_id,
                force=True,
            )

        return await self.get_weather_for_trip(
            destination, start_date, end_date, user_id, trip_id
        )

    async def _get_cached_weather(
        self, location: str, dates: list[date]
    ) -> list[WeatherCache]:
        """Retrieve cached weather data for location and dates."""
        if not dates:
            return []

        result = await self.db.execute(
            select(WeatherCache).where(
                and_(
                    WeatherCache.location == location.lower(),
                    WeatherCache.date.in_(dates),
                )
            )
        )
        return list(result.scalars().all())

    def _is_cache_fresh(self, cache: WeatherCache) -> bool:
        """Check if cached data is still valid."""
        age = datetime.utcnow() - cache.fetched_at
        return age < timedelta(hours=self.cache_ttl_hours)

    async def _fetch_and_cache_weather(
        self,
        location: str,
        dates: list[date],
        user_id: str | None = None,
        trip_id: str | None = None,
        force: bool = False,
    ) -> None:
        """Fetch weather from OpenWeatherMap and cache results."""
        start_time = datetime.utcnow()
        status_code = None

        try:
            # First, geocode the location
            coords = await self._geocode_location(location)
            if not coords:
                logger.warning(f"Could not geocode location: {location}")
                return

            lat, lon = coords

            # Fetch 5-day forecast
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    OWM_FORECAST_URL,
                    params={
                        "lat": lat,
                        "lon": lon,
                        "appid": self.api_key,
                        "units": "metric",
                    },
                    timeout=10.0,
                )
                status_code = response.status_code

                if response.status_code != 200:
                    logger.error(f"OpenWeatherMap API error: {response.status_code}")
                    return

                data = response.json()

            # Also try to fetch air quality
            aqi_data = await self._fetch_air_quality(lat, lon)

            # Process and cache the forecast data
            await self._process_forecast_data(
                location, data, aqi_data, dates, force
            )

        except httpx.TimeoutException:
            logger.warning(f"Timeout fetching weather for: {location}")
            status_code = 408
        except Exception as e:
            logger.exception(f"Error fetching weather: {e}")
            status_code = 500
        finally:
            # Log API call
            response_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            await self._log_api_call(
                service="openweathermap",
                endpoint="forecast",
                location=location,
                status_code=status_code,
                response_time_ms=response_time,
                cache_hit=False,
                user_id=user_id,
                trip_id=trip_id,
            )

    async def _geocode_location(self, location: str) -> tuple[float, float] | None:
        """Convert location name to coordinates."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    OWM_GEOCODING_URL,
                    params={
                        "q": location,
                        "limit": 1,
                        "appid": self.api_key,
                    },
                    timeout=10.0,
                )

                if response.status_code != 200:
                    return None

                data = response.json()
                if not data:
                    return None

                return (data[0]["lat"], data[0]["lon"])
        except Exception as e:
            logger.exception(f"Geocoding error: {e}")
            return None

    async def _fetch_air_quality(
        self, lat: float, lon: float
    ) -> dict[date, int] | None:
        """Fetch air quality forecast data."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    OWM_AIR_POLLUTION_URL,
                    params={
                        "lat": lat,
                        "lon": lon,
                        "appid": self.api_key,
                    },
                    timeout=10.0,
                )

                if response.status_code != 200:
                    return None

                data = response.json()

                # Map AQI by date (take worst AQI for each day)
                aqi_by_date: dict[date, int] = {}
                for item in data.get("list", []):
                    dt = datetime.fromtimestamp(item["dt"]).date()
                    aqi = item.get("main", {}).get("aqi", 1)
                    if dt not in aqi_by_date or aqi > aqi_by_date[dt]:
                        aqi_by_date[dt] = aqi

                return aqi_by_date
        except Exception as e:
            logger.warning(f"Failed to fetch AQI: {e}")
            return None

    async def _process_forecast_data(
        self,
        location: str,
        forecast_data: dict,
        aqi_data: dict[date, int] | None,
        requested_dates: list[date],
        force: bool,
    ) -> None:
        """Process forecast response and save to cache."""
        # Group forecast entries by date
        daily_data: dict[date, list] = {}

        for item in forecast_data.get("list", []):
            dt = datetime.fromtimestamp(item["dt"])
            item_date = dt.date()

            if item_date not in daily_data:
                daily_data[item_date] = []
            daily_data[item_date].append(item)

        # Get city sunrise/sunset info
        city = forecast_data.get("city", {})
        sunrise_ts = city.get("sunrise")
        sunset_ts = city.get("sunset")

        sunrise = time.fromisoformat(
            datetime.fromtimestamp(sunrise_ts).strftime("%H:%M:%S")
        ) if sunrise_ts else None
        sunset = time.fromisoformat(
            datetime.fromtimestamp(sunset_ts).strftime("%H:%M:%S")
        ) if sunset_ts else None

        now = datetime.utcnow()
        location_lower = location.lower()

        for forecast_date, entries in daily_data.items():
            # Only process dates we requested
            if forecast_date not in requested_dates:
                continue

            # Aggregate daily values
            temps = [e["main"]["temp"] for e in entries]
            feels_like = [e["main"]["feels_like"] for e in entries]
            humidity = [e["main"]["humidity"] for e in entries]
            wind_speeds = [e["wind"]["speed"] * 3.6 for e in entries]  # m/s to km/h
            wind_gusts = [e["wind"].get("gust", 0) * 3.6 for e in entries]
            visibility = [e.get("visibility", 10000) / 1000 for e in entries]  # m to km

            # Precipitation - check for rain or snow
            precip_probs = []
            precip_amounts = []
            for e in entries:
                pop = e.get("pop", 0) * 100  # probability of precipitation
                precip_probs.append(pop)
                rain = e.get("rain", {}).get("3h", 0)
                snow = e.get("snow", {}).get("3h", 0)
                precip_amounts.append(rain + snow)

            # Get most common weather condition
            conditions = [e["weather"][0]["main"] for e in entries]
            condition = Counter(conditions).most_common(1)[0][0]

            # Get icon for most common condition at midday or first occurrence
            midday_entries = [e for e in entries if 11 <= datetime.fromtimestamp(e["dt"]).hour <= 14]
            icon_entry = midday_entries[0] if midday_entries else entries[0]
            condition_icon = icon_entry["weather"][0]["icon"]

            # Get AQI for this date if available
            aqi = aqi_data.get(forecast_date) if aqi_data else None

            # Check if we already have this entry
            existing = await self.db.execute(
                select(WeatherCache).where(
                    and_(
                        WeatherCache.location == location_lower,
                        WeatherCache.date == forecast_date,
                    )
                )
            )
            existing_cache = existing.scalar_one_or_none()

            weather_data = {
                "temp_high": max(temps),
                "temp_low": min(temps),
                "feels_like_high": max(feels_like),
                "feels_like_low": min(feels_like),
                "condition": condition,
                "condition_icon": condition_icon,
                "precipitation_chance": max(precip_probs),
                "precipitation_mm": sum(precip_amounts),
                "humidity": int(sum(humidity) / len(humidity)),
                "wind_speed": max(wind_speeds),
                "wind_gust": max(wind_gusts) if any(wind_gusts) else None,
                "uv_index": None,  # Not available in free tier
                "air_quality_index": aqi,
                "visibility_km": min(visibility),
                "sunrise": sunrise,
                "sunset": sunset,
                "fetched_at": now,
            }

            if existing_cache:
                if force or not self._is_cache_fresh(existing_cache):
                    for key, value in weather_data.items():
                        setattr(existing_cache, key, value)
            else:
                cache_entry = WeatherCache(
                    location=location_lower,
                    date=forecast_date,
                    **weather_data,
                )
                self.db.add(cache_entry)

        await self.db.commit()

    def _build_daily_weather(
        self,
        trip_dates: list[date],
        cached_weather: list[WeatherCache],
        today: date,
    ) -> list[WeatherDay]:
        """Build list of daily weather from cache."""
        cache_by_date = {w.date: w for w in cached_weather}
        daily = []

        # OpenWeatherMap free tier = 5 day forecast
        max_forecast_date = today + timedelta(days=5)

        for d in trip_dates:
            cache = cache_by_date.get(d)

            if d < today:
                # Past date
                daily.append(WeatherDay(date=d, available=False))
            elif d > max_forecast_date:
                # Beyond forecast range
                daily.append(WeatherDay(date=d, available=False))
            elif cache:
                daily.append(WeatherDay(
                    date=cache.date,
                    temp_high=cache.temp_high,
                    temp_low=cache.temp_low,
                    feels_like_high=cache.feels_like_high,
                    feels_like_low=cache.feels_like_low,
                    condition=cache.condition,
                    condition_icon=cache.condition_icon,
                    precipitation_chance=cache.precipitation_chance,
                    precipitation_mm=cache.precipitation_mm,
                    humidity=cache.humidity,
                    wind_speed=cache.wind_speed,
                    wind_gust=cache.wind_gust,
                    uv_index=cache.uv_index,
                    air_quality_index=cache.air_quality_index,
                    visibility_km=cache.visibility_km,
                    sunrise=cache.sunrise,
                    sunset=cache.sunset,
                    available=True,
                ))
            else:
                # No data available
                daily.append(WeatherDay(date=d, available=False))

        return daily

    def _generate_alerts(self, daily_weather: list[WeatherDay]) -> list[WeatherAlert]:
        """Generate weather alerts based on conditions."""
        alerts = []

        for day in daily_weather:
            if not day.available:
                continue

            # Precipitation alerts
            if day.precipitation_chance and day.precipitation_chance > THRESHOLDS["precipitation_chance"]:
                condition_lower = (day.condition or "").lower()
                if "snow" in condition_lower:
                    alerts.append(WeatherAlert(
                        date=day.date,
                        type="snow",
                        severity="warning",
                        message=f"Snow expected ({day.precipitation_chance:.0f}% chance) - plan for winter conditions",
                    ))
                else:
                    alerts.append(WeatherAlert(
                        date=day.date,
                        type="rain",
                        severity="warning",
                        message=f"Rain expected ({day.precipitation_chance:.0f}% chance) - consider indoor alternatives",
                    ))

            # Extreme heat
            if day.temp_high and day.temp_high > THRESHOLDS["extreme_heat_c"]:
                alerts.append(WeatherAlert(
                    date=day.date,
                    type="extreme_heat",
                    severity="severe",
                    message=f"Extreme heat ({day.temp_high:.0f}°C) - stay hydrated, limit outdoor activities",
                ))

            # Extreme cold
            if day.temp_low is not None and day.temp_low < THRESHOLDS["extreme_cold_c"]:
                alerts.append(WeatherAlert(
                    date=day.date,
                    type="extreme_cold",
                    severity="severe",
                    message=f"Freezing temperatures ({day.temp_low:.0f}°C) - dress warmly, watch for ice",
                ))

            # High wind
            if day.wind_speed and day.wind_speed > THRESHOLDS["high_wind_kmh"]:
                alerts.append(WeatherAlert(
                    date=day.date,
                    type="high_wind",
                    severity="warning",
                    message=f"High winds ({day.wind_speed:.0f} km/h) - outdoor activities may be affected",
                ))

            # Poor air quality
            if day.air_quality_index and day.air_quality_index >= THRESHOLDS["poor_aqi"]:
                alerts.append(WeatherAlert(
                    date=day.date,
                    type="poor_aqi",
                    severity="warning",
                    message="Poor air quality - limit prolonged outdoor exposure",
                ))

            # High UV
            if day.uv_index and day.uv_index >= THRESHOLDS["high_uv"]:
                alerts.append(WeatherAlert(
                    date=day.date,
                    type="high_uv",
                    severity="warning",
                    message=f"High UV index ({day.uv_index:.0f}) - use sun protection",
                ))

            # Low visibility
            if day.visibility_km and day.visibility_km < THRESHOLDS["low_visibility_km"]:
                alerts.append(WeatherAlert(
                    date=day.date,
                    type="low_visibility",
                    severity="warning",
                    message=f"Low visibility ({day.visibility_km:.1f} km) - fog expected",
                ))

        return alerts

    def _build_summary(
        self, daily_weather: list[WeatherDay], alerts: list[WeatherAlert]
    ) -> WeatherSummary:
        """Build weather summary from daily data."""
        available_days = [d for d in daily_weather if d.available]

        if not available_days:
            return WeatherSummary(alert_count=len(alerts))

        temp_lows = [d.temp_low for d in available_days if d.temp_low is not None]
        temp_highs = [d.temp_high for d in available_days if d.temp_high is not None]
        conditions = [d.condition for d in available_days if d.condition]

        # Get most common condition
        dominant_condition = None
        dominant_icon = None
        if conditions:
            dominant_condition = Counter(conditions).most_common(1)[0][0]
            # Find icon for dominant condition
            for d in available_days:
                if d.condition == dominant_condition:
                    dominant_icon = d.condition_icon
                    break

        return WeatherSummary(
            temp_range_low=min(temp_lows) if temp_lows else None,
            temp_range_high=max(temp_highs) if temp_highs else None,
            dominant_condition=dominant_condition,
            dominant_condition_icon=dominant_icon,
            alert_count=len(alerts),
            top_alerts=alerts[:2],
        )

    async def _log_api_call(
        self,
        service: str,
        endpoint: str,
        location: str | None,
        status_code: int | None,
        response_time_ms: int,
        cache_hit: bool,
        user_id: str | None,
        trip_id: str | None,
    ) -> None:
        """Log an API call for monitoring."""
        log_entry = ApiCallLog(
            service=service,
            endpoint=endpoint,
            location=location,
            status_code=status_code,
            response_time_ms=response_time_ms,
            cache_hit=cache_hit,
            user_id=user_id,
            trip_id=trip_id,
        )
        self.db.add(log_entry)
        await self.db.commit()

    def _get_date_range(self, start: date, end: date) -> list[date]:
        """Generate list of dates between start and end (inclusive)."""
        dates = []
        current = start
        while current <= end:
            dates.append(current)
            current += timedelta(days=1)
        return dates

    def _empty_response(
        self, start_date: date, end_date: date, message: str | None = None
    ) -> WeatherResponse:
        """Create empty response for disabled weather or errors."""
        dates = self._get_date_range(start_date, end_date)
        return WeatherResponse(
            summary=WeatherSummary(),
            daily=[WeatherDay(date=d, available=False) for d in dates],
            alerts=[],
            last_updated=None,
        )
