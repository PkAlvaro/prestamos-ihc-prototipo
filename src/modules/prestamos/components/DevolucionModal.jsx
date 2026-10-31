import React, { useState, useEffect } from 'react'
import { AlertTriangle, X, DollarSign, Gift, Minus, Clock } from 'lucide-react'
import useEscape from '../hooks/useEscape'
import { REGLA_MULTA } from '../constants'
import ResumenDevolucion from './ResumenDevolucion'

const formatPesos = n => `$${n.toLocaleString('es-CL')}`

/**
 * Devolución de un préstamo. Ademas de la multa por atraso, puede traer un
 * arriendo de otra carrera que se difirio para cobrarse recien ahora (ver
 * CobroArriendoModal, opcion "Cobrar al devolver"): en ese caso el modal se
 * abre igual aunque no haya multa, y no se puede confirmar la devolucion sin
 * resolver tambien ese cobro.
 */
export default function DevolucionModal({ prestamo, multa, onConfirm, onClose }) {
  const arriendoPendiente = !!prestamo?.cobro_arriendo_pendiente
  const arriendoMonto = prestamo?.cobro_arriendo_monto ?? 0

  const [tipoPago, setTipoPago] = useState('')
  const [montoParcial, setMontoParcial] = useState('')
  const [comentario, setComentario] = useState('')

  const [tipoPagoArriendo, setTipoPagoArriendo] = useState('')
  const [montoParcialArriendo, setMontoParcialArriendo] = useState('')
  const [comentarioArriendo, setComentarioArriendo] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEscape(onClose, !loading)

  useEffect(() => {
    setTipoPago('')
    setMontoParcial('')
    setComentario('')
    setTipoPagoArriendo('')
    setMontoParcialArriendo('')
    setComentarioArriendo('')
    setError('')
  }, [prestamo?.id])

  const pagoElegido = (multa <= 0 || tipoPago) && (!arriendoPendiente || tipoPagoArriendo)

  const handleConfirm = async () => {
    setError('')
    let monto_cobrado = 0

    if (!pagoElegido) {
      setError('Elige cómo se resolvió el cobro antes de confirmar')
      return
    }

    if (multa > 0) {
      if (tipoPago === 'TOTAL') {
        monto_cobrado = multa
      } else if (tipoPago === 'PARCIAL') {
        const parsed = parseInt(montoParcial, 10)
        if (!montoParcial || isNaN(parsed) || parsed < 0 || parsed > multa) {
          setError(`Multa: ingresa un monto entre $0 y ${formatPesos(multa)}`)
          return
        }
        monto_cobrado = parsed
      } else if (tipoPago === 'CONDONADO') {
        if (!comentario.trim()) {
          setError('La justificación es obligatoria al condonar la multa')
          return
        }
        monto_cobrado = 0
      }
    }

    let cobro_arriendo = null
    if (arriendoPendiente) {
      if (tipoPagoArriendo === 'TOTAL') {
        cobro_arriendo = { monto_cobrado: arriendoMonto, tipo_pago: 'TOTAL', comentario: null }
      } else if (tipoPagoArriendo === 'PARCIAL') {
        const parsed = parseInt(montoParcialArriendo, 10)
        if (!montoParcialArriendo || isNaN(parsed) || parsed <= 0 || parsed >= arriendoMonto) {
          setError(`Arriendo: ingresa un monto entre $1 y ${formatPesos(arriendoMonto - 1)}`)
          return
        }
        if (!comentarioArriendo.trim()) {
          setError('Arriendo: la justificación es obligatoria para un monto parcial')
          return
        }
        cobro_arriendo = {
          monto_cobrado: parsed,
          tipo_pago: 'PARCIAL',
          comentario: comentarioArriendo.trim(),
        }
      } else if (tipoPagoArriendo === 'CONDONADO') {
        if (!comentarioArriendo.trim()) {
          setError('Arriendo: la justificación es obligatoria al condonarlo')
          return
        }
        cobro_arriendo = {
          monto_cobrado: 0,
          tipo_pago: 'CONDONADO',
          comentario: comentarioArriendo.trim(),
        }
      }
    }

    setLoading(true)
    try {
      await onConfirm({
        monto_cobrado,
        tipo_pago: multa > 0 ? tipoPago : 'SIN_MULTA',
        comentario: comentario.trim() || null,
        cobro_arriendo,
      })
    } finally {
      setLoading(false)
    }
  }

  if (!prestamo) return null

  const titulo =
    multa > 0 && arriendoPendiente
      ? 'Devolución: multa y arriendo pendiente'
      : arriendoPendiente
        ? 'Devolución: arriendo pendiente'
        : 'Devolución con multa'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md sm:mx-4 overflow-hidden max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cai-border">
          <div className="flex items-center gap-2">
            {multa > 0 ? (
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            ) : (
              <Clock className="w-5 h-5 text-amber-600" />
            )}
            <h2 className="font-bold text-base text-cai-black">{titulo}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-cai-surface border border-cai-border text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="mx-6 mt-5">
            <ResumenDevolucion prestamo={prestamo} />
          </div>
          {multa > 0 && (
            <>
              {/* Multa alert */}
              <div className="mx-6 mt-5 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-1">
                  Multa por atraso
                </p>
                <p className="text-2xl font-black text-orange-600">{formatPesos(multa)}</p>
                <p className="text-xs text-gray-500 mt-2">{REGLA_MULTA}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Si el estudiante reclama la multa, elige “Condonar multa” e indica el motivo.
                </p>
              </div>

              {/* Payment selector */}
              <div className="px-6 mt-5 space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  ¿Cómo se resuelve la multa?
                </p>

                {/* TOTAL */}
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${tipoPago === 'TOTAL' ? 'border-[#16A34A] bg-green-50' : 'border-cai-border hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    name="tipoPago"
                    value="TOTAL"
                    checked={tipoPago === 'TOTAL'}
                    onChange={() => setTipoPago('TOTAL')}
                    className="accent-[#16A34A]"
                  />
                  <DollarSign className="w-4 h-4 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-cai-black">Pagó el total</p>
                    <p className="text-xs text-gray-400">{formatPesos(multa)} cobrados</p>
                  </div>
                </label>

                {/* PARCIAL */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${tipoPago === 'PARCIAL' ? 'border-blue-500 bg-blue-50' : 'border-cai-border hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    name="tipoPago"
                    value="PARCIAL"
                    checked={tipoPago === 'PARCIAL'}
                    onChange={() => setTipoPago('PARCIAL')}
                    className="mt-0.5 accent-blue-500"
                  />
                  <Minus className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-cai-black">Monto parcial</p>
                    {tipoPago === 'PARCIAL' && (
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={multa}
                        value={montoParcial}
                        onChange={e => setMontoParcial(e.target.value)}
                        placeholder={`0 – ${multa}`}
                        className="mt-2 w-full bg-white border border-cai-border rounded-lg py-2 px-3 text-sm font-semibold text-cai-black outline-none focus:ring-2 focus:ring-blue-300"
                        autoFocus
                      />
                    )}
                  </div>
                </label>

                {/* CONDONADO */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${tipoPago === 'CONDONADO' ? 'border-red-400 bg-red-50' : 'border-cai-border hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    name="tipoPago"
                    value="CONDONADO"
                    checked={tipoPago === 'CONDONADO'}
                    onChange={() => setTipoPago('CONDONADO')}
                    className="mt-0.5 accent-red-500"
                  />
                  <Gift className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-cai-black">Condonar multa</p>
                    <p className="text-xs text-gray-400 mb-1">Requiere justificación</p>
                    {tipoPago === 'CONDONADO' && (
                      <textarea
                        value={comentario}
                        onChange={e => setComentario(e.target.value)}
                        placeholder="¿Por qué se condona esta multa?"
                        rows={2}
                        className="w-full bg-white border border-cai-border rounded-lg py-2 px-3 text-sm text-cai-black outline-none focus:ring-2 focus:ring-red-300 resize-none"
                        autoFocus
                      />
                    )}
                  </div>
                </label>
              </div>
            </>
          )}

          {arriendoPendiente && (
            <>
              {/* Arriendo pendiente alert */}
              <div className="mx-6 mt-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide mb-1">
                  Arriendo pendiente (otra carrera)
                </p>
                <p className="text-2xl font-black text-amber-700">{formatPesos(arriendoMonto)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Se difirió al pedir prestado. Debe resolverse ahora, al devolver.
                </p>
              </div>

              <div className="px-6 mt-5 space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  ¿Cómo se resuelve el arriendo?
                </p>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${tipoPagoArriendo === 'TOTAL' ? 'border-[#16A34A] bg-green-50' : 'border-cai-border hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    name="tipoPagoArriendo"
                    value="TOTAL"
                    checked={tipoPagoArriendo === 'TOTAL'}
                    onChange={() => setTipoPagoArriendo('TOTAL')}
                    className="accent-[#16A34A]"
                  />
                  <DollarSign className="w-4 h-4 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-cai-black">Pagó el total</p>
                    <p className="text-xs text-gray-400">{formatPesos(arriendoMonto)} cobrados</p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${tipoPagoArriendo === 'PARCIAL' ? 'border-blue-500 bg-blue-50' : 'border-cai-border hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    name="tipoPagoArriendo"
                    value="PARCIAL"
                    checked={tipoPagoArriendo === 'PARCIAL'}
                    onChange={() => setTipoPagoArriendo('PARCIAL')}
                    className="mt-0.5 accent-blue-500"
                  />
                  <Minus className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-cai-black">Monto parcial</p>
                    <p className="text-xs text-gray-400 mb-1">Requiere justificación</p>
                    {tipoPagoArriendo === 'PARCIAL' && (
                      <>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={arriendoMonto - 1}
                          value={montoParcialArriendo}
                          onChange={e => setMontoParcialArriendo(e.target.value)}
                          placeholder={`1 – ${arriendoMonto - 1}`}
                          className="w-full bg-white border border-cai-border rounded-lg py-2 px-3 text-sm font-semibold text-cai-black outline-none focus:ring-2 focus:ring-blue-300"
                          autoFocus
                        />
                        <textarea
                          value={comentarioArriendo}
                          onChange={e => setComentarioArriendo(e.target.value)}
                          placeholder="¿Por qué se cobra menos?"
                          rows={2}
                          className="mt-2 w-full bg-white border border-cai-border rounded-lg py-2 px-3 text-sm text-cai-black outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                        />
                      </>
                    )}
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${tipoPagoArriendo === 'CONDONADO' ? 'border-red-400 bg-red-50' : 'border-cai-border hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    name="tipoPagoArriendo"
                    value="CONDONADO"
                    checked={tipoPagoArriendo === 'CONDONADO'}
                    onChange={() => setTipoPagoArriendo('CONDONADO')}
                    className="mt-0.5 accent-red-500"
                  />
                  <Gift className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-cai-black">No cobrar</p>
                    <p className="text-xs text-gray-400 mb-1">Requiere justificación</p>
                    {tipoPagoArriendo === 'CONDONADO' && (
                      <textarea
                        value={comentarioArriendo}
                        onChange={e => setComentarioArriendo(e.target.value)}
                        placeholder="¿Por qué no se cobra este arriendo?"
                        rows={2}
                        className="w-full bg-white border border-cai-border rounded-lg py-2 px-3 text-sm text-cai-black outline-none focus:ring-2 focus:ring-red-300 resize-none"
                        autoFocus
                      />
                    )}
                  </div>
                </label>
              </div>
            </>
          )}

          {error && <p className="mx-6 mt-3 text-xs text-red-500 font-semibold">{error}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-5 shrink-0 border-t border-cai-border">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-cai-border text-sm font-bold text-gray-500 hover:bg-cai-surface transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !pagoElegido}
            className="flex-1 py-2.5 rounded-xl bg-[#16A34A] hover:bg-green-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Registrando…' : 'Confirmar devolución'}
          </button>
        </div>
      </div>
    </div>
  )
}
