import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plane, Users, Calendar, Share2 } from 'lucide-react'

export function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Triply</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4">
        {/* Hero */}
        <section className="py-20 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Plan trips together,
            <br />
            <span className="text-primary">effortlessly</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Create personalized travel itineraries, invite friends and family, and keep everyone
            on the same page. From flights to experiences, Triply has you covered.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link to="/plan">
              <Button size="lg" className="gap-2">
                <Calendar className="h-5 w-5" />
                Start Planning
              </Button>
            </Link>
            <Link to="/join">
              <Button size="lg" variant="outline" className="gap-2">
                <Share2 className="h-5 w-5" />
                Join a Trip
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Smart Planning</CardTitle>
                <CardDescription>
                  Answer a few questions and we'll create a personalized itinerary based on your preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Solo, couple, friends, or family trips</li>
                  <li>• Budget-conscious recommendations</li>
                  <li>• Activity-based suggestions</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Collaborate</CardTitle>
                <CardDescription>
                  Share your trip with others and plan together in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Shareable invite links</li>
                  <li>• See who's confirmed</li>
                  <li>• Edit together</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Plane className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>All-in-One</CardTitle>
                <CardDescription>
                  Flights, hotels, experiences - manage everything in one place
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Drag and drop itinerary</li>
                  <li>• Booking confirmations</li>
                  <li>• Travel notes</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center">
          <Card className="mx-auto max-w-2xl bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-3xl">Ready to plan your next adventure?</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Join thousands of travelers who plan smarter with Triply
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/register">
                <Button size="lg" variant="secondary">
                  Create Free Account
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Triply. Plan trips together, effortlessly.</p>
        </div>
      </footer>
    </div>
  )
}
