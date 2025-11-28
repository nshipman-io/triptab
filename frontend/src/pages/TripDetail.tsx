import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Plane, Hotel, MapPin, Utensils, Car, Calendar, Users, Share2, Plus,
  Check, Copy, ArrowLeft, GripVertical, ExternalLink, Search, Compass, Settings2
} from 'lucide-react'
import { api } from '@/lib/api'
import type { Trip, ItineraryItem, TripMember, ItineraryItemType } from '@/types'
import { cn } from '@/lib/utils'
import {
  getFlightSearchLinks,
  getHotelSearchLinks,
  getExperienceSearchLinks,
  getOpenTableUrl,
  getRentalCarsUrl,
} from '@/lib/affiliates'
import { searchAirports, formatAirport, type Airport } from '@/lib/airports'

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

// Get booking link for an itinerary item
function getItemBookingLink(item: ItineraryItem, trip: Trip): string | null {
  const destination = item.location || trip.destination

  switch (item.type) {
    case 'flight':
      return getFlightSearchLinks({
        destination,
        departDate: item.start_time,
        returnDate: item.end_time || trip.end_date,
        adults: trip.preferences.num_travelers,
      }).googleFlights
    case 'hotel':
      return getHotelSearchLinks({
        destination,
        checkIn: item.start_time,
        checkOut: item.end_time || trip.end_date,
        guests: trip.preferences.num_travelers,
      }).bookingCom
    case 'experience':
      return getExperienceSearchLinks({
        destination,
        date: item.start_time,
      }).viator
    case 'restaurant':
      return getOpenTableUrl(destination, item.start_time, trip.preferences.num_travelers)
    case 'transport':
      return getRentalCarsUrl(destination, item.start_time, item.end_time || trip.end_date)
    default:
      return null
  }
}

// Helper to format date for input[type="date"]
function formatDateForInput(dateStr: string): string {
  const datePart = dateStr.split('T')[0]
  return datePart
}

export function TripDetail() {
  const { id } = useParams()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [items, setItems] = useState<ItineraryItem[]>([])
  const [members, setMembers] = useState<TripMember[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Editable search parameters
  const [showSearchSettings, setShowSearchSettings] = useState(false)
  const [searchDepartDate, setSearchDepartDate] = useState('')
  const [searchReturnDate, setSearchReturnDate] = useState('')
  const [searchTravelersInput, setSearchTravelersInput] = useState('1')
  const [searchOrigin, setSearchOrigin] = useState('')
  const [searchDestination, setSearchDestination] = useState('')
  const [originQuery, setOriginQuery] = useState('')
  const [originResults, setOriginResults] = useState<Airport[]>([])
  const [showOriginDropdown, setShowOriginDropdown] = useState(false)

  // Computed travelers value (defaults to 1 for affiliate links)
  const searchTravelers = parseInt(searchTravelersInput) || 1

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      try {
        const [tripData, itemsData, membersData] = await Promise.all([
          api.getTrip(id),
          api.getItineraryItems(id),
          api.getTripMembers(id),
        ])
        const loadedTrip = tripData as Trip
        setTrip(loadedTrip)
        setItems((itemsData as { data: ItineraryItem[] }).data || itemsData as ItineraryItem[])
        setMembers((membersData as { data: TripMember[] }).data || membersData as TripMember[])

        // Initialize search parameters from trip data
        setSearchDepartDate(formatDateForInput(loadedTrip.start_date))
        setSearchReturnDate(formatDateForInput(loadedTrip.end_date))
        setSearchTravelersInput(String(loadedTrip.preferences.num_travelers || 1))
        setSearchDestination(loadedTrip.destination)
      } catch (error) {
        console.error('Failed to load trip:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  // Handle origin airport search
  useEffect(() => {
    if (originQuery.length >= 2) {
      const results = searchAirports(originQuery, 5)
      setOriginResults(results)
      setShowOriginDropdown(results.length > 0)
    } else {
      setOriginResults([])
      setShowOriginDropdown(false)
    }
  }, [originQuery])

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
                              <div className="flex items-center gap-2">
                                {item.booking_confirmed ? (
                                  <span className="flex items-center gap-1 text-sm text-green-600">
                                    <Check className="h-4 w-4" />
                                    Booked
                                  </span>
                                ) : (
                                  <>
                                    {item.booking_url ? (
                                      <a href={item.booking_url} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="sm" className="gap-1">
                                          View Booking
                                          <ExternalLink className="h-3 w-3" />
                                        </Button>
                                      </a>
                                    ) : (
                                      <a
                                        href={getItemBookingLink(item, trip) || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Button variant="outline" size="sm" className="gap-1">
                                          Find & Book
                                          <ExternalLink className="h-3 w-3" />
                                        </Button>
                                      </a>
                                    )}
                                  </>
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
            {/* Book Travel */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Search className="h-5 w-5" />
                    Book Travel
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSearchSettings(!showSearchSettings)}
                    className="gap-1 text-xs"
                  >
                    <Settings2 className="h-4 w-4" />
                    {showSearchSettings ? 'Hide' : 'Edit'}
                  </Button>
                </div>
                <CardDescription>Find and book flights, hotels, and more</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Editable Search Parameters */}
                {showSearchSettings && (
                  <div className="space-y-3 rounded-lg border bg-white p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="searchDepartDate" className="text-xs">Depart</Label>
                        <Input
                          id="searchDepartDate"
                          type="date"
                          value={searchDepartDate}
                          onChange={(e) => setSearchDepartDate(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="searchReturnDate" className="text-xs">Return</Label>
                        <Input
                          id="searchReturnDate"
                          type="date"
                          value={searchReturnDate}
                          onChange={(e) => setSearchReturnDate(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="searchTravelers" className="text-xs">Travelers</Label>
                      <Input
                        id="searchTravelers"
                        type="number"
                        min={1}
                        max={10}
                        value={searchTravelersInput}
                        onChange={(e) => setSearchTravelersInput(e.target.value)}
                        onBlur={() => {
                          // Ensure valid value on blur
                          const num = parseInt(searchTravelersInput)
                          if (!num || num < 1) setSearchTravelersInput('1')
                          else if (num > 10) setSearchTravelersInput('10')
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1 relative">
                      <Label htmlFor="searchOrigin" className="text-xs">Origin Airport (optional)</Label>
                      <Input
                        id="searchOrigin"
                        type="text"
                        placeholder="Search airports (e.g., NYC, LAX)"
                        value={originQuery}
                        onChange={(e) => {
                          setOriginQuery(e.target.value)
                          if (!e.target.value) setSearchOrigin('')
                        }}
                        onFocus={() => originResults.length > 0 && setShowOriginDropdown(true)}
                        className="h-8 text-xs"
                      />
                      {searchOrigin && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Selected: {searchOrigin}
                        </p>
                      )}
                      {showOriginDropdown && originResults.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
                          <ul className="max-h-40 overflow-auto py-1">
                            {originResults.map((airport) => (
                              <li
                                key={airport.code}
                                onClick={() => {
                                  setSearchOrigin(airport.code)
                                  setOriginQuery(formatAirport(airport))
                                  setShowOriginDropdown(false)
                                }}
                                className="cursor-pointer px-3 py-2 text-xs hover:bg-accent"
                              >
                                <span className="font-medium">{airport.code}</span> - {airport.city}, {airport.country}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="searchDestination" className="text-xs">Destination</Label>
                      <Input
                        id="searchDestination"
                        type="text"
                        value={searchDestination}
                        onChange={(e) => setSearchDestination(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Current Search Summary */}
                {!showSearchSettings && (
                  <div className="text-xs text-muted-foreground space-y-1 pb-2">
                    <p>{searchOrigin ? `${searchOrigin} → ` : ''}{searchDestination.split(',')[0]}</p>
                    <p>{searchDepartDate} - {searchReturnDate} • {searchTravelers} traveler{searchTravelers !== 1 ? 's' : ''}</p>
                  </div>
                )}

                {/* Flights */}
                <div>
                  <p className="mb-1 text-sm font-medium flex items-center gap-2">
                    <Plane className="h-4 w-4" /> Flights
                  </p>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Each traveler books individually
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(getFlightSearchLinks({
                      originCode: searchOrigin || undefined,
                      destination: searchDestination,
                      departDate: searchDepartDate,
                      returnDate: searchReturnDate,
                      adults: 1, // Always 1 since each person books their own
                    })).map(([name, url]) => {
                      const displayName = name === 'googleFlights' ? 'Google Flights'
                        : name === 'kayak' ? 'Kayak'
                        : name === 'skyscanner' ? 'Skyscanner'
                        : name.charAt(0).toUpperCase() + name.slice(1)
                      return (
                        <a key={name} href={url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-1 text-xs">
                            {displayName}
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </a>
                      )
                    })}
                  </div>
                </div>

                {/* Hotels */}
                <div>
                  <p className="mb-2 text-sm font-medium flex items-center gap-2">
                    <Hotel className="h-4 w-4" /> Hotels
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(getHotelSearchLinks({
                      destination: searchDestination,
                      checkIn: searchDepartDate,
                      checkOut: searchReturnDate,
                      guests: searchTravelers,
                    })).map(([name, url]) => (
                      <a key={name} href={url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1 text-xs">
                          {name === 'bookingCom' ? 'Booking' : name === 'hotelsCom' ? 'Hotels.com' : 'Airbnb'}
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Experiences */}
                <div>
                  <p className="mb-2 text-sm font-medium flex items-center gap-2">
                    <Compass className="h-4 w-4" /> Experiences
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(getExperienceSearchLinks({
                      destination: searchDestination,
                      date: searchDepartDate,
                    })).map(([name, url]) => (
                      <a key={name} href={url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1 text-xs">
                          {name === 'getYourGuide' ? 'GetYourGuide' : 'Viator'}
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Restaurants */}
                <div>
                  <p className="mb-2 text-sm font-medium flex items-center gap-2">
                    <Utensils className="h-4 w-4" /> Restaurants
                  </p>
                  <a
                    href={getOpenTableUrl(searchDestination, searchDepartDate, searchTravelers)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="gap-1 text-xs">
                      OpenTable
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                </div>

                {/* Car Rental */}
                <div>
                  <p className="mb-2 text-sm font-medium flex items-center gap-2">
                    <Car className="h-4 w-4" /> Car Rental
                  </p>
                  <a
                    href={getRentalCarsUrl(searchDestination, searchDepartDate, searchReturnDate)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="gap-1 text-xs">
                      Rentalcars.com
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Trip Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trip Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Destination</p>
                    <p className="font-medium">{searchDestination.split(',')[0]}</p>
                    {searchOrigin && (
                      <p className="text-xs text-muted-foreground">From: {searchOrigin}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dates</p>
                    <p className="font-medium">
                      {searchDepartDate} - {searchReturnDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Travelers</p>
                    <p className="font-medium">{searchTravelers} {searchTravelers === 1 ? 'person' : 'people'}</p>
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
