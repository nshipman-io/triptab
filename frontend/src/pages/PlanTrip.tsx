import { Link } from 'react-router'
import { Plane } from 'lucide-react'
import { TripQuestionnaire } from '@/components/questionnaire/TripQuestionnaire'

export function PlanTrip() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="container mx-auto px-4 py-6">
        <Link to="/" className="flex items-center gap-2">
          <Plane className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">Triply</span>
        </Link>
      </header>

      <main className="container mx-auto px-4 py-8">
        <TripQuestionnaire />
      </main>
    </div>
  )
}
