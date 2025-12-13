import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Settings as SettingsIcon, Thermometer, Gauge, Ruler, Clock, Calendar, RotateCcw, ChevronDown, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/lib/api'
import type { User } from '@/types'
import {
  useUserPreferences,
  type TemperatureUnit,
  type SpeedUnit,
  type DistanceUnit,
  type TimeFormat,
  type DateFormat,
} from '@/contexts/UserPreferencesContext'
import { toast } from 'sonner'

export function Settings() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { preferences, updatePreference, resetToDefaults } = useUserPreferences()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await api.getCurrentUser()
        setUser(userData as User)
      } catch {
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [navigate])

  const handleReset = () => {
    resetToDefaults()
    toast.success('Preferences reset to defaults')
  }

  const handleLogout = () => {
    api.setToken(null)
    navigate('/')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand">
        <div className="text-ink-light">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand">
      {/* Header */}
      <header className="border-b border-sand-dark bg-cream">
        <div className="container mx-auto flex items-center justify-between px-4 md:px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-serif text-xl font-medium text-forest tracking-tight hover:text-terracotta transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            Triptab
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full bg-sand px-3 py-1.5 hover:bg-sand-dark transition-colors cursor-pointer">
                <span className="text-sm font-medium text-ink truncate max-w-24 md:max-w-none">
                  {user?.name}
                </span>
                <ChevronDown className="h-3 w-3 text-ink-light" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                  My Trips
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                  <SettingsIcon className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-2xl">
        {/* Back button and title */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4 -ml-2 gap-1 text-ink-light hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-forest/10 p-2">
              <SettingsIcon className="h-6 w-6 text-forest" />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-ink">Settings</h1>
              <p className="text-sm text-ink-light">Customize your experience</p>
            </div>
          </div>
        </div>

        {/* Measurement Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Ruler className="h-5 w-5 text-terracotta" />
              Measurement Preferences
            </CardTitle>
            <CardDescription>
              Choose your preferred units for temperature, speed, and distance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Temperature */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Thermometer className="h-5 w-5 text-ink-light" />
                <div>
                  <Label className="text-sm font-medium">Temperature</Label>
                  <p className="text-xs text-ink-light">For weather forecasts</p>
                </div>
              </div>
              <Select
                value={preferences.temperatureUnit}
                onValueChange={(value: TemperatureUnit) => updatePreference('temperatureUnit', value)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                  <SelectItem value="celsius">Celsius (°C)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Speed */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gauge className="h-5 w-5 text-ink-light" />
                <div>
                  <Label className="text-sm font-medium">Speed</Label>
                  <p className="text-xs text-ink-light">For wind speed</p>
                </div>
              </div>
              <Select
                value={preferences.speedUnit}
                onValueChange={(value: SpeedUnit) => updatePreference('speedUnit', value)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mph">Miles/hour</SelectItem>
                  <SelectItem value="kmh">Km/hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Distance */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Ruler className="h-5 w-5 text-ink-light" />
                <div>
                  <Label className="text-sm font-medium">Distance</Label>
                  <p className="text-xs text-ink-light">For visibility and distances</p>
                </div>
              </div>
              <Select
                value={preferences.distanceUnit}
                onValueChange={(value: DistanceUnit) => updatePreference('distanceUnit', value)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="miles">Miles</SelectItem>
                  <SelectItem value="kilometers">Kilometers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Time & Date Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Clock className="h-5 w-5 text-terracotta" />
              Time & Date Format
            </CardTitle>
            <CardDescription>
              Choose how times and dates are displayed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Time Format */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-ink-light" />
                <div>
                  <Label className="text-sm font-medium">Time Format</Label>
                  <p className="text-xs text-ink-light">12-hour or 24-hour clock</p>
                </div>
              </div>
              <Select
                value={preferences.timeFormat}
                onValueChange={(value: TimeFormat) => updatePreference('timeFormat', value)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                  <SelectItem value="24h">24-hour (14:30)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Format */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-ink-light" />
                <div>
                  <Label className="text-sm font-medium">Date Format</Label>
                  <p className="text-xs text-ink-light">Order of month, day, year</p>
                </div>
              </div>
              <Select
                value={preferences.dateFormat}
                onValueChange={(value: DateFormat) => updatePreference('dateFormat', value)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                  <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                  <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reset to Defaults */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>

        {/* Preview Section */}
        <Card className="mt-8 bg-cream/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-ink-light">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-ink-light mb-1">Temperature</p>
                <p className="font-medium">
                  {preferences.temperatureUnit === 'fahrenheit' ? '72°F' : '22°C'}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-light mb-1">Wind Speed</p>
                <p className="font-medium">
                  {preferences.speedUnit === 'mph' ? '15 mph' : '24 km/h'}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-light mb-1">Distance</p>
                <p className="font-medium">
                  {preferences.distanceUnit === 'miles' ? '5.2 mi' : '8.4 km'}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-light mb-1">Time</p>
                <p className="font-medium">
                  {preferences.timeFormat === '12h' ? '2:30 PM' : '14:30'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
