import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  ArrowLeft, MapPin, Share2, Check, ChevronRight,
  Eye, DollarSign, Loader2
} from 'lucide-react'
import { api } from '@/lib/api'
import type { Guide, GuidePlace } from '@/types'
import { cn } from '@/lib/utils'

export function GuideView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [guide, setGuide] = useState<Guide | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchGuide = async () => {
      if (!id) return
      try {
        const data = await api.getGuide(id)
        setGuide(data as Guide)
        // Expand all sections by default
        const sectionIds = (data as Guide).sections.map(s => s.id)
        setExpandedSections(new Set(sectionIds))
        // Increment view count
        api.incrementGuideViewCount(id).catch(() => {})
      } catch (err) {
        console.error('Failed to load guide:', err)
        setError('Guide not found')
      } finally {
        setLoading(false)
      }
    }
    fetchGuide()
  }, [id])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  const handleCopyShareLink = async () => {
    if (!guide) return
    const shareUrl = `${window.location.origin}/guides/share/${guide.share_code}`
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    )
  }

  if (error || !guide) {
    return (
      <div className="min-h-screen bg-sand flex flex-col items-center justify-center">
        <h1 className="text-2xl font-serif text-ink mb-4">Guide not found</h1>
        <Button onClick={() => navigate('/')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go back
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-forest to-forest-light">
        {guide.cover_image_url ? (
          <img
            src={guide.cover_image_url}
            alt={guide.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="h-16 w-16 text-cream/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Back button */}
        <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="bg-white/20 hover:bg-white/40 text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Share button */}
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyShareLink}
            className="bg-white/20 hover:bg-white/40 text-white"
          >
            {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
          </Button>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-serif text-white mb-2">
              {guide.title}
            </h1>
            <div className="flex items-center gap-4 text-white/80 text-sm">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {guide.destination}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {guide.view_count} views
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Author & Description */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-forest text-cream flex items-center justify-center font-medium">
              {guide.author.avatar_url ? (
                <img
                  src={guide.author.avatar_url}
                  alt={guide.author.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                guide.author.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="font-medium text-ink">{guide.author.name}</p>
              <p className="text-sm text-ink-light">
                {new Date(guide.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          {guide.description && (
            <p className="text-ink-light leading-relaxed">{guide.description}</p>
          )}

          {/* Tags */}
          {guide.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {guide.tags.map((tag, i) => (
                <span
                  key={i}
                  className="rounded-full bg-sand-dark px-3 py-1 text-sm text-ink-light"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {guide.sections.length === 0 ? (
            <Card className="p-8">
              <CardContent className="text-center p-0">
                <MapPin className="mx-auto h-12 w-12 text-ink-light mb-4" />
                <h3 className="text-lg font-serif mb-2">No sections yet</h3>
                <p className="text-ink-light">
                  This guide doesn't have any content yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            guide.sections.map((section) => (
              <Collapsible
                key={section.id}
                open={expandedSections.has(section.id)}
                onOpenChange={() => toggleSection(section.id)}
              >
                <Card className="overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-sand-dark/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <ChevronRight
                          className={cn(
                            "h-5 w-5 text-ink-light transition-transform duration-200",
                            expandedSections.has(section.id) && "rotate-90"
                          )}
                        />
                        <div className="text-left">
                          <h3 className="font-serif text-lg text-ink">{section.title}</h3>
                          {section.description && (
                            <p className="text-sm text-ink-light line-clamp-1">
                              {section.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-ink-light">
                        {section.places.length} {section.places.length === 1 ? 'place' : 'places'}
                      </span>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t border-sand-dark">
                      {section.places.length === 0 ? (
                        <div className="p-6 text-center text-ink-light">
                          No places in this section yet.
                        </div>
                      ) : (
                        <div className="divide-y divide-sand-dark">
                          {section.places.map((place) => (
                            <PlaceCard key={place.id} place={place} />
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function PlaceCard({ place }: { place: GuidePlace }) {
  return (
    <div className="p-4 hover:bg-sand-dark/30 transition-colors">
      <div className="flex gap-4">
        {/* Photo */}
        {place.photo_url ? (
          <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
            <img
              src={place.photo_url}
              alt={place.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-lg bg-sand-dark flex items-center justify-center shrink-0">
            <MapPin className="h-6 w-6 text-ink-light" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-ink mb-1">{place.name}</h4>

          {place.category && (
            <span className="inline-block text-xs bg-terracotta/10 text-terracotta px-2 py-0.5 rounded-full mb-2">
              {place.category}
            </span>
          )}

          {place.description && (
            <p className="text-sm text-ink-light line-clamp-2 mb-2">
              {place.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-ink-light">
            {place.address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[200px]">{place.address}</span>
              </span>
            )}
            {place.price_range && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {place.price_range}
              </span>
            )}
          </div>

          {/* Tips */}
          {place.tips && (
            <div className="mt-2 p-2 bg-golden/10 rounded-lg">
              <p className="text-xs text-golden-light italic">
                💡 {place.tips}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
