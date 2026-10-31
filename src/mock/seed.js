/**
 * Datos ficticios del prototipo. Todo lo que aparece aquí es inventado:
 * nombres, RUT (con dígito verificador válido), correos y movimientos.
 * Se generan con un PRNG con semilla fija para que cada "Reiniciar datos"
 * vuelva exactamente al mismo estado.
 */

function prng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

export function dvRut(num) {
  let suma = 0
  let mult = 2
  for (let n = num; n > 0; n = Math.floor(n / 10)) {
    suma += (n % 10) * mult
    mult = mult === 7 ? 2 : mult + 1
  }
  const dv = 11 - (suma % 11)
  return dv === 11 ? '0' : dv === 10 ? 'K' : String(dv)
}

/** Fecha local sin zona (igual que la API real: hora de Chile, sin "Z"). */
export function isoLocal(date) {
  const pad = n => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

const NOMBRES = [
  'Valentina',
  'Matías',
  'Catalina',
  'Benjamín',
  'Antonia',
  'Vicente',
  'Josefa',
  'Martín',
  'Isidora',
  'Tomás',
  'Florencia',
  'Agustín',
  'Fernanda',
  'Joaquín',
  'Constanza',
  'Diego',
  'Javiera',
  'Sebastián',
  'Trinidad',
  'Ignacio',
  'Amanda',
  'Cristóbal',
  'Emilia',
  'Felipe',
]
const APELLIDOS = [
  'Rojas',
  'Muñoz',
  'Fuentes',
  'Contreras',
  'Silva',
  'Morales',
  'Araya',
  'Castillo',
  'Espinoza',
  'Vergara',
  'Tapia',
  'Reyes',
  'Sepúlveda',
  'Navarro',
  'Cáceres',
  'Pizarro',
  'Herrera',
  'Bravo',
  'Valenzuela',
  'Saavedra',
]
const CARRERAS_SEED = [
  'Ingeniería Civil',
  'Ingeniería Civil',
  'Ingeniería Civil',
  'Ingeniería Civil',
  'Licenciatura en Ciencias de la Computación',
  'College Ciencias Naturales',
  'College Ciencias Sociales',
  'Ingeniería Comercial',
  'Construcción Civil',
  'Física',
  'Matemáticas',
  'Química',
  'Arquitectura',
]

const ARTICULOS_SEED = [
  ['Calculadora científica #1', 'Calculadora', 'Casio fx-570, con tapa'],
  ['Calculadora científica #2', 'Calculadora', 'Casio fx-82'],
  ['Calculadora gráfica', 'Calculadora', 'Para cursos de cálculo y estadística'],
  ['Delantal de laboratorio talla S', 'Delantal', 'Algodón, manga larga'],
  ['Delantal de laboratorio talla M', 'Delantal', 'Algodón, manga larga'],
  ['Delantal de laboratorio talla L', 'Delantal', 'Algodón, manga larga'],
  ['Cargador USB-C 65W', 'Cargadores', 'Compatible con la mayoría de notebooks'],
  ['Cargador Lightning', 'Cargadores', 'Para iPhone'],
  ['Cargador notebook HP', 'Cargadores', 'Punta azul'],
  ['Adaptador HDMI a USB-C', 'Adaptadores', null],
  ['Adaptador VGA', 'Adaptadores', null],
  ['Alargador 3 enchufes', 'Electricidad', '3 metros'],
  ['Mouse inalámbrico', 'Computación', 'Incluye pilas'],
  ['Audífonos con cable', 'Computación', 'Jack 3,5 mm'],
  ['Regla T', 'Dibujo técnico', '60 cm'],
  ['Escuadras (set)', 'Dibujo técnico', '45° y 60°'],
  ['Compás de precisión', 'Dibujo técnico', null],
  ['Paraguas', 'Varios', 'Negro, grande'],
  ['Pelota de fútbol', 'Deportes', 'N° 5'],
  ['Paleta de ping-pong (par)', 'Deportes', 'Incluye 2 pelotas'],
  ['Candado para casillero', 'Varios', 'Con 2 llaves'],
  ['Corchetera', 'Oficina', null],
  ['Tijeras', 'Oficina', null],
]

// Prefijo del código de inventario por categoría (lo que va en la etiqueta del objeto)
export const PREFIJOS_CODIGO = {
  Calculadora: 'CALC',
  Delantal: 'DEL',
  Cargadores: 'CARG',
  Adaptadores: 'ADAP',
  Electricidad: 'ELEC',
  Computación: 'COMP',
  'Dibujo técnico': 'DIB',
  Deportes: 'DEP',
  Oficina: 'OFI',
  Varios: 'VAR',
}

// "Otros nombres" propios de algunos artículos, además del diccionario general
const ALIAS_SEED = {
  'Calculadora gráfica': ['graficadora', 'la TI'],
  'Cargador notebook HP': ['cargador HP'],
  'Candado para casillero': ['candado locker'],
}

const INSUMOS_SEED = [
  ['Hojas cuadriculadas (resma)', 'Papelería', 20, 4],
  ['Lápiz pasta azul', 'Papelería', 30, 85],
  ['Lápiz grafito', 'Papelería', 30, 22],
  ['Toalla higiénica', 'Higiene', 15, 40],
  ['Tampón', 'Higiene', 15, 9],
  ['Preservativo', 'Salud', 20, 120],
  ['Parche curita', 'Salud', 10, 48],
  ['Pila AA', 'Electricidad', 8, 3],
]

const COMBOS_SEED = [
  ['Kit laboratorio', ['Delantal de laboratorio talla M', 'Calculadora científica #1']],
  ['Kit presentación', ['Adaptador HDMI a USB-C', 'Cargador USB-C 65W', 'Alargador 3 enchufes']],
  ['Kit dibujo técnico', ['Regla T', 'Escuadras (set)', 'Compás de precisión']],
]

const OPERADORES = [
  ['Usuario Demo', 'demo@ejemplo.cl'],
  ['Operador Mesón', 'meson@ejemplo.cl'],
  ['Coordinación Préstamos', 'coordinacion@ejemplo.cl'],
]

/** Resta días hábiles (lunes a viernes) a una fecha, conservando la hora. */
function haceDiasHabiles(base, dias, hora, minuto) {
  const d = new Date(base)
  let restantes = dias
  while (restantes > 0) {
    d.setDate(d.getDate() - 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) restantes--
  }
  d.setHours(hora, minuto, 0, 0)
  return d
}

export function crearSeed(ahora = new Date()) {
  const rnd = prng(20261031)
  const pick = arr => arr[Math.floor(rnd() * arr.length)]
  const entre = (a, b) => a + Math.floor(rnd() * (b - a + 1))

  const estudiantes = []
  const usados = new Set()
  for (let i = 0; i < 42; i++) {
    let nombre
    do {
      nombre = `${pick(NOMBRES)} ${pick(APELLIDOS)} ${pick(APELLIDOS)}`
    } while (usados.has(nombre))
    usados.add(nombre)
    const num = 19000000 + entre(0, 2999999)
    const [pila, ap1] = nombre.split(' ')
    const usuario = `${pila}.${ap1}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    estudiantes.push({
      id: i + 1,
      rut: `${num}-${dvRut(num)}`,
      nombre,
      email: i % 11 === 7 ? null : `${usuario}${i}@ejemplo.cl`,
      carrera: i % 13 === 5 ? null : pick(CARRERAS_SEED),
      es_intercambio: false,
      multa_acumulada: 0,
      consentimiento_aceptado: i % 17 !== 3,
      version_terminos: '2026.1',
    })
  }
  // Un estudiante de intercambio, identificado por pasaporte en vez de RUT
  estudiantes.push({
    id: estudiantes.length + 1,
    rut: 'P-DE4471902',
    nombre: 'Lena Hoffmann',
    email: 'lena.hoffmann@ejemplo.cl',
    carrera: 'Intercambio',
    es_intercambio: true,
    multa_acumulada: 0,
    consentimiento_aceptado: true,
    version_terminos: '2026.1',
  })

  const correlativos = {}
  const articulos = ARTICULOS_SEED.map(([nombre, categoria, descripcion], i) => {
    const stock_total =
      categoria === 'Calculadora' || categoria === 'Delantal' ? entre(4, 10) : entre(1, 5)
    const prefijo = PREFIJOS_CODIGO[categoria] || 'ART'
    correlativos[prefijo] = (correlativos[prefijo] || 0) + 1
    return {
      id: i + 1,
      codigo: `${prefijo}-${String(correlativos[prefijo]).padStart(2, '0')}`,
      alias: ALIAS_SEED[nombre] || [],
      nombre,
      categoria,
      descripcion,
      stock_total,
      stock_disponible: stock_total,
      created_at: isoLocal(haceDiasHabiles(ahora, 120 + i, 10, 0)),
    }
  })
  const artPorNombre = Object.fromEntries(articulos.map(a => [a.nombre, a]))

  const combos = COMBOS_SEED.map(([nombre, items], i) => ({
    id: i + 1,
    nombre,
    items: items.map(n => ({ articulo_id: artPorNombre[n].id, cantidad: 1 })),
  }))

  const insumos = INSUMOS_SEED.map(([nombre, categoria, stock_critico, stock_actual], i) => ({
    id: i + 1,
    nombre,
    categoria,
    stock_critico,
    stock_actual,
    updated_at: isoLocal(haceDiasHabiles(ahora, entre(1, 20), 12, 0)),
  }))

  const tarifas = [
    { id: 1, categoria: 'Calculadora', monto: 500, activa: true, updated_at: isoLocal(ahora) },
    { id: 2, categoria: 'Delantal', monto: 500, activa: true, updated_at: isoLocal(ahora) },
  ]

  const anio = ahora.getFullYear()
  const periodosSinMulta = [
    {
      id: 1,
      fecha_inicio: `${anio}-09-15`,
      fecha_fin: `${anio}-09-19`,
      descripcion: 'Fiestas Patrias',
      created_at: `${anio}-08-20T10:00:00`,
    },
  ]

  // --- Préstamos: activos recientes, vencidos y un historial de devoluciones ---
  const prestamos = []
  const pagosMulta = []
  const cobrosArriendo = []
  let prestamoId = 1

  const nuevoPrestamo = (est, art, fecha, extra = {}) => {
    const [responsable_nombre, responsable_email] = pick(OPERADORES)
    const p = {
      id: prestamoId++,
      articulo_id: art.id,
      estudiante_id: est.id,
      responsable_email,
      responsable_nombre,
      fecha_prestamo: isoLocal(fecha),
      fecha_devolucion: null,
      multa_calculada: 0,
      estado: 'ACTIVO',
      comentario: null,
      cobro_arriendo_id: null,
      ultima_notificacion: null,
      ...extra,
    }
    prestamos.push(p)
    return p
  }

  const conConsentimiento = estudiantes.filter(e => e.consentimiento_aceptado)
  const prestables = articulos.filter(a => a.stock_total > 0)
  const enUso = {}
  const tomarArticulo = () => {
    for (let intento = 0; intento < 50; intento++) {
      const art = pick(prestables)
      if ((enUso[art.id] || 0) < art.stock_total) {
        enUso[art.id] = (enUso[art.id] || 0) + 1
        return art
      }
    }
    return null
  }

  // Activos dentro del plazo (0–1 días hábiles)
  for (let i = 0; i < 9; i++) {
    const art = tomarArticulo()
    if (art)
      nuevoPrestamo(
        pick(conConsentimiento),
        art,
        haceDiasHabiles(ahora, entre(0, 1), entre(9, 17), entre(0, 59))
      )
  }
  // Vencidos (3–20 días hábiles), algunos estudiantes con varios
  const morosos = conConsentimiento.slice(0, 8)
  for (let i = 0; i < 12; i++) {
    const art = tomarArticulo()
    const est = morosos[i % morosos.length]
    if (art) {
      const p = nuevoPrestamo(
        est,
        art,
        haceDiasHabiles(ahora, entre(3, 20), entre(9, 17), entre(0, 59))
      )
      if (i % 3 === 0) p.ultima_notificacion = isoLocal(haceDiasHabiles(ahora, 1, 9, 0))
    }
  }
  // Un préstamo vencido con arriendo pendiente (estudiante de otra carrera)
  const otraCarrera = conConsentimiento.find(e => e.carrera === 'Ingeniería Comercial')
  const calcLibre = articulos.find(
    a => a.categoria === 'Calculadora' && (enUso[a.id] || 0) < a.stock_total
  )
  if (otraCarrera && calcLibre) {
    enUso[calcLibre.id] = (enUso[calcLibre.id] || 0) + 1
    const cobro = {
      id: 1,
      estudiante_id: otraCarrera.id,
      monto_calculado: 500,
      monto_cobrado: 0,
      tipo_pago: 'PENDIENTE',
      comentario: null,
      registrado_por: 'meson@ejemplo.cl',
      fecha_cobro: isoLocal(haceDiasHabiles(ahora, 4, 11, 30)),
    }
    cobrosArriendo.push(cobro)
    nuevoPrestamo(otraCarrera, calcLibre, haceDiasHabiles(ahora, 4, 11, 30), {
      cobro_arriendo_id: cobro.id,
    })
  }

  // Historial devuelto (últimos ~4 meses)
  const tiposPago = [
    'SIN_MULTA',
    'SIN_MULTA',
    'SIN_MULTA',
    'SIN_MULTA',
    'TOTAL',
    'TOTAL',
    'PARCIAL',
    'CONDONADO',
  ]
  for (let i = 0; i < 90; i++) {
    const est = pick(conConsentimiento)
    const art = pick(prestables)
    const inicio = haceDiasHabiles(ahora, entre(5, 85), entre(9, 17), entre(0, 59))
    const tipo = pick(tiposPago)
    const diasPrestado = tipo === 'SIN_MULTA' ? entre(0, 2) : entre(3, 14)
    const fin = new Date(inicio)
    fin.setDate(fin.getDate() + diasPrestado + (diasPrestado > 4 ? 2 : 0))
    fin.setHours(entre(9, 18), entre(0, 59))
    if (fin >= ahora) continue
    const multa = tipo === 'SIN_MULTA' ? 0 : Math.min(500 * Math.max(1, diasPrestado - 2), 6000)
    const p = nuevoPrestamo(est, art, inicio, {
      fecha_devolucion: isoLocal(fin),
      multa_calculada: multa,
      estado: 'DEVUELTO',
    })
    if (tipo === 'CONDONADO') p.comentario = 'Condonada: certificado médico presentado.'
    if (multa > 0 || tipo === 'SIN_MULTA') {
      const cobrado =
        tipo === 'TOTAL' ? multa : tipo === 'PARCIAL' ? Math.floor(multa / 2 / 100) * 100 : 0
      pagosMulta.push({
        id: pagosMulta.length + 1,
        prestamo_id: p.id,
        multa_calculada: multa,
        monto_cobrado: cobrado,
        tipo_pago: tipo,
        comentario:
          tipo === 'CONDONADO'
            ? p.comentario
            : tipo === 'PARCIAL'
              ? 'Pagó la mitad, resto condonado'
              : null,
        registrado_por: p.responsable_email,
        fecha_cobro: p.fecha_devolucion,
      })
    }
  }
  // Algunos arriendos ya cobrados
  for (let i = 0; i < 6; i++) {
    const est = estudiantes.find(
      (e, idx) =>
        idx > i * 5 &&
        e.carrera &&
        /Comercial|Física|Química|Arquitectura|Matemáticas/.test(e.carrera)
    )
    if (!est) continue
    const fecha = haceDiasHabiles(ahora, entre(8, 60), entre(9, 17), 0)
    const cobro = {
      id: cobrosArriendo.length + 1,
      estudiante_id: est.id,
      monto_calculado: 500,
      monto_cobrado: i === 2 ? 0 : 500,
      tipo_pago: i === 2 ? 'CONDONADO' : 'TOTAL',
      comentario: i === 2 ? 'Ayudante de curso del CAi' : null,
      registrado_por: 'meson@ejemplo.cl',
      fecha_cobro: isoLocal(fecha),
    }
    cobrosArriendo.push(cobro)
    const art = articulos.find(a => a.categoria === (i % 2 ? 'Delantal' : 'Calculadora'))
    const fin = new Date(fecha)
    fin.setDate(fin.getDate() + 1)
    nuevoPrestamo(est, art, fecha, {
      fecha_devolucion: isoLocal(fin),
      estado: 'DEVUELTO',
      cobro_arriendo_id: cobro.id,
    })
  }

  // Dos devoluciones de hoy, para que "Movimientos del turno" no parta vacío
  const movimientos = []
  for (const [minutos, operador] of [
    [95, OPERADORES[1]],
    [25, OPERADORES[0]],
  ]) {
    const est = pick(conConsentimiento)
    const art = pick(prestables)
    const devuelto = new Date(ahora.getTime() - minutos * 60000)
    const p = nuevoPrestamo(est, art, haceDiasHabiles(ahora, 1, entre(9, 16), entre(0, 59)), {
      fecha_devolucion: isoLocal(devuelto),
      estado: 'DEVUELTO',
    })
    pagosMulta.push({
      id: pagosMulta.length + 1,
      prestamo_id: p.id,
      multa_calculada: 0,
      monto_cobrado: 0,
      tipo_pago: 'SIN_MULTA',
      comentario: null,
      registrado_por: operador[1],
      fecha_cobro: p.fecha_devolucion,
    })
    movimientos.push({
      id: movimientos.length + 1,
      tipo: 'DEVOLUCION',
      prestamo_id: p.id,
      fecha: p.fecha_devolucion,
      registrado_por: operador[0],
      multa: 0,
      revertido_por: null,
      revertido_en: null,
    })
  }

  for (const art of articulos) art.stock_disponible = art.stock_total - (enUso[art.id] || 0)

  const entregasInsumos = []
  for (let i = 0; i < 25; i++) {
    const ins = pick(insumos)
    entregasInsumos.push({
      id: i + 1,
      insumo_id: ins.id,
      insumo_nombre: ins.nombre,
      cantidad: entre(1, 3),
      fecha_entrega: isoLocal(haceDiasHabiles(ahora, entre(0, 30), entre(9, 18), entre(0, 59))),
      responsable_email: pick(OPERADORES)[1],
    })
  }
  entregasInsumos.sort((a, b) => b.fecha_entrega.localeCompare(a.fecha_entrega))

  const carrerasConfig = [{ carrera: 'Arquitectura', exenta: true }]

  const correos = []
  const eventos = [
    'delivered',
    'delivered',
    'delivered',
    'opened',
    'opened',
    'clicked',
    'bounced',
    'delivery_delayed',
  ]
  const tipos = ['confirmacion', 'devolucion', 'recordatorio_vencido', 'aviso_automatico']
  for (let i = 0; i < 60; i++) {
    const est = pick(estudiantes.filter(e => e.email))
    const tipo = pick(tipos)
    correos.push({
      id: i + 1,
      resend_id: `demo-${(100000 + i).toString(36)}`,
      recipient: est.email,
      subject:
        tipo === 'confirmacion'
          ? 'Confirmación de préstamo'
          : tipo === 'devolucion'
            ? 'Registramos tu devolución'
            : 'Tienes un préstamo vencido',
      email_type: tipo,
      prestamo_id: entre(1, prestamoId - 1),
      sent_at: isoLocal(haceDiasHabiles(ahora, entre(0, 40), entre(8, 19), entre(0, 59))),
      last_event: pick(eventos),
    })
  }
  correos.sort((a, b) => b.sent_at.localeCompare(a.sent_at))

  return {
    estudiantes,
    articulos,
    combos,
    insumos,
    entregasInsumos,
    tarifas,
    periodosSinMulta,
    carrerasConfig,
    prestamos,
    pagosMulta,
    cobrosArriendo,
    correos,
    movimientos,
    notificacionConfig: {
      enabled: true,
      multa_minima: 1000,
      hora_envio: '09:00',
      ultimo_envio: isoLocal(haceDiasHabiles(ahora, 1, 9, 0)),
    },
    verificaciones: {},
  }
}
