import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { Eye, Globe, Lock, Link as LinkIcon, ChevronUp, ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { StatCard } from '@/components/admin/StatCard'
import { api } from '@/lib/api'

interface GuideListItem {
  id: string
  title: string
  destination: string
  visibility: string
  view_count: number
  author_name: string
  author_email: string
  created_at: string
}

interface GuideAnalytics {
  total_guides: number
  public_guides: number
  private_guides: number
  unlisted_guides: number
  total_views: number
  guides: GuideListItem[]
}

type SortField = 'view_count' | 'created_at' | 'title'
type SortOrder = 'asc' | 'desc'
type VisibilityFilter = 'all' | 'public' | 'private' | 'unlisted'

const visibilityFilters: { value: VisibilityFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'unlisted', label: 'Unlisted' },
]

export function AdminGuides() {
  const navigate = useNavigate()
  const [data, setData] = useState<GuideAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibility, setVisibility] = useState<VisibilityFilter>('all')
  const [sortBy, setSortBy] = useState<SortField>('view_count')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const fetchGuides = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api.getAdminGuides({
        visibility: visibility === 'all' ? undefined : visibility,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: 50,
      })
      setData(result as GuideAnalytics)
    } catch (err) {
      if (err instanceof Error && err.message.includes('403')) {
        navigate('/dashboard')
      } else if (err instanceof Error && err.message.includes('401')) {
        navigate('/login')
      } else {
        setError('Failed to load guides')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate, visibility, sortBy, sortOrder])

  useEffect(() => {
    fetchGuides()
  }, [fetchGuides])

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    )
  }

  const VisibilityIcon = ({ visibility }: { visibility: string }) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-4 w-4 text-forest" />
      case 'private':
        return <Lock className="h-4 w-4 text-ink-light" />
      case 'unlisted':
        return <LinkIcon className="h-4 w-4 text-terracotta" />
      default:
        return null
    }
  }

  if (error && !data) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">{error}</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-2xl font-serif text-ink">Guides</h2>
          <p className="text-ink-light mt-1">Guide performance and analytics</p>
        </div>

        {/* Stats */}
        {data && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <StatCard
              title="Total Guides"
              value={data.total_guides}
              icon={Eye}
              iconColor="text-forest"
            />
            <StatCard
              title="Public"
              value={data.public_guides}
              icon={Globe}
              iconColor="text-forest"
            />
            <StatCard
              title="Private"
              value={data.private_guides}
              icon={Lock}
              iconColor="text-ink-light"
            />
            <StatCard
              title="Unlisted"
              value={data.unlisted_guides}
              icon={LinkIcon}
              iconColor="text-terracotta"
            />
            <StatCard
              title="Total Views"
              value={data.total_views}
              icon={Eye}
              iconColor="text-terracotta"
            />
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2">
          {visibilityFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={visibility === filter.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVisibility(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-sand-dark bg-cream">
                  <tr>
                    <th
                      className="text-left px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider cursor-pointer hover:text-ink"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center gap-1">
                        Guide <SortIcon field="title" />
                      </div>
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider">
                      Author
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider">
                      Visibility
                    </th>
                    <th
                      className="text-right px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider cursor-pointer hover:text-ink"
                      onClick={() => handleSort('view_count')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Views <SortIcon field="view_count" />
                      </div>
                    </th>
                    <th
                      className="text-left px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider cursor-pointer hover:text-ink"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-1">
                        Created <SortIcon field="created_at" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand">
                  {loading && !data ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-ink-light">
                        Loading...
                      </td>
                    </tr>
                  ) : data?.guides.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-ink-light">
                        No guides found
                      </td>
                    </tr>
                  ) : (
                    data?.guides.map((guide) => (
                      <tr key={guide.id} className="hover:bg-sand/50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">{guide.title}</p>
                            <p className="text-sm text-ink-light">{guide.destination}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm">{guide.author_name}</p>
                            <p className="text-xs text-ink-light">{guide.author_email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <VisibilityIcon visibility={guide.visibility} />
                            <span className="text-sm capitalize">{guide.visibility}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium">
                          {guide.view_count.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-ink-light text-sm">
                          {new Date(guide.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
