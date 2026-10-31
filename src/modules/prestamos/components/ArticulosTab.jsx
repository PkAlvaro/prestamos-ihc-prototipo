import React, { useState } from 'react'
import MensajeListaVacia from './MensajeListaVacia'
import OtrosNombresModal from './OtrosNombresModal'
import useEscape from '../hooks/useEscape'
import {
  Package,
  RefreshCw,
  Plus,
  Minus,
  Layers,
  Inbox,
  Search,
  Pencil,
  Check,
  AlertTriangle,
  Trash2,
  Tags,
} from 'lucide-react'

export default function ArticulosTab({ ctx, cn }) {
  const {
    loadPrestamosData,
    activeInventoryTab,
    setShowNuevoArticulo,
    setAjustarStockArticulo,
    setAjustarStockValor,
    handleIncrementarStockArticulo,
    setShowNuevoInsumo,
    setShowReponerInsumo,
    handleEliminarArticulo,
    handleRenombrarArticulo,
    navigateToInventoryView,
    insumosSearchQuery,
    setInsumosSearchQuery,
    stockSearchQuery,
    isLoading,
    loadError,
    setStockSearchQuery,
    stockSemanticLoading,
    editingArticuloId,
    setEditingArticuloId,
    editingArticuloNombre,
    setEditingArticuloNombre,
    filteredInsumos,
    filteredStock,
    deleteArticuloPending,
    articuloDeleteBlocked,
    confirmEliminarArticulo,
    cancelEliminarArticulo,
    handleGuardarAlias,
  } = ctx
  const [otrosNombresDe, setOtrosNombresDe] = useState(null) // articulo | null

  useEscape(cancelEliminarArticulo, !!deleteArticuloPending)

  return (
    <div className="space-y-5">
      {otrosNombresDe && (
        <OtrosNombresModal
          articulo={otrosNombresDe}
          onGuardar={handleGuardarAlias}
          onClose={() => setOtrosNombresDe(null)}
        />
      )}
      {/* Modal confirmación eliminar artículo */}
      {deleteArticuloPending && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-cai-dark text-sm">Eliminar artículo</p>
                <p className="text-xs text-gray-500 mt-0.5">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              ¿Eliminar{' '}
              <span className="font-semibold text-cai-dark">{deleteArticuloPending.nombre}</span>?
              {deleteArticuloPending.stock_disponible < deleteArticuloPending.stock_total && (
                <span className="block mt-1 text-xs text-amber-600">
                  Tiene préstamos activos: no se podrá eliminar hasta que se devuelvan.
                </span>
              )}
            </p>
            {articuloDeleteBlocked && (
              <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">
                Tiene historial de préstamos pasados (multas, correos). Eliminarlo de todas formas
                borra también ese historial y requiere rol ADMIN.
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={cancelEliminarArticulo}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmEliminarArticulo(articuloDeleteBlocked)}
                className="px-4 py-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors cursor-pointer"
              >
                {articuloDeleteBlocked ? 'Eliminar con historial' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-cai-dark">Stock</h2>
        <button
          onClick={loadPrestamosData}
          className="px-4 py-2 bg-white/70 border border-gray-100 rounded-xl text-xs font-semibold flex gap-2 items-center hover:bg-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualizar
        </button>
      </div>

      {/* Switcher Articulos vs Insumos */}
      <div className="inline-flex items-center p-1 bg-white/50 border border-white/40 rounded-xl">
        <button
          onClick={() => navigateToInventoryView('articulos')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all',
            activeInventoryTab === 'articulos'
              ? 'bg-white shadow-sm text-cai-dark'
              : 'text-gray-400 hover:text-gray-600'
          )}
        >
          <Layers className="w-4 h-4" /> Artículos
        </button>
        <button
          onClick={() => navigateToInventoryView('insumos')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all',
            activeInventoryTab === 'insumos'
              ? 'bg-white shadow-sm text-cai-dark'
              : 'text-gray-400 hover:text-gray-600'
          )}
        >
          <Inbox className="w-4 h-4" /> Insumos
        </button>
      </div>

      {/* Vista Articulos */}
      {activeInventoryTab === 'articulos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowNuevoArticulo(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Nuevo Artículo
            </button>
          </div>
          <div className="relative">
            {stockSemanticLoading ? (
              <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            )}
            <input
              type="text"
              placeholder="Buscar por nombre, código, categoría o como le digan (ej: bata)..."
              value={stockSearchQuery}
              onChange={e => setStockSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/70 border border-gray-100 rounded-xl text-sm font-medium text-cai-dark placeholder:text-gray-300 focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
          {filteredStock.length === 0 && (
            <div className="glass-panel rounded-[24px] p-10 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Inbox className="w-6 h-6 text-gray-400" />
              </div>
              <MensajeListaVacia
                isLoading={isLoading}
                loadError={loadError}
                onRetry={loadPrestamosData}
              >
                {stockSearchQuery
                  ? 'Sin resultados para esa búsqueda'
                  : 'No hay artículos registrados'}
              </MensajeListaVacia>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStock.map(articulo => (
              <div key={articulo.id} className="glass-panel p-5 rounded-[24px] relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {editingArticuloId === articulo.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            type="text"
                            value={editingArticuloNombre}
                            onChange={e => setEditingArticuloNombre(e.target.value)}
                            onKeyDown={async e => {
                              if (e.key === 'Enter') {
                                await handleRenombrarArticulo(
                                  articulo.id,
                                  articulo.nombre,
                                  editingArticuloNombre
                                )
                                setEditingArticuloId(null)
                              } else if (e.key === 'Escape') {
                                setEditingArticuloId(null)
                              }
                            }}
                            className="w-full bg-white border border-emerald-300 rounded-lg px-2 py-1 text-sm font-bold text-cai-dark focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          />
                          <button
                            onClick={async () => {
                              await handleRenombrarArticulo(
                                articulo.id,
                                articulo.nombre,
                                editingArticuloNombre
                              )
                              setEditingArticuloId(null)
                            }}
                            className="w-6 h-6 flex items-center justify-center bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <h3 className="font-bold text-cai-dark truncate">{articulo.nombre}</h3>
                          <button
                            onClick={() => {
                              setEditingArticuloId(articulo.id)
                              setEditingArticuloNombre(articulo.nombre)
                            }}
                            className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-emerald-600 shrink-0 cursor-pointer"
                            title="Renombrar artículo"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 font-semibold truncate">
                        {articulo.codigo && <span className="font-mono">{articulo.codigo} · </span>}
                        {articulo.categoria}
                      </p>
                      {articulo._coincidencia && (
                        <p className="mt-1 inline-flex px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-semibold">
                          «{articulo._coincidencia.buscado}» ={' '}
                          {articulo._coincidencia.tipo === 'alias'
                            ? 'otro nombre de este artículo'
                            : articulo._coincidencia.es}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEliminarArticulo(articulo)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl shrink-0 cursor-pointer transition-colors"
                    title="Eliminar artículo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => setOtrosNombresDe(articulo)}
                  className="w-full mb-3 -mt-1 flex items-center gap-1.5 flex-wrap text-left text-[11px] text-gray-500 hover:text-emerald-700 cursor-pointer transition-colors duration-[120ms]"
                  title="Editar otros nombres con que se busca este artículo"
                >
                  <Tags className="w-3.5 h-3.5 shrink-0" />
                  {articulo.alias?.length ? (
                    articulo.alias.map(a => (
                      <span key={a} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                        {a}
                      </span>
                    ))
                  ) : (
                    <span>Agregar otros nombres</span>
                  )}
                </button>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-50/80 rounded-xl p-2.5 text-center border border-gray-100">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleIncrementarStockArticulo(articulo, -1)}
                        disabled={articulo.stock_disponible <= 0}
                        title="Restar 1 al stock total"
                        className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setAjustarStockArticulo(articulo)
                          setAjustarStockValor(articulo.stock_total)
                        }}
                        title="Ajustar stock total"
                        className="text-xl font-black text-cai-dark hover:text-emerald-600 transition-colors cursor-pointer px-1"
                      >
                        {articulo.stock_total}
                      </button>
                      <button
                        onClick={() => handleIncrementarStockArticulo(articulo, 1)}
                        title="Sumar 1 al stock total"
                        className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Total</p>
                  </div>
                  <div className="bg-emerald-50/80 rounded-xl p-3 text-center border border-emerald-100">
                    <p className="text-xl font-black text-emerald-600">
                      {articulo.stock_disponible}
                    </p>
                    <p className="text-[9px] font-bold text-emerald-600/70 uppercase mt-1">
                      Libres
                    </p>
                  </div>
                  <div className="bg-blue-50/80 rounded-xl p-3 text-center border border-blue-100">
                    <p className="text-xl font-black text-blue-600">
                      {articulo.stock_total - articulo.stock_disponible}
                    </p>
                    <p className="text-[9px] font-bold text-blue-600/70 uppercase mt-1">
                      Prestados
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vista Insumos */}
      {activeInventoryTab === 'insumos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                placeholder="Buscar insumo..."
                value={insumosSearchQuery}
                onChange={e => setInsumosSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/70 border border-gray-100 rounded-xl text-sm font-medium text-cai-dark placeholder:text-gray-300 focus:outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>
            <button
              onClick={() => setShowNuevoInsumo(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" /> Nuevo Insumo
            </button>
          </div>
          {filteredInsumos.length === 0 && (
            <div className="glass-panel rounded-[24px] p-10 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Inbox className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-400 text-sm font-semibold">
                {insumosSearchQuery
                  ? 'Sin resultados para esa búsqueda'
                  : 'No hay insumos registrados'}
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInsumos.map(insumo => (
              <div key={insumo.id} className="glass-panel p-5 rounded-[24px]">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Inbox className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-cai-dark truncate">{insumo.nombre}</h3>
                      <p className="text-xs text-gray-400 font-semibold truncate">
                        {insumo.categoria}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 p-3 bg-gray-50/80 border border-gray-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="text-center px-4">
                      <p className="text-xl font-black text-cai-dark">{insumo.stock_actual}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Stock</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowReponerInsumo(insumo.id)}
                    className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Reponer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
