import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { QRCode } from 'react-qr-code'
import { CARRERAS } from '../constants'
import useSubmitGuard from '../hooks/useSubmitGuard'

// En el sistema real el QR apunta a un subdominio propio, corto y fácil de
// escribir a mano. En el prototipo apunta al autorregistro de este mismo sitio,
// así el QR se puede probar con un celular.
const AUTORREGISTRO_URL = `${window.location.origin}${window.location.pathname}#/prestamos/autorregistro`
const AUTORREGISTRO_TEXTO = `${window.location.host}${window.location.pathname}`.replace(/\/$/, '')
import CobroArriendoModal from './CobroArriendoModal'
import ComboModal from './ComboModal'
import DevolucionModal from './DevolucionModal'
import TransferirPrestamoModal from './TransferirPrestamoModal'
import DevolverLoteModal from './DevolverLoteModal'
import ConfirmDialog from './ConfirmDialog'

const normalizeStr = s => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const INPUT_CLS =
  'w-full bg-cai-surface border border-cai-border rounded-xl py-3 px-4 text-sm font-semibold text-cai-black outline-none transition-shadow duration-[120ms]'

const CloseBtn = ({ onClick }) => (
  <button
    onClick={onClick}
    className="w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer bg-white border border-cai-border text-[#888884] hover:bg-cai-surface"
  >
    <X className="w-4 h-4" />
  </button>
)

export default function PrestamosModals({ ctx }) {
  const { devolucionModal, setDevolucionModal, handleConfirmarDevolucion } = ctx
  const [carreraOtro, setCarreraOtro] = useState(false)
  const [busy, guard] = useSubmitGuard()

  // El botón de crear solo se habilita con datos válidos (en vez de avisar tras el clic).
  const { nuevoArticulo: art, nuevoInsumo: ins } = ctx
  const articuloValido =
    !!art?.nombre?.trim() && Number.isInteger(art.stock_total) && art.stock_total >= 1
  const insumoValido =
    !!ins?.nombre?.trim() &&
    !!ins?.categoria?.trim() &&
    Number.isInteger(ins.stock_inicial) &&
    ins.stock_inicial >= 0

  const articuloSimilar = useMemo(() => {
    const q = normalizeStr(ctx.nuevoArticulo?.nombre)
    if (q.length < 3) return null
    const articulos = ctx.prestamosArticulos ?? []
    return (
      articulos.find(a => {
        const norm = normalizeStr(a.nombre)
        return norm !== q && (norm.includes(q) || q.includes(norm))
      }) ?? null
    )
  }, [ctx.nuevoArticulo?.nombre, ctx.prestamosArticulos])

  useEffect(() => {
    if (!ctx.showConsentModal) setCarreraOtro(false)
  }, [ctx.showConsentModal])

  const handleCarreraChange = e => {
    const val = e.target.value
    if (val === '__otro__') {
      setCarreraOtro(true)
      ctx.setNuevoEstudiante({ ...ctx.nuevoEstudiante, carrera: '' })
    } else {
      setCarreraOtro(false)
      ctx.setNuevoEstudiante({ ...ctx.nuevoEstudiante, carrera: val })
    }
  }

  const {
    showNuevoArticulo,
    setShowNuevoArticulo,
    nuevoArticulo,
    setNuevoArticulo,
    ajustarStockArticulo,
    setAjustarStockArticulo,
    ajustarStockValor,
    setAjustarStockValor,
    handleCrearArticulo,
    handleAjustarStockArticulo,
    showNuevoInsumo,
    setShowNuevoInsumo,
    nuevoInsumo,
    setNuevoInsumo,
    handleCrearInsumo,
    showReponerInsumo,
    setShowReponerInsumo,
    reponerCantidad,
    setReponerCantidad,
    handleReponerInsumo,
    showConsentModal,
    setShowConsentModal,
    terminosTexto,
    nuevoEstudiante,
    setNuevoEstudiante,
    handleSolicitarVerificacion,
    handleConfirmarVerificacion,
    handleVolverAEditarDatos,
    handleAtenderOtroMientras,
    verificacion,
    codigoVerificacion,
    setCodigoVerificacion,
    rutReadOnly,
    rutNormalizado,
    rutError,
    rutInputRef,
    nombreInputRef,
  } = ctx

  return (
    <>
      {devolucionModal && (
        <DevolucionModal
          prestamo={devolucionModal.prestamo}
          multa={devolucionModal.multa}
          onConfirm={handleConfirmarDevolucion}
          onClose={() => setDevolucionModal(null)}
        />
      )}
      {ctx.cobroArriendoModal && (
        <CobroArriendoModal
          evaluacion={ctx.cobroArriendoModal.evaluacion}
          articulos={ctx.cobroArriendoModal.articulos}
          onGuardarCarrera={ctx.handleGuardarCarreraCobro}
          onConfirm={ctx.handleConfirmarCobroArriendo}
          onClose={() => ctx.setCobroArriendoModal(null)}
        />
      )}
      {ctx.confirmacion && (
        <ConfirmDialog confirmacion={ctx.confirmacion} onResolve={ctx.resolverConfirmacion} />
      )}
      {ctx.devolverLoteModal && (
        <DevolverLoteModal
          modal={ctx.devolverLoteModal}
          onConfirm={ctx.handleConfirmarDevolverLote}
          onClose={() => ctx.setDevolverLoteModal(null)}
        />
      )}
      {ctx.transferirModal && (
        <TransferirPrestamoModal
          modal={ctx.transferirModal}
          onConfirm={ctx.handleConfirmarTransferir}
          onClose={() => ctx.setTransferirModal(null)}
        />
      )}
      {ctx.editingCombo && (
        <ComboModal
          combo={ctx.editingCombo}
          articulos={ctx.prestamosArticulos}
          onSave={ctx.handleGuardarCombo}
          onDelete={ctx.handleEliminarCombo}
          onClose={() => ctx.setEditingCombo(null)}
        />
      )}
      {/* Modal Nuevo Artículo */}
      {showNuevoArticulo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl bg-white border border-cai-border">
            <div className="p-6 flex justify-between items-center bg-cai-surface border-b border-cai-border">
              <h3 className="font-bold text-lg text-cai-black">Nuevo Artículo</h3>
              <CloseBtn onClick={() => setShowNuevoArticulo(false)} />
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                  Nombre
                </label>
                <input
                  type="text"
                  value={nuevoArticulo.nombre}
                  onChange={e => setNuevoArticulo({ ...nuevoArticulo, nombre: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="Ej: Calculadora Casio"
                  onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(22,163,74,0.3)')}
                  onBlur={e => (e.target.style.boxShadow = 'none')}
                />
                {articuloSimilar && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg p-2.5 bg-[#F59E0B1A] border border-[#F59E0B59]">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" />
                    <p className="text-xs font-semibold text-[#D97706]">
                      Ya existe un artículo similar:{' '}
                      <span className="font-bold">&ldquo;{articuloSimilar.nombre}&rdquo;</span>. ¿Te
                      refieres a ese? Si es el mismo, usa &ldquo;Ajustar Stock&rdquo; en vez de
                      crear uno nuevo.
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                  Categoría
                </label>
                <input
                  type="text"
                  value={nuevoArticulo.categoria}
                  onChange={e => setNuevoArticulo({ ...nuevoArticulo, categoria: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="Ej: Calculadora"
                  onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(22,163,74,0.3)')}
                  onBlur={e => (e.target.style.boxShadow = 'none')}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                  Descripción
                </label>
                <input
                  type="text"
                  value={nuevoArticulo.descripcion}
                  onChange={e =>
                    setNuevoArticulo({ ...nuevoArticulo, descripcion: e.target.value })
                  }
                  className={INPUT_CLS}
                  placeholder="Opcional"
                  onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(22,163,74,0.3)')}
                  onBlur={e => (e.target.style.boxShadow = 'none')}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                  Stock Inicial
                </label>
                <input
                  type="number"
                  min="1"
                  value={nuevoArticulo.stock_total}
                  onChange={e =>
                    setNuevoArticulo({
                      ...nuevoArticulo,
                      stock_total: e.target.value === '' ? '' : parseInt(e.target.value, 10),
                    })
                  }
                  className={INPUT_CLS}
                  onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(22,163,74,0.3)')}
                  onBlur={e => (e.target.style.boxShadow = 'none')}
                />
              </div>
              <button
                onClick={guard(handleCrearArticulo)}
                disabled={busy || !articuloValido}
                className="w-full py-3.5 mt-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear Artículo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajustar Stock de Artículo: control total (subir, bajar o fijar un valor) */}
      {ajustarStockArticulo &&
        (() => {
          const prestados = ajustarStockArticulo.stock_total - ajustarStockArticulo.stock_disponible
          const valorInvalido =
            !Number.isFinite(ajustarStockValor) ||
            ajustarStockValor < 0 ||
            ajustarStockValor < prestados
          return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl bg-white border border-cai-border">
                <div className="p-6 flex justify-between items-center bg-cai-surface border-b border-cai-border">
                  <h3 className="font-bold text-lg text-cai-black">Ajustar Stock</h3>
                  <CloseBtn onClick={() => setAjustarStockArticulo(null)} />
                </div>
                <div className="p-6 space-y-4">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-cai-dark">
                      {ajustarStockArticulo.nombre}
                    </p>
                    {prestados > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {prestados} prestado{prestados !== 1 ? 's' : ''} ahora mismo
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase text-center mb-2">
                      Stock total
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAjustarStockValor(v => Math.max((v || 0) - 1, 0))}
                        className="w-12 h-12 shrink-0 flex items-center justify-center bg-cai-surface border border-cai-border rounded-xl text-2xl font-black text-cai-dark hover:bg-gray-100 transition-colors cursor-pointer active:scale-95"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={ajustarStockValor}
                        onChange={e => setAjustarStockValor(parseInt(e.target.value))}
                        className="w-full bg-cai-surface border border-cai-border rounded-xl p-4 text-[30px] font-black text-cai-black outline-none transition-shadow duration-[120ms] text-center"
                        min="0"
                        onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(22,163,74,0.3)')}
                        onBlur={e => (e.target.style.boxShadow = 'none')}
                      />
                      <button
                        type="button"
                        onClick={() => setAjustarStockValor(v => (v || 0) + 1)}
                        className="w-12 h-12 shrink-0 flex items-center justify-center bg-cai-surface border border-cai-border rounded-xl text-2xl font-black text-cai-dark hover:bg-gray-100 transition-colors cursor-pointer active:scale-95"
                      >
                        +
                      </button>
                    </div>
                    {ajustarStockValor < prestados && (
                      <p className="mt-2 text-xs font-semibold text-red-500 text-center">
                        No puede ser menor a {prestados}: hay {prestados} unidad
                        {prestados !== 1 ? 'es' : ''} prestada{prestados !== 1 ? 's' : ''} ahora.
                      </p>
                    )}
                  </div>
                  <button
                    disabled={valorInvalido}
                    onClick={() =>
                      handleAjustarStockArticulo(ajustarStockArticulo, ajustarStockValor)
                    }
                    className="w-full py-3.5 mt-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors cursor-pointer active:scale-[0.98]"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

      {/* Modal Nuevo Insumo */}
      {showNuevoInsumo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl bg-white border border-cai-border">
            <div className="p-6 flex justify-between items-center bg-cai-surface border-b border-cai-border">
              <h3 className="font-bold text-lg text-cai-black">Nuevo Insumo</h3>
              <CloseBtn onClick={() => setShowNuevoInsumo(false)} />
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                  Nombre
                </label>
                <input
                  type="text"
                  value={nuevoInsumo.nombre}
                  onChange={e => setNuevoInsumo({ ...nuevoInsumo, nombre: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="Ej: Destacador"
                  onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(22,163,74,0.3)')}
                  onBlur={e => (e.target.style.boxShadow = 'none')}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                  Categoría
                </label>
                <input
                  type="text"
                  value={nuevoInsumo.categoria}
                  onChange={e => setNuevoInsumo({ ...nuevoInsumo, categoria: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="Ej: Librería"
                  onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(22,163,74,0.3)')}
                  onBlur={e => (e.target.style.boxShadow = 'none')}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                  Stock Inicial
                </label>
                <input
                  type="number"
                  min="0"
                  value={nuevoInsumo.stock_inicial}
                  onChange={e =>
                    setNuevoInsumo({
                      ...nuevoInsumo,
                      stock_inicial: e.target.value === '' ? '' : parseInt(e.target.value, 10),
                    })
                  }
                  className={INPUT_CLS}
                  onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(22,163,74,0.3)')}
                  onBlur={e => (e.target.style.boxShadow = 'none')}
                />
              </div>
              <button
                onClick={guard(handleCrearInsumo)}
                disabled={busy || !insumoValido}
                className="w-full py-3.5 mt-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear Insumo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reponer Insumo */}
      {showReponerInsumo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl bg-white border border-cai-border">
            <div className="p-6 flex justify-between items-center bg-cai-surface border-b border-cai-border">
              <h3 className="font-bold text-lg text-cai-black">Reponer Stock</h3>
              <CloseBtn onClick={() => setShowReponerInsumo(null)} />
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase text-center mb-2">
                  Cantidad a añadir
                </label>
                <input
                  type="number"
                  value={reponerCantidad}
                  onChange={e => setReponerCantidad(parseInt(e.target.value))}
                  className="w-full bg-cai-surface border border-cai-border rounded-xl p-4 text-[30px] font-black text-cai-black outline-none transition-shadow duration-[120ms] text-center"
                  min="1"
                  onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(22,163,74,0.3)')}
                  onBlur={e => (e.target.style.boxShadow = 'none')}
                />
              </div>
              <button
                onClick={() => handleReponerInsumo(showReponerInsumo, reponerCantidad)}
                className="w-full py-3.5 mt-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Consentimiento */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col bg-white border border-cai-border"
            style={{ maxHeight: '90vh' }}
          >
            <div className="p-6 flex justify-between items-center shrink-0 bg-cai-surface border-b border-cai-border">
              <h3 className="font-bold text-lg text-cai-black">
                {verificacion ? 'Verificar correo' : 'Registro de Estudiante'}
              </h3>
              <CloseBtn
                onClick={() => {
                  handleVolverAEditarDatos()
                  setShowConsentModal(false)
                }}
              />
            </div>

            {verificacion ? (
              <>
                <div className="p-6 overflow-y-auto space-y-4">
                  <div className="p-4 rounded-xl bg-[#16A34A14] border border-[#16A34A33]">
                    <p className="text-sm font-semibold text-cai-black">
                      Enviamos un código de 6 dígitos a{' '}
                      <span className="font-bold">{verificacion.emailEnmascarado}</span>.
                    </p>
                    <p className="text-xs mt-2 font-medium text-[#888884]">
                      Pídele al estudiante que revise su correo ahora mismo y te dicte el código
                      para confirmar que le pertenece. Expira en{' '}
                      {Math.max(0, Math.round((verificacion.expiraEn - Date.now()) / 60000))}{' '}
                      minutos.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                      Código de verificación <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      autoFocus
                      value={codigoVerificacion}
                      onChange={e =>
                        setCodigoVerificacion(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      className={`${INPUT_CLS} text-center text-2xl font-black tracking-[0.5em]`}
                      placeholder="000000"
                      onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(22,163,74,0.3)')}
                      onBlur={e => (e.target.style.boxShadow = 'none')}
                    />
                  </div>

                  <div className="flex justify-between text-xs font-semibold">
                    <button
                      onClick={handleVolverAEditarDatos}
                      className="text-[#888884] hover:text-cai-black transition-colors cursor-pointer"
                    >
                      ← Volver a editar datos
                    </button>
                    <button
                      onClick={guard(handleSolicitarVerificacion)}
                      disabled={busy}
                      className="text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                    >
                      Reenviar código
                    </button>
                  </div>

                  <button
                    onClick={handleAtenderOtroMientras}
                    className="w-full py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Dejar en espera y atender a otra persona
                  </button>
                </div>

                <div className="p-6 shrink-0 bg-cai-surface border-t border-cai-border">
                  <button
                    onClick={guard(handleConfirmarVerificacion)}
                    disabled={busy || codigoVerificacion.length !== 6}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors cursor-pointer active:scale-[0.98]"
                  >
                    Confirmar y Registrar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-6 overflow-y-auto space-y-4">
                  {/* Autorregistro por QR: preferido — el propio estudiante llena sus
                      datos y confirma el código, sin que el staff lo haga por él. */}
                  <div className="p-4 rounded-xl bg-cai-surface border border-cai-border flex items-center gap-4">
                    <div className="bg-white rounded-lg p-2 shrink-0">
                      <QRCode value={AUTORREGISTRO_URL} size={72} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-cai-black uppercase mb-1">
                        Recomendado: que se autorregistre
                      </p>
                      <p className="text-[11px] text-[#888884] font-medium mb-1.5">
                        Que el estudiante escanee este código con su celular, llene sus datos y
                        confirme el código él mismo. Cuando termine, solo ingresa su RUT abajo.
                      </p>
                      <p className="text-[11px] font-bold text-cai-black">{AUTORREGISTRO_TEXTO}</p>
                    </div>
                  </div>

                  {/* Términos */}
                  <div className="p-4 rounded-xl bg-[#16A34A14] border border-[#16A34A33]">
                    <p className="text-sm font-semibold mb-2 text-cai-black">
                      Términos y Condiciones
                    </p>
                    <div className="text-xs whitespace-pre-wrap font-medium text-[#888884]">
                      {terminosTexto}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {/* Intercambio toggle */}
                    <div className="col-span-2">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={nuevoEstudiante.es_intercambio}
                          onChange={e =>
                            setNuevoEstudiante({
                              ...nuevoEstudiante,
                              es_intercambio: e.target.checked,
                              rut: '',
                            })
                          }
                          className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-gray-500 uppercase">
                          Estudiante de intercambio
                        </span>
                      </label>
                    </div>

                    {/* RUT / ID */}
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                        {nuevoEstudiante.es_intercambio ? 'Identificador' : 'RUT'}{' '}
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        ref={rutInputRef}
                        type="text"
                        inputMode={nuevoEstudiante.es_intercambio ? 'text' : 'numeric'}
                        value={nuevoEstudiante.rut}
                        disabled={rutReadOnly}
                        onChange={e =>
                          setNuevoEstudiante({ ...nuevoEstudiante, rut: e.target.value })
                        }
                        className={`${INPUT_CLS} ${rutReadOnly ? 'opacity-50' : ''}`}
                        style={{
                          '--border-c': rutError
                            ? '#f87171'
                            : nuevoEstudiante.rut && !rutError
                              ? '#34d399'
                              : undefined,
                        }}
                        placeholder={
                          nuevoEstudiante.es_intercambio ? 'Ej: Pasaporte o ID' : 'Ej: 12345678-9'
                        }
                        onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(22,163,74,0.3)')}
                        onBlur={e => (e.target.style.boxShadow = 'none')}
                      />
                      {rutError && (
                        <p className="mt-2 text-xs font-semibold text-red-500 flex items-center gap-1">
                          <span>✗</span> {rutError}
                        </p>
                      )}
                      {rutNormalizado && !rutError && nuevoEstudiante.rut && (
                        <p className="mt-2 text-xs font-semibold text-emerald-500 flex items-center gap-1">
                          <span>✓</span> {nuevoEstudiante.es_intercambio ? 'ID' : 'RUT'}:{' '}
                          {rutNormalizado}
                        </p>
                      )}
                    </div>

                    {/* Nombre */}
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                        Nombre Completo <span className="text-red-400">*</span>
                      </label>
                      <input
                        ref={nombreInputRef}
                        type="text"
                        value={nuevoEstudiante.nombre}
                        onChange={e =>
                          setNuevoEstudiante({ ...nuevoEstudiante, nombre: e.target.value })
                        }
                        className={INPUT_CLS}
                        placeholder="Ej: Juan Pérez"
                        onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(22,163,74,0.3)')}
                        onBlur={e => (e.target.style.boxShadow = 'none')}
                      />
                    </div>

                    {/* Email */}
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                        Correo Electrónico (UC) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        value={nuevoEstudiante.email}
                        onChange={e =>
                          setNuevoEstudiante({
                            ...nuevoEstudiante,
                            email: e.target.value.trim().toLowerCase(),
                          })
                        }
                        className={INPUT_CLS}
                        placeholder="Ej: juan.perez@ejemplo.cl"
                        onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(22,163,74,0.3)')}
                        onBlur={e => (e.target.style.boxShadow = 'none')}
                      />
                    </div>

                    {/* Carrera */}
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                        Carrera <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={carreraOtro ? '__otro__' : nuevoEstudiante.carrera}
                        onChange={handleCarreraChange}
                        className={`${INPUT_CLS} cursor-pointer`}
                        onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(22,163,74,0.3)')}
                        onBlur={e => (e.target.style.boxShadow = 'none')}
                      >
                        <option value="">Seleccionar carrera...</option>
                        {CARRERAS.map(c => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value="__otro__">Otra</option>
                      </select>
                      {carreraOtro && (
                        <input
                          type="text"
                          value={nuevoEstudiante.carrera}
                          onChange={e =>
                            setNuevoEstudiante({ ...nuevoEstudiante, carrera: e.target.value })
                          }
                          autoFocus
                          className={`${INPUT_CLS} mt-2`}
                          placeholder="Escribe tu carrera"
                          onFocus={e =>
                            (e.target.style.boxShadow = '0 0 0 2px rgba(22,163,74,0.3)')
                          }
                          onBlur={e => (e.target.style.boxShadow = 'none')}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 shrink-0 bg-cai-surface border-t border-cai-border">
                  <button
                    onClick={guard(handleSolicitarVerificacion)}
                    disabled={busy}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Aceptar Términos y Enviar Código
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
