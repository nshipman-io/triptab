import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Users, Calendar, Share2, Plane, User, LogOut, Map, Wallet, Wifi, Sparkles, Menu, X } from 'lucide-react'
import { api } from '@/lib/api'
import type { User as UserType } from '@/types'

export function Home() {
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await api.getCurrentUser()
        setUser(userData as UserType)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const handleLogout = () => {
    api.setToken(null)
    setUser(null)
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-sand">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4 md:py-5 flex justify-between items-center bg-gradient-to-b from-sand to-transparent">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl md:text-2xl font-medium text-forest tracking-tight hover:text-terracotta transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 md:w-6 md:h-6">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          Triptab
        </Link>

        {/* Desktop Navigation */}
        {!loading && (
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {user ? (
              <>
                <Link to="/dashboard" className="text-ink-light text-sm font-medium hover:text-terracotta transition-colors">
                  My Trips
                </Link>
                <Link to="/plan" className="text-ink-light text-sm font-medium hover:text-terracotta transition-colors">
                  Plan a Trip
                </Link>
                <div className="flex items-center gap-2 rounded-full bg-cream px-3 py-1.5 shadow-sm">
                  <User className="h-4 w-4 text-ink-light" />
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-ink-light text-sm font-medium hover:text-terracotta transition-colors">
                  Log in
                </Link>
                <Link to="/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        )}

        {/* Mobile Menu Button */}
        {!loading && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        )}
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
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-ink-light hover:bg-sand rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </>
            ) : (
              <>
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

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center px-4 md:px-8 pt-24 md:pt-32 pb-12 md:pb-16 text-center relative overflow-hidden">
        {/* Floating cards - hidden on mobile and tablet */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block">
          <div className="absolute top-[20%] left-[5%] bg-cream rounded-2xl p-3 shadow-lg animate-float" style={{ animationDelay: '0s' }}>
            <img src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=240&h=160&fit=crop" alt="Kyoto temple" className="w-28 h-20 object-cover rounded-lg" />
            <span className="block mt-2 text-xs text-ink-light">Kyoto, Japan</span>
          </div>
          <div className="absolute top-[30%] right-[5%] bg-cream rounded-2xl p-3 shadow-lg animate-float" style={{ animationDelay: '-2s' }}>
            <img src="https://images.unsplash.com/photo-1534695215921-52f8a19e7909?w=240&h=160&fit=crop" alt="Santorini" className="w-28 h-20 object-cover rounded-lg" />
            <span className="block mt-2 text-xs text-ink-light">Santorini, Greece</span>
          </div>
          <div className="absolute bottom-[25%] left-[8%] bg-cream rounded-2xl p-3 shadow-lg animate-float" style={{ animationDelay: '-4s' }}>
            <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=240&h=160&fit=crop" alt="Swiss Alps" className="w-28 h-20 object-cover rounded-lg" />
            <span className="block mt-2 text-xs text-ink-light">Swiss Alps</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-7xl font-serif leading-tight text-ink max-w-4xl mb-4 md:mb-6 tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Plan your next <em className="italic text-terracotta">adventure</em> together
        </h1>

        <p className="text-base md:text-lg text-ink-light max-w-lg leading-relaxed mb-8 md:mb-10 px-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Tell us where you want to go and what you love. We'll craft the perfect itinerary—no endless tabs, no spreadsheet chaos.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto px-4 sm:px-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Link to="/plan" className="w-full sm:w-auto">
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              <Calendar className="h-5 w-5" />
              Start Planning
            </Button>
          </Link>
          <Link to="#features" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
              <Share2 className="h-5 w-5" />
              See How It Works
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-4xl font-serif mb-3 md:mb-4 text-ink">Everything you need, nothing you don't</h2>
          <p className="text-ink-light max-w-md mx-auto text-sm md:text-base">Built for how you actually plan trips together.</p>
        </div>

        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-8 md:mt-12">
          <Card className="hover:-translate-y-2 hover:shadow-xl p-4 md:p-6">
            <div className="w-12 h-12 bg-gradient-to-br from-sand to-sand-dark rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="h-5 w-5 text-forest" />
            </div>
            <CardTitle className="text-lg mb-2">AI-Powered Suggestions</CardTitle>
            <CardDescription className="text-sm leading-relaxed text-ink-light">
              Tell us your vibe and we'll generate a personalized itinerary. No more endless research rabbit holes.
            </CardDescription>
          </Card>

          <Card className="hover:-translate-y-2 hover:shadow-xl p-4 md:p-6">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-sand to-sand-dark rounded-xl flex items-center justify-center mb-3 md:mb-4">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-forest" />
            </div>
            <CardTitle className="text-base md:text-lg mb-2">Plan Together</CardTitle>
            <CardDescription className="text-sm leading-relaxed text-ink-light">
              Real-time collaboration. Both of you can add, edit, and shuffle things around.
            </CardDescription>
          </Card>

          <Card className="hover:-translate-y-2 hover:shadow-xl p-4 md:p-6">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-sand to-sand-dark rounded-xl flex items-center justify-center mb-3 md:mb-4">
              <Map className="h-4 w-4 md:h-5 md:w-5 text-forest" />
            </div>
            <CardTitle className="text-base md:text-lg mb-2">Visual Map View</CardTitle>
            <CardDescription className="text-sm leading-relaxed text-ink-light">
              See your whole trip on a map. Drag activities to reorder.
            </CardDescription>
          </Card>

          <Card className="hover:-translate-y-2 hover:shadow-xl p-4 md:p-6">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-sand to-sand-dark rounded-xl flex items-center justify-center mb-3 md:mb-4">
              <Wallet className="h-4 w-4 md:h-5 md:w-5 text-forest" />
            </div>
            <CardTitle className="text-base md:text-lg mb-2">Budget Tracking</CardTitle>
            <CardDescription className="text-sm leading-relaxed text-ink-light">
              Set a budget, track spending as you go. Split costs automatically.
            </CardDescription>
          </Card>

          <Card className="hover:-translate-y-2 hover:shadow-xl p-4 md:p-6">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-sand to-sand-dark rounded-xl flex items-center justify-center mb-3 md:mb-4">
              <Wifi className="h-4 w-4 md:h-5 md:w-5 text-forest" />
            </div>
            <CardTitle className="text-base md:text-lg mb-2">Works Offline</CardTitle>
            <CardDescription className="text-sm leading-relaxed text-ink-light">
              Access your itinerary anywhere, even without wifi.
            </CardDescription>
          </Card>

          <Card className="hover:-translate-y-2 hover:shadow-xl p-4 md:p-6">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-sand to-sand-dark rounded-xl flex items-center justify-center mb-3 md:mb-4">
              <Plane className="h-4 w-4 md:h-5 md:w-5 text-forest" />
            </div>
            <CardTitle className="text-base md:text-lg mb-2">Keep It Simple</CardTitle>
            <CardDescription className="text-sm leading-relaxed text-ink-light">
              No bloat. No upsells. Just a clean way to plan trips together.
            </CardDescription>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-6 md:px-8">
        <Card className="mx-auto max-w-3xl bg-forest text-cream p-8 md:p-12 text-center">
          <CardTitle className="text-2xl md:text-4xl font-serif text-cream mb-4">
            {user ? 'Ready for your next adventure?' : 'Ready to plan your next adventure?'}
          </CardTitle>
          <CardDescription className="text-cream/80 text-base md:text-lg mb-8">
            {user
              ? 'Start planning a new trip or check out your existing ones'
              : 'Join thousands of travelers who plan smarter with Triptab'}
          </CardDescription>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {user ? (
              <>
                <Link to="/plan">
                  <Button size="lg" className="w-full sm:w-auto bg-cream text-forest hover:bg-cream/90">
                    Plan New Trip
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto bg-cream/20 text-cream border-2 border-cream/50 hover:bg-cream/30">
                    View My Trips
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/register">
                <Button size="lg" className="bg-cream text-forest hover:bg-cream/90">
                  Create Free Account
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </section>

      <footer className="py-12 border-t border-sand-dark text-center">
        <p className="text-sm text-ink-light">
          Made with <span className="text-terracotta">&#9829;</span> for adventures together
        </p>
      </footer>
    </div>
  )
}
