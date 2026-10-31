import React, { useEffect } from 'react'
import { ShieldCheck } from 'lucide-react'

/** Verificación anti-bot SIMULADA: en el sitio real es un widget de
 * Cloudflare Turnstile. Aquí entrega un token de prueba al montar para no
 * bloquear el formulario, pero conserva su lugar en la pantalla. */
export default function TurnstileWidget({ onToken }) {
  useEffect(() => {
    onToken('demo-token')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-2 px-4 py-3 rounded border border-[var(--pub-borde)] text-xs text-[var(--pub-muted)]">
        <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
        Verificación anti-bot (simulada en el prototipo)
      </div>
    </div>
  )
}
