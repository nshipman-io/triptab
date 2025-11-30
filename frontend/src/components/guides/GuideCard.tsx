import { Link } from 'react-router'
import { MapPin, Eye } from 'lucide-react'
import type { GuideSummary } from '@/types'

interface GuideCardProps {
  guide: GuideSummary
  className?: string
}

export function GuideCard({ guide, className = '' }: GuideCardProps) {
  return (
    <Link
      to={`/guides/${guide.id}`}
      className={`block group ${className}`}
    >
      <div className="relative h-40 rounded-xl overflow-hidden mb-3">
        {guide.cover_image_url ? (
          <img
            src={guide.cover_image_url}
            alt={guide.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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

      <h3 className="font-medium text-ink text-sm line-clamp-2 mb-1 group-hover:text-forest transition-colors">
        {guide.title}
      </h3>

      {guide.description && (
        <p className="text-xs text-ink-light line-clamp-2 mb-2">
          {guide.description}
        </p>
      )}

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
  )
}
