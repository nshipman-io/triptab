import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { PlacesAutocomplete } from '@/components/ui/places-autocomplete'
import {
  User, Users, Heart, Home,
  DollarSign, Wallet, Crown,
  Mountain, Palmtree, Landmark, Utensils, Trees, Moon,
  ArrowLeft, ArrowRight, Check
} from 'lucide-react'
import type { TravelType, BudgetRange, ActivityPreference, TripPreferences } from '@/types'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 'travel-type', title: 'Who are you traveling with?' },
  { id: 'destination', title: 'Where do you want to go?' },
  { id: 'dates', title: 'When are you traveling?' },
  { id: 'budget', title: 'What\'s your budget?' },
  { id: 'activities', title: 'What do you enjoy?' },
  { id: 'summary', title: 'Review your trip' },
]

const TRAVEL_TYPES: { value: TravelType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'solo', label: 'Solo', icon: <User className="h-6 w-6" />, description: 'Just me, exploring alone' },
  { value: 'couple', label: 'Couple', icon: <Heart className="h-6 w-6" />, description: 'Romantic getaway for two' },
  { value: 'friends', label: 'Friends', icon: <Users className="h-6 w-6" />, description: 'Adventure with friends' },
  { value: 'family', label: 'Family', icon: <Home className="h-6 w-6" />, description: 'Family trip with loved ones' },
]

const BUDGET_RANGES: { value: BudgetRange; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'budget', label: 'Budget', icon: <DollarSign className="h-6 w-6" />, description: 'Keep costs low' },
  { value: 'moderate', label: 'Moderate', icon: <Wallet className="h-6 w-6" />, description: 'Balance of comfort & cost' },
  { value: 'luxury', label: 'Luxury', icon: <Crown className="h-6 w-6" />, description: 'Spare no expense' },
]

const ACTIVITIES: { value: ActivityPreference; label: string; icon: React.ReactNode }[] = [
  { value: 'adventure', label: 'Adventure', icon: <Mountain className="h-6 w-6" /> },
  { value: 'relaxation', label: 'Relaxation', icon: <Palmtree className="h-6 w-6" /> },
  { value: 'culture', label: 'Culture', icon: <Landmark className="h-6 w-6" /> },
  { value: 'food', label: 'Food & Dining', icon: <Utensils className="h-6 w-6" /> },
  { value: 'nature', label: 'Nature', icon: <Trees className="h-6 w-6" /> },
  { value: 'nightlife', label: 'Nightlife', icon: <Moon className="h-6 w-6" /> },
]

export function TripQuestionnaire() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [preferences, setPreferences] = useState<Partial<TripPreferences>>({
    travel_type: undefined,
    destination: '',
    start_date: '',
    end_date: '',
    budget_range: undefined,
    activities: [],
    num_travelers: 1,
    special_requirements: '',
  })

  const progress = ((currentStep + 1) / STEPS.length) * 100

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.getCurrentUser()
        setIsAuthenticated(true)
      } catch {
        setIsAuthenticated(false)
        navigate('/login', { state: { from: '/plan', message: 'Please log in to plan a trip' } })
      }
    }
    checkAuth()
  }, [navigate])

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const tripData = {
        name: `Trip to ${preferences.destination}`,
        destination: preferences.destination,
        start_date: preferences.start_date,
        end_date: preferences.end_date,
        preferences: preferences as TripPreferences,
      }
      const trip = await api.createTrip(tripData) as { id: string }
      navigate(`/trips/${trip.id}`)
    } catch (error) {
      console.error('Failed to create trip:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleActivity = (activity: ActivityPreference) => {
    const current = preferences.activities || []
    const updated = current.includes(activity)
      ? current.filter((a) => a !== activity)
      : [...current, activity]
    setPreferences({ ...preferences, activities: updated })
  }

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'travel-type':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            {TRAVEL_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setPreferences({
                  ...preferences,
                  travel_type: type.value,
                  num_travelers: type.value === 'solo' ? 1 : type.value === 'couple' ? 2 : preferences.num_travelers || 2
                })}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border-2 p-6 transition-all hover:border-terracotta bg-sand",
                  preferences.travel_type === type.value
                    ? "border-terracotta bg-cream"
                    : "border-sand-dark"
                )}
              >
                <div className={cn(
                  "rounded-full p-3",
                  preferences.travel_type === type.value
                    ? "bg-forest text-cream"
                    : "bg-sand-dark"
                )}>
                  {type.icon}
                </div>
                <span className="font-medium">{type.label}</span>
                <span className="text-sm text-ink-light">{type.description}</span>
              </button>
            ))}
          </div>
        )

      case 'destination':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <PlacesAutocomplete
                value={preferences.destination || ''}
                onChange={(value) => setPreferences({ ...preferences, destination: value })}
                placeholder="Search for a city..."
              />
            </div>
            {(preferences.travel_type === 'friends' || preferences.travel_type === 'family') && (
              <div className="space-y-2">
                <Label htmlFor="travelers">Number of travelers</Label>
                <Input
                  id="travelers"
                  type="number"
                  min={2}
                  max={20}
                  value={preferences.num_travelers || ''}
                  onChange={(e) => {
                    const val = e.target.value
                    // Allow empty input while typing, but use the raw value
                    setPreferences({ ...preferences, num_travelers: val === '' ? 0 : parseInt(val) })
                  }}
                  onBlur={(e) => {
                    // On blur, ensure minimum of 2 for group travel
                    const val = parseInt(e.target.value) || 2
                    setPreferences({ ...preferences, num_travelers: Math.max(2, val) })
                  }}
                />
              </div>
            )}
          </div>
        )

      case 'dates':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={preferences.start_date}
                onChange={(e) => setPreferences({ ...preferences, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={preferences.end_date}
                min={preferences.start_date}
                onChange={(e) => setPreferences({ ...preferences, end_date: e.target.value })}
              />
            </div>
          </div>
        )

      case 'budget':
        return (
          <div className="grid gap-4 sm:grid-cols-3">
            {BUDGET_RANGES.map((budget) => (
              <button
                key={budget.value}
                onClick={() => setPreferences({ ...preferences, budget_range: budget.value })}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border-2 p-6 transition-all hover:border-terracotta bg-sand",
                  preferences.budget_range === budget.value
                    ? "border-terracotta bg-cream"
                    : "border-sand-dark"
                )}
              >
                <div className={cn(
                  "rounded-full p-3",
                  preferences.budget_range === budget.value
                    ? "bg-forest text-cream"
                    : "bg-sand-dark"
                )}>
                  {budget.icon}
                </div>
                <span className="font-medium">{budget.label}</span>
                <span className="text-sm text-ink-light">{budget.description}</span>
              </button>
            ))}
          </div>
        )

      case 'activities':
        return (
          <div className="space-y-4">
            <p className="text-sm text-ink-light">Select all that interest you</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {ACTIVITIES.map((activity) => {
                const isSelected = preferences.activities?.includes(activity.value)
                return (
                  <button
                    key={activity.value}
                    onClick={() => toggleActivity(activity.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all hover:border-terracotta bg-sand",
                      isSelected ? "border-terracotta bg-cream" : "border-sand-dark"
                    )}
                  >
                    <div className={cn(
                      "rounded-full p-3",
                      isSelected ? "bg-forest text-cream" : "bg-sand-dark"
                    )}>
                      {activity.icon}
                    </div>
                    <span className="font-medium">{activity.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )

      case 'summary':
        return (
          <div className="space-y-6">
            <div className="rounded-2xl bg-sand p-6">
              <h3 className="mb-4 text-lg font-serif">Trip to {preferences.destination}</h3>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-ink-light">Travel Type</dt>
                  <dd className="font-medium capitalize">{preferences.travel_type}</dd>
                </div>
                <div>
                  <dt className="text-ink-light">Travelers</dt>
                  <dd className="font-medium">{preferences.num_travelers}</dd>
                </div>
                <div>
                  <dt className="text-ink-light">Dates</dt>
                  <dd className="font-medium">
                    {new Date(preferences.start_date!).toLocaleDateString()} - {new Date(preferences.end_date!).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-light">Budget</dt>
                  <dd className="font-medium capitalize">{preferences.budget_range}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-ink-light">Activities</dt>
                  <dd className="font-medium capitalize">
                    {preferences.activities?.join(', ') || 'None selected'}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="space-y-2">
              <Label htmlFor="special">Special requirements (optional)</Label>
              <Input
                id="special"
                placeholder="e.g., wheelchair accessible, vegetarian restaurants"
                value={preferences.special_requirements}
                onChange={(e) => setPreferences({ ...preferences, special_requirements: e.target.value })}
              />
            </div>
          </div>
        )
    }
  }

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case 'travel-type':
        return !!preferences.travel_type
      case 'destination':
        return !!preferences.destination
      case 'dates':
        return !!preferences.start_date && !!preferences.end_date
      case 'budget':
        return !!preferences.budget_range
      case 'activities':
        return (preferences.activities?.length || 0) > 0
      case 'summary':
        return true
      default:
        return false
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-10">
          <CardContent className="flex items-center justify-center py-12 p-0">
            <p className="text-ink-light">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="p-10 overflow-visible">
        <CardHeader className="p-0 mb-8">
          <div className="mb-6">
            <Progress value={progress} className="h-2" />
            <p className="mt-2 text-sm text-ink-light">
              Step {currentStep + 1} of {STEPS.length}
            </p>
          </div>
          <CardTitle className="text-2xl font-serif">{STEPS[currentStep].title}</CardTitle>
          <CardDescription className="text-ink-light mt-2">
            {currentStep === 0 && "Let's start by understanding your travel style"}
            {currentStep === 1 && "Tell us where you'd like to explore"}
            {currentStep === 2 && "Pick your travel dates"}
            {currentStep === 3 && "Help us find options that fit your budget"}
            {currentStep === 4 && "What kind of experiences are you looking for?"}
            {currentStep === 5 && "Review your preferences before we create your trip"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">{renderStep()}</CardContent>
        <CardFooter className="flex justify-between p-0 mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {currentStep === STEPS.length - 1 ? (
            <Button variant="terracotta" onClick={handleSubmit} disabled={loading}>
              <Check className="mr-2 h-4 w-4" />
              {loading ? 'Creating...' : 'Create Trip'}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
