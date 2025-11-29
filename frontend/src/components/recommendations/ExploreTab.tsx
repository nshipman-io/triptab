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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Explore</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered recommendations for your trip
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2">
        {CATEGORY_OPTIONS.map((cat) => (
          <Button
            key={cat.value}
            variant={category === cat.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategory(cat.value)}
            className="gap-2"
          >
            {cat.icon}
            {cat.label}
          </Button>
        ))}
        <Button onClick={loadRecommendations} disabled={loading} className="ml-auto">
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
        <div className="grid gap-4 md:grid-cols-2">
          {recommendations.map((rec, index) => (
            <Card key={index} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="font-medium text-ink truncate">{rec.name}</h3>
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
                  className="shrink-0"
                >
                  {addingIndex === index ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <p className="text-sm text-ink-light leading-relaxed mb-3">{rec.description}</p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-ink-light">
                {rec.estimated_cost && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-forest" />
                    {rec.estimated_cost}
                  </span>
                )}
                {rec.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-forest" />
                    {rec.duration}
                  </span>
                )}
                {rec.location?.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-terracotta" />
                    {rec.location.address}
                  </span>
                )}
              </div>

              {rec.why_recommended && (
                <p className="mt-3 text-xs italic text-ink-light">
                  {rec.why_recommended}
                </p>
              )}

              {rec.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {rec.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-sand-dark px-2 py-0.5 text-xs text-ink-light"
                    >
                      {tag}
                    </span>
                  ))}
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
