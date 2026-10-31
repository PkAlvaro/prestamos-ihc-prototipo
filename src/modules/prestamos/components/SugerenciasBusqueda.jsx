import React from 'react'
import { Package, User } from 'lucide-react'
import { MarcaNuevo, useNovedad } from '../../../novedades'
import { AvisoPorRevisar } from './DisponibilidadPorRevisar'

const formatPesos = n => `$${(n ?? 0).toLocaleString('es-CL')}`

/** Fila de un material sugerido: nombre, código, disponibilidad y, si aplica, por qué coincide. */
export function FilaMaterial({ art, primero, resaltado = false, onElegir, onResaltar }) {
  const { activa: conSinonimos } = useNovedad('busqueda-sinonimos')
  const { activa: conReportes } = useNovedad('diferencia-disponibilidad')
  const sinUnidades = art.stock_disponible <= 0
  return (
    <button
      role="option"
      aria-selected={resaltado}
      onClick={() => onElegir(art)}
      onMouseEnter={onResaltar}
      className={`w-full text-left px-5 py-3 transition-colors duration-[120ms] flex items-center gap-3 outline-none border-b border-cai-border cursor-pointer ${resaltado ? 'bg-emerald-50' : 'hover:bg-[var(--surface-lt)]'}`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${sinUnidades ? 'bg-gray-100' : 'bg-emerald-100'}`}
      >
        <Package className={`w-4 h-4 ${sinUnidades ? 'text-gray-400' : 'text-emerald-600'}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate text-cai-black">{art.nombre}</p>
        <p
          className={`text-[10px] font-semibold uppercase tracking-wider ${sinUnidades ? 'text-gray-400' : 'text-emerald-600'}`}
        >
          {conSinonimos && art.codigo && <span className="text-gray-400">{art.codigo} · </span>}
          {sinUnidades
            ? 'Sin unidades libres'
            : `${art.stock_disponible} disponible${art.stock_disponible !== 1 ? 's' : ''}`}
        </p>
        {conReportes && art.reporte_pendiente && (
          <div className="mt-1">
            <AvisoPorRevisar articulo={art} compacto />
          </div>
        )}
      </div>
      {art._coincidencia && (
        <span
          className="shrink-0 max-w-[45%] truncate px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-semibold"
          title={
            art._coincidencia.tipo === 'alias'
              ? 'Coincide con otro nombre registrado para este artículo'
              : 'Coincide por sinónimo'
          }
        >
          «{art._coincidencia.buscado}» ={' '}
          {art._coincidencia.tipo === 'alias' ? 'otro nombre' : art._coincidencia.es}
          {primero && <MarcaNuevo novedad="busqueda-sinonimos" className="ml-1" />}
        </span>
      )}
    </button>
  )
}

function FilaPersona({ persona, resaltado, onElegir, onResaltar }) {
  return (
    <button
      role="option"
      aria-selected={resaltado}
      onClick={() => onElegir(persona)}
      onMouseEnter={onResaltar}
      className={`w-full text-left px-5 py-3 transition-colors duration-[120ms] flex items-center gap-3 outline-none border-b border-cai-border cursor-pointer ${resaltado ? 'bg-emerald-50' : 'hover:bg-[var(--surface-lt)]'}`}
    >
      <div className="w-8 h-8 rounded-full bg-cai-surface border border-cai-border flex items-center justify-center shrink-0">
        <User className="w-4 h-4 text-gray-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate text-cai-black">{persona.nombre}</p>
        <p className="text-[11px] font-mono text-gray-500">{persona.rut}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {persona.multa_acumulada > 0 && (
          <span className="px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-bold">
            Multa {formatPesos(persona.multa_acumulada)}
          </span>
        )}
        {!persona.consentimiento_aceptado && (
          <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold">
            Falta consentimiento
          </span>
        )}
      </div>
    </button>
  )
}

function Grupo({ titulo, cantidad, children, marca }) {
  return (
    <div role="group" aria-label={titulo}>
      <p className="px-5 py-1.5 bg-cai-surface border-b border-cai-border text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
        {titulo} ({cantidad}) {marca}
      </p>
      {children}
    </div>
  )
}

/** Lista plana en el orden en que se muestran (personas, luego materiales), para el teclado. */
export const itemsDeBusqueda = (personas, materiales) => [
  ...personas.map(p => ({ tipo: 'persona', valor: p })),
  ...materiales.map(m => ({ tipo: 'material', valor: m })),
]

/**
 * Resultados de la barra principal agrupados en «Personas» (nombre y RUT) y
 * «Materiales» (nombre y disponibilidad), mejora 6. Si lo escrito coincide con
 * ambos, se ven las dos secciones y el encargado elige el registro que corresponde.
 * ↑/↓ mueven el resaltado y Enter elige.
 */
export default function SugerenciasBusqueda({
  personas,
  materiales,
  resaltado,
  setResaltado,
  onPersona,
  onMaterial,
}) {
  return (
    <div
      role="listbox"
      aria-label="Resultados de búsqueda"
      className="absolute top-[100%] left-0 right-0 mt-2 rounded-xl shadow-xl overflow-hidden z-50 bg-white border border-cai-border max-h-[60vh] overflow-y-auto"
    >
      {personas.length > 0 && (
        <Grupo
          titulo="Personas"
          cantidad={personas.length}
          marca={<MarcaNuevo novedad="busqueda-personas" />}
        >
          {personas.map((p, i) => (
            <FilaPersona
              key={p.id}
              persona={p}
              resaltado={resaltado === i}
              onElegir={onPersona}
              onResaltar={() => setResaltado(i)}
            />
          ))}
        </Grupo>
      )}
      {materiales.length > 0 && (
        <Grupo titulo="Materiales" cantidad={materiales.length}>
          {materiales.map((art, i) => (
            <FilaMaterial
              key={art.id}
              art={art}
              primero={i === 0}
              resaltado={resaltado === personas.length + i}
              onElegir={onMaterial}
              onResaltar={() => setResaltado(personas.length + i)}
            />
          ))}
        </Grupo>
      )}
    </div>
  )
}
