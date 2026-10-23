import { useEffect } from 'react'
import { HashRouter, Navigate, NavLink, Route, Routes, useLocation, useParams } from 'react-router'
import { Icon, type IconName } from './components/Icon'
import { RestTimerBar, RestTimerProvider } from './components/RestTimer'
import Body from './pages/Body'
import ExercisePage from './pages/ExercisePage'
import Nutrition from './pages/nutrition/Nutrition'
import SupplementEditor from './pages/nutrition/SupplementEditor'
import Settings from './pages/Settings'
import Today from './pages/Today'
import Library from './pages/train/Library'
import RoutineEditor from './pages/train/RoutineEditor'
import Path from './pages/Path'
import Quests from './pages/Quests'
import Train from './pages/train/Train'
import WorkoutPage from './pages/train/WorkoutPage'
import FigureGallery from './pages/dev/FigureGallery'

const TABS: { to: string; label: string; icon: IconName; match: string[] }[] = [
  { to: '/', label: 'Today', icon: 'home', match: ['/', '/settings'] },
  { to: '/train', label: 'Train', icon: 'dumbbell', match: ['/train', '/library', '/exercise'] },
  { to: '/path', label: 'Path', icon: 'star', match: ['/path'] },
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
function Keyed({ page: Page }: { page: () => React.JSX.Element }) {
  const { id } = useParams()
  return <Page key={id} />
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
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
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/train" element={<Train />} />
            <Route path="/train/workout/:id" element={<Keyed page={WorkoutPage} />} />
            <Route path="/train/routine/:id" element={<Keyed page={RoutineEditor} />} />
            <Route path="/train/skill/:id" element={<SkillRedirect />} />
            <Route path="/path" element={<Path />} />
            <Route path="/quests" element={<Quests />} />
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
        </div>
        <RestTimerBar />
        <BottomNav />
      </RestTimerProvider>
    </HashRouter>
  )
}
