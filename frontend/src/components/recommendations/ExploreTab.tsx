import { useState } from 'react'
import { Compass, Loader2, MapPin, Clock, DollarSign, Plus, Star, Utensils, Ticket, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/lib/api'
import type { Recommendation } from '@/types'

const CATEGORY_OPTIONS = [
  { value: 'restaurants', label: 'Restaurants', icon: <Utensils className="h-4 w-4" /> },
  { value: 'activities', label: 'Activities', icon: <Ticket className="h-4 w-4" /> },
  { value: 'attractions', label: 'Attractions', icon: <Camera className="h-4 w-4" /> },
]

interface ExploreTabProps {
  tripId: string
  tripStartDate: string
  onAddToItinerary: () => void
}

export function ExploreTab({ tripId, tripStartDate, onAddToItinerary }: ExploreTabProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('activities')
  const [addingIndex, setAddingIndex] = useState<number | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-serif text-ink">Explore</h2>
        <p className="text-sm text-ink-light">
          AI-powered recommendations for your trip
        </p>
      </div>

      {/* Category Filter - stacked on mobile */}
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
    </div>
  )
}
