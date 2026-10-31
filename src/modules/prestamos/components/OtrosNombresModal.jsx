import React, { useState } from 'react'
import { Tags, X } from 'lucide-react'
import useEscape from '../hooks/useEscape'
import { GRUPOS_SINONIMOS, terminosAlternativos } from '../utils/sinonimos'

/**
 * "Otros nombres" de un artículo: cómo lo piden los estudiantes o el staff en el
 * mesón ("la TI", "graficadora"). La búsqueda del mesón y de Stock los encuentra
 * igual que el nombre oficial. Muestra aparte los sinónimos generales que el
 * sistema ya reconoce, para no repetirlos.
 */
export default function OtrosNombresModal({ articulo, onGuardar, onClose }) {
  const [alias, setAlias] = useState(articulo.alias || [])
  const [nuevo, setNuevo] = useState('')
  const [guardando, setGuardando] = useState(false)
  useEscape(onClose)

  const yaReconocidos = terminosAlternativos({ ...articulo, alias: [] })
  const enDiccionario = new Set(GRUPOS_SINONIMOS.flat())

  const agregar = () => {
    const valor = nuevo.trim()
    if (!valor) return
    const repetido = [...alias, articulo.nombre].some(a => a.toLowerCase() === valor.toLowerCase())
    if (!repetido) setAlias([...alias, valor])
    setNuevo('')
  }

  const guardar = async () => {
    setGuardando(true)
    const ok = await onGuardar(articulo, alias)
    setGuardando(false)
    if (ok) onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="otros-nombres-titulo"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md sm:mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cai-border">
          <div className="flex items-center gap-2">
            <Tags className="w-5 h-5 text-[#16A34A]" />
            <h2 id="otros-nombres-titulo" className="font-bold text-base text-cai-black">
              Otros nombres
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

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            Cómo se le dice a <strong>{articulo.nombre}</strong> en el mesón. Quien lo busque por
            cualquiera de estos nombres lo va a encontrar.
          </p>

          <div className="flex gap-2">
            <input
              autoFocus
              value={nuevo}
              onChange={e => setNuevo(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  agregar()
                }
              }}
              placeholder="Ej: la TI, graficadora…"
              className="flex-1 px-3 py-2 rounded-lg border border-cai-border text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              onClick={agregar}
              disabled={!nuevo.trim()}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors duration-[120ms]"
            >
              Agregar
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-[28px]">
            {alias.length === 0 && (
              <p className="text-xs text-gray-400">Todavía no tiene otros nombres propios.</p>
            )}
            {alias.map(a => (
              <span
                key={a}
                className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold"
              >
                {a}
                <button
                  onClick={() => setAlias(alias.filter(x => x !== a))}
                  aria-label={`Quitar ${a}`}
                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-emerald-100 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {yaReconocidos.length > 0 && (
            <div className="rounded-xl bg-cai-surface border border-cai-border p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Ya se reconoce por sinónimo
              </p>
              <p className="text-xs text-gray-600">
                {yaReconocidos.filter(t => enDiccionario.has(t)).join(', ')}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-cai-border bg-cai-surface">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-cai-border bg-white text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors duration-[120ms] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            className="flex-1 py-2.5 rounded-xl bg-[#16A34A] hover:bg-green-700 text-white text-sm font-bold disabled:opacity-50 transition-colors duration-[120ms] cursor-pointer"
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
