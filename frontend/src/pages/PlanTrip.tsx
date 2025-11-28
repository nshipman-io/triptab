import { Link } from 'react-router'
import { Globe } from 'lucide-react'
import { TripQuestionnaire } from '@/components/questionnaire/TripQuestionnaire'

export function PlanTrip() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="container mx-auto px-4 py-6">
        <Link to="/" className="flex items-center gap-2">
          <Globe className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">Triptab</span>
        </Link>
      </header>

      <main className="container mx-auto px-4 py-8">
        <TripQuestionnaire />
      </main>
    </div>
  )
}
