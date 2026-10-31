import React, { useEffect, useState } from 'react'
import { X, Wallet, DollarSign, Gift } from 'lucide-react'
import useEscape from '../hooks/useEscape'
import { formatFechaHora } from '../utils/fechas'
import { MULTA_MAXIMA, REGLA_MULTA } from '../constants'
import { prestamosApi } from '../services/prestamosApi'
import { useNovedad } from '../../../novedades'

const formatPesos = n => `$${(n ?? 0).toLocaleString('es-CL')}`

/** Explica en una línea cómo se llegó a la multa de un préstamo. */
function explicarMulta(d) {
  if (d.multa > 0) {
    const dias = `${d.bloques} ${d.bloques === 1 ? 'día hábil' : 'días hábiles'} de atraso × ${formatPesos(500)}`
    return d.tope_alcanzado ? `${dias} (tope ${formatPesos(d.multa)})` : dias
  }
  if (d.gracia_restante_horas > 0) {
    return `Dentro del plazo: quedan ${Math.floor(d.gracia_restante_horas)} h hábiles sin multa`
  }
  return 'Sin multa'
}

function Opciones({ nombre, valor, onChange, totalLabel, totalDetalle }) {
  return (
    <div className="space-y-2">
      {[
        { v: 'TOTAL', icon: DollarSign, titulo: totalLabel, detalle: totalDetalle },
        {
          v: 'CONDONADO',
          icon: Gift,
          titulo: 'Condonar',
          detalle: 'No se cobra. Requiere justificación.',
        },
      ].map(({ v, icon: Icon, titulo, detalle }) => (
        <label
          key={v}
          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors duration-[120ms] ${valor === v ? 'border-[#16A34A] bg-green-50' : 'border-cai-border hover:border-gray-300'}`}
        >
          <input
            type="radio"
            name={nombre}
            checked={valor === v}
            onChange={() => onChange(v)}
            className="accent-[#16A34A]"
          />
          <Icon className="w-4 h-4 text-gray-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-cai-black">{titulo}</p>
            <p className="text-xs text-gray-400">{detalle}</p>
          </div>
        </label>
      ))}
    </div>
  )
}

/**
 * Devuelve de una vez todos los préstamos mostrados de una misma persona. Si hay multas o
 * arriendos pendientes hay que decidir cómo se resuelven (cobrar el total o condonar); los
 * montos parciales se siguen haciendo préstamo por préstamo.
 */
export default function DevolverLoteModal({ modal, onConfirm, onClose }) {
  const { activa: conResumen } = useNovedad('resumen-devolucion')
  const [tipoMulta, setTipoMulta] = useState('')
  const [comentarioMulta, setComentarioMulta] = useState('')
  const [tipoArriendo, setTipoArriendo] = useState('')
  const [comentarioArriendo, setComentarioArriendo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEscape(onClose, !loading)

  const { prestamos } = modal

  // La multa se calcula en el servidor al abrir (la de la lista puede tener hasta 30 s de
  // antigüedad). Si falla, se usa la de la lista.
  const [detalle, setDetalle] = useState(undefined) // undefined = calculando, null = falló
  useEffect(() => {
    let vigente = true
    prestamosApi
      .previewMultasLote(prestamos.map(p => p.id))
      .then(r => vigente && setDetalle(Object.fromEntries(r.items.map(i => [i.prestamo_id, i]))))
      .catch(() => vigente && setDetalle(null))
    return () => {
      vigente = false
    }
  }, [prestamos])

  // `multa_cobrable` ya trae el tope por lote (nadie paga más de MULTA_MAXIMA por todo el lote)
  const multaPropia = p => detalle?.[p.id]?.multa ?? p.multa_calculada
  const multaDe = p => detalle?.[p.id]?.multa_cobrable ?? multaPropia(p)
  const conMulta = prestamos.filter(p => multaPropia(p) > 0)
  const sumaCobrable = conMulta.reduce((suma, p) => suma + multaDe(p), 0)
  const totalMulta = detalle ? sumaCobrable : Math.min(sumaCobrable, MULTA_MAXIMA)
  const totalSinTope = conMulta.reduce((suma, p) => suma + multaPropia(p), 0)
  // Los préstamos de una misma transacción comparten un solo arriendo: se cuenta una vez por monto
  const hayArriendo = prestamos.some(p => p.cobro_arriendo_pendiente)
  const montoArriendo = prestamos.find(p => p.cobro_arriendo_pendiente)?.cobro_arriendo_monto

  const decisionLista =
    detalle !== undefined && (!conMulta.length || tipoMulta) && (!hayArriendo || tipoArriendo)

  const handleConfirm = async () => {
    setError('')
    if (tipoMulta === 'CONDONADO' && !comentarioMulta.trim()) {
      setError('La justificación es obligatoria al condonar la multa')
      return
    }
    if (tipoArriendo === 'CONDONADO' && !comentarioArriendo.trim()) {
      setError('La justificación es obligatoria al condonar el arriendo')
      return
    }
    setLoading(true)
    try {
      await onConfirm({
        prestamo_ids: prestamos.map(p => p.id),
        tipo_pago_multa: tipoMulta || null,
        comentario_multa: comentarioMulta.trim() || null,
        tipo_pago_arriendo: tipoArriendo || null,
        comentario_arriendo: comentarioArriendo.trim() || null,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md sm:mx-4 overflow-hidden max-h-[92dvh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cai-border">
          <h2 className="font-bold text-base text-cai-black">Devolver todo ({prestamos.length})</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-cai-surface border border-cai-border text-gray-400 hover:bg-gray-100 transition-colors duration-[120ms] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div>
            <p className="text-sm font-bold text-cai-black">
              {modal.estudianteNombre}
              <span className="ml-2 text-xs font-normal text-gray-400 font-mono">
                {prestamos[0]?.estudiante_rut}
              </span>
            </p>
            <ul className="mt-2 divide-y divide-gray-100 border border-cai-border rounded-xl">
              {prestamos.map(p => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-cai-dark truncate">
                      {p.articulo_nombre}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {conResumen && p.articulo_codigo && (
                        <span className="font-mono text-gray-500">{p.articulo_codigo} · </span>
                      )}
                      Prestado {formatFechaHora(p.fecha_prestamo)}
                    </p>
                    {detalle?.[p.id] && (
                      <p className="text-[11px] text-gray-500">
                        {explicarMulta(detalle[p.id])}
                        {detalle[p.id].tope_lote_aplicado &&
                          ` · se cobra ${formatPesos(detalle[p.id].multa_cobrable)} por el tope del lote`}
                      </p>
                    )}
                  </div>
                  {multaPropia(p) > 0 && (
                    <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg shrink-0">
                      {formatPesos(multaDe(p))}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {detalle === undefined && (
            <p className="text-xs text-gray-400 font-semibold">Calculando multas…</p>
          )}

          {conMulta.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Multas: {formatPesos(totalMulta)} en {conMulta.length}{' '}
                {conMulta.length === 1 ? 'préstamo' : 'préstamos'}
              </p>
              {totalSinTope > totalMulta && (
                <p className="text-xs text-amber-700 font-semibold">
                  Tope de {formatPesos(MULTA_MAXIMA)} por lote: sin tope serían{' '}
                  {formatPesos(totalSinTope)}.
                </p>
              )}
              <p className="text-xs text-gray-500">{REGLA_MULTA}</p>
              <Opciones
                nombre="multaLote"
                valor={tipoMulta}
                onChange={setTipoMulta}
                totalLabel="Pagó el total"
                totalDetalle={`${formatPesos(totalMulta)} cobrados`}
              />
              {tipoMulta === 'CONDONADO' && (
                <textarea
                  rows={2}
                  value={comentarioMulta}
                  onChange={e => setComentarioMulta(e.target.value)}
                  placeholder="¿Por qué se condona la multa?"
                  className="w-full bg-white border border-cai-border rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  autoFocus
                />
              )}
            </div>
          )}

          {hayArriendo && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" /> Arriendo pendiente
                {montoArriendo ? `: ${formatPesos(montoArriendo)}` : ''}
              </p>
              <Opciones
                nombre="arriendoLote"
                valor={tipoArriendo}
                onChange={setTipoArriendo}
                totalLabel="Pagó el arriendo"
                totalDetalle="Se registra cobrado al devolver"
              />
              {tipoArriendo === 'CONDONADO' && (
                <textarea
                  rows={2}
                  value={comentarioArriendo}
                  onChange={e => setComentarioArriendo(e.target.value)}
                  placeholder="¿Por qué se condona el arriendo?"
                  className="w-full bg-white border border-cai-border rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                />
              )}
            </div>
          )}

          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 py-5 shrink-0 border-t border-cai-border">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-cai-border text-sm font-bold text-gray-500 hover:bg-cai-surface transition-colors duration-[120ms] cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !decisionLista}
            className="flex-1 py-2.5 rounded-xl bg-[#16A34A] hover:bg-green-700 text-white text-sm font-bold transition-colors duration-[120ms] cursor-pointer disabled:opacity-50"
          >
            {loading
              ? 'Registrando…'
              : conResumen
                ? `Confirmar devolución (${prestamos.length})`
                : `Devolver ${prestamos.length}`}
          </button>
        </div>
      </div>
    </div>
  )
}
