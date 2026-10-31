import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Lightbulb, X } from 'lucide-react'
import { useNovedades, etiquetaNovedad } from './NovedadesContext'

/**
 * Guía "Prueba esto" de la novedad que el revisor eligió en el inicio. Además,
 * prepara la pantalla con `novedad.preparar(contexto)` (p. ej. dejar un
 * estudiante escaneado); `preparar` devuelve false si aún faltan datos y se
 * reintenta cuando el contexto cambia.
 */
export default function GuiaNovedad({ contexto }) {
  const { catalogo, escenario, marcarPreparado, cerrarEscenario, iniciarEscenario } = useNovedades()
  const navigate = useNavigate()
  const indice = catalogo.findIndex(n => n.id === escenario?.id)
  const novedad = catalogo[indice]
  const siguiente = catalogo[indice + 1]

  const preparando = useRef(false)

  useEffect(() => {
    if (!novedad || escenario.preparado || !novedad.preparar || preparando.current) return
    preparando.current = true
    Promise.resolve(novedad.preparar(contexto)).then(listo => {
      preparando.current = false
      if (listo !== false) marcarPreparado()
    })
  }, [novedad, escenario, contexto, marcarPreparado])

  if (!novedad) return null

  return (
    <aside
      aria-label={`Guía: ${novedad.titulo}`}
      className="mb-5 rounded-xl border-2 border-cai-yellow bg-[#FFFBEA] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">
              {etiquetaNovedad(novedad)} · Prueba esto
            </p>
            <h2 className="font-bold text-cai-black">{novedad.titulo}</h2>
            <ol className="mt-2 space-y-1 text-sm text-gray-700 list-decimal pl-4">
              {novedad.pasos.map(paso => (
                <li key={paso}>{paso}</li>
              ))}
            </ol>
            {novedad.acciones?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {novedad.acciones.map(accion => (
                  <button
                    key={accion.texto}
                    onClick={() => accion.ejecutar(contexto)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-xs font-bold text-amber-900 cursor-pointer transition-colors duration-[120ms]"
                  >
                    {accion.texto}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={cerrarEscenario}
          aria-label="Cerrar guía"
          className="p-1.5 rounded-lg text-gray-400 hover:bg-amber-100 hover:text-gray-700 cursor-pointer transition-colors duration-[120ms] shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {siguiente && (
        <button
          onClick={() => {
            iniciarEscenario(siguiente.id)
            navigate(siguiente.ruta)
          }}
          className="mt-3 ml-8 text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
        >
          Siguiente: {siguiente.titulo} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </aside>
  )
}
