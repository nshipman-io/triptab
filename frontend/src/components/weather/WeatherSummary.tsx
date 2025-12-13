import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Thermometer,
  AlertTriangle, RefreshCw, ChevronRight
} from 'lucide-react'
import { api } from '@/lib/api'
import type { WeatherResponse, WeatherAlert } from '@/types'

type TempUnit = 'C' | 'F'
type SpeedUnit = 'kmh' | 'mph'

interface WeatherSummaryProps {
  tripId: string
  destination: string
  startDate: string
  endDate: string
  onViewDetails?: () => void
}

// Unit conversion functions
function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9/5) + 32
}

function formatTemp(tempC: number | null, unit: TempUnit): string {
  if (tempC === null) return '--'
  const temp = unit === 'F' ? celsiusToFahrenheit(tempC) : tempC
  return `${Math.round(temp)}°${unit}`
}

function formatTempRange(lowC: number | null, highC: number | null, unit: TempUnit): string {
  if (lowC === null || highC === null) return '--'
  const low = unit === 'F' ? celsiusToFahrenheit(lowC) : lowC
  const high = unit === 'F' ? celsiusToFahrenheit(highC) : highC
  return `${Math.round(low)}° - ${Math.round(high)}°${unit}`
}

// Get/set unit preferences from localStorage
function getUnitPreferences(): { temp: TempUnit; speed: SpeedUnit } {
  if (typeof window === 'undefined') return { temp: 'C', speed: 'kmh' }
  const stored = localStorage.getItem('weatherUnits')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return { temp: 'C', speed: 'kmh' }
    }
  }
  return { temp: 'C', speed: 'kmh' }
}

function saveUnitPreferences(prefs: { temp: TempUnit; speed: SpeedUnit }) {
  localStorage.setItem('weatherUnits', JSON.stringify(prefs))
}

// Map OpenWeatherMap condition codes to icons
function getWeatherIcon(condition: string | null, _iconCode: string | null) {
  if (!condition) return <Cloud className="h-6 w-6 text-ink-light" />

  const conditionLower = condition.toLowerCase()

  if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
    return <CloudLightning className="h-6 w-6 text-yellow-500" />
  }
  if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
    return <CloudRain className="h-6 w-6 text-blue-500" />
  }
  if (conditionLower.includes('snow')) {
    return <CloudSnow className="h-6 w-6 text-blue-300" />
  }
  if (conditionLower.includes('clear') || conditionLower.includes('sun')) {
    return <Sun className="h-6 w-6 text-yellow-500" />
  }
  if (conditionLower.includes('cloud')) {
    return <Cloud className="h-6 w-6 text-gray-400" />
  }

  return <Cloud className="h-6 w-6 text-ink-light" />
}

function getAlertIcon(type: string) {
  switch (type) {
    case 'rain':
    case 'snow':
      return <CloudRain className="h-4 w-4" />
    case 'extreme_heat':
    case 'extreme_cold':
      return <Thermometer className="h-4 w-4" />
    case 'high_wind':
      return <Wind className="h-4 w-4" />
    default:
      return <AlertTriangle className="h-4 w-4" />
  }
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate.split('T')[0] + 'T00:00:00')
  const end = new Date(endDate.split('T')[0] + 'T00:00:00')

  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }

  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`
}

function formatLocalTime(utcDateString: string): string {
  const date = new Date(utcDateString)
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  })
}

export function WeatherSummary({
  tripId,
  destination,
  startDate,
  endDate,
  onViewDetails
}: WeatherSummaryProps) {
  const [weather, setWeather] = useState<WeatherResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [units, setUnits] = useState<{ temp: TempUnit; speed: SpeedUnit }>(getUnitPreferences)

  const toggleTempUnit = () => {
    const newUnits = { ...units, temp: units.temp === 'C' ? 'F' as TempUnit : 'C' as TempUnit }
    setUnits(newUnits)
    saveUnitPreferences(newUnits)
  }

  const fetchWeather = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true)
        const data = await api.refreshTripWeather(tripId)
        setWeather(data as WeatherResponse)
      } else {
        setLoading(true)
        const data = await api.getTripWeather(tripId)
        setWeather(data as WeatherResponse)
      }
      setError(null)
    } catch (err) {
      console.error('Failed to fetch weather:', err)
      setError('Weather unavailable')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchWeather()
  }, [tripId])

  // Check if trip is in the past
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tripEnd = new Date(endDate.split('T')[0] + 'T00:00:00')

  if (tripEnd < today) {
    return null // Don't show weather for past trips
  }

  if (loading) {
    return (
      <Card className="p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-serif">
            <Cloud className="h-5 w-5 text-terracotta animate-pulse" />
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-sand-dark rounded w-3/4"></div>
            <div className="h-8 bg-sand-dark rounded w-1/2"></div>
            <div className="h-4 bg-sand-dark rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !weather) {
    return (
      <Card className="p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-serif">
            <Cloud className="h-5 w-5 text-ink-light" />
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <p className="text-sm text-ink-light">{error || 'Weather unavailable'}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchWeather(true)}
            className="mt-2 gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { summary, alerts } = weather
  const hasAlerts = alerts.length > 0

  return (
    <Card className="p-6">
      <CardHeader className="p-0 mb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-serif">
            {getWeatherIcon(summary.dominant_condition, summary.dominant_condition_icon)}
            Weather
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTempUnit}
              className="h-7 px-2 text-xs font-medium"
              title="Toggle temperature unit"
            >
              °{units.temp}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchWeather(true)}
              disabled={refreshing}
              className="h-7 w-7"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        {/* Location and dates */}
        <div>
          <p className="font-medium text-ink">{destination.split(',')[0]}</p>
          <p className="text-sm text-ink-light">{formatDateRange(startDate, endDate)}</p>
        </div>

        {/* Temperature and condition */}
        {summary.temp_range_low !== null && summary.temp_range_high !== null ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-medium">
                {formatTempRange(summary.temp_range_low, summary.temp_range_high, units.temp)}
              </p>
              <p className="text-sm text-ink-light">(temperature range)</p>
            </div>
            <div className="text-right">
              <p className="font-medium">{summary.dominant_condition || 'Mixed'}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-light">Forecast not yet available</p>
        )}

        {/* Alerts */}
        {hasAlerts && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="flex items-center gap-2 text-amber-700 font-medium text-sm mb-2">
              <AlertTriangle className="h-4 w-4" />
              {summary.alert_count} weather alert{summary.alert_count !== 1 ? 's' : ''}
            </div>
            <div className="space-y-1">
              {summary.top_alerts.slice(0, 2).map((alert: WeatherAlert, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-amber-600">
                  {getAlertIcon(alert.type)}
                  <span>
                    {alert.type.replace('_', ' ')} on{' '}
                    {new Date(alert.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Details button */}
        {onViewDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewDetails}
            className="w-full justify-between text-sm"
          >
            View Details
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Last updated - local time */}
        {weather.last_updated && (
          <p className="text-xs text-ink-light text-center">
            Updated {formatLocalTime(weather.last_updated)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Export unit helpers for use in DayWeather
export { getUnitPreferences, saveUnitPreferences, formatTemp, celsiusToFahrenheit }
export type { TempUnit, SpeedUnit }
