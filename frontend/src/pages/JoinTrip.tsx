import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, MapPin } from 'lucide-react'
import { api } from '@/lib/api'
import type { Trip } from '@/types'

export function JoinTrip() {
  const { shareCode } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTrip = async () => {
      if (!shareCode) return
      try {
        const tripData = await api.getTripByShareCode(shareCode)
        setTrip(tripData as Trip)
      } catch {
        setError('Trip not found or link has expired')
      } finally {
        setLoading(false)
      }
    }

    fetchTrip()
  }, [shareCode])

  const handleJoin = async () => {
    if (!shareCode) return
    setJoining(true)
    try {
      await api.joinTrip(shareCode)
      navigate(`/trips/${trip?.id}`)
    } catch (err) {
      if (err instanceof Error && err.message.includes('login')) {
        // Redirect to login with return URL
        navigate(`/login?redirect=/join/${shareCode}`)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to join trip')
      }
    } finally {
      setJoining(false)
    }
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
              <Button className="w-full" onClick={handleJoin} disabled={joining}>
                {joining ? 'Joining...' : 'Join This Trip'}
              </Button>
              <p className="text-center text-sm text-ink-light">
                By joining, you'll be able to view and edit the trip itinerary
              </p>
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
