import { crearSeed, isoLocal } from './seed'

/**
 * "Base de datos" del prototipo: un objeto en memoria que se guarda en
 * localStorage para que los cambios sobrevivan a un recargo de página.
 * Nada sale del navegador.
 */

const STORAGE_KEY = 'prestamos-demo-db-v3'

function cargar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // localStorage bloqueado o JSON corrupto: se parte desde la semilla
  }
  return crearSeed()
}

export const db = cargar()

export function guardar() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Sin persistencia: el prototipo sigue funcionando en memoria
  }
}

// Se guarda desde el primer acceso para que los datos no cambien entre recargas
guardar()

export function reiniciarDatos() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignorado
  }
  window.location.reload()
}

/** Simula la latencia de red para que se vean los estados de carga. */
export function responder(valor, ms = 150 + Math.random() * 250) {
  return new Promise(resolve => setTimeout(() => resolve(structuredClone(valor)), ms))
}

/** Error con la misma forma que un error de Axios, que es lo que la UI espera. */
export function fallar(status, detail, ms = 200) {
  const error = new Error(detail)
  error.response = { status, data: { detail } }
  return new Promise((_, reject) => setTimeout(() => reject(error), ms))
}

export function siguienteId(lista) {
  return lista.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

export const ahoraIso = () => isoLocal(new Date())

// --- Regla de multa (misma que el backend real) ---

export const HORAS_GRACIA = 48
export const MULTA_POR_BLOQUE = 500
export const MULTA_MAXIMA = 6000

function esDiaSinMulta(fecha) {
  const iso = isoLocal(fecha).slice(0, 10)
  return db.periodosSinMulta.some(p => p.fecha_inicio <= iso && iso <= p.fecha_fin)
}

export function horasHabiles(desdeIso, hasta = new Date()) {
  let actual = new Date(desdeIso)
  if (hasta <= actual) return 0
  let segundos = 0
  while (actual < hasta) {
    const siguiente = new Date(actual)
    siguiente.setDate(siguiente.getDate() + 1)
    siguiente.setHours(0, 0, 0, 0)
    const dia = actual.getDay()
    if (dia !== 0 && dia !== 6 && !esDiaSinMulta(actual)) {
      const fin = siguiente < hasta ? siguiente : hasta
      segundos += (fin - actual) / 1000
    }
    actual = siguiente
  }
  return segundos / 3600
}

export function detalleMulta(fechaPrestamo) {
  const horas = horasHabiles(fechaPrestamo)
  const atraso = Math.max(0, horas - HORAS_GRACIA)
  const bloques = atraso > 0 ? Math.ceil(atraso / 24) : 0
  const sinTope = bloques * MULTA_POR_BLOQUE
  return {
    multa: Math.min(sinTope, MULTA_MAXIMA),
    horas_habiles: Math.round(horas * 10) / 10,
    horas_atraso: Math.round(atraso * 10) / 10,
    bloques,
    tope_alcanzado: sinTope > MULTA_MAXIMA,
    gracia_restante_horas: Math.round(Math.max(0, HORAS_GRACIA - horas) * 10) / 10,
  }
}

export const calcularMulta = fechaPrestamo => detalleMulta(fechaPrestamo).multa

export function estadoPrestamo(p) {
  if (p.fecha_devolucion) return 'DEVUELTO'
  return horasHabiles(p.fecha_prestamo) > HORAS_GRACIA ? 'VENCIDO' : 'ACTIVO'
}

/** Recalcula estados y multas acumuladas, como hace el backend al leer. */
export function refrescarEstados() {
  for (const p of db.prestamos) {
    if (!p.fecha_devolucion) p.estado = estadoPrestamo(p)
  }
  for (const e of db.estudiantes) {
    e.multa_acumulada = db.prestamos
      .filter(p => p.estudiante_id === e.id && p.estado !== 'DEVUELTO')
      .reduce((total, p) => total + calcularMulta(p.fecha_prestamo), 0)
  }
}

// --- Agrupación de carreras (misma que el backend real) ---

export const GRUPOS_ORDENADOS = ['ING/LICC', 'College', 'Otras Carreras']

const sinTildes = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

export function grupoCarrera(carrera) {
  if (!carrera) return 'Otras Carreras'
  const c = sinTildes(carrera.trim().toLowerCase())
  const exactas = [
    'ing/licc',
    'licd',
    'ingenieria civil',
    'licenciatura en ciencias de la computacion',
  ]
  if (
    exactas.includes(c) ||
    ['licc', 'ciencia de datos', 'ciencias de datos'].some(k => c.includes(k))
  ) {
    return 'ING/LICC'
  }
  if (c.startsWith('college')) return 'College'
  return 'Otras Carreras'
}

export function carreraExenta(carrera) {
  const config = db.carrerasConfig.find(
    c => sinTildes(c.carrera.toLowerCase()) === sinTildes((carrera || '').toLowerCase())
  )
  if (config) return config.exenta
  return ['ING/LICC', 'College'].includes(grupoCarrera(carrera))
}
