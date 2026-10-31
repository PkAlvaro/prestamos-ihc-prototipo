/**
 * Reglas de validación de los formularios de inventario (mejora 5). Cada función
 * devuelve el mensaje que se muestra junto al campo, o null si el valor es válido.
 * Los valores llegan como texto tal cual se escribieron, para poder distinguir
 * "2,5" o "-1" de un campo vacío.
 */

const sinTildes = s =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

/** Nombre reconocible: al menos 3 letras, no solo números o símbolos. */
export function validarNombre(valor, { etiqueta = 'el nombre' } = {}) {
  const texto = String(valor ?? '').trim()
  if (!texto) return `Escribe ${etiqueta}.`
  const letras = (texto.match(/\p{L}/gu) || []).length
  if (letras < 3) return 'Usa un nombre reconocible, con al menos 3 letras (ej: Calculadora Casio).'
  return null
}

/**
 * Cantidad entera. `minimo` 0 para existencias (stock) y 1 para lo que se agrega.
 * Devuelve el mensaje de error, o null.
 */
export function validarCantidad(valor, { minimo = 0, maximo = Infinity } = {}) {
  const texto = String(valor ?? '').trim()
  if (!texto) return 'Indica una cantidad.'
  if (/^-/.test(texto)) return 'No puede ser negativa.'
  if (/[.,]/.test(texto)) return 'Usa un número entero, sin decimales.'
  if (!/^\d+$/.test(texto)) return 'Escribe solo números.'
  const n = Number(texto)
  if (n < minimo) return minimo === 1 ? 'Debe ser mayor que 0.' : `Debe ser al menos ${minimo}.`
  if (n > maximo) return `No puede superar ${maximo}.`
  return null
}

export const aEntero = valor => Number(String(valor).trim())

/** Material registrado: el texto escrito debe corresponder a uno del inventario. */
export function buscarMaterialRegistrado(texto, materiales) {
  const q = sinTildes(texto)
  if (!q) return null
  return (
    materiales.find(m => sinTildes(m.nombre) === q) ||
    materiales.find(m => m.codigo && sinTildes(m.codigo) === q) ||
    null
  )
}

export function validarMaterialRegistrado(texto, materiales) {
  if (!String(texto ?? '').trim()) return 'Elige el material al que se le agregan existencias.'
  if (!buscarMaterialRegistrado(texto, materiales)) {
    return 'No hay un material registrado con ese nombre. Elígelo de la lista.'
  }
  return null
}

/** Material con el mismo nombre (sin tildes ni mayúsculas) ya registrado. */
export const materialDuplicado = (nombre, materiales) =>
  materiales.find(m => sinTildes(m.nombre) === sinTildes(nombre)) || null
