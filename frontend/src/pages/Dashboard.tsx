import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar, Users, MapPin, LogOut, Plane } from 'lucide-react'
import { api } from '@/lib/api'
import type { Trip, User } from '@/types'

export function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, tripsData] = await Promise.all([
          api.getCurrentUser(),
          api.getTrips(),
        ])
        setUser(userData as User)
        setTrips((tripsData as { data: Trip[] }).data || tripsData as Trip[])
      } catch {
        // If unauthorized, redirect to login
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate])

  const handleLogout = () => {
    api.setToken(null)
    navigate('/')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand">
        <div className="text-ink-light">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand">
      {/* Header */}
      <header className="border-b border-sand-dark bg-cream">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-serif text-xl font-medium text-forest tracking-tight hover:text-terracotta transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            Triptab
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-sand px-3 py-1.5">
              <span className="text-sm font-medium text-ink">
                {user?.name}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        {/* Page Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif text-ink">My Trips</h1>
            <p className="text-ink-light mt-1">
              Plan, organize, and share your adventures
            </p>
          </div>
          <Link to="/plan">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Trip
            </Button>
          </Link>
        </div>

        {/* Trips Grid */}
        {trips.length === 0 ? (
          <Card className="text-center p-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sand to-sand-dark">
              <Plane className="h-10 w-10 text-forest" />
            </div>
            <CardTitle className="text-2xl font-serif mb-2">No trips yet</CardTitle>
            <CardDescription className="text-ink-light mb-6">
              Start planning your first adventure by clicking the button below
            </CardDescription>
            <Link to="/plan">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Plan Your First Trip
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <Link key={trip.id} to={`/trips/${trip.id}`}>
                <Card className="hover:-translate-y-1 hover:shadow-xl p-6">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <MapPin className="h-5 w-5 text-terracotta" />
                      {trip.name}
                    </CardTitle>
                    <CardDescription className="text-ink-light">{trip.destination}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 text-sm text-ink-light">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(trip.start_date).toLocaleDateString()} -{' '}
                          {new Date(trip.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{trip.preferences.num_travelers} travelers</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
