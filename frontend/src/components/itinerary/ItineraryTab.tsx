import { useState, useMemo } from 'react'
import {
  Plane, Hotel, MapPin, Utensils, Car, Calendar, Plus,
  Check, GripVertical, ExternalLink, Mail, Pencil, Trash2,
  ChevronRight, MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { Trip, ItineraryItem, ItineraryItemType } from '@/types'
import { cn } from '@/lib/utils'
import {
  getFlightSearchLinks,
  getHotelSearchLinks,
  getExperienceSearchLinks,
  getOpenTableUrl,
  getRentalCarsUrl,
} from '@/lib/affiliates'

const ITEM_ICONS: Record<ItineraryItemType, React.ReactNode> = {
  flight: <Plane className="h-4 w-4" />,
  hotel: <Hotel className="h-4 w-4" />,
  experience: <MapPin className="h-4 w-4" />,
  restaurant: <Utensils className="h-4 w-4" />,
  transport: <Car className="h-4 w-4" />,
}

const ITEM_COLORS: Record<ItineraryItemType, string> = {
  flight: 'bg-blue-100 text-blue-700',
  hotel: 'bg-purple-100 text-purple-700',
  experience: 'bg-green-100 text-green-700',
  restaurant: 'bg-orange-100 text-orange-700',
  transport: 'bg-gray-100 text-gray-700',
}

function getItemBookingLink(item: ItineraryItem, trip: Trip): string | null {
  const destination = item.location || trip.destination

  switch (item.type) {
    case 'flight':
      return getFlightSearchLinks({
        destination,
        departDate: item.start_time,
        returnDate: item.end_time || trip.end_date,
        adults: trip.preferences.num_travelers,
      }).googleFlights
    case 'hotel':
      return getHotelSearchLinks({
        destination,
        checkIn: item.start_time,
        checkOut: item.end_time || trip.end_date,
        guests: trip.preferences.num_travelers,
      }).bookingCom
    case 'experience':
      return getExperienceSearchLinks({
        destination,
        date: item.start_time,
      }).viator
    case 'restaurant':
      return getOpenTableUrl(destination, item.start_time, trip.preferences.num_travelers)
    case 'transport':
      return getRentalCarsUrl(destination, item.start_time, item.end_time || trip.end_date)
    default:
      return null
  }
}

interface DayData {
  date: Date
  dateString: string
  dayNumber: number
  dayName: string
  formattedDate: string
  items: ItineraryItem[]
}

interface ItineraryTabProps {
  trip: Trip
  items: ItineraryItem[]
  canEdit: boolean
  onAddItem: (type: ItineraryItemType, date?: string) => void
  onEditItem: (item: ItineraryItem) => void
  onDeleteItem: (itemId: string) => void
  onImport: () => void
  showItemForm: boolean
  itemFormContent: React.ReactNode
}

export function ItineraryTab({
  trip,
  items,
  canEdit,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onImport,
  showItemForm,
  itemFormContent,
}: ItineraryTabProps) {
  const [quickAddValue, setQuickAddValue] = useState('')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  // Generate all days between trip start and end dates
  const tripDays = useMemo((): DayData[] => {
    const start = new Date(trip.start_date)
    const end = new Date(trip.end_date)
    const days: DayData[] = []

    const current = new Date(start)
    let dayNumber = 1

    while (current <= end) {
      const dateString = current.toISOString().split('T')[0]
      const dayItems = items.filter(item => {
        const itemDate = new Date(item.start_time).toISOString().split('T')[0]
        return itemDate === dateString
      })

      days.push({
        date: new Date(current),
        dateString,
        dayNumber,
        dayName: current.toLocaleDateString('en-US', { weekday: 'long' }),
        formattedDate: current.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        }),
        items: dayItems.sort((a, b) => a.order - b.order),
      })

      current.setDate(current.getDate() + 1)
      dayNumber++
    }

    return days
  }, [trip.start_date, trip.end_date, items])

  // Initialize expanded days (expand days with items by default)
  useState(() => {
    const daysWithItems = tripDays
      .filter(day => day.items.length > 0)
      .map(day => day.dateString)
    setExpandedDays(new Set(daysWithItems))
  })

  const toggleDay = (dateString: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(dateString)) {
        next.delete(dateString)
      } else {
        next.add(dateString)
      }
      return next
    })
  }

  const handleQuickAdd = (dateString: string) => {
    if (!quickAddValue.trim()) return
    // For now, quick add creates an "experience" type item
    // In a real implementation, you might want to parse the input
    // or show a type selector
    setSelectedDay(dateString)
    onAddItem('experience', dateString)
    setQuickAddValue('')
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar Navigation - Hidden on mobile, shown on larger screens */}
      <aside className="hidden lg:block w-48 shrink-0">
        <div className="sticky top-6">
          <h3 className="text-sm font-medium text-ink-light mb-3">Itinerary</h3>
          <nav className="space-y-1">
            {tripDays.map((day) => (
              <button
                key={day.dateString}
                onClick={() => {
                  setExpandedDays(prev => new Set([...prev, day.dateString]))
                  document.getElementById(`day-${day.dateString}`)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                  })
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  "hover:bg-sand-dark",
                  day.items.length > 0 ? "text-ink font-medium" : "text-ink-light"
                )}
              >
                <div className="flex items-center justify-between">
                  <span>
                    {day.dayName.slice(0, 3)} {day.date.getMonth() + 1}/{day.date.getDate()}
                  </span>
                  {day.items.length > 0 && (
                    <span className="text-xs bg-forest text-cream px-1.5 py-0.5 rounded-full">
                      {day.items.length}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header with actions */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-serif text-ink">Itinerary</h2>
          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onImport}
                className="gap-1"
              >
                <Mail className="h-3 w-3" />
                Import
              </Button>
              {(Object.keys(ITEM_ICONS) as ItineraryItemType[]).map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  onClick={() => onAddItem(type)}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Item Form */}
        {showItemForm && (
          <div className="mb-6">
            {itemFormContent}
          </div>
        )}

        {/* Quick Add Input */}
        {canEdit && (
          <Card className="mb-6 p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-ink-light shrink-0" />
              <Input
                placeholder="Add a place"
                value={quickAddValue}
                onChange={(e) => setQuickAddValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && quickAddValue.trim()) {
                    // Add to the first day or selected day
                    handleQuickAdd(selectedDay || tripDays[0]?.dateString || trip.start_date.split('T')[0])
                  }
                }}
                className="border-0 shadow-none focus-visible:ring-0 text-base placeholder:text-ink-light"
              />
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Day Sections */}
        {tripDays.length === 0 ? (
          <Card className="p-8">
            <CardContent className="py-8 text-center p-0">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-sand to-sand-dark flex items-center justify-center">
                <Calendar className="h-8 w-8 text-forest" />
              </div>
              <h3 className="text-lg font-serif mb-2">No dates set</h3>
              <p className="text-ink-light mb-6">
                Set your trip dates to start planning your itinerary
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tripDays.map((day) => (
              <Collapsible
                key={day.dateString}
                id={`day-${day.dateString}`}
                open={expandedDays.has(day.dateString)}
                onOpenChange={() => toggleDay(day.dateString)}
              >
                <div className="border-b border-sand-dark pb-4">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between py-3 group">
                      <div className="flex items-center gap-3">
                        <ChevronRight
                          className={cn(
                            "h-5 w-5 text-ink-light transition-transform duration-200",
                            expandedDays.has(day.dateString) && "rotate-90"
                          )}
                        />
                        <h3 className="text-lg font-serif text-ink">
                          {day.formattedDate}
                        </h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Day options menu - could add more options here
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="space-y-2 pt-2">
                    {day.items.length === 0 ? (
                      <div className="py-4 text-center text-sm text-ink-light">
                        No activities planned for this day
                        {canEdit && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => onAddItem('experience', day.dateString)}
                            className="ml-1"
                          >
                            Add one
                          </Button>
                        )}
                      </div>
                    ) : (
                      day.items.map((item) => (
                        <Card key={item.id} className="group p-3 md:p-4">
                          <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 p-0">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <GripVertical className="h-5 w-5 text-ink-light cursor-move shrink-0 hidden sm:block" />
                              <div className={cn("rounded-full p-2 shrink-0", ITEM_COLORS[item.type])}>
                                {ITEM_ICONS[item.type]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium truncate">{item.title}</h4>
                                {item.location && (
                                  <p className="text-sm text-ink-light truncate">{item.location}</p>
                                )}
                              </div>
                              <div className="text-right sm:hidden">
                                <p className="text-sm">
                                  {new Date(item.start_time).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-1">
                              <div className="text-right hidden sm:block">
                                <p className="text-sm">
                                  {new Date(item.start_time).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                                {item.price && (
                                  <p className="text-sm text-ink-light">
                                    {item.currency || '$'}{item.price}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {item.booking_confirmed ? (
                                  <span className="flex items-center gap-1 text-xs sm:text-sm text-green-600 mr-1 sm:mr-2">
                                    <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Booked</span>
                                  </span>
                                ) : item.booking_url ? (
                                  <a href={item.booking_url} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
                                      View
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </a>
                                ) : (
                                  <a
                                    href={getItemBookingLink(item, trip) || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
                                      Book
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </a>
                                )}
                                {canEdit && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onEditItem(item)}
                                      className="h-8 w-8 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onDeleteItem(item.id)}
                                      className="h-8 w-8 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-ink-light hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
