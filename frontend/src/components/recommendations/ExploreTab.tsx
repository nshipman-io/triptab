import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router'
import { Compass, Loader2, MapPin, Clock, DollarSign, Plus, Star, Utensils, Ticket, Camera, Hotel, Search, ChevronRight, ChevronLeft, Eye, X, Calendar, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Recommendation, GuideSummary } from '@/types'

const CATEGORY_OPTIONS = [
  { value: 'restaurants', label: 'Restaurants', icon: <Utensils className="h-4 w-4" /> },
  { value: 'activities', label: 'Activities', icon: <Ticket className="h-4 w-4" /> },
  { value: 'attractions', label: 'Attractions', icon: <Camera className="h-4 w-4" /> },
  { value: 'hotels', label: 'Hotels', icon: <Hotel className="h-4 w-4" /> },
]

interface ExploreTabProps {
  tripId: string
  tripStartDate: string
  tripEndDate: string
  tripDestination?: string
  onAddToItinerary: () => void
  canEdit?: boolean
}

// Helper to generate dates between start and end
function getDatesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate.split('T')[0])
  const end = new Date(endDate.split('T')[0])

  const current = new Date(start)
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  return dates
}

// Helper to format date for display (MM/DD/YYYY)
function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
}

export function ExploreTab({ tripId, tripStartDate, tripEndDate, tripDestination, onAddToItinerary, canEdit = true }: ExploreTabProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [guides, setGuides] = useState<GuideSummary[]>([])
  const [guidesLoading, setGuidesLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('activities')
  const [addingIndex, setAddingIndex] = useState<number | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [guidesExpanded, setGuidesExpanded] = useState(true)
  const [recommendationsExpanded, setRecommendationsExpanded] = useState(true)
  const guidesScrollRef = useRef<HTMLDivElement>(null)

  // Detail modal state
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Add to itinerary modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [addingRecommendation, setAddingRecommendation] = useState<Recommendation | null>(null)

  // Get available dates for the trip
  const tripDates = getDatesBetween(tripStartDate, tripEndDate)

  // Load guides on mount
  useEffect(() => {
    const loadGuides = async () => {
      try {
        const data = await api.getPublicGuides(tripDestination, 10)
        setGuides(data as GuideSummary[])
      } catch (error) {
        console.error('Failed to load guides:', error)
        setGuides([])
      } finally {
        setGuidesLoading(false)
      }
    }
    loadGuides()
  }, [tripDestination])

  const loadRecommendations = async () => {
    setLoading(true)
    try {
      const data = await api.getRecommendations(tripId, category, 5)
      setRecommendations(data as Recommendation[])
      setHasSearched(true)
    } catch (error) {
      console.error('Failed to load recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (rec: Recommendation) => {
    setSelectedRecommendation(rec)
    setShowDetailModal(true)
  }

  const handleAddClick = (rec: Recommendation, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setAddingRecommendation(rec)
    setSelectedDate(tripDates[0] || tripStartDate.split('T')[0])
    setShowAddModal(true)
  }

  const handleConfirmAdd = async () => {
    if (!addingRecommendation || !selectedDate) return

    const recIndex = recommendations.findIndex(r => r.name === addingRecommendation.name)
    setAddingIndex(recIndex)

    try {
      await api.addRecommendationToItinerary(
        tripId,
        addingRecommendation as unknown as Record<string, unknown>,
        selectedDate
      )
      onAddToItinerary()
      setShowAddModal(false)
      setShowDetailModal(false)
      toast.success(`Added "${addingRecommendation.name}" to your itinerary`, {
        description: `Scheduled for ${formatDateDisplay(selectedDate)}`,
        duration: 4000,
      })
    } catch (error) {
      console.error('Failed to add to itinerary:', error)
      toast.error('Failed to add to itinerary', {
        description: 'Please try again',
      })
    } finally {
      setAddingIndex(null)
      setAddingRecommendation(null)
    }
  }

  const scrollGuides = (direction: 'left' | 'right') => {
    if (guidesScrollRef.current) {
      const scrollAmount = 300
      guidesScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Detail Modal */}
      {showDetailModal && selectedRecommendation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDetailModal(false)}>
          <div
            className="bg-cream rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-cream border-b border-sand-dark p-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif text-ink">{selectedRecommendation.name}</h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-ink-light">
                  {selectedRecommendation.rating && (
                    <span className="flex items-center gap-1 text-golden">
                      <Star className="h-4 w-4 fill-current" />
                      {selectedRecommendation.rating}
                    </span>
                  )}
                  <span className="capitalize">{selectedRecommendation.category}</span>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-sand rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-ink mb-2">About</h3>
                <p className="text-sm text-ink-light leading-relaxed">{selectedRecommendation.description}</p>
              </div>

              {/* Why Recommended */}
              {selectedRecommendation.why_recommended && (
                <div className="bg-forest/10 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-forest mb-1">Why We Recommend This</h3>
                  <p className="text-sm text-ink-light italic">{selectedRecommendation.why_recommended}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                {selectedRecommendation.estimated_cost && (
                  <div className="bg-sand rounded-xl p-3">
                    <div className="flex items-center gap-2 text-forest mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-xs font-medium">Estimated Cost</span>
                    </div>
                    <p className="text-sm text-ink">{selectedRecommendation.estimated_cost}</p>
                  </div>
                )}
                {selectedRecommendation.duration && (
                  <div className="bg-sand rounded-xl p-3">
                    <div className="flex items-center gap-2 text-forest mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-medium">Duration</span>
                    </div>
                    <p className="text-sm text-ink">{selectedRecommendation.duration}</p>
                  </div>
                )}
              </div>

              {/* Location */}
              {selectedRecommendation.location?.address && (
                <div className="bg-sand rounded-xl p-3">
                  <div className="flex items-center gap-2 text-terracotta mb-1">
                    <MapPin className="h-4 w-4" />
                    <span className="text-xs font-medium">Location</span>
                  </div>
                  <p className="text-sm text-ink">{selectedRecommendation.location.address}</p>
                  {selectedRecommendation.location.lat && selectedRecommendation.location.lng && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedRecommendation.location.lat},${selectedRecommendation.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-forest hover:underline mt-2"
                    >
                      View on Google Maps
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Tags */}
              {selectedRecommendation.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-ink mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecommendation.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-sand-dark px-3 py-1 text-xs text-ink-light"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Website Link */}
              {selectedRecommendation.website_url && (
                <div className="pt-2">
                  <a
                    href={selectedRecommendation.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-forest text-cream rounded-xl hover:bg-forest-light transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Visit Website
                  </a>
                </div>
              )}
            </div>

            {/* Footer with Add Button */}
            {canEdit && (
              <div className="sticky bottom-0 bg-cream border-t border-sand-dark p-4">
                <Button
                  onClick={() => handleAddClick(selectedRecommendation)}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add to Itinerary
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add to Itinerary Modal with Date Picker */}
      {showAddModal && addingRecommendation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddModal(false)}>
          <div
            className="bg-cream rounded-2xl max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-sand-dark p-4">
              <h2 className="text-lg font-serif text-ink">Add to Itinerary</h2>
              <p className="text-sm text-ink-light mt-1">{addingRecommendation.name}</p>
            </div>

            {/* Date Selection */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-ink-light mb-2">
                <Calendar className="h-4 w-4" />
                <span>Select a date for this activity</span>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {tripDates.map((date) => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`p-3 rounded-xl text-sm text-left transition-all ${
                      selectedDate === date
                        ? 'bg-forest text-cream'
                        : 'bg-sand hover:bg-sand-dark text-ink'
                    }`}
                  >
                    {formatDateDisplay(date)}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-sand-dark p-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAdd}
                disabled={!selectedDate || addingIndex !== null}
                className="flex-1 gap-2"
              >
                {addingIndex !== null ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Explore Section Header */}
      <Collapsible open={guidesExpanded} onOpenChange={setGuidesExpanded}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 group">
              <ChevronRight
                className={`h-5 w-5 text-ink-light transition-transform duration-200 ${guidesExpanded ? 'rotate-90' : ''}`}
              />
              <h2 className="text-xl font-serif text-ink">Explore</h2>
            </button>
          </CollapsibleTrigger>
          <Button variant="default" size="sm" className="gap-2 bg-terracotta hover:bg-terracotta-light">
            <Search className="h-4 w-4" />
            Browse all
          </Button>
        </div>

        <CollapsibleContent className="mt-4">
          {/* Distance indicator */}
          {tripDestination && (
            <div className="flex items-center gap-2 text-sm text-ink-light mb-4">
              <MapPin className="h-4 w-4" />
              <span>Guides and itineraries for {tripDestination}</span>
            </div>
          )}

          {/* Guide Cards Carousel */}
          {guidesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-forest" />
            </div>
          ) : guides.length === 0 ? (
            <div className="py-8 text-center">
              <MapPin className="mx-auto h-10 w-10 text-ink-light mb-3" />
              <p className="text-ink-light text-sm">
                No guides available for this destination yet.
              </p>
              <p className="text-ink-light text-xs mt-1">
                Be the first to create one!
              </p>
            </div>
          ) : (
            <div className="relative group overflow-hidden">
              {/* Scroll buttons */}
              <button
                onClick={() => scrollGuides('left')}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => scrollGuides('right')}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Scrollable container */}
              <div
                ref={guidesScrollRef}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {guides.map((guide) => (
                  <Link
                    key={guide.id}
                    to={`/guides/${guide.id}`}
                    className="flex-shrink-0 w-64 snap-start cursor-pointer group/card"
                  >
                    <div className="relative h-40 rounded-xl overflow-hidden mb-3">
                      {guide.cover_image_url ? (
                        <img
                          src={guide.cover_image_url}
                          alt={guide.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-forest to-forest-light flex items-center justify-center">
                          <MapPin className="h-8 w-8 text-cream/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {/* View count badge */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/40 text-white text-xs px-2 py-1 rounded-full">
                        <Eye className="h-3 w-3" />
                        {guide.view_count}
                      </div>
                    </div>
                    <h3 className="font-medium text-ink text-sm line-clamp-2 mb-1 group-hover/card:text-forest transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-ink-light line-clamp-2 mb-2">
                      {guide.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-ink-light">
                      <span className="flex items-center gap-1">
                        <span className="w-5 h-5 rounded-full bg-sand-dark flex items-center justify-center text-[10px] font-medium">
                          {guide.author.avatar_url ? (
                            <img
                              src={guide.author.avatar_url}
                              alt={guide.author.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            guide.author.name.charAt(0).toUpperCase()
                          )}
                        </span>
                        {guide.author.name}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {guide.destination}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* AI Recommendations Section */}
      <Collapsible open={recommendationsExpanded} onOpenChange={setRecommendationsExpanded}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 group w-full">
            <ChevronRight
              className={`h-5 w-5 text-ink-light transition-transform duration-200 ${recommendationsExpanded ? 'rotate-90' : ''}`}
            />
            <h2 className="text-xl font-serif text-ink">AI Recommendations</h2>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-4">
          {/* Category Filter */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <Button
                  key={cat.value}
                  variant={category === cat.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategory(cat.value)}
                  className="gap-1.5 text-xs sm:text-sm"
                >
                  {cat.icon}
                  {cat.label}
                </Button>
              ))}
            </div>
            <Button onClick={loadRecommendations} disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Compass className="mr-2 h-4 w-4" />
                  Get Recommendations
                </>
              )}
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">
                  Finding the best {category} for your trip...
                </p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!loading && !hasSearched && (
            <Card>
              <CardContent className="py-12 text-center">
                <Compass className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Discover Your Destination</h3>
                <p className="text-muted-foreground mb-4">
                  Get personalized recommendations based on your trip preferences
                </p>
                <Button onClick={loadRecommendations}>
                  <Compass className="mr-2 h-4 w-4" />
                  Get Recommendations
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Recommendations Grid */}
          {!loading && recommendations.length > 0 && (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
              {recommendations.map((rec, index) => (
                <Card
                  key={index}
                  className="p-4 sm:p-5 cursor-pointer hover:shadow-md hover:border-forest/30 transition-all"
                  onClick={() => handleCardClick(rec)}
                >
                  {/* Header with name and add button */}
                  <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-ink text-sm sm:text-base line-clamp-2">{rec.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-ink-light">
                        {rec.rating && (
                          <span className="flex items-center gap-1 text-golden">
                            <Star className="h-3 w-3 fill-current" />
                            {rec.rating}
                          </span>
                        )}
                        <span className="capitalize">{rec.category}</span>
                      </div>
                    </div>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleAddClick(rec, e)}
                        disabled={addingIndex === index}
                        className="shrink-0 h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                      >
                        {addingIndex === index ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline sm:ml-1">Add</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-ink-light leading-relaxed mb-2 sm:mb-3 line-clamp-3">{rec.description}</p>

                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-ink-light">
                    {rec.estimated_cost && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-forest" />
                        <span className="truncate max-w-24">{rec.estimated_cost}</span>
                      </span>
                    )}
                    {rec.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-forest" />
                        {rec.duration}
                      </span>
                    )}
                    {rec.location?.address && (
                      <span className="flex items-center gap-1 min-w-0">
                        <MapPin className="h-3 w-3 text-terracotta shrink-0" />
                        <span className="truncate">{rec.location.address}</span>
                      </span>
                    )}
                  </div>

                  {/* Why recommended */}
                  {rec.why_recommended && (
                    <p className="mt-2 sm:mt-3 text-xs italic text-ink-light line-clamp-2">
                      {rec.why_recommended}
                    </p>
                  )}

                  {/* Tags */}
                  {rec.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2 sm:mt-3">
                      {rec.tags.slice(0, 4).map((tag, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-sand-dark px-1.5 sm:px-2 py-0.5 text-xs text-ink-light"
                        >
                          {tag}
                        </span>
                      ))}
                      {rec.tags.length > 4 && (
                        <span className="text-xs text-ink-light">+{rec.tags.length - 4}</span>
                      )}
                    </div>
                  )}

                  {/* Click hint */}
                  <div className="mt-3 pt-3 border-t border-sand text-xs text-ink-light flex items-center justify-center gap-1">
                    <span>Click for more details</span>
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && hasSearched && recommendations.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No recommendations found. Try a different category.
                </p>
              </CardContent>
            </Card>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
