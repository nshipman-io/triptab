import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Users, Map, BookOpen, TrendingUp, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { StatCard } from '@/components/admin/StatCard'
import { SimpleLineChart } from '@/components/admin/SimpleLineChart'
import { api } from '@/lib/api'

interface TopGuide {
  id: string
  title: string
  destination: string
  view_count: number
  author_name: string
  visibility: string
}

interface DailyCount {
  date: string
  count: number
}

interface AdminStats {
  total_users: number
  new_users_30d: number
  users_by_auth_provider: Record<string, number>
  total_trips: number
  active_trips: number
  total_guides: number
  public_guides: number
  total_guide_views: number
  total_expenses_count: number
  top_guides: TopGuide[]
}

interface TrendData {
  daily_signups: DailyCount[]
  daily_guide_views: DailyCount[]
}

export function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [trends, setTrends] = useState<TrendData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, trendsData] = await Promise.all([
          api.getAdminStats(),
          api.getAdminTrends(30),
        ])
        setStats(statsData as AdminStats)
        setTrends(trendsData as TrendData)
      } catch (err) {
        if (err instanceof Error && err.message.includes('403')) {
          navigate('/dashboard')
        } else if (err instanceof Error && err.message.includes('401')) {
          navigate('/login')
        } else {
          setError('Failed to load admin data')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [navigate])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-ink-light">Loading...</div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">{error || 'Failed to load data'}</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h2 className="text-2xl font-serif text-ink">Overview</h2>
          <p className="text-ink-light mt-1">Platform analytics and metrics</p>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={stats.total_users}
            subtitle={`+${stats.new_users_30d} last 30 days`}
            icon={Users}
            iconColor="text-forest"
          />
          <StatCard
            title="Total Trips"
            value={stats.total_trips}
            subtitle={`${stats.active_trips} active`}
            icon={Map}
            iconColor="text-terracotta"
          />
          <StatCard
            title="Total Guides"
            value={stats.total_guides}
            subtitle={`${stats.public_guides} public`}
            icon={BookOpen}
            iconColor="text-forest"
          />
          <StatCard
            title="Total Guide Views"
            value={stats.total_guide_views}
            icon={Eye}
            iconColor="text-terracotta"
          />
        </div>

        {/* Charts */}
        {trends && (
          <div className="grid gap-6 md:grid-cols-2">
            <SimpleLineChart
              title="User Signups (30 days)"
              data={trends.daily_signups}
              color="#2D4739"
              emptyMessage="No signups in this period"
            />
            <SimpleLineChart
              title="Guides Created (30 days)"
              data={trends.daily_guide_views}
              color="#C4785E"
              emptyMessage="No guides created in this period"
            />
          </div>
        )}

        {/* Top Guides & Auth Providers */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Guides */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5" />
                Top Guides by Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.top_guides.length === 0 ? (
                  <p className="text-ink-light text-sm">No guides yet</p>
                ) : (
                  stats.top_guides.map((guide, index) => (
                    <div key={guide.id} className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {index + 1}. {guide.title}
                        </p>
                        <p className="text-sm text-ink-light truncate">
                          {guide.destination} - by {guide.author_name}
                        </p>
                      </div>
                      <span className="text-sm font-medium ml-4 whitespace-nowrap">
                        {guide.view_count.toLocaleString()} views
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Auth Providers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5" />
                Users by Auth Provider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.users_by_auth_provider).length === 0 ? (
                  <p className="text-ink-light text-sm">No users yet</p>
                ) : (
                  Object.entries(stats.users_by_auth_provider).map(([provider, count]) => (
                    <div key={provider} className="flex items-center justify-between">
                      <span className="capitalize">{provider}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-sand rounded-full overflow-hidden">
                          <div
                            className="h-full bg-forest rounded-full"
                            style={{
                              width: `${(count / stats.total_users) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="font-medium text-sm w-12 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
