/**
 * Utilidades para normalización y validación de RUT chileno
 *
 * Soporta múltiples formatos de entrada:
 * - 12345678-5 (ya normalizado)
 * - 123456785 (sin guión)
 * - 12.345.678-5 (con puntos)
 * - 12.345.678-K (con letra mayúscula o minúscula)
 */

/**
 * Normaliza un RUT chileno al formato estándar: NNNNNNN-D
 * @param {string} rutInput - RUT en cualquier formato
 * @returns {string|null} RUT normalizado (NNNNNNN-D) o null si es inválido
 */
export function normalizeRut(rutInput) {
  if (!rutInput) {
    return null
  }

  // Limpiar: eliminar puntos, espacios y convertir a mayúsculas
  const cleaned = rutInput.replace(/\./g, '').replace(/\s/g, '').toUpperCase().trim()

  let numPart, dvPart

  // Si ya tiene guión, separar número y dígito verificador
  if (cleaned.includes('-')) {
    const parts = cleaned.split('-')
    if (parts.length !== 2) {
      return null
    }
    ;[numPart, dvPart] = parts
  } else {
    // Sin guión: último carácter es el dígito verificador
    if (cleaned.length < 2) {
      return null
    }
    numPart = cleaned.slice(0, -1)
    dvPart = cleaned.slice(-1)
  }

  // Validar que numPart es solo dígitos
  if (!/^\d+$/.test(numPart)) {
    return null
  }

  // Validar que dvPart es dígito o K
  if (!/^[0-9K]$/.test(dvPart)) {
    return null
  }

  // Eliminar ceros a la izquierda del número
  numPart = numPart.replace(/^0+/, '') || '0'

  // RUTs chilenos tienen exactamente 8 dígitos
  if (numPart.length !== 8) {
    return null
  }

  return `${numPart}-${dvPart}`
}

/**
 * Verifica si un RUT tiene el formato estándar
 * @param {string} rut - RUT a validar
 * @returns {boolean} True si el RUT tiene el formato NNNNNNN-D
 */
export function isValidRut(rut) {
  if (!rut) {
    return false
  }

  // Patrón: exactamente 8 dígitos, guión, 1 dígito o K
  return /^\d{8}-[0-9K]$/.test(rut)
}

/**
 * Extrae la parte numérica del RUT
 * @param {string} rut - RUT en formato estándar (NNNNNNN-D)
 * @returns {number|null} Número del RUT o null si es inválido
 */
export function extractRutNumber(rut) {
  if (!isValidRut(rut)) {
    return null
  }

  try {
    const numPart = rut.split('-')[0]
    return parseInt(numPart, 10)
  } catch {
    return null
  }
}
