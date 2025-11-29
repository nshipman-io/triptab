import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plane, Hotel, MapPin, Utensils, Car, Calendar, Users, Share2, Plus,
  Check, Copy, ArrowLeft, GripVertical, ExternalLink, Search, Compass, Settings2,
  ListTodo, DollarSign, Mail, Pencil, Trash2, X
} from 'lucide-react'
import { api } from '@/lib/api'
import type { Trip, ItineraryItem, TripMember, ItineraryItemType, TripPreferences, User } from '@/types'
import { cn } from '@/lib/utils'
import {
  getFlightSearchLinks,
  getHotelSearchLinks,
  getExperienceSearchLinks,
  getOpenTableUrl,
  getRentalCarsUrl,
} from '@/lib/affiliates'
import { searchAirports, formatAirport, type Airport } from '@/lib/airports'
import { ChecklistsTab } from '@/components/checklists/ChecklistsTab'
import { ExpensesTab } from '@/components/expenses/ExpensesTab'
import { ExploreTab } from '@/components/recommendations/ExploreTab'
import { ImportDialog } from '@/components/import/ImportDialog'
import { ItineraryItemForm } from '@/components/itinerary/ItineraryItemForm'
import { TripPreferencesEditor } from '@/components/trip/TripPreferencesEditor'
import { MemberManagement } from '@/components/trip/MemberManagement'

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
  const navigate = useNavigate()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [items, setItems] = useState<ItineraryItem[]>([])
  const [members, setMembers] = useState<TripMember[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('itinerary')
  const [showImportDialog, setShowImportDialog] = useState(false)

  // Edit trip name state
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Itinerary item form state
  const [showItemForm, setShowItemForm] = useState(false)
  const [itemFormType, setItemFormType] = useState<ItineraryItemType>('experience')
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null)

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
        const [tripData, itemsData, membersData, userData] = await Promise.all([
          api.getTrip(id),
          api.getItineraryItems(id),
          api.getTripMembers(id),
          api.getCurrentUser(),
        ])
        const loadedTrip = tripData as Trip
        setTrip(loadedTrip)
        setItems((itemsData as { data: ItineraryItem[] }).data || itemsData as ItineraryItem[])
        setMembers((membersData as { data: TripMember[] }).data || membersData as TripMember[])
        setCurrentUser(userData as User)

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

  const handleAddItem = (type: ItineraryItemType) => {
    setItemFormType(type)
    setEditingItem(null)
    setShowItemForm(true)
  }

  const handleEditItem = (item: ItineraryItem) => {
    setItemFormType(item.type)
    setEditingItem(item)
    setShowItemForm(true)
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!id) return
    try {
      await api.deleteItineraryItem(id, itemId)
      setItems(items.filter(i => i.id !== itemId))
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  const handleSubmitItem = async (data: Record<string, unknown>) => {
    if (!id) return
    try {
      if (editingItem) {
        // Update existing item
        const updatedItem = await api.updateItineraryItem(id, editingItem.id, data)
        setItems(items.map(i => i.id === editingItem.id ? updatedItem as ItineraryItem : i))
      } else {
        // Create new item
        const newItem = await api.createItineraryItem(id, {
          ...data,
          order: items.length,
        })
        setItems([...items, newItem as ItineraryItem])
      }
      setShowItemForm(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Failed to save item:', error)
    }
  }

  const handleCancelItemForm = () => {
    setShowItemForm(false)
    setEditingItem(null)
  }

  const reloadItems = async () => {
    if (!id) return
    try {
      const itemsData = await api.getItineraryItems(id)
      setItems((itemsData as { data: ItineraryItem[] }).data || itemsData as ItineraryItem[])
    } catch (error) {
      console.error('Failed to reload items:', error)
    }
  }

  const reloadMembers = async () => {
    if (!id) return
    try {
      const membersData = await api.getTripMembers(id)
      setMembers((membersData as { data: TripMember[] }).data || membersData as TripMember[])
    } catch (error) {
      console.error('Failed to reload members:', error)
    }
  }

  // Check if current user is the trip owner
  const isOwner = trip && currentUser ? trip.owner_id === currentUser.id : false

  // Check if current user can edit (owner or editor role)
  const currentMember = members.find(m => m.user_id === currentUser?.id)
  const canEdit = isOwner || (currentMember?.role === 'editor') || (currentMember?.role === 'owner')

  const handleEditName = () => {
    if (!trip) return
    setEditedName(trip.name)
    setIsEditingName(true)
  }

  const handleSaveName = async () => {
    if (!id || !editedName.trim()) return
    try {
      const updatedTrip = await api.updateTrip(id, { name: editedName.trim() })
      setTrip(updatedTrip as Trip)
      setIsEditingName(false)
    } catch (error) {
      console.error('Failed to update trip name:', error)
    }
  }

  const handleCancelEditName = () => {
    setIsEditingName(false)
    setEditedName('')
  }

  const handleDeleteTrip = async () => {
    if (!id) return
    setIsDeleting(true)
    try {
      await api.deleteTrip(id)
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to delete trip:', error)
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleSavePreferences = async (preferences: TripPreferences) => {
    if (!id) return
    const updatedTrip = await api.updateTrip(id, { preferences })
    setTrip(updatedTrip as Trip)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand">
        <div className="text-ink-light">Loading trip...</div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand">
        <div className="text-center">
          <h1 className="text-2xl font-serif">Trip not found</h1>
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
    <div className="min-h-screen bg-sand">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md p-6">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-destructive font-serif">Delete Trip</CardTitle>
              <CardDescription className="text-ink-light mt-2">
                Are you sure you want to delete "{trip.name}"? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2 justify-end p-0">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteTrip}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Trip'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-sand-dark bg-cream">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              {isEditingName && canEdit ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName()
                      if (e.key === 'Escape') handleCancelEditName()
                    }}
                    className="text-lg md:text-xl font-serif h-10 w-full max-w-64"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={handleSaveName}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={handleCancelEditName}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="group flex items-center gap-2 min-w-0">
                  <div className="min-w-0">
                    <h1 className="text-lg md:text-2xl font-serif text-ink truncate">{trip.name}</h1>
                    <p className="text-sm text-ink-light truncate">
                      {trip.destination}
                      {!canEdit && <span className="ml-2 text-xs bg-sand-dark px-2 py-0.5 rounded-full">View only</span>}
                    </p>
                  </div>
                  {canEdit && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleEditName}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="hidden sm:flex">
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </>
                )}
              </Button>
              <Button variant="outline" size="icon" onClick={handleCopyLink} className="sm:hidden">
                {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              </Button>
              {isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-ink-light hover:text-destructive"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Import Dialog */}
        {showImportDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <ImportDialog
              tripId={id!}
              onSuccess={reloadItems}
              onClose={() => setShowImportDialog(false)}
            />
          </div>
        )}

        <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
          {/* Main Content - Tabs */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Desktop tabs */}
              <TabsList className="mb-6 w-full hidden lg:grid lg:grid-cols-4">
                <TabsTrigger value="itinerary" className="gap-2 text-sm px-3">
                  <Calendar className="h-4 w-4" />
                  Itinerary
                </TabsTrigger>
                <TabsTrigger value="expenses" className="gap-2 text-sm px-3">
                  <DollarSign className="h-4 w-4" />
                  Expenses
                </TabsTrigger>
                <TabsTrigger value="checklists" className="gap-2 text-sm px-3">
                  <ListTodo className="h-4 w-4" />
                  Checklists
                </TabsTrigger>
                <TabsTrigger value="explore" className="gap-2 text-sm px-3">
                  <Compass className="h-4 w-4" />
                  Explore
                </TabsTrigger>
              </TabsList>

              {/* Mobile tabs - includes Book and Info */}
              <TabsList className="mb-6 w-full grid grid-cols-6 lg:hidden">
                <TabsTrigger value="itinerary" className="gap-1 text-xs px-1">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Itinerary</span>
                </TabsTrigger>
                <TabsTrigger value="expenses" className="gap-1 text-xs px-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="hidden sm:inline">Expenses</span>
                </TabsTrigger>
                <TabsTrigger value="checklists" className="gap-1 text-xs px-1">
                  <ListTodo className="h-4 w-4" />
                  <span className="hidden sm:inline">Checklists</span>
                </TabsTrigger>
                <TabsTrigger value="explore" className="gap-1 text-xs px-1">
                  <Compass className="h-4 w-4" />
                  <span className="hidden sm:inline">Explore</span>
                </TabsTrigger>
                <TabsTrigger value="book" className="gap-1 text-xs px-1">
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Book</span>
                </TabsTrigger>
                <TabsTrigger value="info" className="gap-1 text-xs px-1">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Info</span>
                </TabsTrigger>
              </TabsList>

              {/* Itinerary Tab */}
              <TabsContent value="itinerary">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-xl font-serif text-ink">Itinerary</h2>
                  {canEdit && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowImportDialog(true)}
                        className="gap-1"
                      >
                        <Mail className="h-3 w-3" />
                        Import
                      </Button>
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
                  )}
                </div>

                {/* Item Form */}
                {showItemForm && (
                  <div className="mb-6">
                    <ItineraryItemForm
                      type={itemFormType}
                      item={editingItem}
                      tripStartDate={trip.start_date}
                      onSubmit={handleSubmitItem}
                      onCancel={handleCancelItemForm}
                    />
                  </div>
                )}

                {items.length === 0 && !showItemForm ? (
                  <Card className="p-8">
                    <CardContent className="py-8 text-center p-0">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-sand to-sand-dark flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-forest" />
                      </div>
                      <h3 className="text-lg font-serif mb-2">No items yet</h3>
                      <p className="text-ink-light mb-6">
                        {canEdit
                          ? 'Start adding flights, hotels, and experiences to your itinerary'
                          : 'No items have been added to this itinerary yet'}
                      </p>
                      {canEdit && (
                        <Button onClick={() => setShowImportDialog(true)} variant="outline">
                          <Mail className="mr-2 h-4 w-4" />
                          Import from Email
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : items.length > 0 && (
                  <div className="space-y-6">
                    {Object.entries(itemsByDate).map(([date, dateItems]) => (
                      <div key={date}>
                        <h3 className="mb-3 text-sm font-medium text-ink-light">{date}</h3>
                        <div className="space-y-2">
                          {dateItems
                            .sort((a, b) => a.order - b.order)
                            .map((item) => (
                              <Card key={item.id} className="group p-3 md:p-4">
                                <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 p-0">
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <GripVertical className="h-5 w-5 text-ink-light cursor-move shrink-0 hidden sm:block" />
                                    <div className={cn("rounded-full p-2 shrink-0", ITEM_COLORS[item.type])}>
                                      {ITEM_ICONS[item.type]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium truncate">{item.title}</h4>
                                      {item.location && (
                                        <p className="text-sm text-ink-light truncate">{item.location}</p>
                                      )}
                                    </div>
                                    <div className="text-right sm:hidden">
                                      <p className="text-sm">
                                        {new Date(item.start_time).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-1">
                                    <div className="text-right hidden sm:block">
                                      <p className="text-sm">
                                        {new Date(item.start_time).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </p>
                                      {item.price && (
                                        <p className="text-sm text-ink-light">
                                          {item.currency || '$'}{item.price}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {item.booking_confirmed ? (
                                        <span className="flex items-center gap-1 text-xs sm:text-sm text-green-600 mr-1 sm:mr-2">
                                          <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                                          <span className="hidden sm:inline">Booked</span>
                                        </span>
                                      ) : item.booking_url ? (
                                        <a href={item.booking_url} target="_blank" rel="noopener noreferrer">
                                          <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
                                            View
                                            <ExternalLink className="h-3 w-3" />
                                          </Button>
                                        </a>
                                      ) : (
                                        <a
                                          href={getItemBookingLink(item, trip) || '#'}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
                                            Book
                                            <ExternalLink className="h-3 w-3" />
                                          </Button>
                                        </a>
                                      )}
                                      {canEdit && (
                                        <>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEditItem(item)}
                                            className="h-8 w-8 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="h-8 w-8 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-ink-light hover:text-destructive"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Expenses Tab */}
              <TabsContent value="expenses">
                <ExpensesTab tripId={id!} canEdit={canEdit} />
              </TabsContent>

              {/* Checklists Tab */}
              <TabsContent value="checklists">
                <ChecklistsTab tripId={id!} canEdit={canEdit} />
              </TabsContent>

              {/* Explore Tab */}
              <TabsContent value="explore">
                <ExploreTab
                  tripId={id!}
                  tripStartDate={trip.start_date}
                  onAddToItinerary={reloadItems}
                  canEdit={canEdit}
                />
              </TabsContent>

              {/* Mobile-only Book Tab */}
              <TabsContent value="book" className="lg:hidden">
                <div className="space-y-6">
                  {/* Book Travel - Mobile Version */}
                  <Card className="bg-sand p-4 md:p-6">
                    <CardHeader className="p-0 mb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg font-serif">
                          <Search className="h-5 w-5 text-terracotta" />
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
                      <CardDescription className="text-ink-light mt-1">Find and book flights, hotels, and more</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-0">
                      {/* Editable Search Parameters */}
                      {showSearchSettings && (
                        <div className="space-y-3 rounded-xl border border-sand-dark bg-cream p-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="mobileSearchDepartDate" className="text-xs">Depart</Label>
                              <Input
                                id="mobileSearchDepartDate"
                                type="date"
                                value={searchDepartDate}
                                onChange={(e) => setSearchDepartDate(e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="mobileSearchReturnDate" className="text-xs">Return</Label>
                              <Input
                                id="mobileSearchReturnDate"
                                type="date"
                                value={searchReturnDate}
                                onChange={(e) => setSearchReturnDate(e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="mobileSearchTravelers" className="text-xs">Travelers</Label>
                            <Input
                              id="mobileSearchTravelers"
                              type="number"
                              min={1}
                              max={10}
                              value={searchTravelersInput}
                              onChange={(e) => setSearchTravelersInput(e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="mobileSearchDestination" className="text-xs">Destination</Label>
                            <Input
                              id="mobileSearchDestination"
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

                      {/* Booking Links Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Flights */}
                        <div>
                          <p className="mb-2 text-sm font-medium flex items-center gap-2">
                            <Plane className="h-4 w-4" /> Flights
                          </p>
                          <div className="flex flex-col gap-2">
                            {Object.entries(getFlightSearchLinks({
                              originCode: searchOrigin || undefined,
                              destination: searchDestination,
                              departDate: searchDepartDate,
                              returnDate: searchReturnDate,
                              adults: 1,
                            })).map(([name, url]) => (
                              <a key={name} href={url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" className="w-full gap-1 text-xs justify-start">
                                  {name === 'googleFlights' ? 'Google' : name === 'kayak' ? 'Kayak' : 'Skyscanner'}
                                  <ExternalLink className="h-3 w-3 ml-auto" />
                                </Button>
                              </a>
                            ))}
                          </div>
                        </div>

                        {/* Hotels */}
                        <div>
                          <p className="mb-2 text-sm font-medium flex items-center gap-2">
                            <Hotel className="h-4 w-4" /> Hotels
                          </p>
                          <div className="flex flex-col gap-2">
                            {Object.entries(getHotelSearchLinks({
                              destination: searchDestination,
                              checkIn: searchDepartDate,
                              checkOut: searchReturnDate,
                              guests: searchTravelers,
                            })).map(([name, url]) => (
                              <a key={name} href={url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" className="w-full gap-1 text-xs justify-start">
                                  {name === 'bookingCom' ? 'Booking' : name === 'hotelsCom' ? 'Hotels.com' : 'Airbnb'}
                                  <ExternalLink className="h-3 w-3 ml-auto" />
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
                          <div className="flex flex-col gap-2">
                            {Object.entries(getExperienceSearchLinks({
                              destination: searchDestination,
                              date: searchDepartDate,
                            })).map(([name, url]) => (
                              <a key={name} href={url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" className="w-full gap-1 text-xs justify-start">
                                  {name === 'getYourGuide' ? 'GetYourGuide' : 'Viator'}
                                  <ExternalLink className="h-3 w-3 ml-auto" />
                                </Button>
                              </a>
                            ))}
                          </div>
                        </div>

                        {/* More */}
                        <div>
                          <p className="mb-2 text-sm font-medium flex items-center gap-2">
                            <Utensils className="h-4 w-4" /> More
                          </p>
                          <div className="flex flex-col gap-2">
                            <a href={getOpenTableUrl(searchDestination, searchDepartDate, searchTravelers)} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="w-full gap-1 text-xs justify-start">
                                OpenTable
                                <ExternalLink className="h-3 w-3 ml-auto" />
                              </Button>
                            </a>
                            <a href={getRentalCarsUrl(searchDestination, searchDepartDate, searchReturnDate)} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="w-full gap-1 text-xs justify-start">
                                Car Rental
                                <ExternalLink className="h-3 w-3 ml-auto" />
                              </Button>
                            </a>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Mobile-only Info Tab */}
              <TabsContent value="info" className="lg:hidden">
                <div className="space-y-4">
                  {/* Trip Details */}
                  <Card className="p-4">
                    <CardHeader className="p-0 mb-3">
                      <CardTitle className="text-lg font-serif">Trip Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-0">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-terracotta shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-ink-light">Destination</p>
                          <p className="font-medium truncate">{searchDestination.split(',')[0]}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-terracotta shrink-0" />
                        <div>
                          <p className="text-sm text-ink-light">Dates</p>
                          <p className="font-medium">{searchDepartDate} - {searchReturnDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-terracotta shrink-0" />
                        <div>
                          <p className="text-sm text-ink-light">Travelers</p>
                          <p className="font-medium">{searchTravelers} {searchTravelers === 1 ? 'person' : 'people'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trip Preferences - Mobile */}
                  <TripPreferencesEditor
                    preferences={trip.preferences}
                    onSave={handleSavePreferences}
                    canEdit={canEdit}
                  />

                  {/* Share Link */}
                  <Card className="p-4">
                    <CardHeader className="p-0 mb-3">
                      <CardTitle className="text-lg font-serif">Invite Others</CardTitle>
                      <CardDescription className="text-ink-light mt-1 text-sm">Share this link to invite people</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={`${window.location.origin}/join/${trip.share_code}`}
                          className="text-xs"
                        />
                        <Button variant="outline" size="icon" onClick={handleCopyLink}>
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trip Members */}
                  <MemberManagement
                    tripId={id!}
                    members={members}
                    currentUserId={currentUser?.id || ''}
                    isOwner={isOwner}
                    onMemberUpdate={reloadMembers}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Desktop only */}
          <div className="hidden lg:block space-y-6">
            {/* Book Travel */}
            <Card className="bg-sand p-6">
              <CardHeader className="p-0 mb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg font-serif">
                    <Search className="h-5 w-5 text-terracotta" />
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
                <CardDescription className="text-ink-light mt-1">Find and book flights, hotels, and more</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                {/* Editable Search Parameters */}
                {showSearchSettings && (
                  <div className="space-y-3 rounded-xl border border-sand-dark bg-cream p-3">
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
            <Card className="p-6">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg font-serif">Trip Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-terracotta" />
                  <div>
                    <p className="text-sm text-ink-light">Destination</p>
                    <p className="font-medium">{searchDestination.split(',')[0]}</p>
                    {searchOrigin && (
                      <p className="text-xs text-ink-light">From: {searchOrigin}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-terracotta" />
                  <div>
                    <p className="text-sm text-ink-light">Dates</p>
                    <p className="font-medium">
                      {searchDepartDate} - {searchReturnDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-terracotta" />
                  <div>
                    <p className="text-sm text-ink-light">Travelers</p>
                    <p className="font-medium">{searchTravelers} {searchTravelers === 1 ? 'person' : 'people'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trip Preferences */}
            <TripPreferencesEditor
              preferences={trip.preferences}
              onSave={handleSavePreferences}
              canEdit={canEdit}
            />

            {/* Share Link */}
            <Card className="p-6">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg font-serif">Invite Others</CardTitle>
                <CardDescription className="text-ink-light mt-1">Share this link to invite people to your trip</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
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
            <MemberManagement
              tripId={id!}
              members={members}
              currentUserId={currentUser?.id || ''}
              isOwner={isOwner}
              onMemberUpdate={reloadMembers}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
