import React, { useState } from 'react'
import { CornerDownLeft, X } from 'lucide-react'
import useEscape from '../hooks/useEscape'
import ResumenDevolucion from './ResumenDevolucion'

/** Devolución sin multa ni cobros: resumen del préstamo y "Confirmar devolución". */
export default function ConfirmarDevolucionModal({ prestamo, onConfirm, onClose }) {
  const [registrando, setRegistrando] = useState(false)
  useEscape(onClose)

  const confirmar = async () => {
    setRegistrando(true)
    await onConfirm()
    setRegistrando(false)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmar-devolucion-titulo"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md sm:mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cai-border">
          <div className="flex items-center gap-2">
            <CornerDownLeft className="w-5 h-5 text-[#16A34A]" />
            <h2 id="confirmar-devolucion-titulo" className="font-bold text-base text-cai-black">
              Revisa antes de devolver
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-cai-surface border border-cai-border text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <ResumenDevolucion prestamo={prestamo} />
          <p className="text-xs text-gray-500">
            Sin multa ni cobros pendientes. Comprueba que el código coincida con la etiqueta del
            objeto que te entregan.
          </p>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-cai-border bg-cai-surface">
          <button
            onClick={onClose}
            disabled={registrando}
            className="flex-1 py-2.5 rounded-xl border border-cai-border bg-white text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors duration-[120ms] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            autoFocus
            onClick={confirmar}
            disabled={registrando}
            className="flex-1 py-2.5 rounded-xl bg-[#16A34A] hover:bg-green-700 text-white text-sm font-bold disabled:opacity-50 transition-colors duration-[120ms] cursor-pointer"
          >
            {registrando ? 'Registrando…' : 'Confirmar devolución'}
          </button>
        </div>
      </div>
    </div>
  )
}
