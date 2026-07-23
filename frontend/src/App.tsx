import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { api, authChangedEvent, authSession } from './api/client'
import { Layout } from './components/Layout'
import { AcademyPage } from './pages/AcademyPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { MarketPage } from './pages/MarketPage'
import { PmoPage } from './pages/PmoPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { ProjectFormPage } from './pages/ProjectFormPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { TicketsPage } from './pages/TicketsPage'
import { VideoGuidelinePage } from './pages/VideoGuidelinePage'

function ProtectedApp() {
  const location = useLocation()
  const [, refreshSession] = useState(0)
  const authenticated = authSession.isAuthenticated()

  useEffect(() => {
    const refresh = () => refreshSession((version) => version + 1)
    window.addEventListener(authChangedEvent, refresh)
    return () => window.removeEventListener(authChangedEvent, refresh)
  }, [])

  useEffect(() => {
    if (authenticated) void api.auth.me().catch(() => undefined)
  }, [authenticated])

  if (!authenticated) return <Navigate to="/login" state={{ from: `${location.pathname}${location.search}` }} replace />

  return <Layout><Routes><Route path="/" element={<DashboardPage />} /><Route path="/projects" element={<ProjectsPage />} /><Route path="/projects/new" element={<ProjectFormPage />} /><Route path="/projects/:id" element={<ProjectDetailPage />} /><Route path="/projects/:id/edit" element={<ProjectFormPage />} /><Route path="/pmo" element={<PmoPage />} /><Route path="/market" element={<MarketPage />} /><Route path="/academy" element={<AcademyPage />} /><Route path="/tickets" element={<TicketsPage />} /><Route path="/guidelines" element={<VideoGuidelinePage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></Layout>
}

export default function App() {
  return <Routes><Route path="/login" element={<LoginPage />} /><Route path="/*" element={<ProtectedApp />} /></Routes>
}
