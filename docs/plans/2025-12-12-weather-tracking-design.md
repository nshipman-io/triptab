# Weather Tracking Feature Design

**Date:** 2025-12-12
**Status:** Approved
**Branch:** `feature/weather-tracking`

## Overview

Add weather forecasting to TripTab so travelers can prepare for their trips and receive notices about weather conditions that may affect their plans.

### Goals

1. **Forecast display** - Show weather forecasts for upcoming trip dates so users can pack appropriately
2. **Weather notices** - Alert users in their itinerary when weather conditions might affect planned activities

### Non-Goals

- Push notifications or email alerts
- Historical weather data
- Weather-based trip date recommendations

## Data Model

### Weather Cache Table

```sql
CREATE TABLE weather_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    temp_high FLOAT,
    temp_low FLOAT,
    feels_like_high FLOAT,
    feels_like_low FLOAT,
    condition VARCHAR(50),
    condition_icon VARCHAR(10),
    precipitation_chance FLOAT,
    precipitation_mm FLOAT,
    humidity INTEGER,
    wind_speed FLOAT,
    wind_gust FLOAT,
    uv_index FLOAT,
    air_quality_index INTEGER,
    visibility_km FLOAT,
    sunrise TIME,
    sunset TIME,
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(location, date)
);

CREATE INDEX idx_weather_cache_location_date ON weather_cache(location, date);
CREATE INDEX idx_weather_cache_fetched_at ON weather_cache(fetched_at);
```

### API Call Logs Table

```sql
CREATE TABLE api_call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service VARCHAR(50) NOT NULL,
    endpoint VARCHAR(255),
    location VARCHAR(255),
    status_code INTEGER,
    response_time_ms INTEGER,
    cache_hit BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES users(id),
    trip_id UUID REFERENCES trips(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_call_logs_service ON api_call_logs(service);
CREATE INDEX idx_api_call_logs_created_at ON api_call_logs(created_at);
```

## Caching Strategy

- **TTL:** 6 hours
- **Key:** `(normalized_location, date)`
- **Logic:**
  1. On request, check if record exists for location + date
  2. If `fetched_at` is within 6 hours, return cached data
  3. If stale or missing, fetch from OpenWeatherMap, store, return
- **Benefit:** Multiple users viewing same destination share cached data

## Backend Architecture

### Weather Service

**Location:** `/backend/app/services/weather/openweathermap.py`

```python
class WeatherService:
    async def get_forecast(
        self,
        location: str,
        start_date: date,
        end_date: date
    ) -> list[WeatherDay]:
        """Fetch weather forecast, using cache when available."""
        pass

    async def get_weather_alerts(
        self,
        weather: WeatherDay
    ) -> list[WeatherAlert]:
        """Generate alerts based on weather conditions."""
        pass

    async def refresh_cache(
        self,
        location: str,
        dates: list[date]
    ) -> None:
        """Force refresh cache for specific location/dates."""
        pass
```

### API Endpoints

**Location:** `/backend/app/api/routes/weather.py`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/trips/{trip_id}/weather` | Get weather forecast and alerts for trip |
| POST | `/trips/{trip_id}/weather/refresh` | Force cache refresh |

**Response Schema:**

```python
class WeatherResponse(BaseModel):
    summary: WeatherSummary
    daily: list[WeatherDay]
    alerts: list[WeatherAlert]

class WeatherSummary(BaseModel):
    temp_range_low: float
    temp_range_high: float
    dominant_condition: str
    alert_count: int

class WeatherDay(BaseModel):
    date: date
    temp_high: float
    temp_low: float
    feels_like_high: float
    feels_like_low: float
    condition: str
    condition_icon: str
    precipitation_chance: float
    precipitation_mm: float
    humidity: int
    wind_speed: float
    wind_gust: float
    uv_index: float
    air_quality_index: int
    visibility_km: float
    sunrise: time
    sunset: time

class WeatherAlert(BaseModel):
    date: date
    type: str  # rain, snow, extreme_heat, extreme_cold, high_wind, poor_aqi, high_uv, low_visibility
    severity: str  # warning, severe
    message: str
```

### Alert Thresholds

| Condition | Threshold | Severity |
|-----------|-----------|----------|
| Rain/Snow | >30% precipitation | warning |
| Extreme Heat | >35°C (95°F) | severe |
| Extreme Cold | <0°C (32°F) | severe |
| High Wind | >50 km/h | warning |
| Poor Air Quality | AQI >= 4 | warning |
| High UV | UV index >= 8 | warning |
| Low Visibility | <1 km | warning |

## Frontend Components

### WeatherSummary (Sidebar)

**Location:** Right sidebar in TripDetail, below Trip Details section

**Display:**
```
┌─────────────────────────────┐
│ Weather                     │
├─────────────────────────────┤
│ Paris, France               │
│ Dec 15-20                   │
│                             │
│ 8°C - 14°C  │  Mostly Cloudy│
│ (avg range)                 │
│                             │
│ ⚠ 2 weather alerts          │
│   Rain on Dec 17            │
│   High wind on Dec 18       │
│                             │
│ [View Details]              │
└─────────────────────────────┘
```

**Behavior:**
- Aggregated temperature range across all trip days
- Most common condition as summary
- Alert count with top 2 listed
- "View Details" scrolls to itinerary
- Loading skeleton while fetching
- "Weather unavailable" on API failure
- Hidden for past trips

### DayWeather (Itinerary)

**Location:** Top of each day section in ItineraryTab

**Display:**
```
┌─────────────────────────────────────────────────────┐
│ Tuesday, Dec 17                                     │
├─────────────────────────────────────────────────────┤
│ 🌧 12°C (feels 9°C) │ Rain │ 💧 75% │ 💨 25km/h    │
│ ↑14° ↓8° │ UV: 2 │ AQI: Good │ 🌅 8:12 🌇 17:04   │
├─────────────────────────────────────────────────────┤
│ ⚠ Rain expected - consider indoor alternatives     │
│   for outdoor activities                           │
├─────────────────────────────────────────────────────┤
│ [Itinerary items for this day...]                  │
└─────────────────────────────────────────────────────┘
```

**Weather Notice Bar:**
- Yellow/amber background for warnings
- Red for severe conditions
- Only shows when alerts exist for that day
- Contextual message based on alert type
- Collapsible by user preference

### Admin Dashboard - API Usage

**Location:** Admin analytics dashboard (`/admin`)

**Display:**
```
┌─────────────────────────────────────────────────────┐
│ API Usage                                           │
├─────────────────────────────────────────────────────┤
│ OpenWeatherMap        │ Today: 45  │ Month: 892    │
│ ████████░░ 45% of daily limit (1000)               │
│                                                     │
│ Cache Hit Rate: 78%                                 │
│ Avg Response Time: 245ms                            │
├─────────────────────────────────────────────────────┤
│ [Chart: API calls over last 7 days]                 │
│ [Chart: Cache hits vs misses]                       │
└─────────────────────────────────────────────────────┘
```

**Metrics:**
- Daily/monthly call counts per service
- Cache hit rate
- Average response time
- Error rate
- Top locations queried

## Error Handling

### API Failures

| Error | Handling |
|-------|----------|
| Network timeout | Show "Weather temporarily unavailable" with retry button |
| Rate limit (429) | Serve stale cache if available, log warning |
| Invalid location | Show "Weather unavailable for this destination" |
| General failure | Never block trip loading - weather is progressive enhancement |

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Trip in past | Hide weather section entirely |
| Trip starts today | Show weather, highlight "today" |
| Trip > 5 days out | Show "Forecast available closer to trip" |
| Trip spans > 5 days | Show available days, "Forecast unavailable" for rest |
| No destination set | Hide weather section |
| Shared trip (viewer) | Show weather (read-only, no refresh button) |

## Configuration

```bash
# Environment variables
OPENWEATHERMAP_API_KEY=xxx
WEATHER_CACHE_TTL_HOURS=6
WEATHER_ENABLED=true  # feature flag
```

## API Integration

### OpenWeatherMap

- **Plan:** Free tier
- **Limits:** 1,000 calls/day
- **Forecast range:** 5 days
- **Endpoints used:**
  - `/data/2.5/forecast` - 5-day forecast
  - `/data/2.5/air_pollution` - Air quality data

## Implementation Checklist

- [ ] Database migrations for `weather_cache` and `api_call_logs`
- [ ] WeatherService with OpenWeatherMap integration
- [ ] Weather API routes with authentication
- [ ] API call logging middleware
- [ ] WeatherSummary sidebar component
- [ ] DayWeather itinerary component
- [ ] Weather alerts logic and display
- [ ] Admin dashboard API usage section
- [ ] Unit tests for weather service
- [ ] Integration tests for weather endpoints
- [ ] Error handling and edge cases
- [ ] Environment configuration and feature flag
