import { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Navigate, NavLink, Route, Routes, useLocation, useParams } from 'react-router'
import { Icon, type IconName } from './components/Icon'
import { RestTimerBar, RestTimerProvider } from './components/RestTimer'
import Body from './pages/Body'
import ExercisePage from './pages/ExercisePage'
import Nutrition from './pages/nutrition/Nutrition'
import Today from './pages/Today'
import Path from './pages/Path'
import Quests from './pages/Quests'
import Yellowstone from './pages/Yellowstone'
import Train from './pages/train/Train'
import WorkoutPage from './pages/train/WorkoutPage'

// Pages you visit now and then load on demand, keeping startup quick. They're still cached for offline use.
const SupplementEditor = lazy(() => import('./pages/nutrition/SupplementEditor'))
const Settings = lazy(() => import('./pages/Settings'))
const Library = lazy(() => import('./pages/train/Library'))
const RoutineEditor = lazy(() => import('./pages/train/RoutineEditor'))
const FigureGallery = lazy(() => import('./pages/dev/FigureGallery'))

const TABS: { to: string; label: string; icon: IconName; match: string[] }[] = [
  { to: '/', label: 'Today', icon: 'home', match: ['/', '/settings'] },
  { to: '/train', label: 'Train', icon: 'dumbbell', match: ['/train', '/library', '/exercise'] },
  { to: '/path', label: 'Path', icon: 'star', match: ['/path', '/yellowstone'] },
  { to: '/quests', label: 'Quests', icon: 'trophy', match: ['/quests'] },
  { to: '/nutrition', label: 'Food', icon: 'food', match: ['/nutrition'] },
  { to: '/body', label: 'Body', icon: 'body', match: ['/body'] },
]

function BottomNav() {
  const { pathname } = useLocation()
  const isActive = (match: string[]) => match.some((m) => (m === '/' ? pathname === '/' : pathname.startsWith(m)))
  return (
    <div className="bottom-nav">
      <nav aria-label="Main">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} className={isActive(t.match) ? 'active' : ''} end={t.to === '/'}>
            <span className="nav-icon">
              <Icon name={t.icon} size={22} />
            </span>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

/** Remounts a page when its :id changes, so editors never carry over the previous item's state. */
function Keyed({ page: Page }: { page: React.ComponentType }) {
  const { id } = useParams()
  return <Page key={id} />
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function SkillRedirect() {
  const { id } = useParams()
  return <Navigate to={`/path?skill=${id ?? ''}`} replace />
}

export default function App() {
  return (
    <HashRouter>
      <RestTimerProvider>
        <ScrollToTop />
        <div className="app">
          <Suspense fallback={<div className="page" />}>
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/train" element={<Train />} />
            <Route path="/train/workout/:id" element={<Keyed page={WorkoutPage} />} />
            <Route path="/train/routine/:id" element={<Keyed page={RoutineEditor} />} />
            <Route path="/train/skill/:id" element={<SkillRedirect />} />
            <Route path="/path" element={<Path />} />
            <Route path="/quests" element={<Quests />} />
            <Route path="/yellowstone" element={<Yellowstone />} />
            <Route path="/trip" element={<Navigate to="/yellowstone" replace />} />
            <Route path="/library" element={<Library />} />
            <Route path="/exercise/:id" element={<ExercisePage />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/nutrition/supplement/:id" element={<Keyed page={SupplementEditor} />} />
            <Route path="/fasting" element={<Navigate to="/nutrition?tab=fasting" replace />} />
            <Route path="/body" element={<Body />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/dev/figures" element={<FigureGallery />} />
            <Route path="*" element={<Today />} />
          </Routes>
          </Suspense>
        </div>
        <RestTimerBar />
        <BottomNav />
      </RestTimerProvider>
    </HashRouter>
  )
}
