import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plane, Plus, Calendar, Users, MapPin, LogOut } from 'lucide-react'
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Plane className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Triply</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.name}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Trips</h1>
            <p className="text-muted-foreground">
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
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Plane className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>No trips yet</CardTitle>
              <CardDescription>
                Start planning your first adventure by clicking the button below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/plan">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Plan Your First Trip
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <Link key={trip.id} to={`/trips/${trip.id}`}>
                <Card className="transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      {trip.name}
                    </CardTitle>
                    <CardDescription>{trip.destination}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
