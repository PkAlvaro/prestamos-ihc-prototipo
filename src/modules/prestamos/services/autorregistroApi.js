import { prestamosApi } from './prestamosApi'

/**
 * API pública del autorregistro (QR en el mesón de préstamos): el propio
 * estudiante llena sus datos y confirma el código desde su celular.
 *
 * Prototipo: reutiliza la API simulada; el código de verificación es 123456.
 */
export const autorregistroApi = {
  obtenerTerminos: () => prestamosApi.obtenerTerminos(),

  solicitarVerificacion: ({ turnstile_token: _token, ...data }) =>
    prestamosApi.solicitarVerificacion(data),

  confirmarVerificacion: ({ verificacion_id, codigo }) =>
    prestamosApi.confirmarVerificacion({ verificacion_id, codigo }),
}

export default autorregistroApi
