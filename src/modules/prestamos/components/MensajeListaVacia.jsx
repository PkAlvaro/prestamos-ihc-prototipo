import React from 'react'
import { MarcaNuevo, useNovedad } from '../../../novedades'

/**
 * Texto de una lista sin filas. Distingue "cargando" y "falló la carga" de
 * "no hay datos", para que una carga lenta o caída no parezca una lista vacía
 * (Decisión 5). En modo original se muestra lo que veía la Entrega 1: el mensaje
 * de lista vacía aunque todavía esté cargando.
 */
export default function MensajeListaVacia({
  isLoading,
  loadError,
  onRetry,
  textoCarga = 'Cargando...',
  children,
}) {
  const { activa } = useNovedad('estado-carga')
  if (!activa) return <p className="text-gray-400 text-sm font-semibold">{children}</p>
  if (isLoading) {
    return (
      <p
        role="status"
        className="text-gray-500 text-sm font-semibold inline-flex items-center gap-2"
      >
        <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 border-t-emerald-500 animate-spin" />
        {textoCarga}
        <MarcaNuevo novedad="estado-carga" />
      </p>
    )
  }
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
