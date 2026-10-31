import React, { lazy, Suspense, useState } from 'react'
import {
  Zap,
  Package,
  AlertCircle,
  Gift,
  User,
  Plus,
  Pencil,
  X,
  Search,
  Filter,
  Camera,
} from 'lucide-react'
import InsumoRow from './InsumoRow'
import useSubmitGuard from '../hooks/useSubmitGuard'

const CameraScanner = lazy(() => import('./CameraScanner'))

function MinutosRestantes({ expiraEn }) {
  const [, forceTick] = useState(0)
  React.useEffect(() => {
    const interval = setInterval(() => forceTick(t => t + 1), 30000)
    return () => clearInterval(interval)
  }, [])
  const minutos = Math.max(0, Math.round((expiraEn - Date.now()) / 60000))
  return minutos > 0 ? `${minutos} min` : 'por expirar'
}

export default function EscaneoTab({ ctx, cn }) {
  const [showCamera, setShowCamera] = useState(false)
  const [busy, guard] = useSubmitGuard()
  const {
    activeScannerTab,
    smartInput,
    setSmartInput,
    smartInputRef,
    searchRutNormalizado,
    estudianteEscaneado,
    setEstudianteEscaneado,
    articuloEscaneado,
    setArticuloEscaneado,
    articulosEscaneados,
    setArticulosEscaneados,
    handleAbrirIngresoManual,
    handleScan,
    removeArticuloEscaneado,
    insumos,
    handleUpdateInsumoStock,
    showConsentModal,
    navigateToScannerMode,
    handleRealizarPrestamoAndNavigate,
    insumosSearchQuery,
    setInsumosSearchQuery,
    insumosCategoryFilter,
    setInsumosCategoryFilter,
    showSuggestions,
    filteredSuggestions,
    estudianteFines,
    handleSuggestionClick,
    pendingArticulo,
    pendingCantidad,
    setPendingCantidad,
    pendingMaxCantidad,
    handleConfirmarPendiente,
    handleCancelarPendiente,
    combos,
    setEditingCombo,
    handleAgregarCombo,
    insumosCategories,
    filteredInsumos,
    pendientesVerificacion,
    handleRetomarPendiente,
    handleDescartarPendiente,
  } = ctx

  const totalUnidades = articulosEscaneados.reduce((sum, a) => sum + a.cantidad, 0)
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-center">
        <div className="bg-white/50 p-1 rounded-xl flex gap-1 border border-gray-100">
          <button
            onClick={() => navigateToScannerMode('prestamo')}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2',
              activeScannerTab === 'prestamo'
                ? 'bg-white text-cai-dark shadow-sm'
                : 'text-gray-400 hover:text-cai-dark'
            )}
          >
            <Zap className="w-4 h-4" /> Préstamo
          </button>
          <button
            onClick={() => navigateToScannerMode('insumo')}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2',
              activeScannerTab === 'insumo'
                ? 'bg-white text-cai-dark shadow-sm'
                : 'text-gray-400 hover:text-cai-dark'
            )}
          >
            <Gift className="w-4 h-4" /> Entrega
          </button>
        </div>
      </div>
      {activeScannerTab === 'prestamo' && (
        <div className="p-6 rounded-xl relative bg-white border border-cai-border">
          <div className="mb-5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Combos rápidos
            </label>
            <div className="flex flex-wrap gap-2">
              {combos.map(combo => (
                <div
                  key={combo.id}
                  className="group flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700"
                >
                  <button
                    type="button"
                    onClick={() => handleAgregarCombo(combo)}
                    className="flex items-center gap-1.5 text-xs font-bold hover:text-emerald-800 transition-colors"
                    title={combo.items.map(i => `${i.cantidad}x ${i.articulo_nombre}`).join(' + ')}
                  >
                    <Package className="w-3.5 h-3.5" />
                    {combo.nombre}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCombo(combo)}
                    className="w-5 h-5 flex items-center justify-center rounded-full text-emerald-500 hover:text-emerald-800 hover:bg-emerald-100 transition-colors"
                    title="Editar combo"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setEditingCombo({})}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-gray-300 text-gray-400 text-xs font-bold hover:border-emerald-300 hover:text-emerald-600 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Combo
              </button>
            </div>
          </div>
          {pendientesVerificacion.length > 0 && (
            <div className="mb-5 p-3 rounded-xl border border-amber-200 bg-amber-50">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2">
                Esperando código ({pendientesVerificacion.length})
              </p>
              <div className="space-y-1.5">
                {pendientesVerificacion.map(p => (
                  <div
                    key={p.verificacionId}
                    className="flex items-center justify-between gap-2 bg-white rounded-lg px-3 py-2 border border-amber-100"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-cai-dark truncate">
                        {p.nuevoEstudiante.nombre}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {p.emailEnmascarado} · <MinutosRestantes expiraEn={p.expiraEn} />
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRetomarPendiente(p.verificacionId)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold transition-colors"
                      >
                        Retomar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDescartarPendiente(p.verificacionId)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        title="Descartar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mb-6">
            <div className="flex items-center justify-between gap-3 mb-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Escaneo Universal (TUC o nombre de artículo)
              </label>
              <button
                onClick={handleAbrirIngresoManual}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 hover:bg-emerald-100 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Nuevo ingreso
              </button>
            </div>
            <div className="relative group" id="smartInputContainer">
              <div className="relative flex gap-2">
                <input
                  ref={smartInputRef}
                  type="text"
                  value={smartInput}
                  disabled={showConsentModal}
                  onChange={e => setSmartInput(e.target.value)}
                  onFocus={e => {
                    if (showConsentModal) e.target.blur()
                  }}
                  onKeyDown={async e => {
                    if (showConsentModal || e.key !== 'Enter' || !smartInput) return
                    if (showSuggestions && filteredSuggestions.length > 0) {
                      // Hay sugerencias de artículo: abrir el selector de cantidad de la primera
                      handleSuggestionClick(filteredSuggestions[0])
                    } else {
                      // Usar RUT normalizado si está disponible, sino enviar input original
                      const searchValue = searchRutNormalizado || smartInput
                      await handleScan(searchValue)
                    }
                  }}
                  placeholder="Escanea TUC, busca un artículo o ingresa RUT manual..."
                  className={`flex-1 px-5 py-4 bg-white/50 rounded-xl outline-none focus:bg-white focus:ring-2 text-base font-semibold transition-all placeholder:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                    searchRutNormalizado
                      ? 'border-2 border-emerald-300 focus:border-emerald-400 focus:ring-emerald-500/20'
                      : 'border border-gray-100 focus:border-emerald-300 focus:ring-emerald-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  disabled={showConsentModal}
                  className="shrink-0 px-4 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  title="Escanear TUC con cámara"
                >
                  <Camera className="w-5 h-5" />
                </button>
                {searchRutNormalizado && smartInput && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                      {searchRutNormalizado}
                    </span>
                    <span className="text-emerald-600">✓</span>
                  </div>
                )}
              </div>
              {showSuggestions && (
                <div className="absolute top-[100%] left-0 right-0 mt-2 rounded-xl shadow-xl overflow-hidden z-50 bg-white border border-cai-border">
                  {filteredSuggestions.map(art => (
                    <button
                      key={art.id}
                      onClick={() => handleSuggestionClick(art)}
                      className="w-full text-left px-5 py-3 transition-colors flex items-center gap-3 outline-none border-b border-cai-border"
                      onMouseEnter={e =>
                        (e.currentTarget.style.backgroundColor = 'var(--surface-lt)')
                      }
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate text-cai-black">{art.nombre}</p>
                        <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                          {art.stock_disponible} disponible{art.stock_disponible !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {pendingArticulo && (
                <div className="absolute top-[100%] left-0 right-0 mt-2 rounded-xl shadow-xl z-50 bg-white border border-cai-border p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate text-cai-black">
                        {pendingArticulo.nombre}
                      </p>
                      <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                        {pendingMaxCantidad} disponible{pendingMaxCantidad !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelarPendiente}
                      className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPendingCantidad(c => Math.max(c - 1, 1))}
                      disabled={pendingCantidad <= 1}
                      className="w-9 h-9 shrink-0 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-cai-dark font-bold flex items-center justify-center transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={pendingMaxCantidad}
                      value={pendingCantidad}
                      autoFocus
                      onChange={e => {
                        const val = parseInt(e.target.value, 10)
                        if (Number.isNaN(val)) {
                          setPendingCantidad(1)
                          return
                        }
                        setPendingCantidad(Math.min(Math.max(val, 1), pendingMaxCantidad))
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleConfirmarPendiente()
                        } else if (e.key === 'Escape') {
                          handleCancelarPendiente()
                        }
                      }}
                      className="w-16 text-center px-2 py-2 bg-white/50 border border-gray-100 rounded-lg outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 text-base font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setPendingCantidad(c => Math.min(c + 1, pendingMaxCantidad))}
                      disabled={pendingCantidad >= pendingMaxCantidad}
                      className="w-9 h-9 shrink-0 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-cai-dark font-bold flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmarPendiente}
                      className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-colors"
                    >
                      Agregar {pendingCantidad}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p className="mt-2 text-[10px] font-semibold text-gray-400">
              Tip: escanea 1 documento de identidad y luego busca cada artículo por nombre para
              registrar múltiples préstamos en un solo flujo. Buscar el mismo artículo de nuevo suma
              una unidad más.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <div
              className={cn(
                'p-4 rounded-xl border transition-all flex items-center justify-between',
                estudianteEscaneado
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-white/50 border-gray-100 opacity-60'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    estudianteEscaneado ? 'bg-emerald-500' : 'bg-gray-100'
                  )}
                >
                  <User
                    className={cn('w-4 h-4', estudianteEscaneado ? 'text-white' : 'text-gray-400')}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Estudiante</p>
                  <p className="font-semibold text-sm text-cai-dark truncate">
                    {estudianteEscaneado?.nombre || 'Esperando TUC...'}
                  </p>
                  {estudianteEscaneado?.carrera && (
                    <p className="text-[10px] text-emerald-600 font-medium truncate">
                      {estudianteEscaneado.carrera}
                    </p>
                  )}
                </div>
              </div>
              {estudianteEscaneado && (
                <button
                  onClick={() => {
                    setEstudianteEscaneado(null)
                    setArticuloEscaneado(null)
                    setArticulosEscaneados([])
                  }}
                  className="p-1.5 rounded-lg text-emerald-600/50 hover:bg-emerald-100 hover:text-emerald-700 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div
              className={cn(
                'p-4 rounded-xl border transition-all flex items-center justify-between',
                articuloEscaneado
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white/50 border-gray-100 opacity-60'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    articuloEscaneado ? 'bg-blue-500' : 'bg-gray-100'
                  )}
                >
                  <Package
                    className={cn('w-4 h-4', articuloEscaneado ? 'text-white' : 'text-gray-400')}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Artículos</p>
                  <p className="font-semibold text-sm text-cai-dark truncate">
                    {totalUnidades > 0 ? `${totalUnidades} agregado(s)` : 'Busca un artículo...'}
                  </p>
                </div>
              </div>
              {articulosEscaneados.length > 0 && (
                <button
                  onClick={() => {
                    setArticuloEscaneado(null)
                    setArticulosEscaneados([])
                  }}
                  className="p-1.5 rounded-lg text-blue-600/50 hover:bg-blue-100 hover:text-blue-700 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {estudianteEscaneado && articulosEscaneados.length > 0 && (
            <button
              onClick={guard(handleRealizarPrestamoAndNavigate)}
              disabled={busy}
              className="w-full py-4 mb-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors sticky top-2 z-10 shadow-md disabled:opacity-50"
            >
              {`Realizar Préstamo (${totalUnidades})`}
            </button>
          )}
          {estudianteEscaneado && estudianteFines.length > 0 && (
            <div className="mb-4 p-4 rounded-xl border-2 border-red-400 bg-red-50 flex items-start gap-3">
              <div className="flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-red-900 mb-1">⚠️ ESTUDIANTE CON MULTA</h3>
                <p className="text-sm text-red-800 mb-2">
                  Este estudiante tiene {estudianteFines.length} artículo
                  {estudianteFines.length !== 1 ? 's' : ''} vencido
                  {estudianteFines.length !== 1 ? 's' : ''} sin devolver.
                </p>
                <div className="space-y-1">
                  {estudianteFines.map(fine => (
                    <p
                      key={fine.id}
                      className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded inline-block mr-2 mb-1"
                    >
                      {fine.articulo_nombre}
                    </p>
                  ))}
                </div>
                <p className="text-xs text-red-700 font-bold mt-2 uppercase">
                  Por favor, exigir la devolución antes de permitir nuevos préstamos.
                </p>
              </div>
            </div>
          )}
          {articulosEscaneados.length > 0 && (
            <div className="mb-4 p-3 rounded-xl border border-blue-100 bg-white/70 max-h-40 overflow-y-auto space-y-2">
              {articulosEscaneados.map(articulo => (
                <div
                  key={articulo.articulo_id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-cai-dark truncate">{articulo.nombre}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      {articulo.cantidad} unidad{articulo.cantidad !== 1 ? 'es' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => removeArticuloEscaneado(articulo.articulo_id)}
                    className="p-1.5 rounded-lg text-blue-600/60 hover:bg-blue-100 hover:text-blue-700 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {showCamera && (
        <Suspense fallback={null}>
          <CameraScanner
            onScan={val => {
              setShowCamera(false)
              handleScan(val)
            }}
            onClose={() => setShowCamera(false)}
          />
        </Suspense>
      )}
      {activeScannerTab === 'insumo' && (
        <div className="p-6 rounded-xl relative bg-white border border-cai-border">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-cai-dark">Insumos de Entrega</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Regalos, medicamentos y merchandising
              </p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o categoría..."
                value={insumosSearchQuery}
                onChange={e => setInsumosSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/70 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold transition-all placeholder:text-gray-400"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar items-center">
              <div className="flex items-center gap-2 px-2 text-gray-400">
                <Filter className="w-4 h-4" />
              </div>
              {insumosCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setInsumosCategoryFilter(cat)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border',
                    insumosCategoryFilter === cat
                      ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                      : 'bg-white/50 text-gray-500 border-gray-100 hover:bg-white hover:text-cai-dark'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 animate-in fade-in duration-300">
            {filteredInsumos.length > 0 ? (
              filteredInsumos.map(insumo => (
                <InsumoRow key={insumo.id} insumo={insumo} onUpdate={handleUpdateInsumoStock} />
              ))
            ) : (
              <div className="col-span-full p-8 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-white/30">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-gray-300" />
                </div>
                <p className="font-semibold text-gray-400">No se encontraron insumos</p>
                {insumos.length > 0 && (
                  <button
                    onClick={() => {
                      setInsumosSearchQuery('')
                      setInsumosCategoryFilter('Todos')
                    }}
                    className="mt-3 text-sm text-blue-500 hover:text-blue-600 font-bold"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
