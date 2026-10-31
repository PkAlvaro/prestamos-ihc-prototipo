import React, { useEffect, useRef, useState } from 'react'
import { Clock, Mail, Minimize2, Package, Play, User, X } from 'lucide-react'

export const MOTIVOS_ESPERA = [
  'Esperando código del correo',
  'Fue a buscar su credencial',
  'Buscando el artículo en bodega',
  'Volverá en un momento',
]

function useAhora(intervaloMs = 30000) {
  const [ahora, setAhora] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), intervaloMs)
    return () => clearInterval(id)
  }, [intervaloMs])
  return ahora
}

const minutosDesde = (t, ahora) => Math.max(0, Math.floor((ahora - t) / 60000))

function textoEspera(desde, ahora) {
  const min = minutosDesde(desde, ahora)
  return min < 1 ? 'recién' : `hace ${min} min`
}

/**
 * Botón "Poner en espera": minimiza la atención en curso. Al hacer clic pide
 * el motivo con un toque (sin escribir), para que al volver se sepa por qué
 * quedó pendiente.
 */
export function PonerEnEsperaBoton({ onMinimizar, disabled }) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!abierto) return
    const cerrar = e => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false)
    }
    const escape = e => e.key === 'Escape' && setAbierto(false)
    document.addEventListener('mousedown', cerrar)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', cerrar)
      document.removeEventListener('keydown', escape)
    }
  }, [abierto])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto(v => !v)}
        disabled={disabled}
        aria-expanded={abierto}
        className="w-full h-full px-4 py-4 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-sm font-bold flex items-center justify-center gap-2 transition-colors duration-[120ms] cursor-pointer disabled:opacity-50"
        title="Guardar esta atención y atender a otra persona"
      >
        <Minimize2 className="w-4 h-4" /> Poner en espera
      </button>
      {abierto && (
        <div className="absolute right-0 bottom-[calc(100%+8px)] z-30 w-72 rounded-xl bg-white border border-cai-border shadow-xl p-2">
          <p className="px-2 pt-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            ¿Por qué queda en espera?
          </p>
          {MOTIVOS_ESPERA.map(motivo => (
            <button
              key={motivo}
              type="button"
              onClick={() => {
                setAbierto(false)
                onMinimizar(motivo)
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-cai-black hover:bg-amber-50 transition-colors duration-[120ms] cursor-pointer"
            >
              {motivo}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Bandeja de atenciones minimizadas. Cada tarjeta muestra a quién se atendía,
 * qué llevaba en el carrito, por qué espera y desde cuándo.
 */
export default function AtencionesEnEspera({ atenciones, onRetomar, onDescartar }) {
  const ahora = useAhora()
  if (atenciones.length === 0) return null

  return (
    <section
      aria-label="Atenciones en espera"
      className="mb-5 p-3 rounded-xl border border-amber-200 bg-amber-50"
    >
      <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        En espera ({atenciones.length})
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {atenciones.map(a => {
          const nombre =
            a.estudiante?.nombre ||
            a.registro?.nuevoEstudiante.nombre ||
            a.registro?.nuevoEstudiante.rut ||
            'Registro sin nombre'
          const unidades = a.articulos.reduce((n, x) => n + x.cantidad, 0)
          const verif = a.registro?.verificacion
          const minutosCodigo = verif ? Math.round((verif.expiraEn - ahora) / 60000) : null
          const largaEspera = minutosDesde(a.desde, ahora) >= 10
          return (
            <article
              key={a.id}
              className={`bg-white rounded-lg px-3 py-2.5 border ${largaEspera ? 'border-orange-300' : 'border-amber-100'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-cai-dark truncate flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    {nombre}
                  </p>
                  <p className="text-[11px] text-amber-800 font-semibold mt-0.5">{a.motivo}</p>
                </div>
                <span
                  className={`text-[10px] font-semibold shrink-0 ${largaEspera ? 'text-orange-600' : 'text-gray-400'}`}
                  title={new Date(a.desde).toLocaleTimeString('es-CL')}
                >
                  {textoEspera(a.desde, ahora)}
                </span>
              </div>
              <div className="mt-1.5 space-y-0.5 text-[11px] text-gray-500">
                {a.registro && !a.estudiante && (
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 shrink-0" />
                    {verif
                      ? `Código enviado a ${verif.emailEnmascarado} · ${minutosCodigo > 0 ? `vence en ${minutosCodigo} min` : 'código vencido'}`
                      : 'Registro a medio llenar'}
                  </p>
                )}
                {unidades > 0 && (
                  <p className="flex items-center gap-1.5 truncate">
                    <Package className="w-3 h-3 shrink-0" />
                    {a.articulos
                      .map(x => `${x.cantidad > 1 ? `${x.cantidad}× ` : ''}${x.nombre}`)
                      .join(', ')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 mt-2">
                <button
                  type="button"
                  onClick={() => onRetomar(a.id)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors duration-[120ms] cursor-pointer"
                >
                  <Play className="w-3 h-3" /> Retomar
                </button>
                <button
                  type="button"
                  onClick={() => onDescartar(a.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-[120ms] cursor-pointer"
                  title="Descartar (la persona se fue)"
                  aria-label={`Descartar atención de ${nombre}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
