import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

// Types for user preferences
export type TemperatureUnit = 'fahrenheit' | 'celsius'
export type SpeedUnit = 'mph' | 'kmh'
export type DistanceUnit = 'miles' | 'kilometers'
export type TimeFormat = '12h' | '24h'
export type DateFormat = 'mdy' | 'dmy' | 'ymd'

export interface UserPreferences {
  temperatureUnit: TemperatureUnit
  speedUnit: SpeedUnit
  distanceUnit: DistanceUnit
  timeFormat: TimeFormat
  dateFormat: DateFormat
}

// American defaults
const DEFAULT_PREFERENCES: UserPreferences = {
  temperatureUnit: 'fahrenheit',
  speedUnit: 'mph',
  distanceUnit: 'miles',
  timeFormat: '12h',
  dateFormat: 'mdy',
}

const STORAGE_KEY = 'userPreferences'

interface UserPreferencesContextType {
  preferences: UserPreferences
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void
  resetToDefaults: () => void
}

const UserPreferencesContext = createContext<UserPreferencesContextType | null>(null)

function loadPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Merge with defaults to handle any missing keys from older versions
      return { ...DEFAULT_PREFERENCES, ...parsed }
    }
  } catch (e) {
    console.error('Failed to load preferences:', e)
  }

  return DEFAULT_PREFERENCES
}

function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch (e) {
    console.error('Failed to save preferences:', e)
  }
}

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences)

  // Save to localStorage whenever preferences change
  useEffect(() => {
    savePreferences(preferences)
  }, [preferences])

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const resetToDefaults = () => {
    setPreferences(DEFAULT_PREFERENCES)
  }

  return (
    <UserPreferencesContext.Provider value={{ preferences, updatePreference, resetToDefaults }}>
      {children}
    </UserPreferencesContext.Provider>
  )
}

export function useUserPreferences(): UserPreferencesContextType {
  const context = useContext(UserPreferencesContext)
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider')
  }
  return context
}

// Utility functions for formatting with preferences

export function formatTemperature(
  celsiusValue: number | null,
  unit: TemperatureUnit,
  showUnit = true
): string {
  if (celsiusValue === null) return '--'

  const value = unit === 'fahrenheit'
    ? (celsiusValue * 9/5) + 32
    : celsiusValue

  const symbol = unit === 'fahrenheit' ? 'F' : 'C'
  return showUnit ? `${Math.round(value)}°${symbol}` : `${Math.round(value)}°`
}

export function formatSpeed(
  kmhValue: number | null,
  unit: SpeedUnit
): string {
  if (kmhValue === null) return '--'

  const value = unit === 'mph' ? kmhValue * 0.621371 : kmhValue
  const label = unit === 'mph' ? 'mph' : 'km/h'

  return `${Math.round(value)} ${label}`
}

export function formatDistance(
  kmValue: number | null,
  unit: DistanceUnit,
  decimals = 1
): string {
  if (kmValue === null) return '--'

  const value = unit === 'miles' ? kmValue * 0.621371 : kmValue
  const label = unit === 'miles' ? 'mi' : 'km'

  return `${value.toFixed(decimals)} ${label}`
}

export function formatTime(
  date: Date | string,
  format: TimeFormat,
  includeTimezone = false
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: format === '12h',
  }

  if (includeTimezone) {
    options.timeZoneName = 'short'
  }

  return dateObj.toLocaleTimeString(undefined, options)
}

export function formatTimeOnly(
  timeString: string, // Format: "HH:MM:SS" or "HH:MM"
  format: TimeFormat
): string {
  if (!timeString) return '--'

  const [hours, minutes] = timeString.split(':').map(Number)

  if (format === '24h') {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
}

export function formatDate(
  date: Date | string,
  format: DateFormat,
  options?: { weekday?: boolean; year?: boolean }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  const formatOptions: Intl.DateTimeFormatOptions = {}

  if (options?.weekday) {
    formatOptions.weekday = 'short'
  }

  formatOptions.month = 'short'
  formatOptions.day = 'numeric'

  if (options?.year !== false) {
    formatOptions.year = 'numeric'
  }

  // Use locale based on format preference
  let locale = 'en-US'
  if (format === 'dmy') locale = 'en-GB'
  else if (format === 'ymd') locale = 'sv-SE' // ISO format

  return dateObj.toLocaleDateString(locale, formatOptions)
}
