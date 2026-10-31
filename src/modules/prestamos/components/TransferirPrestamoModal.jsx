import React, { useEffect, useState } from 'react'
import { ArrowLeftRight, Search, X } from 'lucide-react'
import useEscape from '../hooks/useEscape'
import { prestamosApi } from '../services/prestamosApi'
import { normalizeRut } from '../../../utils/rutUtils'
import { mensajeDeError } from '../utils/mensajeDeError'

/**
 * Transfiere la responsabilidad de un préstamo (y, opcionalmente, otros
 * préstamos activos del mismo estudiante) a otro estudiante — el caso real
 * es un canje de TUC: alguien dejó su TUC en garantía y después aparece otra
 * persona a dejar la suya en canje. Requiere que el estudiante nuevo ya
 * tenga consentimiento aceptado (mismo requisito que un préstamo normal).
 */
export default function TransferirPrestamoModal({ modal, onConfirm, onClose }) {
  const [seleccionados, setSeleccionados] = useState(() => new Set([modal?.prestamo?.id]))
  const [rutInput, setRutInput] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [estudianteNuevo, setEstudianteNuevo] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEscape(onClose, !loading)

  useEffect(() => {
    setSeleccionados(new Set([modal?.prestamo?.id]))
    setRutInput('')
    setEstudianteNuevo(null)
    setError('')
  }, [modal?.prestamo?.id])

  if (!modal) return null
  const { prestamo, otrosActivosDelEstudiante } = modal

  const toggleSeleccion = id => {
    setSeleccionados(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBuscar = async () => {
    setError('')
    setEstudianteNuevo(null)
    const rutNorm = normalizeRut(rutInput)
    if (!rutNorm) {
      setError('RUT inválido. Formato esperado: 12345678-9')
      return
    }
    setBuscando(true)
    try {
      const result = await prestamosApi.buscarEstudiante(rutNorm)
      if (!result.existe) {
        setError(
          'Este estudiante no está registrado. Debe registrarse primero por el flujo normal de Escaneo.'
        )
      } else if (!result.consentimiento_aceptado) {
        setError(
          'Este estudiante debe aceptar los Términos y Condiciones antes de recibir un préstamo.'
        )
      } else if (rutNorm === prestamo.estudiante_rut) {
        setError('Ese es el mismo estudiante que ya tiene el préstamo.')
      } else {
        setEstudianteNuevo(result.estudiante)
      }
    } catch (e) {
      setError(mensajeDeError(e, 'Error al buscar estudiante'))
    } finally {
      setBuscando(false)
    }
  }

  const handleConfirmar = async () => {
    if (!estudianteNuevo) return
    setLoading(true)
    try {
      await onConfirm({ prestamoIds: Array.from(seleccionados), nuevoRut: estudianteNuevo.rut })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md sm:mx-4 overflow-hidden max-h-[92dvh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cai-border">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-cai-dark" />
            <h2 className="font-bold text-base text-cai-black">Transferir préstamo</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-cai-surface border border-cai-border text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">
              Préstamo actual
            </p>
            <p className="text-sm font-bold text-cai-black">{prestamo.articulo_nombre}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {prestamo.estudiante_nombre} · {prestamo.estudiante_rut}
            </p>
          </div>

          {otrosActivosDelEstudiante.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Incluir también otros préstamos activos de este estudiante
              </p>
              <div className="space-y-1.5">
                {otrosActivosDelEstudiante.map(p => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={seleccionados.has(p.id)}
                      onChange={() => toggleSeleccion(p.id)}
                      className="accent-cai-dark"
                    />
                    <span className="text-sm text-cai-dark">{p.articulo_nombre}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Nuevo responsable (TUC de canje)
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={rutInput}
                onChange={e => {
                  setRutInput(e.target.value)
                  setEstudianteNuevo(null)
                }}
                onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                placeholder="Ej: 12345678-9"
                className="flex-1 bg-cai-surface border border-cai-border rounded-xl py-2.5 px-3 text-sm font-semibold text-cai-black outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                onClick={handleBuscar}
                disabled={buscando || !rutInput}
                className="px-4 py-2.5 bg-cai-dark hover:bg-black text-white rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
              >
                <Search className="w-3.5 h-3.5" />
                Buscar
              </button>
            </div>
            {estudianteNuevo && (
              <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <p className="text-sm font-bold text-emerald-700">{estudianteNuevo.nombre}</p>
                <p className="text-xs text-emerald-600">{estudianteNuevo.rut}</p>
              </div>
            )}
            {error && <p className="mt-2 text-xs font-semibold text-red-500">{error}</p>}
          </div>
        </div>

        <div className="flex gap-3 px-6 py-5 shrink-0 border-t border-cai-border">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-cai-border text-sm font-bold text-gray-500 hover:bg-cai-surface transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={loading || !estudianteNuevo || seleccionados.size === 0}
            className="flex-1 py-2.5 rounded-xl bg-cai-dark hover:bg-black text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40"
          >
            {loading ? 'Transfiriendo…' : 'Confirmar transferencia'}
          </button>
        </div>
      </div>
    </div>
  )
}
