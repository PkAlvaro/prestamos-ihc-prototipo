import React from 'react'
import MensajeListaVacia from './MensajeListaVacia'
import { formatFechaHora, haceCuanto } from '../utils/fechas'
import {
  Package,
  RefreshCw,
  User,
  Clock,
  CornerDownLeft,
  ArrowLeftRight,
  Search,
  Pencil,
  Check,
  Wallet,
} from 'lucide-react'

const formatPesos = n => `$${(n ?? 0).toLocaleString('es-CL')}`

// Columnas de cada préstamo (subbloque). La de acciones tiene ancho fijo para que todas las
// filas queden alineadas, haya o no botones distintos en cada una.
const COLUMNAS =
  'lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_13rem]'

/** Agrupa los préstamos por persona conservando el orden en que aparecen. */
function agruparPorPersona(prestamos) {
  const grupos = new Map()
  for (const p of prestamos) {
    if (!grupos.has(p.estudiante_id)) grupos.set(p.estudiante_id, [])
    grupos.get(p.estudiante_id).push(p)
  }
  return [...grupos.values()]
}

function PrestamoFila({ p, tab, cn, ctx }) {
  const {
    handleDevolver,
    handleAbrirTransferir,
    editingComentarioId,
    setEditingComentarioId,
    editingComentarioValue,
    setEditingComentarioValue,
    getComentario,
    handleGuardarComentario,
  } = ctx
  const vencidos = tab === 'vencidos'

  return (
    <div
      className={`${COLUMNAS} gap-4 px-5 py-3 items-center hover:bg-gray-50/60 transition-colors duration-[120ms]`}
    >
      {/* Artículo */}
      <div className="flex items-center gap-3 mb-2 lg:mb-0 min-w-0">
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
            vencidos ? 'bg-orange-100' : 'bg-blue-50'
          )}
        >
          <Package className={cn('w-4 h-4', vencidos ? 'text-orange-700' : 'text-blue-600')} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-cai-dark truncate">{p.articulo_nombre}</p>
          {p.estado === 'VENCIDO' && (
            <span className="inline-flex px-2 py-0.5 mt-0.5 bg-orange-50 text-orange-700 text-[10px] font-bold rounded-lg">
              Vencido
            </span>
          )}
        </div>
      </div>
      {/* Responsable */}
      <div className="hidden lg:block min-w-0">
        <p className="text-sm text-gray-600 truncate">{p.responsable_nombre}</p>
      </div>
      {/* Fecha */}
      <div
        className="flex items-center gap-1.5 text-gray-500 mb-2 lg:mb-0"
        title="Fecha y hora en que se prestó"
      >
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <div>
          <p className="text-xs">{formatFechaHora(p.fecha_prestamo)}</p>
          <p className="text-[10px] text-gray-400">{haceCuanto(p.fecha_prestamo)}</p>
        </div>
      </div>
      {/* Multa / Nota */}
      <div className="flex flex-wrap lg:flex-col gap-1 mb-2 lg:mb-0">
        {p.multa_calculada > 0 ? (
          <span className="inline-flex px-2 py-0.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg w-fit">
            {formatPesos(p.multa_calculada)}
          </span>
        ) : (
          <span className="hidden lg:inline text-xs text-gray-300">-</span>
        )}
        {p.cobro_arriendo_pendiente && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg w-fit"
            title="Arriendo diferido: se cobra al devolver"
          >
            <Wallet className="w-3 h-3" /> {formatPesos(p.cobro_arriendo_monto)} pendiente
          </span>
        )}
        <div className="flex items-center gap-1 group/nota">
          {editingComentarioId === p.id ? (
            <>
              <input
                autoFocus
                className="text-xs border border-gray-200 rounded px-1.5 py-0.5 w-28 focus:outline-none focus:border-cai-primary"
                value={editingComentarioValue}
                onChange={e => setEditingComentarioValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleGuardarComentario(p.id)
                  if (e.key === 'Escape') setEditingComentarioId(null)
                }}
                onBlur={() => handleGuardarComentario(p.id)}
                maxLength={200}
                placeholder="Agregar nota..."
              />
              <button
                onMouseDown={e => {
                  e.preventDefault()
                  handleGuardarComentario(p.id)
                }}
              >
                <Check className="w-3 h-3 text-emerald-500" />
              </button>
            </>
          ) : (
            <button
              className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-cai-primary transition-colors cursor-pointer"
              onClick={() => {
                setEditingComentarioId(p.id)
                setEditingComentarioValue(getComentario(p))
              }}
            >
              <Pencil className="w-3 h-3 shrink-0" />
              {getComentario(p) ? (
                <span className="max-w-[80px] truncate">{getComentario(p)}</span>
              ) : (
                <span className="opacity-0 group-hover/nota:opacity-100 transition-opacity">
                  Nota
                </span>
              )}
            </button>
          )}
        </div>
      </div>
      {/* Acciones */}
      <div className="flex justify-end gap-2">
        {!vencidos && (
          <button
            onClick={() => handleAbrirTransferir(p)}
            className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors duration-[120ms] cursor-pointer"
            title="Transferir a otro estudiante (canje de TUC)"
          >
            <ArrowLeftRight className="w-3 h-3" /> Transferir
          </button>
        )}
        <button
          onClick={() => handleDevolver(p)}
          className={cn(
            'px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors duration-[120ms] cursor-pointer',
            vencidos
              ? 'bg-orange-100 hover:bg-orange-200 text-orange-700'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          )}
        >
          <CornerDownLeft className="w-3 h-3" /> Devolver
        </button>
      </div>
    </div>
  )
}

/** Bloque de una persona: su cabecera con el resumen y, debajo, cada uno de sus préstamos. */
function GrupoPersona({ prestamos, tab, cn, ctx }) {
  const { handleAbrirDevolverTodo } = ctx
  const persona = prestamos[0]
  const totalMultas = prestamos.reduce((suma, p) => suma + (p.multa_calculada || 0), 0)
  const conArriendo = prestamos.some(p => p.cobro_arriendo_pendiente)

  return (
    <section className="bg-white/80 border border-gray-100 rounded-2xl overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-gray-50/70 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 min-w-0">
          <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="min-w-0 max-w-[14rem] sm:max-w-none">
            <p className="font-bold text-sm text-cai-dark truncate">{persona.estudiante_nombre}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase">
              {persona.estudiante_rut} · {prestamos.length}{' '}
              {prestamos.length === 1 ? 'préstamo' : 'préstamos'}
            </p>
          </div>
          {totalMultas > 0 && (
            <span
              className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg shrink-0"
              title="Suma de las multas de sus préstamos"
            >
              Multas {formatPesos(totalMultas)}
            </span>
          )}
          {conArriendo && (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg shrink-0">
              Arriendo pendiente
            </span>
          )}
        </div>
        {prestamos.length > 1 && (
          <button
            onClick={() => handleAbrirDevolverTodo(prestamos)}
            className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors duration-[120ms] cursor-pointer"
            title="Devolver de una vez todos los préstamos de esta persona"
          >
            <CornerDownLeft className="w-3 h-3" /> Devolver todo ({prestamos.length})
          </button>
        )}
      </header>
      <div className="divide-y divide-gray-100">
        {prestamos.map(p => (
          <PrestamoFila key={p.id} p={p} tab={tab} cn={cn} ctx={ctx} />
        ))}
      </div>
    </section>
  )
}

export default function ActivosTab({ ctx, cn, SortIcon }) {
  const {
    prestamosTab,
    prestamosActivos,
    prestamosVencidos,
    loadPrestamosData,
    isLoading,
    loadError,
    prestamosSearchQuery,
    setPrestamosSearchQuery,
    prestamosSort,
    handlePrestamosSort,
    filteredPrestamosData,
  } = ctx

  const encabezado = (col, texto) => (
    <button
      onClick={() => handlePrestamosSort(col)}
      className="flex items-center gap-1 hover:text-cai-dark transition-colors duration-[120ms] cursor-pointer"
    >
      {texto} <SortIcon col={col} sort={prestamosSort} />
    </button>
  )

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-cai-dark">
          {prestamosTab === 'activos' ? 'Activos' : 'Vencidos'}
        </h2>
        <button
          onClick={loadPrestamosData}
          className="px-4 py-2 bg-white/70 border border-gray-100 rounded-xl text-xs font-semibold flex gap-2 items-center hover:bg-white transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} /> Actualizar
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
        <input
          type="text"
          placeholder="Buscar por artículo o estudiante..."
          value={prestamosSearchQuery}
          onChange={e => setPrestamosSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white/70 border border-gray-100 rounded-xl text-sm font-medium text-cai-dark placeholder:text-gray-300 focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>

      {(() => {
        const datos = filteredPrestamosData
        if (datos.length === 0) {
          return (
            <div className="glass-panel rounded-[24px] p-10 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
              <MensajeListaVacia
                isLoading={isLoading}
                loadError={loadError}
                onRetry={loadPrestamosData}
              >
                {prestamosSearchQuery
                  ? 'Sin resultados para esa búsqueda'
                  : `No hay préstamos ${prestamosTab === 'activos' ? 'activos' : 'vencidos'}`}
              </MensajeListaVacia>
            </div>
          )
        }
        const grupos = agruparPorPersona(datos)
        return (
          <div className="space-y-4">
            {/* Encabezado de columnas - solo desktop. Mismas columnas que cada préstamo. */}
            <div
              className={`hidden ${COLUMNAS} gap-4 px-5 text-[10px] font-bold uppercase text-gray-400 tracking-wider`}
            >
              {encabezado('articulo_nombre', 'Artículo')}
              {encabezado('responsable_nombre', 'Responsable')}
              {encabezado('fecha_prestamo', 'Prestado')}
              {encabezado('multa_calculada', 'Multa / Nota')}
              <div className="flex justify-end">
                {encabezado('estudiante_nombre', 'Ordenar por persona')}
              </div>
            </div>
            {grupos.map(prestamos => (
              <GrupoPersona
                key={prestamos[0].estudiante_id}
                prestamos={prestamos}
                tab={prestamosTab}
                cn={cn}
                ctx={ctx}
              />
            ))}
            {/* Conteo */}
            <p className="px-1 text-[10px] font-bold text-gray-400 uppercase">
              {grupos.length} {grupos.length === 1 ? 'persona' : 'personas'} · {datos.length}{' '}
              {datos.length === 1 ? 'préstamo' : 'préstamos'}
              {prestamosSearchQuery
                ? ` de ${prestamosTab === 'activos' ? prestamosActivos.length : prestamosVencidos.length}`
                : ''}
            </p>
          </div>
        )
      })()}
    </div>
  )
}
