import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MapPin, Eye, Search, LogOut, User, Menu, X, BookOpen, Plus, Settings, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/lib/api'
import type { GuideSummary, User as UserType } from '@/types'

export function Guides() {
  const [user, setUser] = useState<UserType | null>(null)
  const [guides, setGuides] = useState<GuideSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await api.getCurrentUser()
        setUser(userData as UserType)
      } catch {
        setUser(null)
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const destination = searchQuery.trim() || undefined
        const data = await api.getPublicGuides(destination)
        setGuides((data as { data: GuideSummary[] }).data || data as GuideSummary[])
      } catch (err) {
        console.error('Failed to load guides:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchGuides()
  }, [searchQuery])

  const handleLogout = () => {
    api.setToken(null)
    setUser(null)
    setMobileMenuOpen(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="min-h-screen bg-sand">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4 md:py-5 flex justify-between items-center bg-gradient-to-b from-sand via-sand to-transparent">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl md:text-2xl font-medium text-forest tracking-tight hover:text-terracotta transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 md:w-6 md:h-6">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          Triptab
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {user ? (
            <>
              <Link to="/dashboard" className="text-ink-light text-sm font-medium hover:text-terracotta transition-colors">
                My Trips
              </Link>
              <Link to="/plan" className="text-ink-light text-sm font-medium hover:text-terracotta transition-colors">
                Plan a Trip
              </Link>
              <Link to="/guides" className="text-terracotta text-sm font-medium">
                Guides
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full bg-cream px-3 py-1.5 shadow-sm hover:bg-sand transition-colors cursor-pointer">
                    <User className="h-4 w-4 text-ink-light" />
                    <span className="text-sm font-medium">{user.name}</span>
                    <ChevronDown className="h-3 w-3 text-ink-light" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      My Trips
                    </Link>
                  </DropdownMenuItem>
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
            </>
          ) : (
            <>
              <Link to="/guides" className="text-terracotta text-sm font-medium">
                Guides
              </Link>
              <Link to="/login" className="text-ink-light text-sm font-medium hover:text-terracotta transition-colors">
                Log in
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileMenuOpen(false)} />
          <nav className="absolute top-16 right-4 left-4 bg-cream rounded-2xl shadow-lg p-4 space-y-2">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 border-b border-sand-dark mb-2 pb-3">
                  <User className="h-4 w-4 text-ink-light" />
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 text-ink hover:bg-sand rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Trips
                </Link>
                <Link
                  to="/plan"
                  className="block px-3 py-2 text-ink hover:bg-sand rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Plan a Trip
                </Link>
                <Link
                  to="/guides"
                  className="block px-3 py-2 text-terracotta font-medium rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Guides
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center gap-2 px-3 py-2 text-ink hover:bg-sand rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-red-600 hover:bg-sand rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/guides"
                  className="block px-3 py-2 text-terracotta font-medium rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Guides
                </Link>
                <Link
                  to="/login"
                  className="block px-3 py-2 text-ink hover:bg-sand rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-24 md:pt-32 pb-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-serif text-ink mb-4">
              Travel Guides
            </h1>
            <p className="text-ink-light max-w-lg mx-auto mb-6">
              Discover curated travel guides from our community. Find hidden gems, local favorites, and insider tips.
            </p>
            {user && (
              <Link to="/guides/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Guide
                </Button>
              </Link>
            )}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-light" />
              <Input
                type="text"
                placeholder="Search by destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-cream border-sand-dark"
              />
            </div>
          </form>

          {/* Guides Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="text-ink-light">Loading guides...</div>
            </div>
          ) : guides.length === 0 ? (
            <Card className="text-center p-8 md:p-12 max-w-lg mx-auto">
              <div className="mx-auto mb-6 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-gradient-to-br from-sand to-sand-dark">
                <BookOpen className="h-8 w-8 md:h-10 md:w-10 text-forest" />
              </div>
              <CardTitle className="text-xl md:text-2xl font-serif mb-2">No guides found</CardTitle>
              <CardDescription className="text-ink-light mb-6 text-sm md:text-base">
                {searchQuery
                  ? `No guides found for "${searchQuery}". Try a different search term.`
                  : 'Be the first to create a travel guide!'}
              </CardDescription>
              {user && (
                <Link to="/dashboard">
                  <Button className="gap-2">
                    Create a Guide
                  </Button>
                </Link>
              )}
            </Card>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <Link key={guide.id} to={`/guides/${guide.id}`}>
                  <Card className="hover:-translate-y-1 hover:shadow-xl overflow-hidden h-full">
                    {/* Cover Image */}
                    <div className="h-40 bg-gradient-to-br from-forest to-forest-light relative">
                      {guide.cover_image_url ? (
                        <img
                          src={guide.cover_image_url}
                          alt={guide.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MapPin className="h-12 w-12 text-cream/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="flex items-center gap-1 text-white/80 text-xs">
                          <MapPin className="h-3 w-3" />
                          {guide.destination}
                        </span>
                      </div>
                    </div>

                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg line-clamp-1">{guide.title}</CardTitle>
                      {guide.description && (
                        <CardDescription className="text-ink-light line-clamp-2 text-sm">
                          {guide.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="p-4 pt-0">
                      {/* Tags */}
                      {guide.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {guide.tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="rounded-full bg-sand-dark px-2 py-0.5 text-xs text-ink-light"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Author & Views */}
                      <div className="flex items-center justify-between text-xs text-ink-light">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-forest text-cream flex items-center justify-center text-xs font-medium">
                            {guide.author.avatar_url ? (
                              <img
                                src={guide.author.avatar_url}
                                alt={guide.author.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              guide.author.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span>{guide.author.name}</span>
                        </div>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {guide.view_count}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-sand-dark text-center">
        <p className="text-sm text-ink-light">
          Made with <span className="text-terracotta">&#9829;</span> for adventures together
        </p>
      </footer>
    </div>
  )
}
