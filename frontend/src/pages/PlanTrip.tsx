import { Link } from 'react-router'
import { TripQuestionnaire } from '@/components/questionnaire/TripQuestionnaire'

export function PlanTrip() {
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
        <TripQuestionnaire />
      </main>
    </div>
  )
}
