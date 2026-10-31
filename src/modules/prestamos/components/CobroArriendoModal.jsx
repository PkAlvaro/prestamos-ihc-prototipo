import React, { useState, useEffect } from 'react'
import { AlertTriangle, X, DollarSign, Gift, Minus, GraduationCap, Clock } from 'lucide-react'
import { CARRERAS } from '../constants'
import { mensajeDeError } from '../utils/mensajeDeError'

const formatPesos = n => `$${(n ?? 0).toLocaleString('es-CL')}`

const INPUT_CLS =
  'w-full bg-white border border-cai-border rounded-lg py-2 px-3 text-sm font-semibold text-cai-black outline-none focus:ring-2 focus:ring-amber-300'

/**
 * Aviso de cobro de arriendo a estudiantes de otras carreras.
 *
 * Tiene dos pasos: si el estudiante no tiene carrera registrada primero se pide
 * (y se guarda), porque sin ese dato no se puede saber si corresponde cobrar.
 * Una vez conocida la carrera, si aplica cobro el operario debe registrarlo:
 * el modal no se puede cerrar sin decidir, solo cancelar el préstamo completo.
 */
export default function CobroArriendoModal({
  evaluacion,
  articulos = [],
  onGuardarCarrera,
  onConfirm,
  onClose,
}) {
  const [tipoPago, setTipoPago] = useState('')
  const [montoParcial, setMontoParcial] = useState('')
  const [comentario, setComentario] = useState('')
  const [carreraSel, setCarreraSel] = useState('')
  const [carreraOtro, setCarreraOtro] = useState(false)
  const [carreraLibre, setCarreraLibre] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const necesitaCarrera = evaluacion && !evaluacion.carrera_conocida
  const monto = evaluacion?.monto ?? 0

  useEffect(() => {
    setTipoPago('')
    setMontoParcial('')
    setComentario('')
    setCarreraSel('')
    setCarreraOtro(false)
    setCarreraLibre('')
    setError('')
  }, [evaluacion?.estudiante_id, evaluacion?.carrera_conocida])

  const handleCarreraChange = e => {
    const val = e.target.value
    setCarreraOtro(val === '__otro__')
    setCarreraSel(val === '__otro__' ? '' : val)
  }

  const handleGuardarCarrera = async () => {
    setError('')
    const carrera = (carreraOtro ? carreraLibre : carreraSel).trim()
    if (!carrera) {
      setError('Selecciona la carrera del estudiante para continuar')
      return
    }
    setLoading(true)
    try {
      await onGuardarCarrera(carrera)
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo guardar la carrera'))
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    setError('')
    let monto_cobrado = 0

    if (!tipoPago) {
      setError('Elige cómo se resolvió el cobro antes de confirmar')
      return
    }

    if (tipoPago === 'TOTAL') {
      monto_cobrado = monto
    } else if (tipoPago === 'PARCIAL') {
      const parsed = parseInt(montoParcial, 10)
      if (!montoParcial || isNaN(parsed) || parsed <= 0 || parsed >= monto) {
        setError(`Ingresa un monto entre $1 y ${formatPesos(monto - 1)}`)
        return
      }
      if (!comentario.trim()) {
        setError('La justificación es obligatoria al cobrar un monto parcial')
        return
      }
      monto_cobrado = parsed
    } else if (tipoPago === 'CONDONADO') {
      if (!comentario.trim()) {
        setError('La justificación es obligatoria al condonar el arriendo')
        return
      }
      monto_cobrado = 0
    } else if (tipoPago === 'PENDIENTE') {
      monto_cobrado = 0
    }

    setLoading(true)
    try {
      await onConfirm({ monto_cobrado, tipo_pago: tipoPago, comentario: comentario.trim() || null })
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo registrar el cobro'))
    } finally {
      setLoading(false)
    }
  }

  if (!evaluacion) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md sm:mx-4 overflow-hidden max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cai-border">
          <div className="flex items-center gap-2">
            {necesitaCarrera ? (
              <GraduationCap className="w-5 h-5 text-amber-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            )}
            <h2 className="font-bold text-base text-cai-black">
              {necesitaCarrera ? 'Falta la carrera' : 'Cobrar arriendo'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-cai-surface border border-cai-border text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {necesitaCarrera ? (
            <div className="px-6 py-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-sm font-bold text-cai-black">
                  {evaluacion.estudiante_nombre} no tiene carrera registrada
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Pregúntale qué estudia. Sin ese dato no se puede saber si le corresponde pagar el
                  arriendo.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Carrera
                </label>
                <select
                  value={carreraOtro ? '__otro__' : carreraSel}
                  onChange={handleCarreraChange}
                  className={`${INPUT_CLS} mt-2 cursor-pointer`}
                  autoFocus
                >
                  <option value="">Selecciona una carrera…</option>
                  {CARRERAS.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="__otro__">Otra…</option>
                </select>
                {carreraOtro && (
                  <input
                    type="text"
                    value={carreraLibre}
                    onChange={e => setCarreraLibre(e.target.value)}
                    placeholder="Escribe la carrera"
                    className={`${INPUT_CLS} mt-2`}
                    autoFocus
                  />
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Monto */}
              <div className="mx-6 mt-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide mb-1">
                  Arriendo a cobrar
                </p>
                <p className="text-2xl font-black text-amber-700">{formatPesos(monto)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {evaluacion.estudiante_nombre} · {evaluacion.carrera}
                </p>
                {articulos.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {articulos
                      .map(a => (a.cantidad > 1 ? `${a.cantidad}× ${a.nombre}` : a.nombre))
                      .join(' · ')}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Se cobra una vez por préstamo, no por artículo.
                </p>
              </div>

              {/* Selector de pago */}
              <div className="px-6 mt-5 space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  ¿Cómo se resuelve el cobro?
                </p>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors duration-[120ms] ${tipoPago === 'TOTAL' ? 'border-[#16A34A] bg-green-50' : 'border-cai-border hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    name="tipoPagoArriendo"
                    value="TOTAL"
                    checked={tipoPago === 'TOTAL'}
                    onChange={() => setTipoPago('TOTAL')}
                    className="accent-[#16A34A]"
                  />
                  <DollarSign className="w-4 h-4 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-cai-black">Pagó el total</p>
                    <p className="text-xs text-gray-400">{formatPesos(monto)} cobrados</p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors duration-[120ms] ${tipoPago === 'PARCIAL' ? 'border-blue-500 bg-blue-50' : 'border-cai-border hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    name="tipoPagoArriendo"
                    value="PARCIAL"
                    checked={tipoPago === 'PARCIAL'}
                    onChange={() => setTipoPago('PARCIAL')}
                    className="mt-0.5 accent-blue-500"
                  />
                  <Minus className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-cai-black">Monto parcial</p>
                    <p className="text-xs text-gray-400 mb-1">Requiere justificación</p>
                    {tipoPago === 'PARCIAL' && (
                      <>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={monto - 1}
                          value={montoParcial}
                          onChange={e => setMontoParcial(e.target.value)}
                          placeholder={`1 – ${monto - 1}`}
                          className={INPUT_CLS}
                          autoFocus
                        />
                        <textarea
                          value={comentario}
                          onChange={e => setComentario(e.target.value)}
                          placeholder="¿Por qué se cobra menos?"
                          rows={2}
                          className={`${INPUT_CLS} mt-2 font-normal resize-none`}
                        />
                      </>
                    )}
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors duration-[120ms] ${tipoPago === 'CONDONADO' ? 'border-red-400 bg-red-50' : 'border-cai-border hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    name="tipoPagoArriendo"
                    value="CONDONADO"
                    checked={tipoPago === 'CONDONADO'}
                    onChange={() => setTipoPago('CONDONADO')}
                    className="mt-0.5 accent-red-500"
                  />
                  <Gift className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-cai-black">No cobrar</p>
                    <p className="text-xs text-gray-400 mb-1">Requiere justificación</p>
                    {tipoPago === 'CONDONADO' && (
                      <textarea
                        value={comentario}
                        onChange={e => setComentario(e.target.value)}
                        placeholder="¿Por qué no se cobra este arriendo?"
                        rows={2}
                        className={`${INPUT_CLS} font-normal resize-none`}
                        autoFocus
                      />
                    )}
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors duration-[120ms] ${tipoPago === 'PENDIENTE' ? 'border-amber-500 bg-amber-50' : 'border-cai-border hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    name="tipoPagoArriendo"
                    value="PENDIENTE"
                    checked={tipoPago === 'PENDIENTE'}
                    onChange={() => setTipoPago('PENDIENTE')}
                    className="mt-0.5 accent-amber-500"
                  />
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-cai-black">Cobrar al devolver</p>
                    <p className="text-xs text-gray-400">
                      No paga ahora. Al devolver el artículo se le pedirá resolver este arriendo.
                    </p>
                  </div>
                </label>
              </div>
            </>
          )}

          {error && <p className="mx-6 mt-3 text-xs text-red-500 font-semibold">{error}</p>}
        </div>

        {/* Acciones */}
        <div className="flex gap-3 px-6 py-5 shrink-0 border-t border-cai-border">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-cai-border text-sm font-bold text-gray-500 hover:bg-cai-surface transition-colors duration-[120ms] cursor-pointer disabled:opacity-50"
          >
            Cancelar préstamo
          </button>
          <button
            onClick={necesitaCarrera ? handleGuardarCarrera : handleConfirm}
            disabled={loading || (!necesitaCarrera && !tipoPago)}
            className="flex-1 py-2.5 rounded-xl bg-[#16A34A] hover:bg-green-700 text-white text-sm font-bold transition-colors duration-[120ms] cursor-pointer disabled:opacity-50"
          >
            {loading
              ? 'Guardando…'
              : necesitaCarrera
                ? 'Guardar y continuar'
                : 'Confirmar préstamo'}
          </button>
        </div>
      </div>
    </div>
  )
}
