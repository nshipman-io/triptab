import { useState } from 'react'
import { Plane, Hotel, MapPin, Utensils, Car, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ItineraryItem, ItineraryItemType } from '@/types'
import { cn } from '@/lib/utils'

const TYPE_CONFIG: Record<ItineraryItemType, { icon: React.ReactNode; label: string; placeholder: string; supportsMultiDay: boolean }> = {
  flight: {
    icon: <Plane className="h-5 w-5" />,
    label: 'Flight',
    placeholder: 'e.g., Delta Flight to NYC',
    supportsMultiDay: false,
  },
  hotel: {
    icon: <Hotel className="h-5 w-5" />,
    label: 'Hotel',
    placeholder: 'e.g., Marriott Downtown',
    supportsMultiDay: true,
  },
  experience: {
    icon: <MapPin className="h-5 w-5" />,
    label: 'Experience',
    placeholder: 'e.g., City Walking Tour',
    supportsMultiDay: true,
  },
  restaurant: {
    icon: <Utensils className="h-5 w-5" />,
    label: 'Restaurant',
    placeholder: 'e.g., Dinner at Nobu',
    supportsMultiDay: false,
  },
  transport: {
    icon: <Car className="h-5 w-5" />,
    label: 'Transport',
    placeholder: 'e.g., Car Rental - Hertz',
    supportsMultiDay: true,
  },
}

interface ItineraryItemFormProps {
  type: ItineraryItemType
  item?: ItineraryItem | null
  tripStartDate: string
  onSubmit: (data: Record<string, unknown>) => void
  onCancel: () => void
}

export function ItineraryItemForm({ type, item, tripStartDate, onSubmit, onCancel }: ItineraryItemFormProps) {
  const config = TYPE_CONFIG[type]

  // Parse existing item data or use defaults
  const getDefaultDate = () => {
    if (item?.start_time) {
      return item.start_time.split('T')[0]
    }
    return tripStartDate.split('T')[0]
  }

  const getDefaultTime = () => {
    if (item?.start_time) {
      const timePart = item.start_time.split('T')[1]
      if (timePart) return timePart.substring(0, 5)
    }
    return '09:00'
  }

  const getDefaultEndDate = () => {
    if (item?.end_time) {
      return item.end_time.split('T')[0]
    }
    return ''
  }

  const getDefaultEndTime = () => {
    if (item?.end_time) {
      const timePart = item.end_time.split('T')[1]
      if (timePart) return timePart.substring(0, 5)
    }
    return ''
  }

  const [title, setTitle] = useState(item?.title || '')
  const [location, setLocation] = useState(item?.location || '')
  const [date, setDate] = useState(getDefaultDate())
  const [endDate, setEndDate] = useState(getDefaultEndDate())
  const [startTime, setStartTime] = useState(getDefaultTime())
  const [endTime, setEndTime] = useState(getDefaultEndTime())
  const [notes, setNotes] = useState(item?.notes || '')
  const [price, setPrice] = useState(item?.price?.toString() || '')
  const [booked, setBooked] = useState(item?.booking_confirmed || false)

  // Check if this type supports multi-day
  const supportsMultiDay = TYPE_CONFIG[type].supportsMultiDay

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const startDateTime = `${date}T${startTime}:00`

    // For multi-day items, use endDate; otherwise use endTime on same day
    let endDateTime: string | undefined
    if (supportsMultiDay && endDate) {
      // Multi-day: end date with end time (or default to 12:00 checkout time)
      const endTimeVal = endTime || '12:00'
      endDateTime = `${endDate}T${endTimeVal}:00`
    } else if (endTime) {
      // Same day: use start date with end time
      endDateTime = `${date}T${endTime}:00`
    }

    onSubmit({
      type,
      title,
      location: location || undefined,
      start_time: startDateTime,
      end_time: endDateTime,
      notes: notes || undefined,
      price: price ? parseFloat(price) : undefined,
      booking_confirmed: booked,
    })
  }

  const isValid = title.trim() && date

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {config.icon}
            {item ? `Edit ${config.label}` : `Add ${config.label}`}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder={config.placeholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Address or venue name"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Date and Time */}
          {supportsMultiDay ? (
            // Multi-day layout: Start Date/Time, End Date/Time
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="date">{type === 'hotel' ? 'Check-in Date *' : 'Start Date *'}</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value)
                      // Auto-set end date if not set or before start
                      if (!endDate || endDate < e.target.value) {
                        setEndDate(e.target.value)
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">{type === 'hotel' ? 'Check-in Time' : 'Start Time'}</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="endDate">{type === 'hotel' ? 'Check-out Date' : 'End Date'}</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    min={date}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">{type === 'hotel' ? 'Check-out Time' : 'End Time'}</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    placeholder={type === 'hotel' ? '12:00' : ''}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Single-day layout: Date, Start Time, End Time
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:contents">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              placeholder="Any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Booked Checkbox */}
          <label className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={booked}
              onChange={(e) => setBooked(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div className="flex items-center gap-2">
              <Check className={cn("h-4 w-4", booked ? "text-green-600" : "text-muted-foreground")} />
              <span className="text-sm font-medium">Booked / Confirmed</span>
            </div>
          </label>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid} className="w-full sm:w-auto">
              {item ? 'Save Changes' : `Add ${config.label}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
