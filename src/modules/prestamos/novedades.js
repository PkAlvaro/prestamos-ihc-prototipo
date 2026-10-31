import { CornerDownLeft, Eye, ListChecks, Minimize2, Search, Users } from 'lucide-react'
import { buildPrestamosPath } from '../../core/routing'
import { db } from '../../mock/db'

/**
 * Catálogo de mejoras propuestas para el módulo de Préstamos (curso IHC).
 *
 * Cada entrada alimenta la vitrina de `src/novedades/`: su tarjeta en el inicio,
 * la guía "Prueba esto", las marcas "Nuevo" (por `id`) y el interruptor
 * Original/Mejoras. Para agregar una mejora: sumar una entrada aquí y, en la UI,
 * envolver lo nuevo con <SoloConMejora novedad="id"> y marcarlo con
 * <MarcaNuevo novedad="id" />.
 *
 * `preparar(ctx)` recibe el estado del panel (usePrestamosPageState) y deja la
 * pantalla lista para probar; devuelve false si aún faltan datos por cargar.
 */

// Estudiantes de ejemplo sin préstamos vencidos, para que la pantalla no se llene de alertas
const vencidosDe = id => db.prestamos.some(p => p.estudiante_id === id && p.estado === 'VENCIDO')
const [estudianteA, estudianteB] = db.estudiantes.filter(
  e => e.consentimiento_aceptado && e.carrera === 'Ingeniería Civil' && !vencidosDe(e.id)
)

// Material de ejemplo para reportar una diferencia: el primero con unidades libres
const materialEjemplo = db.articulos.find(a => a.categoria === 'Varios' && a.stock_total > 0)
const sinTildes = s =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
// Búsqueda de ejemplo que coincide con personas y con materiales a la vez
const BUSQUEDA_MIXTA = ['cas', 'ca', 'pa', 'co'].find(
  q =>
    db.estudiantes.some(e => sinTildes(e.nombre).includes(q)) &&
    db.articulos.some(a => sinTildes(a.nombre).includes(q))
)

export const NOVEDADES_PRESTAMOS = [
  {
    id: 'atenciones-espera',
    numero: 1,
    icono: Minimize2,
    titulo: 'Atenciones en espera',
    problema:
      'Si un estudiante debe esperar (el código de su correo, su credencial), el operador tiene que elegir entre quedarse esperando o perder lo avanzado.',
    solucion:
      'Minimizar la atención con un motivo y atender a otra persona; queda en una bandeja para retomarla tal cual.',
    ruta: buildPrestamosPath('escaneo', { mode: 'prestamo' }),
    pasos: [
      `Ya está escaneado ${estudianteA?.nombre ?? 'un estudiante'} con un artículo en el carrito.`,
      'Pulsa "Poner en espera" y elige el motivo.',
      `Escanea a otra persona: escribe ${estudianteB?.rut ?? 'otro RUT'} y presiona Enter.`,
      'En la bandeja "En espera", pulsa "Retomar": vuelve el primero y el segundo pasa a la bandeja.',
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
    titulo: 'Búsqueda por sinónimos',
    problema:
      'El operador debe saber cómo se llama cada objeto en el inventario: si busca "bata" y está registrado como "delantal", no lo encuentra.',
    solucion:
      'La búsqueda entiende sinónimos y otros nombres de cada artículo, y explica por qué sugiere cada resultado.',
    ruta: buildPrestamosPath('escaneo', { mode: 'prestamo' }),
    pasos: [
      'En el buscador ya está escrito "bata": aparecen los delantales, con la explicación «bata» = delantal.',
      'Prueba también "calcu", "zapatilla", "fonos" o un código como CALC-01.',
      'En Stock, cada artículo tiene "Otros nombres" editables (ej. la calculadora gráfica también es "la TI").',
    ],
    preparar: ctx => {
      ctx.setSmartInput('bata')
      ctx.smartInputRef.current?.focus()
    },
  },
  {
    id: 'resumen-devolucion',
    numero: 3,
    icono: CornerDownLeft,
    titulo: 'Resumen antes de devolver y movimientos del turno',
    problema:
      'Una devolución se registraba con un clic sobre un texto genérico; si se elegía la fila equivocada, deshacerlo no era evidente.',
    solucion:
      'Ficha de confirmación con estudiante, objeto, código y fecha, y una lista del turno con "Revertir" que registra quién lo hizo.',
    ruta: buildPrestamosPath('activos'),
    pasos: [
      'Pulsa "Devolver" en un préstamo sin multa: revisa la ficha y pulsa "Confirmar devolución".',
      'La devolución aparece en "Movimientos del turno".',
      'Pulsa "Revertir": el préstamo vuelve a Activos con el mismo estudiante y queda registrado quién lo revirtió.',
    ],
  },
  {
    id: 'diferencia-disponibilidad',
    numero: 4,
    icono: Eye,
    titulo: 'Reportar diferencia de disponibilidad',
    problema:
      'Cuando lo que hay en el estante no coincide con el registro, no queda constancia: o se ignora o se cambia el stock a mano sin revisar.',
    solucion:
      'Desde el material elegido por nombre, el encargado reporta cuántos ve. La ficha queda «Disponibilidad por revisar» y el stock no cambia hasta revisarlo.',
    ruta: buildPrestamosPath('escaneo', { mode: 'prestamo' }),
    pasos: [
      `Ya está elegido ${materialEjemplo?.nombre ?? 'un material'} por nombre: pulsa "Reportar diferencia de disponibilidad".`,
      'Indica cuántas unidades libres ves en el estante (si coincide con el registro, te lo avisa) y envía.',
      'Búscalo de nuevo: la ficha muestra «Disponibilidad por revisar». En Stock, "Revisar" permite cerrarlo o ajustar el stock; nada cambia solo.',
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
    numero: 5,
    icono: ListChecks,
    titulo: 'Formularios de inventario que explican qué falta',
    problema:
      'Los formularios de stock solo desactivaban el botón si algo estaba mal, sin decir qué; aceptaban decimales sin avisar y no había forma de sumar unidades a un material eligiéndolo por nombre.',
    solucion:
      'Cada campo exige un nombre reconocible y una cantidad válida (enteros ≥ 0 para el stock, > 0 para agregar) y muestra el error a su lado sin borrar lo demás. Nuevo "Agregar existencias".',
    ruta: buildPrestamosPath('articulos', { view: 'articulos' }),
    pasos: [
      'Pulsa "Nuevo Artículo" y luego "Crear artículo" sin llenar nada: cada campo dice qué falta.',
      'Escribe "2,5" o "-1" en el stock, o un nombre que ya existe: el aviso aparece junto al campo y lo demás se mantiene.',
      'Pulsa "Agregar existencias": elige un material registrado escribiendo su nombre e indica cuánto se agrega (mayor que 0).',
    ],
  },
  {
    id: 'busqueda-personas',
    numero: 6,
    icono: Users,
    titulo: 'Buscar personas y materiales en la misma barra',
    problema:
      'La barra principal solo encontraba materiales; para dar con una persona había que saber su RUT completo o ir a la pestaña Estudiantes.',
    solucion:
      'La barra busca personas por nombre o RUT además de materiales y muestra los resultados en dos grupos, «Personas» y «Materiales», para elegir el registro correcto.',
    ruta: buildPrestamosPath('escaneo', { mode: 'prestamo' }),
    pasos: [
      `Ya está escrito "${BUSQUEDA_MIXTA}": coincide con personas y con materiales, y se ven los dos grupos.`,
      'Muévete con ↑/↓ y elige con Enter o con el mouse: una persona queda como estudiante de la atención; un material abre la cantidad.',
      `Prueba con parte de un RUT, con o sin puntos (ej: ${estudianteB ? estudianteB.rut.slice(0, 2) + '.' + estudianteB.rut.slice(2, 5) : '19.133'}) o con un apellido.`,
    ],
    preparar: ctx => {
      ctx.setSmartInput(BUSQUEDA_MIXTA)
      ctx.smartInputRef.current?.focus()
    },
  },
]
