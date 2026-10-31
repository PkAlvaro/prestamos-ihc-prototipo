import { useEffect } from 'react'

/** Ejecuta `onEscape` al presionar Esc mientras `enabled` sea true (modales). */
export default function useEscape(onEscape, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined
    const handler = e => e.key === 'Escape' && onEscape()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onEscape, enabled])
}
