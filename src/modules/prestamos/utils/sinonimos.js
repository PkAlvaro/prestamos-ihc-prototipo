/**
 * Vocabulario del mesón: palabras que el operador usa para referirse al mismo
 * objeto. Cada grupo es un concepto; la primera palabra es la forma "oficial"
 * que suele aparecer en el inventario. Se busca sin tildes ni mayúsculas.
 *
 * Además de este diccionario general, cada artículo puede tener sus propios
 * "otros nombres" (`alias`), que el staff edita desde Stock.
 */
export const GRUPOS_SINONIMOS = [
  ['delantal', 'bata', 'cotona', 'guardapolvo', 'mandil', 'delantal de laboratorio'],
  ['calculadora', 'calcu', 'casio', 'calculadora cientifica'],
  ['cargador', 'carga', 'cable de carga', 'fuente de poder', 'transformador'],
  ['adaptador', 'dongle', 'conversor', 'convertidor', 'hub'],
  ['alargador', 'zapatilla', 'extension', 'enchufe multiple', 'triple'],
  ['audifonos', 'auriculares', 'fonos', 'cascos', 'headphones'],
  ['mouse', 'raton'],
  ['paraguas', 'sombrilla'],
  ['pelota', 'balon', 'bola'],
  ['paleta', 'raqueta', 'pala'],
  ['regla', 'regla t', 'escalimetro'],
  ['escuadra', 'escuadras', 'cartabon'],
  ['compas', 'compas de precision'],
  ['candado', 'cerradura', 'chapa'],
  ['corchetera', 'engrapadora', 'grapadora', 'abrochadora'],
  ['tijeras', 'tijera'],
]

export function normalizarTexto(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Forma singular aproximada, suficiente para "batas" → "bata" o "cargadores" → "cargador". */
function singular(palabra) {
  if (palabra.length > 4 && palabra.endsWith('es')) return palabra.slice(0, -2)
  if (palabra.length > 3 && palabra.endsWith('s')) return palabra.slice(0, -1)
  return palabra
}

const formasDe = texto => {
  const n = normalizarTexto(texto)
  return new Set([n, ...n.split(' ').map(singular), singular(n)])
}

/** Grupos de sinónimos que aparecen en un texto (por frase completa o por palabra). */
function gruposEn(texto) {
  const formas = formasDe(texto)
  return GRUPOS_SINONIMOS.filter(grupo => grupo.some(t => formas.has(t) || formas.has(singular(t))))
}

/**
 * Términos alternativos con los que también se debería encontrar un artículo:
 * los sinónimos de las palabras de su nombre y categoría, más sus alias propios.
 * Se usa al indexar el inventario para la búsqueda.
 */
export function terminosAlternativos(articulo) {
  const propios = new Set([normalizarTexto(articulo.nombre), normalizarTexto(articulo.categoria)])
  const alternativos = new Set()
  for (const grupo of [...gruposEn(articulo.nombre), ...gruposEn(articulo.categoria || '')]) {
    for (const t of grupo) if (!propios.has(t)) alternativos.add(t)
  }
  for (const alias of articulo.alias || []) alternativos.add(normalizarTexto(alias))
  return [...alternativos]
}

/**
 * Si la consulta es un sinónimo (y no una palabra del propio artículo), devuelve
 * la palabra que la conecta con el artículo, para explicarle al operador por qué
 * aparece. Ej.: consulta "bata" sobre "Delantal talla M" → { buscado: 'bata', es: 'delantal' }.
 */
export function explicarCoincidencia(consulta, articulo) {
  const q = normalizarTexto(consulta)
  if (q.length < 2) return null
  const nombre = normalizarTexto(`${articulo.nombre} ${articulo.categoria || ''}`)
  if (nombre.includes(q) || nombre.includes(singular(q))) return null

  const alias = (articulo.alias || []).find(a => {
    const n = normalizarTexto(a)
    return n.includes(q) || q.includes(n)
  })
  if (alias) return { buscado: consulta.trim(), es: articulo.nombre, tipo: 'alias' }

  const formasQ = formasDe(q)
  for (const grupo of gruposEn(`${articulo.nombre} ${articulo.categoria || ''}`)) {
    const usado = grupo.find(t => formasQ.has(t) || t.startsWith(q))
    if (usado) {
      const oficial = grupo.find(t => nombre.includes(t)) || grupo[0]
      return { buscado: consulta.trim(), es: oficial, tipo: 'sinonimo' }
    }
  }
  return null
}
