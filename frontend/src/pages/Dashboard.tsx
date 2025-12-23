import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar, Users, MapPin, LogOut, Plane, Settings, ChevronDown, MoreVertical, CheckCircle, RotateCcw } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { api } from '@/lib/api'
import type { Trip, User } from '@/types'

export function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [tripToArchive, setTripToArchive] = useState<Trip | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [completedOpen, setCompletedOpen] = useState(false)

  const activeTrips = trips.filter(trip => !trip.is_archived)
  const completedTrips = trips.filter(trip => trip.is_archived)

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

  // Auto-expand completed section if there are no active trips but there are completed trips
  useEffect(() => {
    if (activeTrips.length === 0 && completedTrips.length > 0) {
      setCompletedOpen(true)
    }
  }, [activeTrips.length, completedTrips.length])

  const handleLogout = () => {
    api.setToken(null)
    navigate('/')
  }

  const handleArchiveClick = (e: React.MouseEvent, trip: Trip) => {
    e.preventDefault()
    e.stopPropagation()
    setTripToArchive(trip)
    setArchiveDialogOpen(true)
  }

  const handleConfirmArchive = async () => {
    if (!tripToArchive) return

    setArchiving(true)
    try {
      const updatedTrip = await api.archiveTrip(tripToArchive.id) as Trip
      setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t))
      setArchiveDialogOpen(false)
      setTripToArchive(null)
    } catch (error) {
      console.error('Failed to archive trip:', error)
    } finally {
      setArchiving(false)
    }
  }

  const handleReactivate = async (e: React.MouseEvent, trip: Trip) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const updatedTrip = await api.unarchiveTrip(trip.id) as Trip
      setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t))
    } catch (error) {
      console.error('Failed to reactivate trip:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand">
        <div className="text-ink-light">Loading...</div>
      </div>
    )
  }

  const TripCard = ({ trip, isArchived = false }: { trip: Trip; isArchived?: boolean }) => (
    <Card className={`hover:-translate-y-1 hover:shadow-xl p-4 md:p-6 relative ${isArchived ? 'opacity-75' : ''}`}>
      <Link to={`/trips/${trip.id}`} className="absolute inset-0 z-0" />
      <CardHeader className="p-0 mb-3 md:mb-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl flex-1 min-w-0">
            <MapPin className="h-4 w-4 md:h-5 md:w-5 text-terracotta shrink-0" />
            <span className="truncate">{trip.name}</span>
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="relative z-10 p-1 rounded-md hover:bg-sand-dark transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                <MoreVertical className="h-4 w-4 text-ink-light" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isArchived ? (
                <DropdownMenuItem
                  onClick={(e) => handleReactivate(e as unknown as React.MouseEvent, trip)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={(e) => handleArchiveClick(e as unknown as React.MouseEvent, trip)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="h-4 w-4" />
                  Mark Complete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="text-ink-light truncate flex items-center gap-2">
          {trip.destination}
          {isArchived && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-sand-dark text-ink-light">
              Completed
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-ink-light">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 md:h-4 md:w-4" />
            <span>
              {new Date(trip.start_date + 'T00:00:00').toLocaleDateString('en-US')} -{' '}
              {new Date(trip.end_date + 'T00:00:00').toLocaleDateString('en-US')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 md:h-4 md:w-4" />
            <span>{trip.preferences.num_travelers}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-sand">
      {/* Header */}
      <header className="border-b border-sand-dark bg-cream">
        <div className="container mx-auto flex items-center justify-between px-4 md:px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-serif text-xl font-medium text-forest tracking-tight hover:text-terracotta transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            Triptab
          </Link>
          <div className="flex items-center gap-2 md:gap-4">
            <Link to="/guides" className="text-ink-light text-sm font-medium hover:text-terracotta transition-colors">
              Guides
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full bg-sand px-3 py-1.5 hover:bg-sand-dark transition-colors cursor-pointer">
                  <span className="text-sm font-medium text-ink truncate max-w-24 md:max-w-none">
                    {user?.name}
                  </span>
                  <ChevronDown className="h-3 w-3 text-ink-light" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Page Header */}
        <div className="mb-6 md:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-serif text-ink">My Trips</h1>
            <p className="text-ink-light mt-1 text-sm md:text-base">
              Plan, organize, and share your adventures
            </p>
          </div>
          <Link to="/plan">
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              New Trip
            </Button>
          </Link>
        </div>

        {/* Active Trips Section */}
        {trips.length === 0 ? (
          <Card className="text-center p-8 md:p-12">
            <div className="mx-auto mb-6 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-gradient-to-br from-sand to-sand-dark">
              <Plane className="h-8 w-8 md:h-10 md:w-10 text-forest" />
            </div>
            <CardTitle className="text-xl md:text-2xl font-serif mb-2">No trips yet</CardTitle>
            <CardDescription className="text-ink-light mb-6 text-sm md:text-base">
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
          <>
            {/* Active Trips */}
            {activeTrips.length > 0 && (
              <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                {activeTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            )}

            {activeTrips.length === 0 && completedTrips.length > 0 && (
              <Card className="text-center p-8 md:p-12 mb-8">
                <div className="mx-auto mb-6 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-gradient-to-br from-sand to-sand-dark">
                  <CheckCircle className="h-8 w-8 md:h-10 md:w-10 text-forest" />
                </div>
                <CardTitle className="text-xl md:text-2xl font-serif mb-2">All trips completed!</CardTitle>
                <CardDescription className="text-ink-light mb-6 text-sm md:text-base">
                  Ready for your next adventure?
                </CardDescription>
                <Link to="/plan">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Plan a New Trip
                  </Button>
                </Link>
              </Card>
            )}

            {/* Completed Trips Section */}
            {completedTrips.length > 0 && (
              <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 w-full py-3 text-left group">
                  <ChevronDown className={`h-4 w-4 text-ink-light transition-transform ${completedOpen ? '' : '-rotate-90'}`} />
                  <h2 className="text-lg font-medium text-ink">Completed Trips</h2>
                  <span className="text-sm text-ink-light bg-sand-dark px-2 py-0.5 rounded-full">
                    {completedTrips.length}
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 pt-4">
                    {completedTrips.map((trip) => (
                      <TripCard key={trip.id} trip={trip} isArchived />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </>
        )}
      </main>

      {/* Archive Confirmation Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark trip as complete?</DialogTitle>
            <DialogDescription>
              You can reactivate it anytime from your dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setArchiveDialogOpen(false)}
              disabled={archiving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmArchive}
              disabled={archiving}
            >
              {archiving ? 'Completing...' : 'Complete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
