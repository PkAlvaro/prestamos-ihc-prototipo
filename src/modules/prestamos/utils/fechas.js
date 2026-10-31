const DOS = n => String(n).padStart(2, '0')

/** "01/06/2026 09:30" — fecha y hora exactas de un préstamo. */
export function formatFechaHora(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${DOS(d.getDate())}/${DOS(d.getMonth() + 1)}/${d.getFullYear()} ${DOS(d.getHours())}:${DOS(d.getMinutes())}`
}

/** "hace 3 días", "hace 5 h", "hace un momento": cuánto lleva prestado. */
export function haceCuanto(iso, ahora = Date.now()) {
  if (!iso) return ''
  const minutos = Math.max(0, Math.floor((ahora - new Date(iso).getTime()) / 60000))
  if (minutos < 60) return 'hace un momento'
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.floor(horas / 24)
  return dias === 1 ? 'hace 1 día' : `hace ${dias} días`
}
