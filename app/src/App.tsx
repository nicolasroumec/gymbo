import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import TrainPage from './pages/TrainPage'
import RegisterPage from './pages/RegisterPage'
import HistoryPage from './pages/HistoryPage'
import StatsPage from './pages/StatsPage'
import MorePage from './pages/MorePage'

export default function App() {
  // undefined = todavía no sabemos si hay sesión; null = no hay.
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) return null

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route element={session ? <Layout /> : <Navigate to="/login" replace />}>
          <Route index element={<TrainPage />} />
          <Route path="registrar" element={<RegisterPage />} />
          <Route path="historial" element={<HistoryPage />} />
          <Route path="estadisticas" element={<StatsPage />} />
          <Route path="mas" element={<MorePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
