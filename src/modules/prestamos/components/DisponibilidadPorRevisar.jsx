import React, { useState } from 'react'
import { Eye, X } from 'lucide-react'
import FormularioValidado from './FormularioValidado'
import useEscape from '../hooks/useEscape'
import { MarcaNuevo } from '../../../novedades'
import { validarCantidad } from '../utils/validacionInventario'
import { formatFechaHora, haceCuanto } from '../utils/fechas'

/*
 * Mejora 4: cuando lo que se ve en el estante no coincide con el registro, el
 * encargado deja constancia. El reporte queda pendiente de revisión y NO cambia
 * las existencias; la ficha del material muestra «Disponibilidad por revisar».
 */

/** Aviso en la ficha de un material con un reporte pendiente. `compacto` para listas. */
export function AvisoPorRevisar({ articulo, compacto = false, onRevisar }) {
  const r = articulo.reporte_pendiente
  if (!r) return null
  if (compacto) {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-bold uppercase tracking-wide"
        title={`Se reportaron ${r.cantidad_observada} en el estante; el registro decía ${r.cantidad_registrada} libres`}
      >
        <Eye className="w-3 h-3" /> Disponibilidad por revisar
      </span>
    )
  }
  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5">
      <p className="text-xs font-bold text-orange-800 flex items-center gap-1.5">
        <Eye className="w-3.5 h-3.5" /> Disponibilidad por revisar
      </p>
      <p className="text-[11px] text-orange-900/80 mt-0.5">
        En el estante se vieron <strong>{r.cantidad_observada}</strong>; el registro decía{' '}
        <strong>{r.cantidad_registrada}</strong> libres. Reportado por {r.reportado_por}{' '}
        {haceCuanto(r.fecha)}.
      </p>
      {onRevisar && (
        <button
          onClick={() => onRevisar(articulo)}
          className="mt-1.5 text-[11px] font-bold text-orange-800 underline cursor-pointer"
        >
          Revisar
        </button>
      )}
    </div>
  )
}

export function ReportarDiferenciaForm({ articulo, onEnviar, onCerrar }) {
  const prestados = articulo.stock_total - articulo.stock_disponible
  return (
    <FormularioValidado
      titulo="Reportar diferencia de disponibilidad"
      marca={<MarcaNuevo novedad="diferencia-disponibilidad" />}
      ancho="max-w-md"
      textoEnviar="Reportar diferencia"
      onCerrar={onCerrar}
      onEnviar={valores => onEnviar(articulo, valores)}
      cabecera={
        <>
          <div className="rounded-xl bg-cai-surface border border-cai-border px-4 py-3">
            <p className="text-sm font-bold text-cai-black">{articulo.nombre}</p>
            <p className="text-[11px] text-gray-500">
              {articulo.codigo && <span className="font-mono">{articulo.codigo} · </span>}
              Según el registro: <strong>{articulo.stock_disponible} libres</strong> de{' '}
              {articulo.stock_total} ({prestados} prestado{prestados !== 1 ? 's' : ''})
            </p>
          </div>
          <p className="text-xs text-gray-500">
            El reporte queda pendiente de revisión y <strong>no cambia las existencias</strong>.
          </p>
        </>
      }
      campos={[
        {
          id: 'cantidad_observada',
          etiqueta: '¿Cuántas unidades libres ves en el estante?',
          tipo: 'cantidad',
          placeholder: `El registro dice ${articulo.stock_disponible}`,
          ayuda: 'Número entero, 0 o más.',
          validar: valor =>
            validarCantidad(valor, { minimo: 0 }) ??
            (Number(valor) === articulo.stock_disponible
              ? 'Coincide con el registro: no hay diferencia que reportar.'
              : null),
        },
        {
          id: 'comentario',
          etiqueta: 'Comentario',
          opcional: true,
          placeholder: 'Ej: una está rota, revisé el casillero 3…',
        },
      ]}
    />
  )
}

/** Revisión de un reporte: cerrarlo y, si corresponde, corregir el stock aparte. */
export function RevisarReporteModal({ articulo, onMarcarRevisado, onAjustarStock, onCerrar }) {
  const r = articulo.reporte_pendiente
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)
  useEscape(onCerrar)
  if (!r) return null
  const diferencia = r.cantidad_observada - r.cantidad_registrada

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="revisar-reporte-titulo"
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    >
      <div className="rounded-2xl w-full max-w-md overflow-hidden shadow-2xl bg-white border border-cai-border">
        <div className="p-6 flex justify-between items-center bg-cai-surface border-b border-cai-border">
          <div className="flex items-center gap-2">
            <h3 id="revisar-reporte-titulo" className="font-bold text-lg text-cai-black">
              Disponibilidad por revisar
            </h3>
            <MarcaNuevo novedad="diferencia-disponibilidad" />
          </div>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer bg-white border border-cai-border text-[#888884] hover:bg-cai-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2">
              <dt className="text-[10px] font-bold uppercase text-gray-400">Material</dt>
              <dd className="font-bold text-cai-black">
                {articulo.nombre}{' '}
                {articulo.codigo && (
                  <span className="font-mono text-xs text-gray-400">{articulo.codigo}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-gray-400">Registro decía</dt>
              <dd className="text-2xl font-black text-cai-black">{r.cantidad_registrada}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-gray-400">Se vieron</dt>
              <dd className="text-2xl font-black text-orange-600">
                {r.cantidad_observada}{' '}
                <span className="text-sm font-bold">
                  ({diferencia > 0 ? '+' : ''}
                  {diferencia})
                </span>
              </dd>
            </div>
            <div className="col-span-2 text-xs text-gray-500">
              Reportado por {r.reportado_por} el {formatFechaHora(r.fecha)}
              {r.comentario && <p className="mt-1 italic">“{r.comentario}”</p>}
            </div>
          </dl>
          <div>
            <label
              htmlFor="nota-revision"
              className="block text-xs font-bold text-gray-500 uppercase mb-1.5"
            >
              Nota de revisión{' '}
              <span className="normal-case font-medium text-gray-400">(opcional)</span>
            </label>
            <input
              id="nota-revision"
              value={nota}
              onChange={e => setNota(e.target.value)}
              placeholder="Ej: estaba en la otra repisa"
              className="w-full bg-cai-surface border border-cai-border rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <p className="text-xs text-gray-500">
            Marcarlo como revisado no cambia las existencias. Si el registro está mal, corrígelo con
            “Ajustar stock”.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onAjustarStock(articulo)}
              className="flex-1 py-3 rounded-xl border border-cai-border text-sm font-bold text-cai-dark hover:bg-cai-surface cursor-pointer transition-colors duration-[120ms]"
            >
              Ajustar stock
            </button>
            <button
              disabled={guardando}
              onClick={async () => {
                setGuardando(true)
                await onMarcarRevisado(r, nota)
                setGuardando(false)
              }}
              className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold disabled:opacity-50 cursor-pointer transition-colors duration-[120ms]"
            >
              Marcar como revisado
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
