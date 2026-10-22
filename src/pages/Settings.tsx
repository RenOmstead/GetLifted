import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Icon } from '../components/Icon'
import { NumInput } from '../components/NumInput'
import { confirmAction } from '../components/Sheet'
import { db } from '../db/db'
import { ageFromSettings, updateSettings, useSettings } from '../db/settings'
import type { ActivityLevel, Sex, ThemePref, Units } from '../db/types'
import { exportBackup, importBackup, resetAll } from '../lib/backup'
import { formatSeconds } from '../lib/dates'
import { ACTIVITY, suggestGoals, tdee, type GoalKind } from '../lib/nutrition'
import { cmToDisplay, displayToCm, displayToKg, displayToMl, fmt, kgToDisplay, lengthUnit, mlToDisplay, volumeUnit, weightUnit } from '../lib/units'

export default function Settings() {
  const navigate = useNavigate()
  const s = useSettings()
  const u = s.units
  const latestWeight = useLiveQuery(() => db.weights.orderBy('date').last(), [])
  const [goalKind, setGoalKind] = useState<GoalKind>('maintain')
  const [message, setMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const age = ageFromSettings(s)
  const maintenance = latestWeight && s.heightCm ? tdee(s.sex, latestWeight.kg, s.heightCm, age, s.activityLevel) : null
  const suggestion = maintenance && latestWeight ? suggestGoals(maintenance, latestWeight.kg, goalKind) : null

  const download = async () => {
    const json = await exportBackup()
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `get-lifted-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('Backup downloaded.')
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <Icon name="chevronLeft" />
        </button>
        <h1>Settings</h1>
      </div>

      <div className="section-title">
        <h2>Profile</h2>
      </div>
      <div className="card stack">
        <label className="field">
          <span>Name</span>
          <input value={s.name} onChange={(e) => void updateSettings({ name: e.target.value })} placeholder="Optional" />
        </label>
        <div className="grid-2">
          <label className="field">
            <span>Sex (for reference values)</span>
            <select value={s.sex} onChange={(e) => void updateSettings({ sex: e.target.value as Sex })}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
          <label className="field">
            <span>Birth year</span>
            <NumInput value={s.birthYear} digits={0} placeholder="e.g. 1992" onChange={(v) => void updateSettings({ birthYear: v && v > 1900 ? Math.round(v) : null })} />
          </label>
        </div>
        <div className="grid-2">
          <label className="field">
            <span>Height ({lengthUnit(u)})</span>
            <NumInput value={s.heightCm != null ? cmToDisplay(s.heightCm, u) : null} digits={1} onChange={(v) => void updateSettings({ heightCm: v ? displayToCm(v, u) : null })} />
          </label>
          <label className="field">
            <span>Units</span>
            <select value={u} onChange={(e) => void updateSettings({ units: e.target.value as Units })}>
              <option value="imperial">lb, in, mi, fl oz</option>
              <option value="metric">kg, cm, km, ml</option>
            </select>
          </label>
        </div>
        <label className="toggle">
          <span>I smoke (raises the vitamin C target)</span>
          <input type="checkbox" checked={s.smoker} onChange={(e) => void updateSettings({ smoker: e.target.checked })} />
        </label>
        <p className="tiny muted">Vitamin and mineral targets use your age ({age}) and sex. They’re designed for healthy adults; pregnancy and medical conditions change them.</p>
      </div>

      <div className="section-title">
        <h2>Daily goals</h2>
      </div>
      <div className="card stack">
        <label className="field">
          <span>Activity level</span>
          <select value={s.activityLevel} onChange={(e) => void updateSettings({ activityLevel: e.target.value as ActivityLevel })}>
            {(Object.keys(ACTIVITY) as ActivityLevel[]).map((k) => (
              <option key={k} value={k}>
                {ACTIVITY[k].label}
              </option>
            ))}
          </select>
        </label>
        {suggestion ? (
          <div className="callout stack-sm" style={{ display: 'flex', flexDirection: 'column' }}>
            <div>
              Estimated maintenance: <strong>{Math.round(maintenance!)} kcal/day</strong> (Mifflin-St Jeor).
            </div>
            <div className="segmented">
              {(['lose', 'maintain', 'gain'] as const).map((g) => (
                <button key={g} className={goalKind === g ? 'active' : ''} onClick={() => setGoalKind(g)}>
                  {g === 'lose' ? 'Lose fat' : g === 'gain' ? 'Build muscle' : 'Maintain'}
                </button>
              ))}
            </div>
            <div>
              Suggested: {suggestion.kcal} kcal · protein {suggestion.protein} g · carbs {suggestion.carbs} g · fat {suggestion.fat} g
            </div>
            <button
              className="btn sm"
              onClick={() => void updateSettings({ calorieGoal: suggestion.kcal, proteinGoalG: suggestion.protein, carbGoalG: suggestion.carbs, fatGoalG: suggestion.fat })}
            >
              Use these goals
            </button>
          </div>
        ) : (
          <p className="small muted">Add your height, birth year and a weigh-in to get a calorie suggestion.</p>
        )}
        <div className="grid-2">
          <label className="field">
            <span>Calories (kcal)</span>
            <NumInput value={s.calorieGoal} digits={0} onChange={(v) => v && void updateSettings({ calorieGoal: Math.round(v) })} />
          </label>
          <label className="field">
            <span>Protein (g)</span>
            <NumInput value={s.proteinGoalG} digits={0} onChange={(v) => v && void updateSettings({ proteinGoalG: Math.round(v) })} />
          </label>
          <label className="field">
            <span>Carbs (g)</span>
            <NumInput value={s.carbGoalG} digits={0} onChange={(v) => v != null && void updateSettings({ carbGoalG: Math.round(v) })} />
          </label>
          <label className="field">
            <span>Fat (g)</span>
            <NumInput value={s.fatGoalG} digits={0} onChange={(v) => v != null && void updateSettings({ fatGoalG: Math.round(v) })} />
          </label>
          <label className="field">
            <span>Water ({volumeUnit(u)})</span>
            <NumInput value={mlToDisplay(s.waterGoalMl, u)} digits={0} onChange={(v) => v && void updateSettings({ waterGoalMl: displayToMl(v, u) })} />
          </label>
          <label className="field">
            <span>Goal weight ({weightUnit(u)})</span>
            <NumInput value={s.goalWeightKg != null ? kgToDisplay(s.goalWeightKg, u) : null} digits={1} onChange={(v) => void updateSettings({ goalWeightKg: v ? displayToKg(v, u) : null })} />
          </label>
        </div>
        <p className="tiny muted">Protein for people who train: 1.4–2.0 g per kg of body weight a day (ISSN). {latestWeight ? `For you that’s about ${fmt(latestWeight.kg * 1.4, 0)}–${fmt(latestWeight.kg * 2, 0)} g.` : ''}</p>
      </div>

      <div className="section-title">
        <h2>Workouts</h2>
      </div>
      <div className="card stack">
        <label className="field">
          <span>Default rest between sets</span>
          <select value={s.defaultRestSec} onChange={(e) => void updateSettings({ defaultRestSec: Number(e.target.value) })}>
            {[30, 45, 60, 75, 90, 120, 150, 180, 240, 300].map((v) => (
              <option key={v} value={v}>
                {formatSeconds(v)}
              </option>
            ))}
          </select>
        </label>
        <label className="toggle">
          <span>Sound when rest or a hold ends</span>
          <input type="checkbox" checked={s.restSound} onChange={(e) => void updateSettings({ restSound: e.target.checked })} />
        </label>
        <label className="toggle">
          <span>Vibrate (Android)</span>
          <input type="checkbox" checked={s.restVibrate} onChange={(e) => void updateSettings({ restVibrate: e.target.checked })} />
        </label>
      </div>

      <div className="section-title">
        <h2>Appearance</h2>
      </div>
      <div className="segmented">
        {(['system', 'light', 'dark'] as ThemePref[]).map((t) => (
          <button key={t} className={s.theme === t ? 'active' : ''} onClick={() => void updateSettings({ theme: t })}>
            {t === 'system' ? 'Automatic' : t === 'light' ? 'Light' : 'Dark'}
          </button>
        ))}
      </div>

      <div className="section-title">
        <h2>Your data</h2>
      </div>
      <div className="card stack">
        <p className="small text-2">Everything is stored privately on this device. Download a backup now and then, especially before switching phones or clearing your browser.</p>
        <div className="grid-2">
          <button className="btn" onClick={() => void download()}>
            <Icon name="download" size={18} /> Back up
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={18} /> Restore
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hide"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f || !confirmAction('Replace everything in the app with this backup?')) return
            try {
              await importBackup(await f.text())
              setMessage('Backup restored.')
            } catch (err) {
              setMessage(err instanceof Error ? err.message : 'Couldn’t read that file.')
            }
          }}
        />
        {message && <p className="small status info">{message}</p>}
        <button
          className="btn danger ghost"
          onClick={async () => {
            if (!confirmAction('Erase all Get Lifted data on this device? This can’t be undone.')) return
            await resetAll()
            setMessage('All data erased.')
          }}
        >
          Erase all data
        </button>
      </div>

      <div className="section-title">
        <h2>Sources</h2>
      </div>
      <div className="card stack-sm small text-2">
        <p>
          Vitamin and mineral reference values: National Academies Dietary Reference Intakes, via the{' '}
          <a href="https://ods.od.nih.gov/factsheets/list-all/" target="_blank" rel="noreferrer">
            NIH Office of Dietary Supplements
          </a>
          .
        </p>
        <p>
          Supplement labels:{' '}
          <a href="https://dsld.od.nih.gov/" target="_blank" rel="noreferrer">
            NIH Dietary Supplement Label Database
          </a>
          . Packaged foods:{' '}
          <a href="https://world.openfoodfacts.org/" target="_blank" rel="noreferrer">
            Open Food Facts
          </a>{' '}
          (ODbL). Whole foods: USDA FoodData Central.
        </p>
        <p>
          Exercise photos and instructions:{' '}
          <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noreferrer">
            Free Exercise DB
          </a>{' '}
          (public domain). Figure illustrations: Get Lifted.
        </p>
        <p className="tiny muted">Get Lifted gives general fitness and nutrition information, not medical advice.</p>
      </div>
    </div>
  )
}
