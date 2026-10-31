import { useRef, useState } from 'react'

/**
 * Evita el doble envío: `guard(fn)` ignora clics mientras `fn` siga en curso y
 * `busy` permite deshabilitar el botón. El ref cubre el clic doble que llega
 * antes de que React re-renderice.
 */
export default function useSubmitGuard() {
  const [busy, setBusy] = useState(false)
  const running = useRef(false)
  const guard =
    fn =>
    async (...args) => {
      if (running.current) return undefined
      running.current = true
      setBusy(true)
      try {
        return await fn(...args)
      } finally {
        running.current = false
        setBusy(false)
      }
    }
  return [busy, guard]
}
