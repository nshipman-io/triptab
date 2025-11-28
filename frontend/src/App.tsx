import { BrowserRouter, Routes, Route } from 'react-router'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Dashboard } from '@/pages/Dashboard'
import { PlanTrip } from '@/pages/PlanTrip'
import { TripDetail } from '@/pages/TripDetail'
import { JoinTrip } from '@/pages/JoinTrip'

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
      </Routes>
    </BrowserRouter>
  )
}

export default App
