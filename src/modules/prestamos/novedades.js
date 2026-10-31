import { CornerDownLeft, Eye, ListChecks, Loader, Minimize2, Search, Users } from 'lucide-react'
import { buildPrestamosPath } from '../../core/routing'
import { db } from '../../mock/db'
import { simularRed } from '../../novedades'

/**
 * Catálogo de las decisiones de diseño del informe (curso IHC) implementadas en el
 * prototipo. `numero` es el de la decisión en el informe: tarjeta, guía y marcas
 * "Nuevo N" lo usan, así que deben coincidir. Lo que el prototipo suma sin estar en
 * el informe va con `numero: null` y se muestra como "Extra".
 *
 * Cada entrada alimenta la vitrina de `src/novedades/`: su tarjeta en el inicio,
 * la guía "Prueba esto", las marcas "Nuevo" (por `id`) y el interruptor
 * Original/Mejoras. Para agregar una: sumar una entrada aquí y, en la UI, envolver
 * lo nuevo con <SoloConMejora novedad="id"> y marcarlo con <MarcaNuevo novedad="id" />.
 *
 * `preparar(ctx)` recibe el estado del panel (usePrestamosPageState) y deja la
 * pantalla lista para probar; devuelve false si aún faltan datos por cargar.
 * `acciones` son botones extra de la guía: `{ texto, ejecutar(ctx) }`.
 */

// Estudiantes de ejemplo sin préstamos vencidos, para que la pantalla no se llene de alertas
const vencidosDe = id => db.prestamos.some(p => p.estudiante_id === id && p.estado === 'VENCIDO')
const [estudianteA, estudianteB] = db.estudiantes.filter(
  e => e.consentimiento_aceptado && e.carrera === 'Ingeniería Civil' && !vencidosDe(e.id)
)

// Material de ejemplo para reportar una diferencia: el primero con unidades libres
const materialEjemplo = db.articulos.find(a => a.categoria === 'Varios' && a.stock_total > 0)
const sinTildes = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
// Búsqueda de ejemplo que coincide con personas y con materiales a la vez
const BUSQUEDA_MIXTA = ['cas', 'ca', 'pa', 'co'].find(
  q =>
    db.estudiantes.some(e => sinTildes(e.nombre).includes(q)) &&
    db.articulos.some(a => sinTildes(a.nombre).includes(q))
)

/** Vacía la lista en pantalla y la vuelve a pedir con la red simulada indicada. */
async function recargarActivos(ctx, simulacion) {
  simularRed(simulacion)
  ctx.setPrestamosActivos([])
  try {
    await ctx.loadPrestamosData()
  } finally {
    // La lista vacía se mantiene hasta pedir los datos normales; lo demás vuelve a la normalidad
    simularRed(simulacion.vacia ? { vacia: true } : null)
  }
}

export const NOVEDADES_PRESTAMOS = [
  {
    id: 'atenciones-espera',
    numero: 1,
    icono: Minimize2,
    titulo: 'Retomar los registros pendientes de verificación',
    problema:
      'Si un estudiante tiene que esperar el código de su correo o ir a buscar su credencial, el encargado debe elegir entre quedarse esperando o perder lo que ya había avanzado.',
    solucion:
      'Dejar la atención en espera con un motivo y atender a otra persona. Queda en una bandeja para retomarla tal como estaba.',
    ruta: buildPrestamosPath('escaneo', { mode: 'prestamo' }),
    pasos: [
      `Ya está escaneado ${estudianteA?.nombre ?? 'un estudiante'} con un artículo en el carrito.`,
      'Pulsa "Poner en espera" y elige el motivo.',
      `Atiende a otra persona: escribe ${estudianteB?.rut ?? 'otro RUT'} y presiona Enter.`,
      'En la bandeja "En espera", pulsa "Retomar". Vuelve el primero y el segundo pasa a la bandeja.',
      'También se puede dejar en espera un registro nuevo mientras llega su código de verificación.',
    ],
    preparar: async ctx => {
      if (!ctx.prestamosArticulos.length || !estudianteA) return false
      const articulo = ctx.prestamosArticulos.find(
        a => a.categoria === 'Varios' && a.stock_disponible > 0
      )
      ctx.setArticulosEscaneados([])
      await ctx.handleScan(estudianteA.rut)
      if (articulo) ctx.handleAgregarArticulo(articulo, 1)
    },
  },
  {
    id: 'busqueda-sinonimos',
    numero: 2,
    icono: Search,
    titulo: 'Encontrar materiales usando nombres habituales y sinónimos',
    problema:
      'El encargado tiene que saber cómo está registrado cada material. Si busca "bata" y en el inventario dice "delantal", no lo encuentra.',
    solucion:
      'La búsqueda entiende sinónimos y otros nombres de cada material, y explica por qué sugiere cada resultado.',
    ruta: buildPrestamosPath('escaneo', { mode: 'prestamo' }),
    pasos: [
      'En el buscador ya está escrito "bata". Aparecen los delantales con la explicación "bata = delantal".',
      'Prueba también "calcu", "zapatilla", "fonos" o un código como CALC-01.',
      'En Stock, cada material tiene "Otros nombres" que se pueden editar. Por ejemplo, la calculadora gráfica también es "la TI".',
    ],
    preparar: ctx => {
      ctx.setSmartInput('bata')
      ctx.smartInputRef.current?.focus()
    },
  },
  {
    id: 'diferencia-disponibilidad',
    numero: 3,
    icono: Eye,
    titulo: 'Reportar diferencias de disponibilidad',
    problema:
      'Cuando lo que hay en el estante no coincide con el registro, no queda constancia. O se ignora o se cambia el stock a mano sin revisarlo.',
    solucion:
      'Desde el material elegido por nombre, el encargado reporta cuántas unidades ve. La ficha queda como "Disponibilidad por revisar" y el stock no cambia hasta que alguien lo revise.',
    ruta: buildPrestamosPath('escaneo', { mode: 'prestamo' }),
    pasos: [
      `Ya está elegido ${materialEjemplo?.nombre ?? 'un material'} por su nombre. Pulsa "Reportar diferencia de disponibilidad".`,
      'Indica cuántas unidades libres ves en el estante y envía. Si el número coincide con el registro, te avisa.',
      'Búscalo de nuevo y verás el aviso "Disponibilidad por revisar". En Stock, "Revisar" permite cerrarlo o ajustar el stock. Nada cambia solo.',
    ],
    preparar: ctx => {
      const articulo = ctx.prestamosArticulos.find(a => a.id === materialEjemplo?.id)
      if (!articulo) return false
      ctx.setArticulosEscaneados([])
      ctx.handleSuggestionClick(articulo)
    },
  },
  {
    id: 'validacion-inventario',
    numero: 4,
    icono: ListChecks,
    titulo: 'Validar los datos al registrar materiales',
    problema:
      'Los formularios de stock solo desactivaban el botón cuando algo estaba mal, sin decir qué. Aceptaban decimales sin avisar y no había cómo sumar unidades a un material eligiéndolo por su nombre.',
    solucion:
      'Cada formulario pide un nombre reconocible y una cantidad válida, enteros desde 0 para el stock y mayores que 0 para agregar. Si algo falla, el mensaje aparece junto al campo y lo demás se mantiene. Además se suma "Agregar existencias".',
    ruta: buildPrestamosPath('articulos', { view: 'articulos' }),
    pasos: [
      'Pulsa "Nuevo Artículo" y luego "Crear artículo" sin llenar nada. Cada campo dice qué le falta.',
      'Escribe "2,5" o "-1" en el stock, o un nombre que ya existe. El aviso aparece junto al campo y lo demás queda como estaba.',
      'Pulsa "Agregar existencias", elige un material registrado escribiendo su nombre e indica cuántas unidades agregas.',
    ],
  },
  {
    id: 'estado-carga',
    numero: 5,
    icono: Loader,
    titulo: 'Diferenciar una lista vacía de una que todavía está cargando',
    problema:
      'Mientras cargaban los préstamos, la lista aparecía vacía. No quedaba claro si no había registros o si la información todavía no terminaba de llegar.',
    solucion:
      'Mientras se cargan los préstamos se ve "Cargando préstamos...". Al terminar, se muestran los registros o el mensaje "No hay préstamos activos". Si la conexión falla, se avisa y se puede reintentar.',
    ruta: buildPrestamosPath('activos'),
    pasos: [
      'Al abrir, la lista tarda unos segundos en llegar a propósito. Mientras tanto se ve "Cargando préstamos...".',
      'Usa los botones de abajo para ver una lista que de verdad no tiene préstamos y una falla de conexión.',
      'Cambia a "Original" arriba y vuelve a cargar lento: mientras carga, la lista dice "No hay préstamos activos" aunque sí los hay.',
    ],
    // Espera a que termine la carga normal de la pestaña para que no se crucen
    preparar: async ctx => {
      await new Promise(resolve => setTimeout(resolve, 800))
      await recargarActivos(ctx, { lenta: true })
    },
    acciones: [
      { texto: 'Cargar lento otra vez', ejecutar: ctx => recargarActivos(ctx, { lenta: true }) },
      {
        texto: 'Ver lista sin préstamos',
        ejecutar: ctx => recargarActivos(ctx, { lenta: true, vacia: true }),
      },
      {
        texto: 'Simular falla de conexión',
        ejecutar: ctx => recargarActivos(ctx, { lenta: true, falla: true }),
      },
      { texto: 'Volver a los datos normales', ejecutar: ctx => recargarActivos(ctx, {}) },
    ],
  },
  {
    id: 'busqueda-personas',
    numero: 6,
    icono: Users,
    titulo: 'Buscar personas y materiales desde una misma barra',
    problema:
      'La barra principal solo encontraba materiales. Para dar con una persona había que saber su RUT completo o ir a la pestaña Estudiantes.',
    solucion:
      'La barra busca personas por nombre o RUT además de materiales, y muestra los resultados en dos grupos, "Personas" y "Materiales", para elegir el registro correcto.',
    ruta: buildPrestamosPath('escaneo', { mode: 'prestamo' }),
    pasos: [
      `Ya está escrito "${BUSQUEDA_MIXTA}". Coincide con personas y con materiales, y se ven los dos grupos.`,
      'Muévete con las flechas y elige con Enter o con el mouse. Una persona queda como estudiante de la atención y un material abre la cantidad.',
      `Prueba con parte de un RUT, con o sin puntos (por ejemplo ${estudianteB ? estudianteB.rut.slice(0, 2) + '.' + estudianteB.rut.slice(2, 5) : '19.133'}), o con un apellido.`,
    ],
    preparar: ctx => {
      ctx.setSmartInput(BUSQUEDA_MIXTA)
      ctx.smartInputRef.current?.focus()
    },
  },
  {
    id: 'resumen-devolucion',
    numero: null,
    icono: CornerDownLeft,
    titulo: 'Resumen antes de devolver y movimientos del turno',
    problema:
      'Una devolución se registraba con un clic sobre un texto genérico. Si se elegía la fila equivocada, no era evidente cómo deshacerlo.',
    solucion:
      'Una ficha de confirmación con estudiante, objeto, código y fecha, y una lista del turno con "Revertir" que registra quién lo hizo.',
    ruta: buildPrestamosPath('activos'),
    pasos: [
      'Pulsa "Devolver" en un préstamo sin multa, revisa la ficha y pulsa "Confirmar devolución".',
      'La devolución aparece en "Movimientos del turno".',
      'Pulsa "Revertir". El préstamo vuelve a Activos con el mismo estudiante y queda registrado quién lo revirtió.',
    ],
  },
]
