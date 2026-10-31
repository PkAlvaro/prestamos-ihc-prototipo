import Fuse from 'fuse.js'
import {
  db,
  guardar,
  responder,
  fallar,
  siguienteId,
  ahoraIso,
  detalleMulta,
  calcularMulta,
  estadoPrestamo,
  refrescarEstados,
  grupoCarrera,
  carreraExenta,
  GRUPOS_ORDENADOS,
  MULTA_MAXIMA,
} from '../../../mock/db'
import { CARRERAS } from '../constants'
import { terminosAlternativos } from '../utils/sinonimos'
import { PREFIJOS_CODIGO } from '../../../mock/seed'
import { novedadActiva } from '../../../novedades/estado'

/**
 * Servicio de API del módulo de Préstamos — VERSIÓN PROTOTIPO.
 *
 * Mismos nombres, parámetros y formas de respuesta que la API real, pero todo
 * se resuelve en el navegador contra `src/mock/db.js`. Ningún dato sale del
 * equipo y no se envían correos.
 */

const RESPONSABLE = { email: 'demo@ejemplo.cl', nombre: 'Usuario Demo' }

export const TERMINOS = {
  version: '2026.1',
  usos: [
    {
      id: 'gestion',
      titulo: 'Gestión del préstamo',
      texto:
        'Para prestarte artículos o insumos, tratamos tu RUT (o identificador de intercambio), ' +
        'nombre y carrera: para verificar tu identidad, llevar el registro de qué tienes prestado ' +
        'y calcular la multa si te atrasas en la devolución. Estos datos se conservan mientras ' +
        'seas usuario activo de préstamos.',
    },
    {
      id: 'avisos_multa',
      titulo: 'Aviso de multas por correo',
      texto:
        'Si tu préstamo genera una multa por atraso, usamos tu correo electrónico para avisarte. ' +
        'El envío lo hace un proveedor externo de correo transaccional.',
    },
  ],
  derechos:
    'Tus derechos: puedes pedir acceder, corregir o eliminar estos datos en cualquier momento ' +
    'escribiendo a contacto@ejemplo.cl, salvo que existan obligaciones pendientes (multas, ' +
    'artículos sin devolver).',
}
TERMINOS.texto = [...TERMINOS.usos.map(u => u.texto), TERMINOS.derechos].join('\n\n')

// --- Helpers de lectura ---

const estudiantePorId = id => db.estudiantes.find(e => e.id === id)
const estudiantePorRut = rut =>
  db.estudiantes.find(e => e.rut.toUpperCase() === String(rut || '').toUpperCase())
const articuloPorId = id => db.articulos.find(a => a.id === Number(id))
const prestamoPorId = id => db.prestamos.find(p => p.id === Number(id))
const cobroArriendoPorId = id => db.cobrosArriendo.find(c => c.id === id)

const enRango = (fechaIso, inicio, fin) =>
  (!inicio || fechaIso.slice(0, 10) >= inicio) && (!fin || fechaIso.slice(0, 10) <= fin)

function prestamoConDetalles(p) {
  const est = estudiantePorId(p.estudiante_id) || {}
  const art = articuloPorId(p.articulo_id) || {}
  const cobro = p.cobro_arriendo_id ? cobroArriendoPorId(p.cobro_arriendo_id) : null
  const pendiente = cobro?.tipo_pago === 'PENDIENTE'
  return {
    id: p.id,
    articulo_id: p.articulo_id,
    estudiante_id: p.estudiante_id,
    responsable_email: p.responsable_email,
    responsable_nombre: p.responsable_nombre,
    fecha_prestamo: p.fecha_prestamo,
    fecha_devolucion: p.fecha_devolucion,
    multa_calculada: p.estado === 'DEVUELTO' ? p.multa_calculada : calcularMulta(p.fecha_prestamo),
    estado: p.estado,
    comentario: p.comentario,
    articulo_nombre: art.nombre,
    articulo_codigo: art.codigo,
    estudiante_nombre: est.nombre,
    estudiante_rut: est.rut,
    estudiante_email: est.email,
    ultima_notificacion: p.ultima_notificacion,
    cobro_arriendo_pendiente: pendiente,
    cobro_arriendo_monto: pendiente ? cobro.monto_calculado : null,
  }
}

const prestamoResponse = p => {
  const { cobro_arriendo_id: _c, ultima_notificacion: _u, ...resto } = p
  return resto
}

function stockEnUso(articuloId) {
  return db.prestamos.filter(p => p.articulo_id === articuloId && p.estado !== 'DEVUELTO').length
}

function recalcularStock(articulo) {
  articulo.stock_disponible = Math.max(0, articulo.stock_total - stockEnUso(articulo.id))
}

function comboConDetalles(combo) {
  return {
    ...combo,
    items: combo.items.map(i => {
      const art = articuloPorId(i.articulo_id)
      return { ...i, articulo_nombre: art?.nombre, stock_disponible: art?.stock_disponible ?? 0 }
    }),
  }
}

function evaluarCobro(estudiante, articulos) {
  const carrera = (estudiante.carrera || '').trim()
  const base = {
    aplica: false,
    monto: 0,
    carrera_conocida: !!carrera,
    carrera: carrera || null,
    grupo: carrera ? grupoCarrera(carrera) : null,
    categorias_cobrables: [],
    motivo: '',
    estudiante_id: estudiante.id,
    estudiante_nombre: estudiante.nombre,
  }
  if (!carrera) return { ...base, motivo: 'El estudiante no tiene carrera registrada' }
  if (carreraExenta(carrera))
    return { ...base, motivo: `${carrera} esta exenta del cobro de arriendo` }
  const tarifas = db.tarifas.filter(t => t.activa)
  const coincidencias = {}
  for (const art of articulos) {
    const tarifa = tarifas.find(
      t => t.categoria.toLowerCase() === (art.categoria || '').toLowerCase()
    )
    if (tarifa) coincidencias[tarifa.categoria] = tarifa
  }
  const categorias = Object.keys(coincidencias).sort()
  if (!categorias.length) {
    return { ...base, motivo: 'Ningun articulo de la transaccion tiene tarifa de arriendo' }
  }
  return {
    ...base,
    aplica: true,
    monto: Math.max(...Object.values(coincidencias).map(t => t.monto)),
    categorias_cobrables: categorias,
    motivo: `${carrera} paga arriendo por ${categorias.join(', ')}`,
  }
}

/** Multa cobrable por préstamo con tope de $6.000 por persona en el lote. */
function asignarMultasLote(prestamos) {
  const usadoPorEstudiante = {}
  return prestamos.map(p => {
    const detalle = detalleMulta(p.fecha_prestamo)
    const usado = usadoPorEstudiante[p.estudiante_id] || 0
    const cobrable = Math.min(detalle.multa, Math.max(0, MULTA_MAXIMA - usado))
    usadoPorEstudiante[p.estudiante_id] = usado + cobrable
    return {
      prestamo_id: p.id,
      ...detalle,
      multa_cobrable: cobrable,
      tope_lote_aplicado: cobrable < detalle.multa,
    }
  })
}

function cerrarPrestamo(p, { multa, tipo_pago, monto_cobrado, comentario, cobro_arriendo }) {
  if (p.cobro_arriendo_id) {
    const cobro = cobroArriendoPorId(p.cobro_arriendo_id)
    if (cobro?.tipo_pago === 'PENDIENTE') {
      if (!cobro_arriendo) {
        throw [
          400,
          `Este prestamo tiene un arriendo pendiente ($${cobro.monto_calculado}) que debe resolverse al devolver.`,
        ]
      }
      cobro.tipo_pago = cobro_arriendo.tipo_pago
      cobro.monto_cobrado = cobro_arriendo.monto_cobrado ?? 0
      cobro.comentario = cobro_arriendo.comentario || null
      cobro.fecha_cobro = ahoraIso()
      cobro.registrado_por = RESPONSABLE.email
    }
  }
  p.fecha_devolucion = ahoraIso()
  p.multa_calculada = multa
  p.estado = 'DEVUELTO'
  db.pagosMulta.push({
    id: siguienteId(db.pagosMulta),
    prestamo_id: p.id,
    multa_calculada: multa,
    monto_cobrado: monto_cobrado ?? 0,
    tipo_pago: multa > 0 ? tipo_pago : 'SIN_MULTA',
    comentario: comentario || null,
    registrado_por: RESPONSABLE.email,
    fecha_cobro: ahoraIso(),
  })
  const art = articuloPorId(p.articulo_id)
  if (art) recalcularStock(art)
  db.movimientos.push({
    id: siguienteId(db.movimientos),
    tipo: 'DEVOLUCION',
    prestamo_id: p.id,
    fecha: p.fecha_devolucion,
    registrado_por: RESPONSABLE.nombre,
    multa,
    revertido_por: null,
    revertido_en: null,
  })
}

const sinTildes = s =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

/** Agrega el reporte de disponibilidad pendiente más reciente del artículo, si hay. */
function conReportePendiente(articulo) {
  const pendientes = db.reportesDisponibilidad.filter(
    r => r.articulo_id === articulo.id && r.estado === 'PENDIENTE'
  )
  return { ...articulo, reporte_pendiente: pendientes.at(-1) ?? null }
}

const esDeHoy = iso => !!iso && iso.slice(0, 10) === ahoraIso().slice(0, 10)

/** Ejecuta una mutación; los `throw [status, detail]` se convierten en error tipo Axios. */
function mutar(fn) {
  try {
    const resultado = fn()
    refrescarEstados()
    guardar()
    return responder(resultado ?? null)
  } catch (e) {
    if (Array.isArray(e)) return fallar(e[0], e[1])
    throw e
  }
}

function leer(fn) {
  refrescarEstados()
  return responder(fn())
}

export const prestamosApi = {
  // --- ESTUDIANTES ---

  listarEstudiantes: async (params = {}) =>
    leer(() => {
      const {
        q,
        carrera,
        limit = 25,
        offset = 0,
        sort_by = 'nombre',
        sort_dir = 'asc',
        solo_con_multa,
      } = params
      let items = db.estudiantes
      if (q) {
        // Sin tildes en nombres y con o sin puntos/guion en el RUT: "jose" encuentra a
        // José y "19.133.3" encuentra 19133300-4
        const t = sinTildes(q)
        const tRut = q.replace(/[.\s-]/g, '').toLowerCase()
        items = items.filter(
          e =>
            sinTildes(e.nombre).includes(t) ||
            (tRut.length >= 3 && e.rut.replace(/-/g, '').toLowerCase().includes(tRut)) ||
            (e.email || '').toLowerCase().includes(t)
        )
      }
      if (carrera) items = items.filter(e => (e.carrera || '') === carrera)
      if (solo_con_multa) items = items.filter(e => e.multa_acumulada > 0)
      const dir = sort_dir === 'desc' ? -1 : 1
      items = [...items].sort((a, b) => {
        const va = a[sort_by] ?? ''
        const vb = b[sort_by] ?? ''
        return (typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb))) * dir
      })
      return { items: items.slice(offset, offset + limit), total: items.length }
    }),

  eliminarEstudiante: async (id, { forzoso = false } = {}) =>
    mutar(() => {
      const est = estudiantePorId(Number(id))
      if (!est) throw [404, 'Estudiante no encontrado']
      const suyos = db.prestamos.filter(p => p.estudiante_id === est.id)
      if (suyos.some(p => p.estado !== 'DEVUELTO')) {
        throw [400, 'El estudiante tiene préstamos sin devolver']
      }
      if (suyos.length && !forzoso) {
        throw [
          409,
          'El estudiante tiene historial de préstamos. Confirma el borrado forzoso para eliminarlo junto a su historial.',
        ]
      }
      const ids = new Set(suyos.map(p => p.id))
      db.prestamos = db.prestamos.filter(p => !ids.has(p.id))
      db.pagosMulta = db.pagosMulta.filter(p => !ids.has(p.prestamo_id))
      db.estudiantes = db.estudiantes.filter(e => e.id !== est.id)
      return { ok: true, mensaje: 'Estudiante eliminado' }
    }),

  actualizarCarreraEstudiante: async (id, carrera) =>
    mutar(() => {
      const est = estudiantePorId(Number(id))
      if (!est) throw [404, 'Estudiante no encontrado']
      est.carrera = carrera
      return est
    }),

  actualizarEstudiante: async (id, data) =>
    mutar(() => {
      const est = estudiantePorId(Number(id))
      if (!est) throw [404, 'Estudiante no encontrado']
      if (data.rut && data.rut !== est.rut && estudiantePorRut(data.rut)) {
        throw [400, 'Ya existe un estudiante con ese RUT']
      }
      Object.assign(est, data)
      return est
    }),

  buscarEstudiante: async rut =>
    leer(() => {
      const est = estudiantePorRut(rut)
      if (!est) return { existe: false, consentimiento_aceptado: false, estudiante: null }
      return { existe: true, consentimiento_aceptado: est.consentimiento_aceptado, estudiante: est }
    }),

  /**
   * En el prototipo no se envía correo: el código siempre es 123456.
   */
  solicitarVerificacion: async data =>
    mutar(() => {
      if (!data.rut || !data.nombre || !data.email) throw [400, 'Faltan datos obligatorios']
      const verificacion_id = `demo-${Date.now()}`
      db.verificaciones[verificacion_id] = data
      const [usuario, dominio] = data.email.split('@')
      return {
        verificacion_id,
        email_enmascarado: `${usuario.slice(0, 2)}***@${dominio || ''}`,
        expira_en_segundos: 600,
      }
    }),

  confirmarVerificacion: async ({ verificacion_id, codigo }) =>
    mutar(() => {
      const data = db.verificaciones[verificacion_id]
      if (!data) throw [400, 'La verificación expiró. Vuelve a solicitar el código.']
      if (String(codigo).trim() !== '123456')
        throw [400, 'Código incorrecto (en el prototipo es 123456)']
      delete db.verificaciones[verificacion_id]
      let est = estudiantePorRut(data.rut)
      const campos = {
        rut: data.rut,
        nombre: data.nombre,
        email: data.email,
        carrera: data.carrera || null,
        es_intercambio: !!data.es_intercambio,
        consentimiento_aceptado: true,
        version_terminos: TERMINOS.version,
      }
      if (est) Object.assign(est, campos)
      else {
        est = { id: siguienteId(db.estudiantes), multa_acumulada: 0, ...campos }
        db.estudiantes.push(est)
      }
      return est
    }),

  obtenerTerminos: async () => responder(TERMINOS),

  // --- ARTÍCULOS ---

  listarArticulos: async () => leer(() => db.articulos.map(conReportePendiente)),

  // --- REPORTES DE DIFERENCIA DE DISPONIBILIDAD (mejora 4) ---

  /**
   * Deja constancia de que lo que se ve en el estante no coincide con el registro.
   * No toca las existencias: queda pendiente hasta que alguien lo revise.
   */
  reportarDiferenciaDisponibilidad: async ({ articulo_id, cantidad_observada, comentario }) =>
    mutar(() => {
      const art = articuloPorId(articulo_id)
      if (!art) throw [404, 'Articulo no encontrado']
      const observada = Number(cantidad_observada)
      if (!Number.isInteger(observada) || observada < 0) {
        throw [422, 'La cantidad observada debe ser un entero no negativo']
      }
      const reporte = {
        id: siguienteId(db.reportesDisponibilidad),
        articulo_id: art.id,
        cantidad_registrada: art.stock_disponible,
        cantidad_observada: observada,
        comentario: (comentario || '').trim() || null,
        reportado_por: RESPONSABLE.nombre,
        fecha: ahoraIso(),
        estado: 'PENDIENTE',
        revisado_por: null,
        revisado_en: null,
        nota_revision: null,
      }
      db.reportesDisponibilidad.push(reporte)
      return reporte
    }),

  /** Cierra un reporte. Si hay que corregir el stock, se hace aparte con "Ajustar stock". */
  revisarReporteDisponibilidad: async (reporteId, { nota } = {}) =>
    mutar(() => {
      const reporte = db.reportesDisponibilidad.find(r => r.id === Number(reporteId))
      if (!reporte) throw [404, 'Reporte no encontrado']
      if (reporte.estado !== 'PENDIENTE') throw [400, 'Este reporte ya fue revisado']
      Object.assign(reporte, {
        estado: 'REVISADO',
        revisado_por: RESPONSABLE.nombre,
        revisado_en: ahoraIso(),
        nota_revision: (nota || '').trim() || null,
      })
      return reporte
    }),

  crearArticulo: async data =>
    mutar(() => {
      if (!data.nombre?.trim()) throw [400, 'El nombre es obligatorio']
      const stock = Number.isInteger(Number(data.stock_total)) ? Number(data.stock_total) : 1
      if (stock < 0) throw [422, 'El stock no puede ser negativo']
      const prefijo = PREFIJOS_CODIGO[data.categoria] || 'ART'
      const correlativo = db.articulos.filter(a => a.codigo?.startsWith(`${prefijo}-`)).length + 1
      const art = {
        id: siguienteId(db.articulos),
        codigo: `${prefijo}-${String(correlativo).padStart(2, '0')}`,
        alias: data.alias || [],
        nombre: data.nombre.trim(),
        categoria: data.categoria || null,
        descripcion: data.descripcion || null,
        stock_total: stock,
        stock_disponible: stock,
        created_at: ahoraIso(),
      }
      db.articulos.push(art)
      return art
    }),

  actualizarArticulo: async (id, data) =>
    mutar(() => {
      const art = articuloPorId(id)
      if (!art) throw [404, 'Articulo no encontrado']
      if (data.stock_total != null && Number(data.stock_total) < stockEnUso(art.id)) {
        throw [400, `No puedes dejar el stock bajo las ${stockEnUso(art.id)} unidades prestadas`]
      }
      Object.assign(art, data)
      recalcularStock(art)
      return art
    }),

  eliminarArticulo: async (id, { forzoso = false } = {}) =>
    mutar(() => {
      const art = articuloPorId(id)
      if (!art) throw [404, 'Articulo no encontrado']
      const suyos = db.prestamos.filter(p => p.articulo_id === art.id)
      if (suyos.some(p => p.estado !== 'DEVUELTO'))
        throw [400, 'El artículo tiene unidades prestadas']
      if (suyos.length && !forzoso) throw [409, 'El artículo tiene historial de préstamos']
      const ids = new Set(suyos.map(p => p.id))
      db.prestamos = db.prestamos.filter(p => !ids.has(p.id))
      db.pagosMulta = db.pagosMulta.filter(p => !ids.has(p.prestamo_id))
      db.articulos = db.articulos.filter(a => a.id !== art.id)
      db.combos.forEach(c => (c.items = c.items.filter(i => i.articulo_id !== art.id)))
      return null
    }),

  /** La API real usa búsqueda semántica; aquí, búsqueda difusa más sinónimos y alias. */
  buscarArticulosSemantico: async (query, soloDisponibles = true, topK = 10) =>
    leer(() => {
      const base = (
        soloDisponibles ? db.articulos.filter(a => a.stock_disponible > 0) : db.articulos
      ).map(a => ({
        ...a,
        // Mejora 2: sinónimos y otros nombres; la versión original solo busca en los textos
        _alternativos: novedadActiva('busqueda-sinonimos') ? terminosAlternativos(a) : [],
      }))
      const fuse = new Fuse(base, {
        keys: ['nombre', 'codigo', 'categoria', 'descripcion', '_alternativos'],
        threshold: 0.3,
        ignoreLocation: true,
      })
      return fuse
        .search(query)
        .slice(0, topK)
        .map(({ item: { _alternativos, ...a } }) => conReportePendiente(a))
    }),

  // --- PRÉSTAMOS ---

  registrarPrestamo: async ({ articulo_id, estudiante_rut }) =>
    prestamosApi
      .registrarPrestamoLote({ estudiante_rut, articulos: [{ articulo_id, cantidad: 1 }] })
      .then(r => r.prestamos[0]),

  evaluarCobroArriendo: async ({ estudiante_rut, articulos }) => {
    const est = estudiantePorRut(estudiante_rut)
    if (!est) return fallar(404, 'Estudiante no encontrado')
    return leer(() =>
      evaluarCobro(est, articulos.map(a => articuloPorId(a.articulo_id)).filter(Boolean))
    )
  },

  registrarPrestamoLote: async ({ estudiante_rut, articulos, cobro = null }) =>
    mutar(() => {
      const est = estudiantePorRut(estudiante_rut)
      if (!est) throw [404, 'Estudiante no encontrado']
      if (!est.consentimiento_aceptado) throw [400, 'El estudiante no ha aceptado los términos']
      const arts = articulos.map(i => [articuloPorId(i.articulo_id), i.cantidad || 1])
      for (const [art, cantidad] of arts) {
        if (!art) throw [404, 'Articulo no encontrado']
        if (art.stock_disponible < cantidad)
          throw [400, `No hay stock suficiente de "${art.nombre}"`]
      }
      const evaluacion = evaluarCobro(
        est,
        arts.map(([a]) => a)
      )
      let cobroRow = null
      if (evaluacion.aplica) {
        if (!cobro) throw [400, 'Esta transacción requiere registrar el cobro de arriendo']
        cobroRow = {
          id: siguienteId(db.cobrosArriendo),
          estudiante_id: est.id,
          monto_calculado: evaluacion.monto,
          monto_cobrado: cobro.monto_cobrado ?? 0,
          tipo_pago: cobro.tipo_pago,
          comentario: cobro.comentario || null,
          registrado_por: RESPONSABLE.email,
          fecha_cobro: ahoraIso(),
        }
        db.cobrosArriendo.push(cobroRow)
      }
      const creados = []
      for (const [art, cantidad] of arts) {
        for (let n = 0; n < cantidad; n++) {
          const p = {
            id: siguienteId(db.prestamos),
            articulo_id: art.id,
            estudiante_id: est.id,
            responsable_email: RESPONSABLE.email,
            responsable_nombre: RESPONSABLE.nombre,
            fecha_prestamo: ahoraIso(),
            fecha_devolucion: null,
            multa_calculada: 0,
            estado: 'ACTIVO',
            comentario: null,
            cobro_arriendo_id: cobroRow?.id ?? null,
            ultima_notificacion: null,
          }
          db.prestamos.push(p)
          creados.push(p)
        }
        recalcularStock(art)
      }
      return {
        prestamos: creados.map(prestamoResponse),
        cobro_arriendo: cobroRow && {
          id: cobroRow.id,
          monto_calculado: cobroRow.monto_calculado,
          monto_cobrado: cobroRow.monto_cobrado,
          tipo_pago: cobroRow.tipo_pago,
        },
      }
    }),

  // --- COMBOS ---

  listarCombos: async () => leer(() => db.combos.map(comboConDetalles)),

  crearCombo: async data =>
    mutar(() => {
      const combo = { id: siguienteId(db.combos), nombre: data.nombre, items: data.items || [] }
      db.combos.push(combo)
      return comboConDetalles(combo)
    }),

  actualizarCombo: async (id, data) =>
    mutar(() => {
      const combo = db.combos.find(c => c.id === Number(id))
      if (!combo) throw [404, 'Combo no encontrado']
      Object.assign(combo, data)
      return comboConDetalles(combo)
    }),

  eliminarCombo: async id =>
    mutar(() => {
      db.combos = db.combos.filter(c => c.id !== Number(id))
      return null
    }),

  transferirPrestamos: async ({ prestamo_ids, nuevo_estudiante_rut }) =>
    mutar(() => {
      const est = estudiantePorRut(nuevo_estudiante_rut)
      if (!est) throw [404, 'El nuevo estudiante no está registrado']
      let actualizados = 0
      for (const id of prestamo_ids) {
        const p = prestamoPorId(id)
        if (p && p.estado !== 'DEVUELTO') {
          p.estudiante_id = est.id
          actualizados++
        }
      }
      return { mensaje: `${actualizados} préstamo(s) transferidos a ${est.nombre}`, actualizados }
    }),

  // --- TARIFAS, CARRERAS Y PERIODOS ---

  listarTarifas: async () => leer(() => db.tarifas),

  crearTarifa: async data =>
    mutar(() => {
      const tarifa = { id: siguienteId(db.tarifas), activa: true, ...data, updated_at: ahoraIso() }
      db.tarifas.push(tarifa)
      return tarifa
    }),

  actualizarTarifa: async (id, data) =>
    mutar(() => {
      const tarifa = db.tarifas.find(t => t.id === Number(id))
      if (!tarifa) throw [404, 'Tarifa no encontrada']
      Object.assign(tarifa, data, { updated_at: ahoraIso() })
      return tarifa
    }),

  eliminarTarifa: async id =>
    mutar(() => {
      db.tarifas = db.tarifas.filter(t => t.id !== Number(id))
      return null
    }),

  listarCarrerasArriendo: async () =>
    leer(() => {
      const nombres = new Set([
        ...CARRERAS.filter(
          c => !['Sin Especificar', 'Magíster', 'Doctorado Sociología'].includes(c)
        ),
        ...db.estudiantes.map(e => e.carrera).filter(Boolean),
      ])
      return [...nombres].sort().map(carrera => ({
        carrera,
        exenta: carreraExenta(carrera),
        configurada: db.carrerasConfig.some(c => c.carrera === carrera),
        estudiantes: db.estudiantes.filter(e => e.carrera === carrera).length,
      }))
    }),

  configurarCarreraArriendo: async (carrera, exenta) =>
    mutar(() => {
      const existente = db.carrerasConfig.find(c => c.carrera === carrera)
      if (existente) existente.exenta = exenta
      else db.carrerasConfig.push({ carrera, exenta })
      return {
        carrera,
        exenta,
        configurada: true,
        estudiantes: db.estudiantes.filter(e => e.carrera === carrera).length,
      }
    }),

  restablecerCarreraArriendo: async carrera =>
    mutar(() => {
      if (!db.carrerasConfig.some(c => c.carrera === carrera)) {
        throw [404, 'Esa carrera no tiene configuracion propia']
      }
      db.carrerasConfig = db.carrerasConfig.filter(c => c.carrera !== carrera)
      return null
    }),

  listarPeriodosSinMulta: async () => leer(() => db.periodosSinMulta),

  crearPeriodoSinMulta: async data =>
    mutar(() => {
      if (data.fecha_fin < data.fecha_inicio) {
        throw [400, 'La fecha de fin no puede ser anterior a la fecha de inicio']
      }
      const periodo = {
        id: siguienteId(db.periodosSinMulta),
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        descripcion: (data.descripcion || '').trim() || null,
        created_at: ahoraIso(),
      }
      db.periodosSinMulta.push(periodo)
      return periodo
    }),

  eliminarPeriodoSinMulta: async id =>
    mutar(() => {
      db.periodosSinMulta = db.periodosSinMulta.filter(p => p.id !== Number(id))
      return null
    }),

  // --- DEVOLUCIONES ---

  previewMulta: async prestamoId =>
    leer(() => {
      const p = prestamoPorId(prestamoId)
      return { prestamo_id: Number(prestamoId), multa: p ? calcularMulta(p.fecha_prestamo) : 0 }
    }),

  devolverPrestamo: async (prestamoId, cobro = { monto_cobrado: 0, tipo_pago: 'SIN_MULTA' }) =>
    mutar(() => {
      const p = prestamoPorId(prestamoId)
      if (!p) throw [404, 'Prestamo no encontrado']
      if (p.estado === 'DEVUELTO') throw [400, 'Este prestamo ya fue devuelto']
      const multa = calcularMulta(p.fecha_prestamo)
      if (multa > 0 && cobro.tipo_pago === 'CONDONADO' && !(cobro.comentario || '').trim()) {
        throw [400, 'La justificacion es obligatoria al condonar la multa']
      }
      cerrarPrestamo(p, { multa, ...cobro })
      const art = articuloPorId(p.articulo_id)
      return {
        prestamo_id: p.id,
        multa_final: multa,
        mensaje: `Devolución registrada: ${art?.nombre ?? 'artículo'}${multa ? ` (multa $${multa})` : ''}`,
      }
    }),

  previewMultasLote: async prestamoIds =>
    leer(() => {
      const prestamos = prestamoIds.map(prestamoPorId).filter(Boolean)
      const items = asignarMultasLote(prestamos).map(i => ({ ...i, multa: i.multa }))
      return {
        items,
        total: items.reduce((s, i) => s + i.multa_cobrable, 0),
        total_sin_tope: items.reduce((s, i) => s + i.multa, 0),
      }
    }),

  devolverLote: async ({
    prestamo_ids,
    tipo_pago_multa,
    comentario_multa,
    tipo_pago_arriendo,
    comentario_arriendo,
  }) =>
    mutar(() => {
      const prestamos = [...new Set(prestamo_ids)].map(prestamoPorId)
      if (prestamos.some(p => !p)) throw [404, 'Prestamo no encontrado']
      if (prestamos.some(p => p.estado === 'DEVUELTO'))
        throw [400, 'Alguno de los préstamos ya fue devuelto']
      const asignadas = Object.fromEntries(
        asignarMultasLote(prestamos).map(i => [i.prestamo_id, i.multa_cobrable])
      )
      if (Object.values(asignadas).some(Boolean) && !tipo_pago_multa) {
        throw [400, 'Elige como se resuelve la multa de este lote']
      }
      if (tipo_pago_multa === 'CONDONADO' && !(comentario_multa || '').trim()) {
        throw [400, 'La justificacion es obligatoria al condonar la multa']
      }
      const hayArriendo = prestamos.some(
        p =>
          p.cobro_arriendo_id && cobroArriendoPorId(p.cobro_arriendo_id)?.tipo_pago === 'PENDIENTE'
      )
      if (hayArriendo && !tipo_pago_arriendo)
        throw [400, 'Elige como se resuelve el arriendo pendiente']
      if (tipo_pago_arriendo === 'CONDONADO' && !(comentario_arriendo || '').trim()) {
        throw [400, 'La justificacion es obligatoria al condonar el arriendo']
      }
      const devueltos = []
      for (const p of prestamos) {
        const multa = asignadas[p.id]
        const cobro = p.cobro_arriendo_id ? cobroArriendoPorId(p.cobro_arriendo_id) : null
        cerrarPrestamo(p, {
          multa,
          tipo_pago: tipo_pago_multa || 'SIN_MULTA',
          monto_cobrado: tipo_pago_multa === 'TOTAL' ? multa : 0,
          comentario: comentario_multa,
          cobro_arriendo:
            cobro?.tipo_pago === 'PENDIENTE'
              ? {
                  tipo_pago: tipo_pago_arriendo,
                  monto_cobrado: tipo_pago_arriendo === 'TOTAL' ? cobro.monto_calculado : 0,
                  comentario: comentario_arriendo,
                }
              : null,
        })
        devueltos.push({ prestamo_id: p.id, multa_final: multa, mensaje: 'Devuelto' })
      }
      return { devueltos, errores: [] }
    }),

  revertirDevolucion: async (prestamoId, confirmarReintegro = false) =>
    mutar(() => {
      const p = prestamoPorId(prestamoId)
      if (!p) throw [404, 'Prestamo no encontrado']
      if (p.estado !== 'DEVUELTO') throw [400, 'Este prestamo no esta devuelto']
      const pago = db.pagosMulta.find(x => x.prestamo_id === p.id)
      const reintegro = pago && pago.tipo_pago !== 'SIN_MULTA' ? pago.monto_cobrado : 0
      if (reintegro > 0 && !confirmarReintegro) {
        throw [
          409,
          `Al devolver este prestamo se cobraron $${reintegro} de multa. Si lo reabres, ese dinero debe reintegrarse al estudiante para que la contabilidad cuadre.`,
        ]
      }
      const art = articuloPorId(p.articulo_id)
      if (art && stockEnUso(art.id) >= art.stock_total) {
        throw [400, `No se puede reabrir: "${art.nombre}" ya no tiene unidades libres.`]
      }
      db.pagosMulta = db.pagosMulta.filter(x => x.prestamo_id !== p.id)
      p.fecha_devolucion = null
      p.multa_calculada = 0
      p.estado = estadoPrestamo(p)
      const ahora = ahoraIso()
      const movimiento = [...db.movimientos]
        .reverse()
        .find(m => m.prestamo_id === p.id && m.tipo === 'DEVOLUCION' && !m.revertido_por)
      if (movimiento) {
        movimiento.revertido_por = RESPONSABLE.nombre
        movimiento.revertido_en = ahora
      } else {
        // Devolución de otro turno (p. ej. reabierta desde Historial): queda igual registrada
        db.movimientos.push({
          id: siguienteId(db.movimientos),
          tipo: 'REVERSION',
          prestamo_id: p.id,
          fecha: ahora,
          registrado_por: RESPONSABLE.nombre,
          multa: 0,
          revertido_por: RESPONSABLE.nombre,
          revertido_en: ahora,
        })
      }
      const nota = `Devolución revertida por ${RESPONSABLE.nombre}${reintegro ? `; se debían reintegrar $${reintegro} cobrados` : ''}`
      p.comentario = p.comentario ? `${p.comentario}\n${nota}` : nota
      if (art) recalcularStock(art)
      return { prestamo_id: p.id, estado: p.estado, monto_a_reintegrar: reintegro }
    }),

  /**
   * Devoluciones (y reversiones) registradas hoy, la más reciente primero. Es la
   * lista "Movimientos del turno": permite deshacer una devolución hecha por error.
   */
  listarMovimientosTurno: async () =>
    leer(() =>
      db.movimientos
        .filter(m => esDeHoy(m.fecha) || esDeHoy(m.revertido_en))
        .sort(
          (a, b) =>
            (b.revertido_en || b.fecha).localeCompare(a.revertido_en || a.fecha) || b.id - a.id
        )
        .map(m => {
          const p = prestamoPorId(m.prestamo_id)
          if (!p) return null
          const det = prestamoConDetalles(p)
          return {
            ...m,
            articulo_nombre: det.articulo_nombre,
            articulo_codigo: det.articulo_codigo,
            estudiante_nombre: det.estudiante_nombre,
            estudiante_rut: det.estudiante_rut,
            fecha_prestamo: det.fecha_prestamo,
            estado_actual: det.estado,
          }
        })
        .filter(Boolean)
    ),

  // --- CONTABILIDAD ---

  listarContabilidad: async ({ limit = 50, offset = 0 } = {}) =>
    leer(() => {
      const pagos = db.pagosMulta
        .filter(p => p.tipo_pago !== 'SIN_MULTA')
        .sort((a, b) => b.fecha_cobro.localeCompare(a.fecha_cobro))
      const cobros = pagos.map(pago => {
        const p = prestamoPorId(pago.prestamo_id) || {}
        const est = estudiantePorId(p.estudiante_id) || {}
        return {
          ...pago,
          articulo_nombre: articuloPorId(p.articulo_id)?.nombre,
          estudiante_nombre: est.nombre,
          estudiante_rut: est.rut,
        }
      })
      const arriendos = [...db.cobrosArriendo]
        .sort((a, b) => b.fecha_cobro.localeCompare(a.fecha_cobro))
        .map(c => {
          const est = estudiantePorId(c.estudiante_id) || {}
          return {
            id: c.id,
            monto_calculado: c.monto_calculado,
            monto_cobrado: c.monto_cobrado,
            tipo_pago: c.tipo_pago,
            comentario: c.comentario,
            registrado_por: c.registrado_por,
            fecha_cobro: c.fecha_cobro,
            estudiante_nombre: est.nombre,
            estudiante_rut: est.rut,
            carrera: est.carrera,
            articulos: db.prestamos
              .filter(p => p.cobro_arriendo_id === c.id)
              .map(p => articuloPorId(p.articulo_id)?.nombre)
              .filter(Boolean),
          }
        })
      const suma = (lista, f) => lista.reduce((s, x) => s + f(x), 0)
      const total_recaudado = suma(pagos, p => p.monto_cobrado)
      const total_condonado = suma(pagos, p =>
        p.tipo_pago === 'PENDIENTE' ? 0 : p.multa_calculada - p.monto_cobrado
      )
      const total_pendiente =
        suma(
          pagos.filter(p => p.tipo_pago === 'PENDIENTE'),
          p => p.multa_calculada
        ) +
        suma(
          db.prestamos.filter(p => p.estado !== 'DEVUELTO'),
          p => calcularMulta(p.fecha_prestamo)
        )
      const arriendos_recaudado = suma(db.cobrosArriendo, c => c.monto_cobrado)
      return {
        total_recaudado,
        total_condonado,
        total_pendiente,
        cobros: cobros.slice(offset, offset + limit),
        cobros_total: cobros.length,
        cobros_limit: limit,
        cobros_offset: offset,
        arriendos_recaudado,
        arriendos_condonado: suma(
          db.cobrosArriendo.filter(c => c.tipo_pago === 'CONDONADO' || c.tipo_pago === 'PARCIAL'),
          c => c.monto_calculado - c.monto_cobrado
        ),
        arriendos_pendiente: suma(
          db.cobrosArriendo.filter(c => c.tipo_pago === 'PENDIENTE'),
          c => c.monto_calculado
        ),
        arriendos_count: db.cobrosArriendo.length,
        cobros_arriendo: arriendos,
        total_recaudado_general: total_recaudado + arriendos_recaudado,
      }
    }),

  listarPrestamosActivos: async () =>
    leer(() =>
      db.prestamos
        .filter(p => p.estado !== 'DEVUELTO')
        .sort((a, b) => b.fecha_prestamo.localeCompare(a.fecha_prestamo))
        .map(prestamoConDetalles)
    ),

  listarPrestamosVencidos: async () =>
    leer(() =>
      db.prestamos
        .filter(p => p.estado === 'VENCIDO')
        .sort((a, b) => a.fecha_prestamo.localeCompare(b.fecha_prestamo))
        .map(prestamoConDetalles)
    ),

  listarHistorialPrestamos: async (limit = 50, offset = 0, q = '') =>
    leer(() => {
      let items = [...db.prestamos]
        .sort((a, b) => b.fecha_prestamo.localeCompare(a.fecha_prestamo))
        .map(prestamoConDetalles)
      if (q) {
        const t = q.toLowerCase()
        items = items.filter(p =>
          [p.articulo_nombre, p.estudiante_nombre, p.estudiante_rut].some(v =>
            (v || '').toLowerCase().includes(t)
          )
        )
      }
      return { items: items.slice(offset, offset + limit), total: items.length, limit, offset }
    }),

  // --- SUB-MODULO INSUMOS ---

  listarInsumos: async () => leer(() => db.insumos),

  crearInsumo: async data =>
    mutar(() => {
      if (!data.nombre?.trim()) throw [400, 'El nombre es obligatorio']
      const insumo = {
        id: siguienteId(db.insumos),
        nombre: data.nombre.trim(),
        categoria: data.categoria || null,
        stock_critico: Number(data.stock_critico) || 0,
        stock_actual: Number(data.stock_inicial) || 0,
        updated_at: ahoraIso(),
      }
      db.insumos.push(insumo)
      return insumo
    }),

  reponerInsumo: async (id, cantidad) =>
    mutar(() => {
      const insumo = db.insumos.find(i => i.id === Number(id))
      if (!insumo) throw [404, 'Insumo no encontrado']
      insumo.stock_actual += Number(cantidad)
      insumo.updated_at = ahoraIso()
      return insumo
    }),

  entregarInsumo: async ({ insumo_id, cantidad }) =>
    mutar(() => {
      const insumo = db.insumos.find(i => i.id === Number(insumo_id))
      if (!insumo) throw [404, 'Insumo no encontrado']
      if (insumo.stock_actual < cantidad) throw [400, `Solo quedan ${insumo.stock_actual} unidades`]
      insumo.stock_actual -= cantidad
      insumo.updated_at = ahoraIso()
      const entrega = {
        id: siguienteId(db.entregasInsumos),
        insumo_id: insumo.id,
        insumo_nombre: insumo.nombre,
        cantidad,
        fecha_entrega: ahoraIso(),
        responsable_email: RESPONSABLE.email,
      }
      db.entregasInsumos.unshift(entrega)
      return entrega
    }),

  listarHistorialEntregas: async () => leer(() => db.entregasInsumos),

  eliminarInsumo: async id =>
    mutar(() => {
      db.insumos = db.insumos.filter(i => i.id !== Number(id))
      return null
    }),

  actualizarComentarioPrestamo: async (prestamoId, comentario) =>
    mutar(() => {
      const p = prestamoPorId(prestamoId)
      if (!p) throw [404, 'Prestamo no encontrado']
      p.comentario = comentario
      return prestamoResponse(p)
    }),

  obtenerDeudaEstudiante: async rut =>
    leer(() => {
      const est = estudiantePorRut(rut)
      const items = est
        ? db.prestamos
            .filter(p => p.estudiante_id === est.id && p.estado !== 'DEVUELTO')
            .map(p => ({
              prestamo_id: p.id,
              articulo_nombre: articuloPorId(p.articulo_id)?.nombre,
              fecha_prestamo: p.fecha_prestamo,
              estado: p.estado,
              multa_actual: calcularMulta(p.fecha_prestamo),
            }))
        : []
      return {
        estudiante_rut: rut,
        estudiante_nombre: est?.nombre ?? null,
        items,
        total: items.reduce((s, i) => s + i.multa_actual, 0),
      }
    }),

  // --- ANALYTICS ---

  getAnalisisPorCarrera: async ({ fechaInicio, fechaFin } = {}) =>
    leer(() =>
      GRUPOS_ORDENADOS.map(grupo => {
        const ps = prestamosDeGrupo(grupo, fechaInicio, fechaFin)
        const conMulta = ps.filter(p => multaDe(p) > 0)
        const vencidos = ps.filter(p => p.estado === 'VENCIDO')
        const activas = suma(
          ps.filter(p => p.estado !== 'DEVUELTO'),
          multaDe
        )
        const historicas = suma(
          ps.filter(p => p.estado === 'DEVUELTO'),
          multaDe
        )
        const perdidos = ps.filter(
          p => p.estado === 'VENCIDO' && calcularMulta(p.fecha_prestamo) >= MULTA_MAXIMA
        )
        return {
          grupo,
          total_prestamos: ps.length,
          actualmente_vencidos: vencidos.length,
          prestamos_con_multa: conMulta.length,
          total_multas_pesos: activas + historicas,
          multas_activas_pesos: activas,
          multas_historicas_pesos: historicas,
          estudiantes_unicos: new Set(ps.map(p => p.estudiante_id)).size,
          tasa_atraso_pct: ps.length ? Math.round((conMulta.length / ps.length) * 1000) / 10 : 0,
          perdidos_count: perdidos.length,
          tasa_perdida_pct: ps.length ? Math.round((perdidos.length / ps.length) * 1000) / 10 : 0,
        }
      })
    ),

  getArticulosTopPorCarrera: async ({ fechaInicio, fechaFin } = {}) =>
    leer(() =>
      GRUPOS_ORDENADOS.map(grupo => {
        const conteo = {}
        for (const p of prestamosDeGrupo(grupo, fechaInicio, fechaFin)) {
          const nombre = articuloPorId(p.articulo_id)?.nombre
          if (nombre) conteo[nombre] = (conteo[nombre] || 0) + 1
        }
        return {
          grupo,
          top_articulos: Object.entries(conteo)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([articulo_nombre, count]) => ({ articulo_nombre, count })),
        }
      })
    ),

  getTiempoRetornoPorArticulo: async ({ fechaInicio, fechaFin } = {}) =>
    leer(() => {
      const porArticulo = {}
      for (const p of db.prestamos) {
        if (!p.fecha_devolucion || !enRango(p.fecha_prestamo, fechaInicio, fechaFin)) continue
        const nombre = articuloPorId(p.articulo_id)?.nombre
        if (!nombre) continue
        const dias = (new Date(p.fecha_devolucion) - new Date(p.fecha_prestamo)) / 86400000
        const grupo = grupoCarrera(estudiantePorId(p.estudiante_id)?.carrera)
        ;((porArticulo[nombre] ||= {})[grupo] ||= []).push(dias)
      }
      const prom = xs => Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10
      return Object.entries(porArticulo)
        .map(([articulo_nombre, grupos]) => {
          const todos = Object.values(grupos).flat()
          return {
            articulo_nombre,
            grupos: Object.entries(grupos).map(([grupo, xs]) => ({
              grupo,
              promedio_dias: prom(xs),
              n: xs.length,
            })),
            promedio_global: prom(todos),
            n_total: todos.length,
          }
        })
        .sort((a, b) => b.n_total - a.n_total)
    }),

  getMorososPorGrupo: async ({ grupo, fechaInicio, fechaFin, minMulta } = {}) =>
    leer(() =>
      db.prestamos
        .filter(p => p.estado === 'VENCIDO' && enRango(p.fecha_prestamo, fechaInicio, fechaFin))
        .map(p => {
          const est = estudiantePorId(p.estudiante_id) || {}
          return {
            prestamo_id: p.id,
            estudiante_nombre: est.nombre,
            estudiante_rut: est.rut,
            estudiante_email: est.email,
            carrera: est.carrera,
            articulo_nombre: articuloPorId(p.articulo_id)?.nombre,
            fecha_prestamo: p.fecha_prestamo,
            dias_vencido: Math.floor((new Date() - new Date(p.fecha_prestamo)) / 86400000),
            multa_calculada: calcularMulta(p.fecha_prestamo),
            _grupo: grupoCarrera(est.carrera),
          }
        })
        .filter(
          m => (!grupo || m._grupo === grupo) && (minMulta == null || m.multa_calculada >= minMulta)
        )
        .map(({ _grupo, ...m }) => m)
        .sort((a, b) => b.multa_calculada - a.multa_calculada)
    ),

  // --- MAILING (simulado: no se envía ningún correo) ---

  notificarVencidos: async (ids = null) =>
    mutar(() => {
      const vencidos = db.prestamos.filter(
        p => p.estado === 'VENCIDO' && (!ids || ids.includes(p.id))
      )
      let enviados = 0
      let sin_email = 0
      for (const p of vencidos) {
        const est = estudiantePorId(p.estudiante_id)
        if (!est?.email) {
          sin_email++
          continue
        }
        enviados++
        p.ultima_notificacion = ahoraIso()
        registrarCorreo(est.email, 'recordatorio_vencido', p.id)
      }
      return { enviados, sin_email, total: vencidos.length }
    }),

  actualizarEmailEstudiante: async (estudianteId, email) =>
    mutar(() => {
      const est = estudiantePorId(Number(estudianteId))
      if (!est) throw [404, 'Estudiante no encontrado']
      est.email = email
      return { ok: true, email }
    }),

  getResendEmails: async ({ limit = 50, page = 0 } = {}) =>
    leer(() => {
      const emails = db.correos.slice(page * limit, (page + 1) * limit)
      const by_event = {}
      for (const c of db.correos) by_event[c.last_event] = (by_event[c.last_event] || 0) + 1
      return {
        emails,
        metrics: {
          total: db.correos.length,
          delivered: (by_event.delivered || 0) + (by_event.opened || 0) + (by_event.clicked || 0),
          bounced: by_event.bounced || 0,
          delivery_delayed: by_event.delivery_delayed || 0,
          complained: by_event.complained || 0,
          queued: by_event.queued || 0,
          by_event,
        },
        page,
        has_more: (page + 1) * limit < db.correos.length,
        limit,
      }
    }),

  getNotificacionConfig: async () => leer(() => db.notificacionConfig),

  putNotificacionConfig: async config =>
    mutar(() => {
      Object.assign(db.notificacionConfig, config)
      return db.notificacionConfig
    }),

  runNotificacionesNow: async () =>
    mutar(() => {
      const { multa_minima } = db.notificacionConfig
      let enviados = 0
      let omitidos = 0
      let sin_email = 0
      for (const p of db.prestamos.filter(x => x.estado === 'VENCIDO')) {
        const est = estudiantePorId(p.estudiante_id)
        if (calcularMulta(p.fecha_prestamo) < multa_minima) omitidos++
        else if (!est?.email) sin_email++
        else {
          enviados++
          registrarCorreo(est.email, 'aviso_automatico', p.id)
        }
      }
      db.notificacionConfig.ultimo_envio = ahoraIso()
      return { enviados, omitidos, sin_email }
    }),

  getHistorial: async ({ limit = 50, offset = 0, emailType } = {}) =>
    leer(() => {
      const lista = emailType ? db.correos.filter(c => c.email_type === emailType) : db.correos
      return {
        emails: lista.slice(offset, offset + limit),
        total: lista.length,
        has_more: offset + limit < lista.length,
        offset,
        limit,
      }
    }),

  refreshHistorialStatus: async () =>
    mutar(() => {
      let actualizados = 0
      for (const c of db.correos.filter(
        x => x.last_event === 'queued' || x.last_event === 'sent'
      )) {
        c.last_event = 'delivered'
        actualizados++
      }
      return { actualizados, revisados: db.correos.length }
    }),
}

// --- Helpers de reportes y correo ---

const suma = (lista, f) => lista.reduce((s, x) => s + f(x), 0)

const multaDe = p => (p.estado === 'DEVUELTO' ? p.multa_calculada : calcularMulta(p.fecha_prestamo))

function prestamosDeGrupo(grupo, inicio, fin) {
  return db.prestamos.filter(
    p =>
      enRango(p.fecha_prestamo, inicio, fin) &&
      grupoCarrera(estudiantePorId(p.estudiante_id)?.carrera) === grupo
  )
}

function registrarCorreo(recipient, email_type, prestamo_id) {
  db.correos.unshift({
    id: siguienteId(db.correos),
    resend_id: `demo-${Date.now().toString(36)}`,
    recipient,
    subject:
      email_type === 'aviso_automatico'
        ? 'Tienes un préstamo vencido'
        : 'Recordatorio de devolución',
    email_type,
    prestamo_id,
    sent_at: ahoraIso(),
    last_event: 'delivered',
  })
}
