import { useEffect, useRef, useState } from 'react'
import { useSettings } from '../db/settings'
import { formatSeconds } from '../lib/dates'
import { beep, buzz, primeAudio } from './RestTimer'
import { Ring } from './Ring'
import { Sheet } from './Sheet'

interface HoldTimerProps {
  open: boolean
  onClose: () => void
  title: string
  targetSec: number
  perSide?: boolean
  /** Count down and finish on its own (stretches); otherwise count up for max holds. */
  countdown?: boolean
  onDone: (seconds: number) => void
}

type Phase = 'ready' | 'prep' | 'running' | 'switch' | 'done'

const PREP_SEC = 3
const SWITCH_SEC = 5

/** Timer for holds and stretches, with a 3-second lead-in and an optional second side. */
export function HoldTimer({ open, onClose, title, targetSec, perSide, countdown, onDone }: HoldTimerProps) {
  const settings = useSettings()
  const [phase, setPhase] = useState<Phase>('ready')
  const [side, setSide] = useState(1)
  const [startedAt, setStartedAt] = useState(0)
  const [now, setNow] = useState(Date.now())
  const results = useRef<number[]>([])
  const signalled = useRef(false)

  useEffect(() => {
    if (open) {
      setPhase('ready')
      setSide(1)
      results.current = []
    }
  }, [open])

  useEffect(() => {
    if (phase === 'ready' || phase === 'done') return
    const t = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(t)
  }, [phase])

  const elapsed = (now - startedAt) / 1000

  const signal = (times: number) => {
    if (settings.restSound) beep(times)
    if (settings.restVibrate) buzz(times > 1 ? [200, 100, 200] : [150])
  }

  const finishSide = (seconds: number) => {
    results.current.push(Math.round(seconds))
    if (perSide && side === 1) {
      setSide(2)
      setPhase('switch')
      setStartedAt(Date.now())
    } else {
      setPhase('done')
      // Record the weaker side so progress reflects both.
      onDone(Math.min(...results.current))
    }
  }

  useEffect(() => {
    if (phase === 'prep' && elapsed >= PREP_SEC) {
      signal(1)
      setPhase('running')
      setStartedAt(Date.now())
      signalled.current = false
    } else if (phase === 'switch' && elapsed >= SWITCH_SEC) {
      signal(1)
      setPhase('running')
      setStartedAt(Date.now())
      signalled.current = false
    } else if (phase === 'running' && elapsed >= targetSec && !signalled.current) {
      signalled.current = true
      signal(3)
      if (countdown) finishSide(targetSec)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now])

  const start = () => {
    primeAudio()
    setStartedAt(Date.now())
    setNow(Date.now())
    setPhase('prep')
  }

  let big = formatSeconds(targetSec)
  let label = perSide ? 'Side 1' : 'Ready'
  let ringValue = 0
  if (phase === 'prep') {
    big = String(Math.max(1, Math.ceil(PREP_SEC - elapsed)))
    label = 'Get in position'
  } else if (phase === 'switch') {
    big = String(Math.max(1, Math.ceil(SWITCH_SEC - elapsed)))
    label = 'Switch sides'
  } else if (phase === 'running') {
    big = countdown ? formatSeconds(Math.max(0, Math.ceil(targetSec - elapsed))) : formatSeconds(Math.floor(elapsed))
    label = perSide ? `Side ${side}` : elapsed >= targetSec ? 'Target reached!' : countdown ? 'Hold' : `Goal ${formatSeconds(targetSec)}`
    ringValue = Math.min(elapsed, targetSec)
  } else if (phase === 'done') {
    big = formatSeconds(Math.min(...results.current))
    label = 'Logged'
    ringValue = targetSec
  }

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="stack" style={{ alignItems: 'center', paddingBottom: 8 }}>
        <Ring value={ringValue} max={targetSec} size={220} stroke={14} done={phase === 'done' || (phase === 'running' && elapsed >= targetSec)}>
          <div className="hero-number num">{big}</div>
          <div className="muted small" style={{ marginTop: 6 }}>
            {label}
          </div>
        </Ring>
        {phase === 'ready' && (
          <button className="btn primary lg block" onClick={start}>
            Start {perSide ? 'side 1' : 'hold'}
          </button>
        )}
        {phase === 'running' && (
          <button className="btn primary lg block" onClick={() => finishSide(elapsed)}>
            {countdown ? 'Stop early' : perSide && side === 1 ? 'Done: switch sides' : 'Done'}
          </button>
        )}
        {(phase === 'prep' || phase === 'switch') && (
          <button className="btn lg block" onClick={() => setPhase('ready')}>
            Cancel
          </button>
        )}
        {phase === 'done' && (
          <button className="btn primary lg block" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </Sheet>
  )
}
