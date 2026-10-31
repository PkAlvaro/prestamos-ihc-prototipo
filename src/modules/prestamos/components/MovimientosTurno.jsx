import React, { useState } from 'react'
import { ChevronDown, CornerDownLeft, History, Undo2 } from 'lucide-react'
import { formatFechaHora } from '../utils/fechas'

const hora = iso => (iso ? iso.slice(11, 16) : '')
const formatPesos = n => `$${(n ?? 0).toLocaleString('es-CL')}`

function Movimiento({ m, onRevertir }) {
  const revertido = !!m.revertido_por
  return (
    <li className={`px-4 py-3 ${revertido ? 'bg-gray-50/80' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className={`text-sm font-semibold truncate ${revertido ? 'text-gray-400 line-through' : 'text-cai-dark'}`}
          >
            {m.articulo_nombre}
          </p>
          <p className="text-[11px] text-gray-500 truncate">
            {m.articulo_codigo && <span className="font-mono">{m.articulo_codigo} · </span>}
            {m.estudiante_nombre}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {m.tipo === 'REVERSION'
              ? 'Devuelto en otro turno'
              : `Devuelto ${hora(m.fecha)} por ${m.registrado_por}`}
            {m.multa > 0 && ` · multa ${formatPesos(m.multa)}`}
          </p>
          <p className="text-[10px] text-gray-400">Prestado {formatFechaHora(m.fecha_prestamo)}</p>
        </div>
        {!revertido && (
          <button
            onClick={() => onRevertir(m)}
            className="shrink-0 px-2.5 py-1.5 rounded-lg border border-cai-border bg-white hover:bg-amber-50 hover:border-amber-300 text-xs font-bold text-gray-600 hover:text-amber-800 flex items-center gap-1 transition-colors duration-[120ms] cursor-pointer"
            title="Volver a dejar activo el préstamo, a nombre del mismo estudiante"
          >
            <Undo2 className="w-3 h-3" /> Revertir
          </button>
        )}
      </div>
      {revertido && (
        <p className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-semibold">
          <Undo2 className="w-3 h-3" />
          Revertido {hora(m.revertido_en)} por {m.revertido_por}
        </p>
      )}
    </li>
  )
}

/**
 * Lista de devoluciones registradas hoy. Cada una se puede revertir: el préstamo
 * vuelve a quedar activo a nombre del mismo estudiante y la reversión queda
 * registrada con quién la hizo y a qué hora.
 */
export default function MovimientosTurno({ movimientos = [], onRevertir }) {
  // Junto a la lista en pantallas anchas va abierto; en las demás va sobre la lista,
  // plegado, para no empujar los préstamos hacia abajo.
  const [abierto, setAbierto] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(min-width: 1536px)').matches
  )
  const devoluciones = movimientos.filter(m => m.tipo === 'DEVOLUCION' && !m.revertido_por).length

  return (
    <aside
      aria-label="Movimientos del turno"
      className="bg-white rounded-2xl border border-cai-border overflow-hidden 2xl:sticky 2xl:top-4"
    >
      <button
        onClick={() => setAbierto(v => !v)}
        aria-expanded={abierto}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 border-b border-cai-border cursor-pointer"
      >
        <span className="flex items-center gap-2 min-w-0">
          <History className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span className="text-sm font-bold text-cai-dark whitespace-nowrap">
            Movimientos del turno
          </span>
          <span
            className="min-w-5 h-5 px-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold flex items-center justify-center"
            title={`${devoluciones} devoluci${devoluciones === 1 ? 'ón' : 'ones'} hoy`}
          >
            {devoluciones}
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${abierto ? 'rotate-180' : ''}`}
        />
      </button>
      {abierto &&
        (movimientos.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <CornerDownLeft className="w-5 h-5 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400">
              Aquí aparecerá cada devolución de hoy, con la opción de revertirla si fue un error.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
            {movimientos.map(m => (
              <Movimiento key={m.id} m={m} onRevertir={onRevertir} />
            ))}
          </ul>
        ))}
    </aside>
  )
}
