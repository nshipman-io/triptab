import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe, Calendar, Users, MapPin } from 'lucide-react'
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-muted-foreground">Loading trip...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="mb-4 flex items-center justify-center gap-2">
            <Globe className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Triptab</span>
          </Link>
          {error ? (
            <>
              <CardTitle className="text-destructive">Oops!</CardTitle>
              <CardDescription>{error}</CardDescription>
            </>
          ) : trip ? (
            <>
              <CardTitle>You're invited!</CardTitle>
              <CardDescription>Someone wants you to join their trip</CardDescription>
            </>
          ) : null}
        </CardHeader>

        {trip && !error && (
          <>
            <CardContent>
              <div className="rounded-lg bg-muted/50 p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <MapPin className="h-5 w-5 text-primary" />
                  {trip.name}
                </h3>
                <p className="mb-4 text-muted-foreground">{trip.destination}</p>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(trip.start_date).toLocaleDateString()} -{' '}
                      {new Date(trip.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{trip.preferences.num_travelers} travelers</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" onClick={handleJoin} disabled={joining}>
                {joining ? 'Joining...' : 'Join This Trip'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                By joining, you'll be able to view and edit the trip itinerary
              </p>
            </CardFooter>
          </>
        )}

        {error && (
          <CardFooter>
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
