import { useEffect } from 'react'
import { HashRouter, NavLink, Route, Routes, useLocation, useParams } from 'react-router'
import { Icon, type IconName } from './components/Icon'
import { RestTimerBar, RestTimerProvider } from './components/RestTimer'
import { useSettings } from './db/settings'
import Body from './pages/Body'
import ExercisePage from './pages/ExercisePage'
import Fasting from './pages/Fasting'
import Nutrition from './pages/nutrition/Nutrition'
import SupplementEditor from './pages/nutrition/SupplementEditor'
import Settings from './pages/Settings'
import Today from './pages/Today'
import Library from './pages/train/Library'
import RoutineEditor from './pages/train/RoutineEditor'
import SkillPage from './pages/train/SkillPage'
import Train from './pages/train/Train'
import WorkoutPage from './pages/train/WorkoutPage'
import FigureGallery from './pages/dev/FigureGallery'

const TABS: { to: string; label: string; icon: IconName; match: string[] }[] = [
  { to: '/', label: 'Today', icon: 'home', match: ['/', '/settings'] },
  { to: '/train', label: 'Train', icon: 'dumbbell', match: ['/train', '/library', '/exercise'] },
  { to: '/nutrition', label: 'Nutrition', icon: 'food', match: ['/nutrition'] },
  { to: '/fasting', label: 'Fasting', icon: 'timer', match: ['/fasting'] },
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

function ThemeSync() {
  const { theme } = useSettings()
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
  }, [theme])
  return null
}

export default function App() {
  return (
    <HashRouter>
      <RestTimerProvider>
        <ThemeSync />
        <ScrollToTop />
        <div className="app">
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/train" element={<Train />} />
            <Route path="/train/workout/:id" element={<Keyed page={WorkoutPage} />} />
            <Route path="/train/routine/:id" element={<Keyed page={RoutineEditor} />} />
            <Route path="/train/skill/:id" element={<SkillPage />} />
            <Route path="/library" element={<Library />} />
            <Route path="/exercise/:id" element={<ExercisePage />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/nutrition/supplement/:id" element={<Keyed page={SupplementEditor} />} />
            <Route path="/fasting" element={<Fasting />} />
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
