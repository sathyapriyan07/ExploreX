import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { ExplorePage } from './pages/ExplorePage'
import { PlaceDetailPage } from './pages/PlaceDetailPage'
import { TripPlannerPage } from './pages/TripPlannerPage'
import { AuthPage } from './pages/AuthPage'
import { SavedPage } from './pages/SavedPage'

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/place/:place" element={<PlaceDetailPage />} />
        <Route path="/planner" element={<TripPlannerPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

