import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, MapPin } from 'lucide-react'
import { api } from '@/lib/api'
import type { Trip, User } from '@/types'

export function JoinTrip() {
  const { shareCode } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMember, setIsMember] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!shareCode) return

      let currentUser: User | null = null

      // Check authentication status first
      try {
        const userData = await api.getCurrentUser()
        currentUser = userData as User
        setUser(currentUser)
        setIsAuthenticated(true)
      } catch {
        setIsAuthenticated(false)
      }

      // Fetch trip details (public endpoint)
      try {
        const tripData = await api.getTripByShareCode(shareCode) as Trip
        setTrip(tripData)

        // If authenticated, check if user is already a member or owner
        if (currentUser && tripData) {
          // Check if user is the owner
          if (tripData.owner_id === currentUser.id) {
            setIsMember(true)
          } else {
            // Check if user is a member by trying to fetch members
            try {
              const membersData = await api.getTripMembers(tripData.id)
              const members = (membersData as { data: Array<{ user_id: string }> }).data || membersData as Array<{ user_id: string }>
              const isAlreadyMember = members.some((m: { user_id: string }) => m.user_id === currentUser!.id)
              setIsMember(isAlreadyMember)
            } catch {
              // If we can't fetch members, user might not have access yet
              setIsMember(false)
            }
          }
        }
      } catch {
        setError('Trip not found or link has expired')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [shareCode])

  const handleJoin = async () => {
    if (!shareCode) return
    setJoining(true)
    try {
      await api.joinTrip(shareCode)
      navigate(`/trips/${trip?.id}`)
    } catch (err) {
      if (err instanceof Error && err.message.includes('401')) {
        // Redirect to login with return URL
        navigate(`/login?redirect=/join/${shareCode}`)
      } else if (err instanceof Error && err.message.includes('Already')) {
        // Already a member, just navigate to trip
        navigate(`/trips/${trip?.id}`)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to join trip')
      }
    } finally {
      setJoining(false)
    }
  }

  const handleLoginRedirect = () => {
    navigate(`/login?redirect=/join/${shareCode}`)
  }

  const handleRegisterRedirect = () => {
    navigate(`/register?redirect=/join/${shareCode}`)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand">
        <div className="text-ink-light">Loading trip...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand p-4">
      <Card className="w-full max-w-md p-8">
        <CardHeader className="text-center p-0 mb-8">
          <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-serif text-2xl font-medium text-forest tracking-tight">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            Triptab
          </Link>
          {error ? (
            <>
              <CardTitle className="text-2xl font-serif text-destructive">Oops!</CardTitle>
              <CardDescription className="text-ink-light mt-2">{error}</CardDescription>
            </>
          ) : trip && isMember ? (
            <>
              <CardTitle className="text-2xl font-serif">You're going!</CardTitle>
              <CardDescription className="text-ink-light mt-2">You're already part of this trip</CardDescription>
            </>
          ) : trip ? (
            <>
              <CardTitle className="text-2xl font-serif">You're invited!</CardTitle>
              <CardDescription className="text-ink-light mt-2">Someone wants you to join their trip</CardDescription>
            </>
          ) : null}
        </CardHeader>

        {trip && !error && (
          <>
            <CardContent className="p-0">
              <div className="rounded-xl bg-sand p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-serif">
                  <MapPin className="h-5 w-5 text-terracotta" />
                  {trip.name}
                </h3>
                <p className="mb-4 text-ink-light">{trip.destination}</p>
                <div className="flex items-center gap-6 text-sm text-ink-light">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(trip.start_date).toLocaleDateString()} -{' '}
                      {new Date(trip.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{trip.preferences.num_travelers} travelers</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 p-0 mt-8">
              {isAuthenticated && isMember ? (
                <>
                  <Link to={`/trips/${trip.id}`} className="w-full">
                    <Button className="w-full">
                      View Trip
                    </Button>
                  </Link>
                  <p className="text-center text-sm text-ink-light">
                    Signed in as {user?.name || user?.email}
                  </p>
                </>
              ) : isAuthenticated ? (
                <>
                  <Button className="w-full" onClick={handleJoin} disabled={joining}>
                    {joining ? 'Joining...' : 'Join This Trip'}
                  </Button>
                  <p className="text-center text-sm text-ink-light">
                    Joining as {user?.name || user?.email}
                  </p>
                </>
              ) : (
                <>
                  <Button className="w-full" onClick={handleRegisterRedirect}>
                    Create Account & Join
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleLoginRedirect}>
                    I Have an Account
                  </Button>
                  <p className="text-center text-sm text-ink-light">
                    Sign in or create an account to join this trip
                  </p>
                </>
              )}
            </CardFooter>
          </>
        )}

        {error && (
          <CardFooter className="p-0 mt-8">
            <Link to="/" className="w-full">
              <Button variant="outline" className="w-full">
                Go to Homepage
              </Button>
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
