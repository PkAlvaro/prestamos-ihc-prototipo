import React from 'react'

/**
 * Texto de una lista sin filas. Distingue "cargando" y "falló la carga" de
 * "no hay datos", para que una carga lenta o caída no parezca una lista vacía.
 */
export default function MensajeListaVacia({ isLoading, loadError, onRetry, children }) {
  if (isLoading) return <p className="text-gray-400 text-sm font-semibold">Cargando…</p>
  if (loadError) {
    return (
      <>
        <p className="text-red-500 text-sm font-semibold">
          No se pudieron cargar los datos. Revisa tu conexión.
        </p>
        <button
          onClick={onRetry}
          className="mt-3 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Reintentar
        </button>
      </>
    )
  }
  return <p className="text-gray-400 text-sm font-semibold">{children}</p>
}
