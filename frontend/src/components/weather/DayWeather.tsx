import { useState } from 'react'
import {
  Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Droplets,
  Thermometer, Eye, Sunrise, Sunset, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { WeatherDay, WeatherAlert } from '@/types'

interface DayWeatherProps {
  weather: WeatherDay
  alerts: WeatherAlert[]
  defaultExpanded?: boolean
}

// Map OpenWeatherMap condition codes to icons
function getWeatherIcon(condition: string | null, size: 'sm' | 'md' = 'md') {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  if (!condition) return <Cloud className={`${sizeClass} text-ink-light`} />

  const conditionLower = condition.toLowerCase()

  if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
    return <CloudLightning className={`${sizeClass} text-yellow-500`} />
  }
  if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
    return <CloudRain className={`${sizeClass} text-blue-500`} />
  }
  if (conditionLower.includes('snow')) {
    return <CloudSnow className={`${sizeClass} text-blue-300`} />
  }
  if (conditionLower.includes('clear') || conditionLower.includes('sun')) {
    return <Sun className={`${sizeClass} text-yellow-500`} />
  }
  if (conditionLower.includes('cloud')) {
    return <Cloud className={`${sizeClass} text-gray-400`} />
  }

  return <Cloud className={`${sizeClass} text-ink-light`} />
}

function getAqiLabel(aqi: number | null): string {
  if (aqi === null) return 'N/A'
  if (aqi <= 1) return 'Good'
  if (aqi <= 2) return 'Fair'
  if (aqi <= 3) return 'Moderate'
  if (aqi <= 4) return 'Poor'
  return 'Very Poor'
}

function getAqiColor(aqi: number | null): string {
  if (aqi === null) return 'text-ink-light'
  if (aqi <= 1) return 'text-green-600'
  if (aqi <= 2) return 'text-yellow-600'
  if (aqi <= 3) return 'text-orange-500'
  return 'text-red-500'
}

export function DayWeather({ weather, alerts, defaultExpanded = false }: DayWeatherProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  if (!weather.available) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-sand-dark/50 rounded-lg text-sm text-ink-light">
        <Cloud className="h-4 w-4" />
        <span>Forecast not available</span>
      </div>
    )
  }

  const hasAlerts = alerts.length > 0
  const isSevere = alerts.some(a => a.severity === 'severe')

  return (
    <div className="rounded-lg border border-sand-dark bg-cream overflow-hidden">
      {/* Main weather row - always visible */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-sand/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          {/* Weather icon and condition */}
          <div className="flex items-center gap-2">
            {getWeatherIcon(weather.condition)}
            <span className="font-medium">
              {weather.temp_high !== null ? `${Math.round(weather.temp_high)}°` : '--'}
              {weather.feels_like_high !== null && weather.temp_high !== null && (
                <span className="text-ink-light text-sm ml-1">
                  (feels {Math.round(weather.feels_like_high)}°)
                </span>
              )}
            </span>
          </div>

          {/* Condition */}
          <span className="text-sm text-ink-light hidden sm:inline">
            {weather.condition || 'Unknown'}
          </span>

          {/* Key stats */}
          <div className="hidden md:flex items-center gap-4 text-sm text-ink-light">
            {weather.precipitation_chance !== null && (
              <span className="flex items-center gap-1">
                <Droplets className="h-3 w-3" />
                {Math.round(weather.precipitation_chance)}%
              </span>
            )}
            {weather.wind_speed !== null && (
              <span className="flex items-center gap-1">
                <Wind className="h-3 w-3" />
                {Math.round(weather.wind_speed)} km/h
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Low temp */}
          <span className="text-sm text-ink-light">
            {weather.temp_low !== null ? `↓${Math.round(weather.temp_low)}°` : ''}
          </span>

          {/* Alert indicator */}
          {hasAlerts && (
            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
              isSevere ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
            }`}>
              <AlertTriangle className="h-3 w-3" />
              {alerts.length}
            </span>
          )}

          {/* Expand/collapse */}
          <Button variant="ghost" size="icon" className="h-6 w-6">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-sand-dark space-y-3">
          {/* Detailed stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {/* Temperature */}
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-terracotta" />
              <div>
                <p className="text-xs text-ink-light">Temp</p>
                <p className="font-medium">
                  {weather.temp_low !== null && weather.temp_high !== null
                    ? `${Math.round(weather.temp_low)}° - ${Math.round(weather.temp_high)}°`
                    : '--'
                  }
                </p>
              </div>
            </div>

            {/* Precipitation */}
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-ink-light">Precip</p>
                <p className="font-medium">
                  {weather.precipitation_chance !== null
                    ? `${Math.round(weather.precipitation_chance)}%`
                    : '--'
                  }
                </p>
              </div>
            </div>

            {/* Wind */}
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-ink-light">Wind</p>
                <p className="font-medium">
                  {weather.wind_speed !== null
                    ? `${Math.round(weather.wind_speed)} km/h`
                    : '--'
                  }
                </p>
              </div>
            </div>

            {/* Humidity */}
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-cyan-500" />
              <div>
                <p className="text-xs text-ink-light">Humidity</p>
                <p className="font-medium">
                  {weather.humidity !== null ? `${weather.humidity}%` : '--'}
                </p>
              </div>
            </div>

            {/* UV Index */}
            {weather.uv_index !== null && (
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-xs text-ink-light">UV Index</p>
                  <p className="font-medium">{weather.uv_index}</p>
                </div>
              </div>
            )}

            {/* Air Quality */}
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-ink-light">Air Quality</p>
                <p className={`font-medium ${getAqiColor(weather.air_quality_index)}`}>
                  {getAqiLabel(weather.air_quality_index)}
                </p>
              </div>
            </div>

            {/* Visibility */}
            {weather.visibility_km !== null && (
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-ink-light">Visibility</p>
                  <p className="font-medium">{weather.visibility_km.toFixed(1)} km</p>
                </div>
              </div>
            )}

            {/* Sunrise/Sunset */}
            {weather.sunrise && weather.sunset && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <Sunrise className="h-4 w-4 text-orange-400" />
                  <Sunset className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-ink-light">Sun</p>
                  <p className="font-medium text-xs">
                    {weather.sunrise.substring(0, 5)} - {weather.sunset.substring(0, 5)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Alerts */}
          {hasAlerts && (
            <div className="space-y-2">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 p-2 rounded text-sm ${
                    alert.severity === 'severe'
                      ? 'bg-red-50 border border-red-200 text-red-700'
                      : 'bg-amber-50 border border-amber-200 text-amber-700'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{alert.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
