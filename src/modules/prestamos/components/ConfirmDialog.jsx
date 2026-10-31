import React from 'react'
import { AlertTriangle, HelpCircle } from 'lucide-react'
import useEscape from '../hooks/useEscape'

/** Ventana de confirmación con el mismo estilo del resto de modales del módulo. */
export default function ConfirmDialog({ confirmacion, onResolve }) {
  const { titulo, mensaje, confirmar = 'Confirmar', tono = 'neutral' } = confirmacion
  const advertencia = tono === 'advertencia'
  useEscape(() => onResolve(false))

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-titulo"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50"
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm sm:mx-4 overflow-hidden">
        <div className="flex items-start gap-3 px-6 pt-6">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${advertencia ? 'bg-amber-50' : 'bg-green-50'}`}
          >
            {advertencia ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <HelpCircle className="w-5 h-5 text-[#16A34A]" />
            )}
          </div>
          <div className="min-w-0">
            <h2 id="confirm-titulo" className="font-bold text-base text-cai-black">
              {titulo}
            </h2>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{mensaje}</p>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-5">
          <button
            onClick={() => onResolve(false)}
            className="flex-1 py-2.5 rounded-xl border border-cai-border text-sm font-bold text-gray-500 hover:bg-cai-surface transition-colors duration-[120ms] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            autoFocus
            onClick={() => onResolve(true)}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-colors duration-[120ms] cursor-pointer ${advertencia ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#16A34A] hover:bg-green-700'}`}
          >
            {confirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
