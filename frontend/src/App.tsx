import { BrowserRouter, Routes, Route } from 'react-router'
import { Toaster } from 'sonner'
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Dashboard } from '@/pages/Dashboard'
import { PlanTrip } from '@/pages/PlanTrip'
import { TripDetail } from '@/pages/TripDetail'
import { JoinTrip } from '@/pages/JoinTrip'
import { Guides } from '@/pages/Guides'
import { CreateGuide } from '@/pages/CreateGuide'
import { GuideView } from '@/pages/GuideView'
import { Privacy } from '@/pages/Privacy'
import { Terms } from '@/pages/Terms'
import { Settings } from '@/pages/Settings'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminUsers } from '@/pages/admin/AdminUsers'
import { AdminGuides } from '@/pages/admin/AdminGuides'

function App() {
  return (
    <UserPreferencesProvider>
      <BrowserRouter>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#FDFBF7',
              border: '1px solid #E5DED5',
              color: '#2C3539',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/plan" element={<PlanTrip />} />
          <Route path="/trips/:id" element={<TripDetail />} />
          <Route path="/join/:shareCode" element={<JoinTrip />} />
          <Route path="/guides" element={<Guides />} />
          <Route path="/guides/new" element={<CreateGuide />} />
          <Route path="/guides/:id" element={<GuideView />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/guides" element={<AdminGuides />} />
        </Routes>
      </BrowserRouter>
    </UserPreferencesProvider>
  )
}

export default App
