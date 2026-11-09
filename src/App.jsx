import { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
const MyClasses = lazy(() => import('./pages/MyClasses'))
const Materials = lazy(() => import('./pages/Materials'))
const Assignments = lazy(() => import('./pages/Assignments'))
const Midterms = lazy(() => import('./pages/Midterms'))
const Examinations = lazy(() => import('./pages/Examinations'))
const IndependentStudies = lazy(() => import('./pages/IndependentStudies'))
const Grades = lazy(() => import('./pages/Grades'))
const AITeacher = lazy(() => import('./pages/AITeacher'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Settings = lazy(() => import('./pages/Settings'))
import Welcome from './pages/Welcome'
import { useApp } from './store/AppStore'
import { useI18n } from './i18n/I18nProvider'

export default function App() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { unread } = useApp()
  const { chosen, t } = useI18n()
  useEffect(() => { setOpen(false); window.scrollTo(0, 0) }, [pathname])

  if (!chosen) return <Welcome /> // first visit: the language is chosen before the app opens

  return (
    <div className="shell">
      <Sidebar open={open} onClose={() => setOpen(false)} unread={unread} />
      <main className="main">
        <Header onMenu={() => setOpen(true)} />
        <Suspense fallback={<div className="card empty-state">{t('common.loading')}</div>}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/classes" element={<MyClasses />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/midterms" element={<Midterms />} />
          <Route path="/exams" element={<Examinations />} />
          <Route path="/independent-studies" element={<IndependentStudies />} />
          <Route path="/grades" element={<Grades />} />
          <Route path="/ai-teacher" element={<AITeacher />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </main>
    </div>
  )
}
