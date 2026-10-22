import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useSettings } from '../db/settings'
import { formatClock } from '../lib/dates'

interface RestState {
  endsAt: number | null
  duration: number
}

interface RestApi extends RestState {
  start: (sec: number) => void
  add: (sec: number) => void
  stop: () => void
}

const KEY = 'gl.rest'
const RestContext = createContext<RestApi | null>(null)

let audio: AudioContext | null = null

/** Unlocks audio during a tap so the end-of-rest beep can play later. */
export function primeAudio() {
  try {
    audio ??= new AudioContext()
    if (audio.state === 'suspended') void audio.resume()
  } catch {
    audio = null
  }
}

export function beep(times = 3) {
  if (!audio) return
  const now = audio.currentTime
  for (let i = 0; i < times; i++) {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.frequency.value = i === times - 1 ? 1180 : 880
    gain.gain.setValueAtTime(0.0001, now + i * 0.28)
    gain.gain.exponentialRampToValueAtTime(0.3, now + i * 0.28 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.28 + 0.22)
    osc.connect(gain).connect(audio.destination)
    osc.start(now + i * 0.28)
    osc.stop(now + i * 0.28 + 0.25)
  }
}

export function buzz(pattern: number[] = [200, 100, 200]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Vibration isn't available everywhere (e.g. iOS Safari).
  }
}

function load(): RestState {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as RestState | null
    if (s && s.endsAt && s.endsAt > Date.now() - 5000) return s
  } catch {
    // Storage may be unavailable (private mode); the timer still works in memory.
  }
  return { endsAt: null, duration: 0 }
}

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RestState>(load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [state])
  const start = useCallback((sec: number) => {
    primeAudio()
    setState({ endsAt: Date.now() + sec * 1000, duration: sec })
  }, [])
  const add = useCallback((sec: number) => setState((s) => (s.endsAt ? { endsAt: Math.max(Date.now() + 1000, s.endsAt + sec * 1000), duration: Math.max(1, s.duration + sec) } : s)), [])
  const stop = useCallback(() => setState({ endsAt: null, duration: 0 }), [])
  const api = useMemo(() => ({ ...state, start, add, stop }), [state, start, add, stop])
  return <RestContext.Provider value={api}>{children}</RestContext.Provider>
}

export function useRestTimer(): RestApi {
  const ctx = useContext(RestContext)
  if (!ctx) throw new Error('useRestTimer needs RestTimerProvider')
  return ctx
}

/** Floating countdown above the tab bar while you rest between sets. */
export function RestTimerBar() {
  const { endsAt, duration, add, stop } = useRestTimer()
  const settings = useSettings()
  const [now, setNow] = useState(Date.now())
  const alerted = useRef<number | null>(null)

  useEffect(() => {
    if (!endsAt) return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [endsAt])

  const remaining = endsAt ? endsAt - now : 0
  const finished = endsAt != null && remaining <= 0

  useEffect(() => {
    if (!finished || alerted.current === endsAt) return
    alerted.current = endsAt
    if (settings.restSound) beep()
    if (settings.restVibrate) buzz()
    const t = setTimeout(stop, 4000)
    return () => clearTimeout(t)
  }, [finished, endsAt, settings.restSound, settings.restVibrate, stop])

  if (!endsAt) return null
  const pct = duration ? Math.min(100, (1 - remaining / (duration * 1000)) * 100) : 100
  return (
    <div className="timer-bar" role="timer" aria-live="polite">
      <div className={`inner ${finished ? 'done' : ''}`} style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="grow">
          <div className="tiny" style={{ opacity: 0.75, fontWeight: 600 }}>
            {finished ? 'Rest done: next set!' : 'Rest'}
          </div>
          <div className="time">{finished ? '0:00' : formatClock(remaining + 999)}</div>
        </div>
        {!finished && (
          <>
            <button onClick={() => add(-15)} aria-label="Remove 15 seconds">
              −15
            </button>
            <button onClick={() => add(15)} aria-label="Add 15 seconds">
              +15
            </button>
          </>
        )}
        <button onClick={stop}>{finished ? 'OK' : 'Skip'}</button>
        {!finished && <div className="timer-progress" style={{ width: `${pct}%` }} />}
      </div>
    </div>
  )
}
