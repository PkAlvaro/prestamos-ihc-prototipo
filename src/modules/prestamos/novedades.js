import { CornerDownLeft, Minimize2, Search } from 'lucide-react'
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
]
