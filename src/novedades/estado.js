/**
 * Estado global de la vitrina de novedades, accesible también fuera de React
 * (la API simulada lo consulta para saber si aplica una mejora).
 *
 * - modo: 'mejoras' (prototipo con las novedades) | 'original' (como el sistema real hoy)
 * - marcas: si se muestran las etiquetas "Nuevo" sobre lo agregado
 */
const KEY = 'prestamos-demo-novedades'

function leer() {
  try {
    return { modo: 'mejoras', marcas: true, ...JSON.parse(localStorage.getItem(KEY)) }
  } catch {
    return { modo: 'mejoras', marcas: true }
  }
}

let estado = leer()
const suscriptores = new Set()

export const obtenerEstado = () => estado

export function actualizarEstado(cambios) {
  estado = { ...estado, ...cambios }
  try {
    localStorage.setItem(KEY, JSON.stringify(estado))
  } catch {
    // sin persistencia
  }
  suscriptores.forEach(fn => fn(estado))
}

export function suscribir(fn) {
  suscriptores.add(fn)
  return () => suscriptores.delete(fn)
}

/**
 * Simulación de red para las guías (no se guarda): `lenta` retrasa las consultas,
 * `vacia` hace que las listas de préstamos vuelvan sin filas y `falla` simula una
 * caída de conexión. La API simulada la consulta en cada lectura.
 */
let simulacion = {}
export const obtenerSimulacion = () => simulacion
export function simularRed(nueva) {
  simulacion = { ...(nueva || {}) }
}

/** ¿Está encendida la mejora `id`? En modo original, ninguna lo está. */
export const novedadActiva = _id => estado.modo === 'mejoras'
