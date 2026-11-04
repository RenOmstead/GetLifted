import { useState, type InputHTMLAttributes } from 'react'
import { parseNum } from '../lib/units'

interface NumInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | null | undefined
  onChange: (value: number | null) => void
  /** Digits to show when the field isn't being edited. */
  digits?: number
}

/**
 * Number field that keeps what you type ("62.") while focused and tidies it on blur.
 * Outside of editing it always shows `value`, so a new value can never land on top of what
 * you're typing.
 */
export function NumInput({ value, onChange, digits = 2, onFocus, onBlur, ...rest }: NumInputProps) {
  const show = (v: number | null | undefined) => (v == null || !Number.isFinite(v) ? '' : String(Number(v.toFixed(digits))))
  /** What you're typing; null when the field isn't being edited. */
  const [text, setText] = useState<string | null>(null)

  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      {...rest}
      value={text ?? show(value)}
      onFocus={(e) => {
        setText(show(value))
        e.currentTarget.select()
        onFocus?.(e)
      }}
      onBlur={(e) => {
        setText(null)
        onBlur?.(e)
      }}
      onChange={(e) => {
        const t = e.target.value.replace(/[^0-9.,]/g, '')
        setText(t)
        onChange(parseNum(t))
      }}
    />
  )
}
