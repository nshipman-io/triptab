import { useState } from 'react'
import { Plane, Hotel, MapPin, Utensils, Car, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ItineraryItem, ItineraryItemType } from '@/types'

const TYPE_CONFIG: Record<ItineraryItemType, { icon: React.ReactNode; label: string; placeholder: string }> = {
  flight: {
    icon: <Plane className="h-5 w-5" />,
    label: 'Flight',
    placeholder: 'e.g., Delta Flight to NYC'
  },
  hotel: {
    icon: <Hotel className="h-5 w-5" />,
    label: 'Hotel',
    placeholder: 'e.g., Marriott Downtown'
  },
  experience: {
    icon: <MapPin className="h-5 w-5" />,
    label: 'Experience',
    placeholder: 'e.g., City Walking Tour'
  },
  restaurant: {
    icon: <Utensils className="h-5 w-5" />,
    label: 'Restaurant',
    placeholder: 'e.g., Dinner at Nobu'
  },
  transport: {
    icon: <Car className="h-5 w-5" />,
    label: 'Transport',
    placeholder: 'e.g., Car Rental - Hertz'
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
  const [startTime, setStartTime] = useState(getDefaultTime())
  const [endTime, setEndTime] = useState(getDefaultEndTime())
  const [notes, setNotes] = useState(item?.notes || '')
  const [price, setPrice] = useState(item?.price?.toString() || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const startDateTime = `${date}T${startTime}:00`
    const endDateTime = endTime ? `${date}T${endTime}:00` : undefined

    onSubmit({
      type,
      title,
      location: location || undefined,
      start_time: startDateTime,
      end_time: endDateTime,
      notes: notes || undefined,
      price: price ? parseFloat(price) : undefined,
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
