import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdGenerator from './pages/AdGenerator'
import ReelGenerator from './pages/ReelGenerator'
import AssetHub from './pages/AssetHub'
import Scheduler from './pages/Scheduler'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import CampaignDetail from './pages/CampaignDetail'
import { Loader2 } from 'lucide-react'

/* ────────────────────── protected route wrapper ────────────────────── */

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-caramel" />
          <p className="text-sm text-stone">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

/* ────────────────────── app routes ────────────────────── */

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Protected routes with Layout */}
      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/ads/generate" element={<AdGenerator />} />
                <Route path="/reels/generate" element={<ReelGenerator />} />
                <Route path="/assets" element={<AssetHub />} />
                <Route path="/schedule" element={<Scheduler />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/campaigns/:id" element={<CampaignDetail />} />
                <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

/* ────────────────────── root app ────────────────────── */

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
