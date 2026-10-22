import type { Units } from '../db/types'

export const KG_PER_LB = 0.45359237
export const CM_PER_IN = 2.54
export const M_PER_MI = 1609.344
export const ML_PER_FLOZ = 29.5735295625

export const weightUnit = (u: Units) => (u === 'imperial' ? 'lb' : 'kg')
export const distanceUnit = (u: Units) => (u === 'imperial' ? 'mi' : 'km')
export const lengthUnit = (u: Units) => (u === 'imperial' ? 'in' : 'cm')
export const volumeUnit = (u: Units) => (u === 'imperial' ? 'fl oz' : 'ml')

export const kgToDisplay = (kg: number, u: Units) => (u === 'imperial' ? kg / KG_PER_LB : kg)
export const displayToKg = (v: number, u: Units) => (u === 'imperial' ? v * KG_PER_LB : v)

export const cmToDisplay = (cm: number, u: Units) => (u === 'imperial' ? cm / CM_PER_IN : cm)
export const displayToCm = (v: number, u: Units) => (u === 'imperial' ? v * CM_PER_IN : v)

export const mToDisplay = (m: number, u: Units) => (u === 'imperial' ? m / M_PER_MI : m / 1000)
export const displayToM = (v: number, u: Units) => (u === 'imperial' ? v * M_PER_MI : v * 1000)

export const mlToDisplay = (ml: number, u: Units) => (u === 'imperial' ? ml / ML_PER_FLOZ : ml)
export const displayToMl = (v: number, u: Units) => (u === 'imperial' ? v * ML_PER_FLOZ : v)

/** Rounds for display, trimming trailing zeros: 82.50 → "82.5". */
export function fmt(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return '–'
  return Number(n.toFixed(digits)).toLocaleString(undefined, { maximumFractionDigits: digits })
}

export function formatWeight(kg: number | null | undefined, u: Units, digits = 1): string {
  if (kg == null) return '–'
  return `${fmt(kgToDisplay(kg, u), digits)} ${weightUnit(u)}`
}

/** Parses a user-typed number; empty or invalid input gives null. */
export function parseNum(value: string): number | null {
  if (value.trim() === '') return null
  const n = Number(value.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
