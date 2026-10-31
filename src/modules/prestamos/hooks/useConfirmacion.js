import { useCallback, useState } from 'react'

/**
 * Confirmaciones dentro de la propia interfaz (en vez del diálogo del navegador).
 * `confirmar({ titulo, mensaje, confirmar, tono })` devuelve una promesa: true si el usuario
 * acepta, false si cancela. El estado `confirmacion` se muestra con <ConfirmDialog>.
 */
export default function useConfirmacion() {
  const [confirmacion, setConfirmacion] = useState(null)

  const confirmar = useCallback(
    opciones => new Promise(resolve => setConfirmacion({ ...opciones, resolve })),
    []
  )

  const resolverConfirmacion = respuesta => {
    confirmacion?.resolve(respuesta)
    setConfirmacion(null)
  }

  return { confirmacion, confirmar, resolverConfirmacion }
}
