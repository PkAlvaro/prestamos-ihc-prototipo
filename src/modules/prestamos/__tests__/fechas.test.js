import { describe, it, expect } from 'vitest'
import { formatFechaHora, haceCuanto } from '../utils/fechas'

describe('fechas', () => {
  it('muestra fecha y hora exactas', () => {
    expect(formatFechaHora('2026-06-01T09:05:00')).toBe('01/06/2026 09:05')
    expect(formatFechaHora(null)).toBe('—')
  })

  it('expresa cuánto lleva prestado', () => {
    const ahora = new Date('2026-06-04T09:00:00').getTime()
    expect(haceCuanto('2026-06-04T08:30:00', ahora)).toBe('hace un momento')
    expect(haceCuanto('2026-06-04T04:00:00', ahora)).toBe('hace 5 h')
    expect(haceCuanto('2026-06-03T08:00:00', ahora)).toBe('hace 1 día')
    expect(haceCuanto('2026-06-01T09:00:00', ahora)).toBe('hace 3 días')
  })
})
