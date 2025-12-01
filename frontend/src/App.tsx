import { BrowserRouter, Routes, Route } from 'react-router'
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
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminUsers } from '@/pages/admin/AdminUsers'
import { AdminGuides } from '@/pages/admin/AdminGuides'

function App() {
  return (
    <BrowserRouter>
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
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/guides" element={<AdminGuides />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
