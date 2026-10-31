const ERROR_GENERICO = 'Ocurrió un error inesperado. Intenta de nuevo.'

/**
 * Texto en español para mostrar al usuario a partir de un error de Axios:
 * - `detail` en texto (errores de negocio del servidor): se muestra tal cual.
 * - `detail` como arreglo (validación 422 de FastAPI): se juntan sus mensajes.
 * - sin respuesta (red caída o timeout): mensaje propio, no el "Network Error" en inglés.
 */
export function mensajeDeError(error, porDefecto = ERROR_GENERICO) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail) return detail
  if (Array.isArray(detail)) {
    const mensajes = detail.map(d => d?.msg).filter(Boolean)
    if (mensajes.length) return `Datos inválidos: ${mensajes.join('; ')}`
  }
  if (error?.code === 'ECONNABORTED') {
    return 'El servidor tardó demasiado en responder. Intenta de nuevo.'
  }
  if (!error?.response) {
    return 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.'
  }
  return porDefecto
}
