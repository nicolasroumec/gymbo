import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import WorkoutPage from './pages/WorkoutPage'
import RegisterPage from './pages/RegisterPage'
import HistoryPage from './pages/HistoryPage'
import WorkoutDetailPage from './pages/WorkoutDetailPage'
import StatsPage from './pages/StatsPage'
import MorePage from './pages/MorePage'
import MuscleGroupsPage from './pages/MuscleGroupsPage'
import ActivityTypesPage from './pages/ActivityTypesPage'
import RoutinesPage from './pages/RoutinesPage'
import RoutineFormPage from './pages/RoutineFormPage'
import ExercisesPage from './pages/ExercisesPage'
import ExerciseFormPage from './pages/ExerciseFormPage'

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
          <Route index element={<WorkoutPage />} />
          <Route path="registrar" element={<RegisterPage />} />
          <Route path="historial" element={<HistoryPage />} />
          <Route path="historial/:id" element={<WorkoutDetailPage />} />
          <Route path="estadisticas" element={<StatsPage />} />
          <Route path="mas" element={<MorePage />} />
          <Route path="mas/grupos" element={<MuscleGroupsPage />} />
          <Route path="mas/actividades" element={<ActivityTypesPage />} />
          <Route path="mas/rutinas" element={<RoutinesPage />} />
          <Route path="mas/rutinas/:id" element={<RoutineFormPage />} />
          <Route path="mas/ejercicios" element={<ExercisesPage />} />
          <Route path="mas/ejercicios/nuevo" element={<ExerciseFormPage />} />
          <Route path="mas/ejercicios/:id" element={<ExerciseFormPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
