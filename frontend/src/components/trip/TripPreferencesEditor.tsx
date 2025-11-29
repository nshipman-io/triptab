import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Pencil, X, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TripPreferences, TravelType, BudgetRange, ActivityPreference } from '@/types'

const TRAVEL_TYPES: { value: TravelType; label: string }[] = [
  { value: 'solo', label: 'Solo' },
  { value: 'couple', label: 'Couple' },
  { value: 'friends', label: 'Friends' },
  { value: 'family', label: 'Family' },
]

const BUDGET_RANGES: { value: BudgetRange; label: string; description: string }[] = [
  { value: 'budget', label: 'Budget', description: 'Affordable options' },
  { value: 'moderate', label: 'Moderate', description: 'Mid-range comfort' },
  { value: 'luxury', label: 'Luxury', description: 'Premium experiences' },
]

const ACTIVITY_OPTIONS: { value: ActivityPreference; label: string }[] = [
  { value: 'adventure', label: 'Adventure' },
  { value: 'relaxation', label: 'Relaxation' },
  { value: 'culture', label: 'Culture' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'nature', label: 'Nature' },
  { value: 'nightlife', label: 'Nightlife' },
]

interface TripPreferencesEditorProps {
  preferences: TripPreferences
  onSave: (preferences: TripPreferences) => Promise<void>
}

export function TripPreferencesEditor({ preferences, onSave }: TripPreferencesEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editedPrefs, setEditedPrefs] = useState<TripPreferences>(preferences)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(editedPrefs)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedPrefs(preferences)
    setIsEditing(false)
  }

  const toggleActivity = (activity: ActivityPreference) => {
    const current = editedPrefs.activities || []
    if (current.includes(activity)) {
      setEditedPrefs({ ...editedPrefs, activities: current.filter(a => a !== activity) })
    } else {
      setEditedPrefs({ ...editedPrefs, activities: [...current, activity] })
    }
  }

  if (!isEditing) {
    return (
      <Card className="p-4 md:p-6">
        <CardHeader className="p-0 mb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-serif">Trip Vibe</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="gap-1">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </div>
          <CardDescription className="text-ink-light mt-1">
            Your preferences help us personalize recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-light">Travel Type</span>
            <span className="text-sm font-medium capitalize">{preferences.travel_type}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-light">Budget</span>
            <span className="text-sm font-medium capitalize">{preferences.budget_range}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-light">Travelers</span>
            <span className="text-sm font-medium">{preferences.num_travelers}</span>
          </div>
          {preferences.activities && preferences.activities.length > 0 && (
            <div>
              <span className="text-sm text-ink-light block mb-2">Interests</span>
              <div className="flex flex-wrap gap-1.5">
                {preferences.activities.map((activity) => (
                  <span
                    key={activity}
                    className="rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-medium text-forest capitalize"
                  >
                    {activity}
                  </span>
                ))}
              </div>
            </div>
          )}
          {preferences.special_requirements && (
            <div>
              <span className="text-sm text-ink-light block mb-1">Special Requirements</span>
              <p className="text-sm">{preferences.special_requirements}</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="p-4 md:p-6">
      <CardHeader className="p-0 mb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-serif">Edit Trip Vibe</CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handleCancel} disabled={saving}>
              <X className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 space-y-4">
        {/* Travel Type */}
        <div className="space-y-2">
          <Label className="text-sm">Travel Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {TRAVEL_TYPES.map((type) => (
              <Button
                key={type.value}
                type="button"
                variant={editedPrefs.travel_type === type.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditedPrefs({ ...editedPrefs, travel_type: type.value })}
                className="w-full"
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <Label className="text-sm">Budget</Label>
          <div className="grid grid-cols-3 gap-2">
            {BUDGET_RANGES.map((budget) => (
              <Button
                key={budget.value}
                type="button"
                variant={editedPrefs.budget_range === budget.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditedPrefs({ ...editedPrefs, budget_range: budget.value })}
                className="w-full flex-col h-auto py-2"
              >
                <span>{budget.label}</span>
                <span className="text-[10px] opacity-70">{budget.description}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Number of Travelers */}
        <div className="space-y-2">
          <Label htmlFor="numTravelers" className="text-sm">Number of Travelers</Label>
          <Input
            id="numTravelers"
            type="number"
            min={1}
            max={20}
            value={editedPrefs.num_travelers}
            onChange={(e) => setEditedPrefs({ ...editedPrefs, num_travelers: parseInt(e.target.value) || 1 })}
            className="h-9"
          />
        </div>

        {/* Activities */}
        <div className="space-y-2">
          <Label className="text-sm">Interests</Label>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_OPTIONS.map((activity) => (
              <Button
                key={activity.value}
                type="button"
                variant={(editedPrefs.activities || []).includes(activity.value) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleActivity(activity.value)}
                className={cn(
                  'rounded-full',
                  (editedPrefs.activities || []).includes(activity.value) && 'bg-forest hover:bg-forest/90'
                )}
              >
                {activity.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Special Requirements */}
        <div className="space-y-2">
          <Label htmlFor="specialReqs" className="text-sm">Special Requirements (optional)</Label>
          <Input
            id="specialReqs"
            type="text"
            placeholder="e.g., wheelchair accessible, vegetarian options"
            value={editedPrefs.special_requirements || ''}
            onChange={(e) => setEditedPrefs({ ...editedPrefs, special_requirements: e.target.value })}
            className="h-9"
          />
        </div>
      </CardContent>
    </Card>
  )
}
