import { useCallback, useMemo, useRef, useState } from 'react'
import { isValidRut, normalizeRut } from '../../../utils/rutUtils'

const formatRut = value => {
  const clean = String(value || '')
    .replace(/[^0-9kK]/g, '')
    .toUpperCase()
  if (clean.length <= 1) return clean
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`
}

export function useRutInput(initialValue = '') {
  const inputRef = useRef(null)
  const [value, setValue] = useState(initialValue)
  const formattedValue = useMemo(() => formatRut(value), [value])
  const normalizedValue = useMemo(() => normalizeRut(value), [value])
  const isValid = useMemo(() => isValidRut(normalizedValue), [normalizedValue])
  const error = value && !normalizedValue ? 'RUT inválido. Formato esperado: 12345678-5' : ''

  const handleChange = useCallback(nextValue => {
    setValue(formatRut(nextValue?.target ? nextValue.target.value : nextValue))
  }, [])

  const focus = useCallback(() => inputRef.current?.focus(), [])

  return {
    value,
    setValue,
    formattedValue,
    normalizedValue,
    isValid,
    error,
    inputRef,
    handleChange,
    focus,
  }
}
