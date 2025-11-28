import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Plane, Hotel, MapPin, Utensils, Car, Calendar, Users, Share2, Plus,
  Check, Copy, ArrowLeft, GripVertical
} from 'lucide-react'
import { api } from '@/lib/api'
import type { Trip, ItineraryItem, TripMember, ItineraryItemType } from '@/types'
import { cn } from '@/lib/utils'

const ITEM_ICONS: Record<ItineraryItemType, React.ReactNode> = {
  flight: <Plane className="h-5 w-5" />,
  hotel: <Hotel className="h-5 w-5" />,
  experience: <MapPin className="h-5 w-5" />,
  restaurant: <Utensils className="h-5 w-5" />,
  transport: <Car className="h-5 w-5" />,
}

const ITEM_COLORS: Record<ItineraryItemType, string> = {
  flight: 'bg-blue-100 text-blue-700',
  hotel: 'bg-purple-100 text-purple-700',
  experience: 'bg-green-100 text-green-700',
  restaurant: 'bg-orange-100 text-orange-700',
  transport: 'bg-gray-100 text-gray-700',
}

export function TripDetail() {
  const { id } = useParams()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [items, setItems] = useState<ItineraryItem[]>([])
  const [members, setMembers] = useState<TripMember[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      try {
        const [tripData, itemsData, membersData] = await Promise.all([
          api.getTrip(id),
          api.getItineraryItems(id),
          api.getTripMembers(id),
        ])
        setTrip(tripData as Trip)
        setItems((itemsData as { data: ItineraryItem[] }).data || itemsData as ItineraryItem[])
        setMembers((membersData as { data: TripMember[] }).data || membersData as TripMember[])
      } catch (error) {
        console.error('Failed to load trip:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleCopyLink = async () => {
    if (!trip) return
    const shareUrl = `${window.location.origin}/join/${trip.share_code}`
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddItem = async (type: ItineraryItemType) => {
    if (!id) return
    try {
      const newItem = await api.createItineraryItem(id, {
        type,
        title: `New ${type}`,
        start_time: new Date().toISOString(),
        order: items.length,
      })
      setItems([...items, newItem as ItineraryItem])
    } catch (error) {
      console.error('Failed to add item:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading trip...</div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Trip not found</h1>
          <Link to="/dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Group items by date
  const itemsByDate = items.reduce((acc, item) => {
    const date = new Date(item.start_time).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(item)
    return acc
  }, {} as Record<string, ItineraryItem[]>)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{trip.name}</h1>
                <p className="text-muted-foreground">{trip.destination}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCopyLink}>
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Trip
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content - Itinerary */}
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Itinerary</h2>
              <div className="flex gap-2">
                {(Object.keys(ITEM_ICONS) as ItineraryItemType[]).map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddItem(type)}
                    className="gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {items.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No items yet</h3>
                  <p className="text-muted-foreground">
                    Start adding flights, hotels, and experiences to your itinerary
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(itemsByDate).map(([date, dateItems]) => (
                  <div key={date}>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">{date}</h3>
                    <div className="space-y-2">
                      {dateItems
                        .sort((a, b) => a.order - b.order)
                        .map((item) => (
                          <Card key={item.id} className="cursor-move">
                            <CardContent className="flex items-center gap-4 p-4">
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                              <div className={cn("rounded-full p-2", ITEM_COLORS[item.type])}>
                                {ITEM_ICONS[item.type]}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{item.title}</h4>
                                {item.location && (
                                  <p className="text-sm text-muted-foreground">{item.location}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm">
                                  {new Date(item.start_time).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                                {item.price && (
                                  <p className="text-sm text-muted-foreground">
                                    {item.currency || '$'}{item.price}
                                  </p>
                                )}
                              </div>
                              <div>
                                {item.booking_confirmed ? (
                                  <span className="flex items-center gap-1 text-sm text-green-600">
                                    <Check className="h-4 w-4" />
                                    Booked
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Pending</span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trip Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trip Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dates</p>
                    <p className="font-medium">
                      {new Date(trip.start_date).toLocaleDateString()} -{' '}
                      {new Date(trip.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Travelers</p>
                    <p className="font-medium">{trip.preferences.num_travelers} people</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Link */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invite Others</CardTitle>
                <CardDescription>Share this link to invite people to your trip</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}/join/${trip.share_code}`}
                    className="text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopyLink}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Trip Members */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trip Members</CardTitle>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No members yet. Share the link to invite people!</p>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                            {member.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{member.user.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {member.tickets_confirmed ? (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <Check className="h-3 w-3" />
                              Confirmed
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground capitalize">{member.status}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
