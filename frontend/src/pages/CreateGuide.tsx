import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { PlacesAutocomplete } from '@/components/ui/places-autocomplete'
import {
  ArrowLeft, ArrowRight, Check, MapPin, FileText,
  Globe, Lock, Link as LinkIcon, X, Plus, GripVertical, Trash2
} from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { GuideVisibility } from '@/types'

interface GuideSection {
  id: string
  title: string
  description: string
  places: GuidePlace[]
}

interface GuidePlace {
  id: string
  name: string
  description: string
  category: string
  address: string
  tips: string
  price_range: string
}

interface GuideData {
  title: string
  destination: string
  description: string
  cover_image_url: string
  visibility: GuideVisibility
  tags: string[]
  location_tags: string[]
  sections: GuideSection[]
}

const STEPS = [
  { id: 'basics', title: 'What\'s your guide about?' },
  { id: 'details', title: 'Tell us more' },
  { id: 'visibility', title: 'Who can see this?' },
  { id: 'sections', title: 'Add your recommendations' },
  { id: 'review', title: 'Review your guide' },
]

const VISIBILITY_OPTIONS: { value: GuideVisibility; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'public', label: 'Public', icon: <Globe className="h-6 w-6" />, description: 'Anyone can discover and view' },
  { value: 'unlisted', label: 'Unlisted', icon: <LinkIcon className="h-6 w-6" />, description: 'Only people with the link can view' },
  { value: 'private', label: 'Private', icon: <Lock className="h-6 w-6" />, description: 'Only you can view' },
]

const SUGGESTED_TAGS = [
  'Food & Dining', 'Adventure', 'Culture', 'Nature', 'Nightlife',
  'Budget-Friendly', 'Luxury', 'Family-Friendly', 'Solo Travel',
  'Romantic', 'Photography', 'Hidden Gems', 'Local Favorites'
]

const PLACE_CATEGORIES = [
  'Restaurant', 'Cafe', 'Bar', 'Hotel', 'Museum', 'Park',
  'Beach', 'Temple', 'Market', 'Shopping', 'Activity', 'Other'
]

function generateId() {
  return Math.random().toString(36).substring(2, 11)
}

export function CreateGuide() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [guideData, setGuideData] = useState<GuideData>({
    title: '',
    destination: '',
    description: '',
    cover_image_url: '',
    visibility: 'public',
    tags: [],
    location_tags: [],
    sections: [],
  })
  const [locationTagInput, setLocationTagInput] = useState('')

  // For adding/editing sections
  const [editingSection, setEditingSection] = useState<GuideSection | null>(null)
  const [editingPlace, setEditingPlace] = useState<{ sectionId: string; place: GuidePlace } | null>(null)

  const progress = ((currentStep + 1) / STEPS.length) * 100

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.getCurrentUser()
        setIsAuthenticated(true)
      } catch {
        setIsAuthenticated(false)
        navigate('/login', { state: { from: '/guides/new', message: 'Please log in to create a guide' } })
      }
    }
    checkAuth()
  }, [navigate])

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Create the guide first
      const guide = await api.createGuide({
        title: guideData.title,
        description: guideData.description || undefined,
        destination: guideData.destination,
        cover_image_url: guideData.cover_image_url || undefined,
        visibility: guideData.visibility,
        tags: guideData.tags,
        location_tags: guideData.location_tags,
      }) as { id: string }

      // Then create sections and places
      for (let i = 0; i < guideData.sections.length; i++) {
        const section = guideData.sections[i]
        const createdSection = await api.createGuideSection(guide.id, {
          title: section.title,
          description: section.description || undefined,
          order: i,
        }) as { id: string }

        // Create places for this section
        for (let j = 0; j < section.places.length; j++) {
          const place = section.places[j]
          await api.createGuidePlace(guide.id, createdSection.id, {
            name: place.name,
            description: place.description || undefined,
            category: place.category || undefined,
            address: place.address || undefined,
            tips: place.tips || undefined,
            price_range: place.price_range || undefined,
            order: j,
          })
        }
      }

      navigate(`/guides/${guide.id}`)
    } catch (error) {
      console.error('Failed to create guide:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !guideData.tags.includes(trimmedTag)) {
      setGuideData({ ...guideData, tags: [...guideData.tags, trimmedTag] })
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setGuideData({ ...guideData, tags: guideData.tags.filter(t => t !== tag) })
  }

  const addLocationTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()
    if (trimmedTag && !guideData.location_tags.includes(trimmedTag)) {
      setGuideData({ ...guideData, location_tags: [...guideData.location_tags, trimmedTag] })
    }
    setLocationTagInput('')
  }

  const removeLocationTag = (tag: string) => {
    setGuideData({ ...guideData, location_tags: guideData.location_tags.filter(t => t !== tag) })
  }

  const addSection = () => {
    const newSection: GuideSection = {
      id: generateId(),
      title: '',
      description: '',
      places: [],
    }
    setEditingSection(newSection)
  }

  const saveSection = (section: GuideSection) => {
    const existingIndex = guideData.sections.findIndex(s => s.id === section.id)
    if (existingIndex >= 0) {
      const updated = [...guideData.sections]
      updated[existingIndex] = section
      setGuideData({ ...guideData, sections: updated })
    } else {
      setGuideData({ ...guideData, sections: [...guideData.sections, section] })
    }
    setEditingSection(null)
  }

  const deleteSection = (sectionId: string) => {
    setGuideData({ ...guideData, sections: guideData.sections.filter(s => s.id !== sectionId) })
  }

  const addPlaceToSection = (sectionId: string) => {
    const newPlace: GuidePlace = {
      id: generateId(),
      name: '',
      description: '',
      category: '',
      address: '',
      tips: '',
      price_range: '',
    }
    setEditingPlace({ sectionId, place: newPlace })
  }

  const savePlace = (sectionId: string, place: GuidePlace) => {
    const sectionIndex = guideData.sections.findIndex(s => s.id === sectionId)
    if (sectionIndex >= 0) {
      const section = guideData.sections[sectionIndex]
      const placeIndex = section.places.findIndex(p => p.id === place.id)

      let updatedPlaces: GuidePlace[]
      if (placeIndex >= 0) {
        updatedPlaces = [...section.places]
        updatedPlaces[placeIndex] = place
      } else {
        updatedPlaces = [...section.places, place]
      }

      const updatedSections = [...guideData.sections]
      updatedSections[sectionIndex] = { ...section, places: updatedPlaces }
      setGuideData({ ...guideData, sections: updatedSections })
    }
    setEditingPlace(null)
  }

  const deletePlace = (sectionId: string, placeId: string) => {
    const sectionIndex = guideData.sections.findIndex(s => s.id === sectionId)
    if (sectionIndex >= 0) {
      const section = guideData.sections[sectionIndex]
      const updatedSections = [...guideData.sections]
      updatedSections[sectionIndex] = {
        ...section,
        places: section.places.filter(p => p.id !== placeId)
      }
      setGuideData({ ...guideData, sections: updatedSections })
    }
  }

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'basics':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Guide Title</Label>
              <Input
                id="title"
                placeholder="e.g., Hidden Gems of Barcelona"
                value={guideData.title}
                onChange={(e) => setGuideData({ ...guideData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <PlacesAutocomplete
                value={guideData.destination}
                onChange={(value) => setGuideData({ ...guideData, destination: value })}
                placeholder="Search for a city or region..."
              />
            </div>
            <div className="space-y-2">
              <Label>Location Tags</Label>
              <p className="text-xs text-ink-light mb-2">
                Add cities, regions, or neighborhoods this guide covers. This helps travelers find your guide.
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {guideData.location_tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-forest text-cream px-3 py-1 text-sm"
                  >
                    {tag}
                    <button onClick={() => removeLocationTag(tag)} className="hover:text-cream/70">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., tokyo, shibuya, shinjuku..."
                  value={locationTagInput}
                  onChange={(e) => setLocationTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addLocationTag(locationTagInput)
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={() => addLocationTag(locationTagInput)}>
                  Add
                </Button>
              </div>
            </div>
          </div>
        )

      case 'details':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={4}
                placeholder="Tell readers what makes this guide special..."
                value={guideData.description}
                onChange={(e) => setGuideData({ ...guideData, description: e.target.value })}
                className="flex w-full rounded-xl border border-sand-dark bg-cream px-4 py-3 text-base text-ink placeholder:text-ink-light/60 focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover">Cover Image URL (optional)</Label>
              <Input
                id="cover"
                type="url"
                placeholder="https://..."
                value={guideData.cover_image_url}
                onChange={(e) => setGuideData({ ...guideData, cover_image_url: e.target.value })}
              />
              {guideData.cover_image_url && (
                <div className="mt-2 rounded-lg overflow-hidden h-32 bg-sand-dark">
                  <img
                    src={guideData.cover_image_url}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {guideData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-forest text-cream px-3 py-1 text-sm"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-cream/70">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag(tagInput)
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={() => addTag(tagInput)}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {SUGGESTED_TAGS.filter(t => !guideData.tags.includes(t)).slice(0, 6).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="rounded-full bg-sand-dark px-3 py-1 text-xs text-ink-light hover:bg-sand-dark/70 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'visibility':
        return (
          <div className="grid gap-4">
            {VISIBILITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setGuideData({ ...guideData, visibility: option.value })}
                className={cn(
                  "flex items-center gap-4 rounded-2xl border-2 p-5 transition-all hover:border-terracotta bg-sand text-left",
                  guideData.visibility === option.value
                    ? "border-terracotta bg-cream"
                    : "border-sand-dark"
                )}
              >
                <div className={cn(
                  "rounded-full p-3 shrink-0",
                  guideData.visibility === option.value
                    ? "bg-forest text-cream"
                    : "bg-sand-dark"
                )}>
                  {option.icon}
                </div>
                <div>
                  <span className="font-medium block">{option.label}</span>
                  <span className="text-sm text-ink-light">{option.description}</span>
                </div>
              </button>
            ))}
          </div>
        )

      case 'sections':
        return (
          <div className="space-y-4">
            {editingSection ? (
              <SectionEditor
                section={editingSection}
                onSave={saveSection}
                onCancel={() => setEditingSection(null)}
              />
            ) : editingPlace ? (
              <PlaceEditor
                place={editingPlace.place}
                onSave={(place) => savePlace(editingPlace.sectionId, place)}
                onCancel={() => setEditingPlace(null)}
              />
            ) : (
              <>
                <p className="text-sm text-ink-light">
                  Organize your recommendations into sections (e.g., "Best Restaurants", "Must-See Attractions")
                </p>

                {guideData.sections.length === 0 ? (
                  <div className="text-center py-8 rounded-2xl bg-sand border-2 border-dashed border-sand-dark">
                    <FileText className="mx-auto h-10 w-10 text-ink-light mb-3" />
                    <p className="text-ink-light mb-4">No sections yet</p>
                    <Button onClick={addSection}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Section
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {guideData.sections.map((section) => (
                      <div key={section.id} className="rounded-2xl bg-sand p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-5 w-5 text-ink-light" />
                            <div>
                              <h4 className="font-medium">{section.title}</h4>
                              {section.description && (
                                <p className="text-sm text-ink-light">{section.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingSection(section)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteSection(section.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Places in this section */}
                        <div className="pl-7 space-y-2">
                          {section.places.map((place) => (
                            <div
                              key={place.id}
                              className="flex items-center justify-between bg-cream rounded-lg p-3"
                            >
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-terracotta" />
                                <span className="text-sm">{place.name}</span>
                                {place.category && (
                                  <span className="text-xs bg-sand-dark px-2 py-0.5 rounded-full">
                                    {place.category}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingPlace({ sectionId: section.id, place })}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deletePlace(section.id, place.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => addPlaceToSection(section.id)}
                            className="flex items-center gap-2 text-sm text-forest hover:text-terracotta transition-colors w-full p-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add Place
                          </button>
                        </div>
                      </div>
                    ))}

                    <Button variant="outline" onClick={addSection} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Another Section
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )

      case 'review':
        return (
          <div className="space-y-6">
            {/* Preview card */}
            <div className="rounded-2xl overflow-hidden bg-sand">
              {guideData.cover_image_url ? (
                <div className="h-32 bg-gradient-to-br from-forest to-forest-light">
                  <img
                    src={guideData.cover_image_url}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-32 bg-gradient-to-br from-forest to-forest-light flex items-center justify-center">
                  <MapPin className="h-10 w-10 text-cream/50" />
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-serif mb-1">{guideData.title || 'Untitled Guide'}</h3>
                <p className="text-sm text-ink-light flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {guideData.destination || 'No destination'}
                </p>
              </div>
            </div>

            {/* Details */}
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-ink-light">Description</dt>
                <dd className="font-medium">{guideData.description || 'No description'}</dd>
              </div>
              <div>
                <dt className="text-ink-light">Visibility</dt>
                <dd className="font-medium capitalize flex items-center gap-2">
                  {guideData.visibility === 'public' && <Globe className="h-4 w-4" />}
                  {guideData.visibility === 'unlisted' && <LinkIcon className="h-4 w-4" />}
                  {guideData.visibility === 'private' && <Lock className="h-4 w-4" />}
                  {guideData.visibility}
                </dd>
              </div>
              <div>
                <dt className="text-ink-light">Tags</dt>
                <dd className="font-medium">
                  {guideData.tags.length > 0 ? guideData.tags.join(', ') : 'No tags'}
                </dd>
              </div>
              <div>
                <dt className="text-ink-light">Location Tags</dt>
                <dd className="font-medium">
                  {guideData.location_tags.length > 0 ? guideData.location_tags.join(', ') : 'No location tags'}
                </dd>
              </div>
              <div>
                <dt className="text-ink-light">Content</dt>
                <dd className="font-medium">
                  {guideData.sections.length} section{guideData.sections.length !== 1 ? 's' : ''},{' '}
                  {guideData.sections.reduce((sum, s) => sum + s.places.length, 0)} place{guideData.sections.reduce((sum, s) => sum + s.places.length, 0) !== 1 ? 's' : ''}
                </dd>
              </div>
            </dl>
          </div>
        )
    }
  }

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case 'basics':
        return !!guideData.title.trim() && !!guideData.destination.trim()
      case 'details':
        return true // Description is optional
      case 'visibility':
        return !!guideData.visibility
      case 'sections':
        // Allow proceeding even without sections, but not while editing
        return !editingSection && !editingPlace
      case 'review':
        return true
      default:
        return false
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-sand">
        <header className="container mx-auto px-6 py-6">
          <Link to="/" className="flex items-center gap-2 font-serif text-2xl font-medium text-forest tracking-tight">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            Triptab
          </Link>
        </header>
        <main className="container mx-auto px-6 py-8">
          <div className="mx-auto max-w-2xl">
            <Card className="p-10">
              <CardContent className="flex items-center justify-center py-12 p-0">
                <p className="text-ink-light">Loading...</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand">
      <header className="container mx-auto px-6 py-6">
        <Link to="/guides" className="flex items-center gap-2 font-serif text-2xl font-medium text-forest tracking-tight hover:text-terracotta transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          Triptab
        </Link>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <Card className="p-6 md:p-10 overflow-visible">
            <CardHeader className="p-0 mb-8">
              <div className="mb-6">
                <Progress value={progress} className="h-2" />
                <p className="mt-2 text-sm text-ink-light">
                  Step {currentStep + 1} of {STEPS.length}
                </p>
              </div>
              <CardTitle className="text-2xl font-serif">{STEPS[currentStep].title}</CardTitle>
              <CardDescription className="text-ink-light mt-2">
                {currentStep === 0 && "Give your guide a title and destination"}
                {currentStep === 1 && "Add a description and tags to help others find your guide"}
                {currentStep === 2 && "Choose who can see your guide"}
                {currentStep === 3 && "Add sections with your favorite places and tips"}
                {currentStep === 4 && "Review your guide before publishing"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">{renderStep()}</CardContent>
            <CardFooter className="flex justify-between p-0 mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0 || !!editingSection || !!editingPlace}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              {currentStep === STEPS.length - 1 ? (
                <Button variant="terracotta" onClick={handleSubmit} disabled={loading}>
                  <Check className="mr-2 h-4 w-4" />
                  {loading ? 'Creating...' : 'Publish Guide'}
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}

// Section Editor Component
function SectionEditor({
  section,
  onSave,
  onCancel,
}: {
  section: GuideSection
  onSave: (section: GuideSection) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(section.title)
  const [description, setDescription] = useState(section.description)

  const handleSave = () => {
    if (title.trim()) {
      onSave({ ...section, title: title.trim(), description: description.trim() })
    }
  }

  return (
    <div className="rounded-2xl bg-sand p-4 space-y-4">
      <h4 className="font-medium">
        {section.title ? 'Edit Section' : 'Add New Section'}
      </h4>
      <div className="space-y-2">
        <Label htmlFor="section-title">Section Title</Label>
        <Input
          id="section-title"
          placeholder="e.g., Best Restaurants, Must-See Attractions"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="section-desc">Description (optional)</Label>
        <Input
          id="section-desc"
          placeholder="A brief description of this section"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!title.trim()}>
          Save Section
        </Button>
      </div>
    </div>
  )
}

// Place Editor Component
function PlaceEditor({
  place,
  onSave,
  onCancel,
}: {
  place: GuidePlace
  onSave: (place: GuidePlace) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState(place)

  const handleSave = () => {
    if (formData.name.trim()) {
      onSave({ ...formData, name: formData.name.trim() })
    }
  }

  return (
    <div className="rounded-2xl bg-sand p-4 space-y-4">
      <h4 className="font-medium">
        {place.name ? 'Edit Place' : 'Add New Place'}
      </h4>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="place-name">Place Name *</Label>
          <Input
            id="place-name"
            placeholder="e.g., Café de Flore"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="place-category">Category</Label>
          <select
            id="place-category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="flex h-10 w-full rounded-xl border border-sand-dark bg-cream px-4 py-2 text-base text-ink focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent"
          >
            <option value="">Select category...</option>
            {PLACE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="place-price">Price Range</Label>
          <Input
            id="place-price"
            placeholder="e.g., $$, $10-20"
            value={formData.price_range}
            onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="place-address">Address</Label>
          <Input
            id="place-address"
            placeholder="Full address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="place-desc">Description</Label>
          <textarea
            id="place-desc"
            rows={2}
            placeholder="What makes this place special?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="flex w-full rounded-xl border border-sand-dark bg-cream px-4 py-3 text-base text-ink placeholder:text-ink-light/60 focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="place-tips">Tips</Label>
          <textarea
            id="place-tips"
            rows={2}
            placeholder="Any insider tips for visitors?"
            value={formData.tips}
            onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
            className="flex w-full rounded-xl border border-sand-dark bg-cream px-4 py-3 text-base text-ink placeholder:text-ink-light/60 focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!formData.name.trim()}>
          Save Place
        </Button>
      </div>
    </div>
  )
}
