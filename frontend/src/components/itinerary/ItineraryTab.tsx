import { useState, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plane, Hotel, MapPin, Utensils, Car, Calendar, Plus,
  Check, GripVertical, Mail, Pencil, Trash2,
  ChevronRight, CalendarDays
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import type { Trip, ItineraryItem, ItineraryItemType } from '@/types'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { toast } from 'sonner'

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
  onItemsReordered?: (items: ItineraryItem[]) => void
}

// Helper to check if an item is multi-day
function isMultiDayItem(item: ItineraryItem): boolean {
  if (!item.end_time) return false
  const startDate = item.start_time.split('T')[0]
  const endDate = item.end_time.split('T')[0]
  return endDate > startDate
}

// Helper to get day label for multi-day items
function getMultiDayLabel(item: ItineraryItem, currentDateString: string): string | null {
  if (!isMultiDayItem(item)) return null

  const startDate = item.start_time.split('T')[0]
  const endDate = item.end_time!.split('T')[0]

  // Calculate day number within the span
  const start = new Date(startDate + 'T00:00:00')
  const current = new Date(currentDateString + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')

  const dayNum = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

  if (currentDateString === startDate) {
    return `Day 1 of ${totalDays}`
  } else if (currentDateString === endDate) {
    return `Day ${totalDays} of ${totalDays} (checkout)`
  } else {
    return `Day ${dayNum} of ${totalDays}`
  }
}

// Sortable Item Component
function SortableItem({
  item,
  canEdit,
  onEditItem,
  onDeleteItem,
  onMoveToDate,
  tripDays,
  currentDateString,
}: {
  item: ItineraryItem
  canEdit: boolean
  onEditItem: (item: ItineraryItem) => void
  onDeleteItem: (itemId: string) => void
  onMoveToDate: (itemId: string, newDate: string) => void
  tripDays: DayData[]
  currentDateString: string
}) {
  const multiDayLabel = getMultiDayLabel(item, currentDateString)
  const isSpanningDay = multiDayLabel !== null && item.start_time.split('T')[0] !== currentDateString
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group p-3 md:p-4",
        isDragging && "shadow-lg ring-2 ring-forest",
        isSpanningDay && "opacity-75 border-dashed"
      )}
    >
      <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 p-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {canEdit && !isSpanningDay && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing touch-none"
            >
              <GripVertical className="h-5 w-5 text-ink-light shrink-0 hidden sm:block hover:text-ink" />
            </div>
          )}
          <div className={cn("rounded-full p-2 shrink-0", ITEM_COLORS[item.type])}>
            {ITEM_ICONS[item.type]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium truncate">{item.title}</h4>
              {multiDayLabel && (
                <span className="text-xs bg-sand-dark text-ink-light px-1.5 py-0.5 rounded shrink-0">
                  {multiDayLabel}
                </span>
              )}
            </div>
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
            {!isSpanningDay && (
              <p className="text-sm">
                {new Date(item.start_time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
            {item.price && !isSpanningDay && (
              <p className="text-sm text-ink-light">
                {item.currency || '$'}{item.price}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {item.booking_confirmed && (
              <span className="flex items-center gap-1 text-xs sm:text-sm text-green-600 mr-1 sm:mr-2">
                <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Booked</span>
              </span>
            )}
            {canEdit && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    >
                      <CalendarDays className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Move to day</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {tripDays.map((day) => (
                      <DropdownMenuItem
                        key={day.dateString}
                        disabled={day.dateString === currentDateString}
                        onClick={() => onMoveToDate(item.id, day.dateString)}
                        className={cn(
                          day.dateString === currentDateString && "opacity-50"
                        )}
                      >
                        <span className="truncate">
                          {day.date.getMonth() + 1}/{day.date.getDate()}/{day.date.getFullYear()}
                        </span>
                        {day.dateString === currentDateString && (
                          <Check className="h-4 w-4 ml-auto" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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
  )
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
  onItemsReordered,
}: ItineraryTabProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [localItems, setLocalItems] = useState<ItineraryItem[]>(items)

  // Update local items when props change
  useMemo(() => {
    setLocalItems(items)
  }, [items])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Generate all days between trip start and end dates
  const tripDays = useMemo((): DayData[] => {
    // Parse dates in local timezone by appending T00:00:00
    const startStr = trip.start_date.split('T')[0]
    const endStr = trip.end_date.split('T')[0]
    const start = new Date(startStr + 'T00:00:00')
    const end = new Date(endStr + 'T00:00:00')
    const days: DayData[] = []

    const current = new Date(start)
    let dayNumber = 1

    while (current <= end) {
      // Use local date string for comparison
      const year = current.getFullYear()
      const month = String(current.getMonth() + 1).padStart(2, '0')
      const day = String(current.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`

      const dayItems = localItems.filter(item => {
        // Parse item date in local timezone for comparison
        const itemStartDateStr = item.start_time.split('T')[0]
        const itemEndDateStr = item.end_time ? item.end_time.split('T')[0] : itemStartDateStr

        // Item appears on this day if:
        // 1. It starts on this day, OR
        // 2. It's a multi-day item that spans this day (start <= day <= end)
        if (itemStartDateStr === dateString) {
          return true
        }

        // Check if this is a multi-day item spanning this date
        if (itemEndDateStr > itemStartDateStr) {
          return dateString >= itemStartDateStr && dateString <= itemEndDateStr
        }

        return false
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
  }, [trip.start_date, trip.end_date, localItems])

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

  const handleDragEnd = async (event: DragEndEvent, dayItems: ItineraryItem[]) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = dayItems.findIndex(item => item.id === active.id)
      const newIndex = dayItems.findIndex(item => item.id === over.id)

      const newDayItems = arrayMove(dayItems, oldIndex, newIndex)
      const itemIds = newDayItems.map(item => item.id)

      // Update local state optimistically
      const newLocalItems = localItems.map(item => {
        const newOrder = itemIds.indexOf(item.id)
        if (newOrder !== -1) {
          return { ...item, order: newOrder }
        }
        return item
      })
      setLocalItems(newLocalItems)

      // Persist to server
      try {
        await api.reorderItineraryItems(trip.id, itemIds)
        if (onItemsReordered) {
          onItemsReordered(newLocalItems)
        }
        toast.success('Itinerary reordered')
      } catch (error) {
        console.error('Failed to reorder items:', error)
        toast.error('Failed to reorder items')
        // Revert on error
        setLocalItems(items)
      }
    }
  }

  const handleMoveToDate = async (itemId: string, newDate: string) => {
    const item = localItems.find(i => i.id === itemId)
    if (!item) return

    // Optimistically update local state
    const updatedItems = localItems.map(i => {
      if (i.id === itemId) {
        const oldDate = new Date(i.start_time)
        const newDateObj = new Date(newDate + 'T' + oldDate.toTimeString().split(' ')[0])
        return { ...i, start_time: newDateObj.toISOString(), order: 0 }
      }
      return i
    })
    setLocalItems(updatedItems)

    // Expand the target day
    setExpandedDays(prev => new Set([...prev, newDate]))

    try {
      await api.moveItineraryItem(trip.id, itemId, newDate, 0)
      if (onItemsReordered) {
        onItemsReordered(updatedItems)
      }
      const d = new Date(newDate + 'T00:00:00')
      toast.success('Moved to ' + `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`)
    } catch (error) {
      console.error('Failed to move item:', error)
      toast.error('Failed to move item')
      // Revert on error
      setLocalItems(items)
    }
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
                    {day.date.getMonth() + 1}/{day.date.getDate()}/{day.date.getFullYear()}
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
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-xl font-serif text-ink">Itinerary</h2>
          {canEdit && (
            <>
              {/* Mobile: Compact dropdown for add actions */}
              <div className="flex gap-2 sm:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onImport}
                  className="gap-1"
                >
                  <Mail className="h-4 w-4" />
                  <span className="sr-only">Import</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {(Object.keys(ITEM_ICONS) as ItineraryItemType[]).map((type) => (
                      <DropdownMenuItem
                        key={type}
                        onClick={() => onAddItem(type)}
                        className="gap-2"
                      >
                        {ITEM_ICONS[type]}
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Desktop: Full button row */}
              <div className="hidden sm:flex flex-wrap gap-2">
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
            </>
          )}
        </div>

        {/* Item Form */}
        {showItemForm && (
          <div className="mb-6">
            {itemFormContent}
          </div>
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
                      {day.items.length > 0 && (
                        <span className="text-xs bg-sand-dark text-ink-light px-2 py-1 rounded-full">
                          {day.items.length} {day.items.length === 1 ? 'activity' : 'activities'}
                        </span>
                      )}
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
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => handleDragEnd(event, day.items)}
                      >
                        <SortableContext
                          items={day.items.map(item => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {day.items.map((item) => (
                              <SortableItem
                                key={item.id}
                                item={item}
                                canEdit={canEdit}
                                onEditItem={onEditItem}
                                onDeleteItem={onDeleteItem}
                                onMoveToDate={handleMoveToDate}
                                tripDays={tripDays}
                                currentDateString={day.dateString}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
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
