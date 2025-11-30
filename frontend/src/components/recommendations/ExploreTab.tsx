import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router'
import { Compass, Loader2, MapPin, Clock, DollarSign, Plus, Star, Utensils, Ticket, Camera, Hotel, Search, ChevronRight, ChevronLeft, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { api } from '@/lib/api'
import type { Recommendation, GuideSummary } from '@/types'

const CATEGORY_OPTIONS = [
  { value: 'restaurants', label: 'Restaurants', icon: <Utensils className="h-4 w-4" /> },
  { value: 'activities', label: 'Activities', icon: <Ticket className="h-4 w-4" /> },
  { value: 'attractions', label: 'Attractions', icon: <Camera className="h-4 w-4" /> },
  { value: 'hotels', label: 'Hotels', icon: <Hotel className="h-4 w-4" /> },
]

// Placeholder guides shown when no real guides exist
const PLACEHOLDER_GUIDES: GuideSummary[] = [
  {
    id: 'placeholder-1',
    title: "Local's Guide to Hidden Gems",
    description: 'Discover off-the-beaten-path spots loved by locals',
    destination: 'Costa Rica',
    cover_image_url: 'https://images.unsplash.com/photo-1518259102261-b40117eabbc9?w=400&h=300&fit=crop',
    visibility: 'public',
    view_count: 1247,
    tags: ['nature', 'adventure', 'wildlife'],
    author: { id: 'system', name: 'TripTab', avatar_url: undefined },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'placeholder-2',
    title: 'Ultimate 2 Week Itinerary',
    description: 'A comprehensive guide covering the best of the country',
    destination: 'Costa Rica',
    cover_image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
    visibility: 'public',
    view_count: 892,
    tags: ['itinerary', 'beaches', 'rainforest'],
    author: { id: 'system', name: 'TripTab', avatar_url: undefined },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'placeholder-3',
    title: 'Best Restaurants & Food Guide',
    description: 'From street food to fine dining - where to eat',
    destination: 'Costa Rica',
    cover_image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
    visibility: 'public',
    view_count: 634,
    tags: ['food', 'restaurants', 'local cuisine'],
    author: { id: 'system', name: 'TripTab', avatar_url: undefined },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

interface ExploreTabProps {
  tripId: string
  tripStartDate: string
  tripDestination?: string
  onAddToItinerary: () => void
  canEdit?: boolean
}

export function ExploreTab({ tripId, tripStartDate, tripDestination, onAddToItinerary, canEdit = true }: ExploreTabProps) {
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

  // Load guides on mount
  useEffect(() => {
    const loadGuides = async () => {
      try {
        const data = await api.getPublicGuides(tripDestination, 10)
        const fetchedGuides = data as GuideSummary[]
        // Use placeholder guides if no real guides exist, customized with destination
        if (fetchedGuides.length === 0 && tripDestination) {
          const customizedPlaceholders = PLACEHOLDER_GUIDES.map(g => ({
            ...g,
            destination: tripDestination,
          }))
          setGuides(customizedPlaceholders)
        } else {
          setGuides(fetchedGuides)
        }
      } catch (error) {
        console.error('Failed to load guides:', error)
        // Show placeholders on error too
        if (tripDestination) {
          const customizedPlaceholders = PLACEHOLDER_GUIDES.map(g => ({
            ...g,
            destination: tripDestination,
          }))
          setGuides(customizedPlaceholders)
        }
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

  const handleAddToItinerary = async (rec: Recommendation, index: number) => {
    setAddingIndex(index)
    try {
      await api.addRecommendationToItinerary(
        tripId,
        rec as unknown as Record<string, unknown>,
        tripStartDate
      )
      onAddToItinerary()
    } catch (error) {
      console.error('Failed to add to itinerary:', error)
    } finally {
      setAddingIndex(null)
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
                {guides.map((guide) => {
                  const isPlaceholder = guide.id.startsWith('placeholder-')
                  const CardWrapper = isPlaceholder ? 'div' : Link
                  const cardProps = isPlaceholder
                    ? { className: "flex-shrink-0 w-64 snap-start group/card" }
                    : { to: `/guides/${guide.id}`, className: "flex-shrink-0 w-64 snap-start cursor-pointer group/card" }

                  return (
                    <CardWrapper key={guide.id} {...cardProps as any}>
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
                        {/* Coming soon badge for placeholders */}
                        {isPlaceholder && (
                          <div className="absolute top-2 left-2 bg-terracotta text-white text-xs px-2 py-1 rounded-full">
                            Coming Soon
                          </div>
                        )}
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
                    </CardWrapper>
                  )
                })}
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
                <Card key={index} className="p-4 sm:p-5">
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
                        onClick={() => handleAddToItinerary(rec, index)}
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
