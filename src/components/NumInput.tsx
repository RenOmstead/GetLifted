import { useEffect, useState, type InputHTMLAttributes } from 'react'
import { parseNum } from '../lib/units'

interface NumInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | null | undefined
  onChange: (value: number | null) => void
  /** Digits to show when the field isn't being edited. */
  digits?: number
}

/** Number field that keeps what you type ("62.") while focused and tidies it on blur. */
export function NumInput({ value, onChange, digits = 2, ...rest }: NumInputProps) {
  const show = (v: number | null | undefined) => (v == null || !Number.isFinite(v) ? '' : String(Number(v.toFixed(digits))))
  const [text, setText] = useState(show(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setText(show(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused])

  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      {...rest}
      value={text}
      onFocus={(e) => {
        setFocused(true)
        e.currentTarget.select()
      }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const t = e.target.value.replace(/[^0-9.,]/g, '')
        setText(t)
        onChange(parseNum(t))
      }}
    />
  )
}
