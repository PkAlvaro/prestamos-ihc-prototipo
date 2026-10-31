import React from 'react'
import MensajeListaVacia from './MensajeListaVacia'
import {
  Package,
  RefreshCw,
  User,
  Clock,
  CornerDownLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Check,
} from 'lucide-react'

const ESTADO_LABEL = { ACTIVO: 'Activo', VENCIDO: 'Vencido', DEVUELTO: 'Devuelto' }

export default function HistorialTab({ ctx, cn, SortIcon }) {
  const {
    historialTotal,
    historialOffset,
    setHistorialOffset,
    HISTORIAL_LIMIT,
    loadPrestamosData,
    isLoading,
    loadError,
    historialSearchQuery,
    setHistorialSearchQuery,
    historialSort,
    editingComentarioId,
    setEditingComentarioId,
    editingComentarioValue,
    setEditingComentarioValue,
    getComentario,
    handleGuardarComentario,
    handleHistorialSort,
    handleRevertirDevolucion,
    filteredHistorial,
  } = ctx
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-cai-dark">Historial</h2>
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
          placeholder="Buscar por artículo, estudiante o responsable..."
          value={historialSearchQuery}
          onChange={e => setHistorialSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white/70 border border-gray-100 rounded-xl text-sm font-medium text-cai-dark placeholder:text-gray-300 focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>

      {filteredHistorial.length === 0 ? (
        <div className="glass-panel rounded-[24px] p-10 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-gray-400" />
          </div>
          <MensajeListaVacia
            isLoading={isLoading}
            loadError={loadError}
            onRetry={loadPrestamosData}
          >
            {historialSearchQuery
              ? 'Sin resultados para esa búsqueda'
              : 'No hay préstamos en el historial'}
          </MensajeListaVacia>
        </div>
      ) : (
        <div className="glass-panel rounded-[24px] overflow-hidden">
          {/* Header tabla — solo desktop */}
          <div className="hidden lg:grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-gray-100 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
            <button
              onClick={() => handleHistorialSort('articulo_nombre')}
              className="flex items-center gap-1 hover:text-cai-dark transition-colors cursor-pointer"
            >
              Artículo <SortIcon col="articulo_nombre" sort={historialSort} />
            </button>
            <button
              onClick={() => handleHistorialSort('estudiante_nombre')}
              className="flex items-center gap-1 hover:text-cai-dark transition-colors cursor-pointer"
            >
              Estudiante <SortIcon col="estudiante_nombre" sort={historialSort} />
            </button>
            <button
              onClick={() => handleHistorialSort('responsable_nombre')}
              className="flex items-center gap-1 hover:text-cai-dark transition-colors cursor-pointer"
            >
              Responsable <SortIcon col="responsable_nombre" sort={historialSort} />
            </button>
            <button
              onClick={() => handleHistorialSort('fecha_prestamo')}
              className="flex items-center gap-1 hover:text-cai-dark transition-colors cursor-pointer"
            >
              Prestado <SortIcon col="fecha_prestamo" sort={historialSort} />
            </button>
            <button
              onClick={() => handleHistorialSort('fecha_devolucion')}
              className="flex items-center gap-1 hover:text-cai-dark transition-colors cursor-pointer"
            >
              Devuelto <SortIcon col="fecha_devolucion" sort={historialSort} />
            </button>
            <button
              onClick={() => handleHistorialSort('multa_calculada')}
              className="flex items-center gap-1 hover:text-cai-dark transition-colors cursor-pointer"
            >
              Multa / Estado <SortIcon col="multa_calculada" sort={historialSort} />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {filteredHistorial.map(p => (
              <div
                key={p.id}
                className="lg:grid lg:grid-cols-[2fr_2fr_1.5fr_1fr_1fr_1fr] gap-4 px-5 py-4 items-center hover:bg-gray-50/50 transition-colors"
              >
                {/* Artículo */}
                <div className="flex items-center gap-3 mb-2 lg:mb-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-cai-dark truncate">
                      {p.articulo_nombre}
                    </p>
                  </div>
                </div>
                {/* Estudiante */}
                <div className="flex items-center gap-3 mb-2 lg:mb-0">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-cai-dark truncate">
                      {p.estudiante_nombre}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">
                      {p.estudiante_rut}
                    </p>
                  </div>
                </div>
                {/* Responsable */}
                <div className="hidden lg:block min-w-0">
                  <p className="text-sm text-gray-600 truncate">{p.responsable_nombre}</p>
                  <p className="text-[10px] text-gray-400 truncate">{p.responsable_email}</p>
                </div>
                {/* Fecha préstamo */}
                <div className="hidden lg:flex items-center gap-1.5 text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs">
                    {new Date(p.fecha_prestamo).toLocaleDateString('es-CL')}
                  </span>
                </div>
                {/* Fecha devolución */}
                <div className="hidden lg:flex items-center gap-1.5 text-gray-500">
                  <CornerDownLeft className="w-3.5 h-3.5" />
                  <span className="text-xs">
                    {p.fecha_devolucion
                      ? new Date(p.fecha_devolucion).toLocaleDateString('es-CL')
                      : '—'}
                  </span>
                </div>
                {/* Multa + Estado + Nota */}
                <div className="hidden lg:flex flex-col gap-1">
                  {p.multa_calculada > 0 ? (
                    <span className="inline-flex px-2 py-0.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg w-fit">
                      ${p.multa_calculada.toLocaleString('es-CL')}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">Sin multa</span>
                  )}
                  <span
                    className={cn(
                      'inline-flex px-2 py-0.5 text-[10px] font-bold rounded-lg w-fit',
                      p.estado === 'DEVUELTO'
                        ? 'bg-emerald-50 text-emerald-700'
                        : p.estado === 'VENCIDO'
                          ? 'bg-orange-50 text-orange-700'
                          : 'bg-blue-50 text-blue-700'
                    )}
                  >
                    {ESTADO_LABEL[p.estado] ?? p.estado}
                  </span>
                  {p.estado === 'DEVUELTO' && (
                    <button
                      onClick={() => handleRevertirDevolucion(p)}
                      className="text-[10px] font-bold text-gray-400 hover:text-orange-600 transition-colors duration-[120ms] cursor-pointer w-fit"
                      title="Reabrir el préstamo si se devolvió por error o la multa se reclama"
                    >
                      Reabrir
                    </button>
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
              </div>
            ))}
          </div>
          {/* Footer con paginación */}
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between gap-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase">
              {historialOffset + 1}–{Math.min(historialOffset + HISTORIAL_LIMIT, historialTotal)} de{' '}
              {historialTotal} registros
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={historialOffset === 0}
                onClick={() => setHistorialOffset(Math.max(0, historialOffset - HISTORIAL_LIMIT))}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-cai-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-bold text-gray-400">
                Pág {Math.floor(historialOffset / HISTORIAL_LIMIT) + 1} /{' '}
                {Math.ceil(historialTotal / HISTORIAL_LIMIT) || 1}
              </span>
              <button
                disabled={historialOffset + HISTORIAL_LIMIT >= historialTotal}
                onClick={() => setHistorialOffset(historialOffset + HISTORIAL_LIMIT)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-cai-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
