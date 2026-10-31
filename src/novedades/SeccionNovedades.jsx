import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useNovedades, etiquetaNovedad, visiblesEnVitrina } from './NovedadesContext'
import ControlesNovedades from './ControlesNovedades'

/** Tarjetas del inicio: una por mejora, con el problema, la propuesta y "Probar". */
export default function SeccionNovedades() {
  const { catalogo: completo, iniciarEscenario } = useNovedades()
  const catalogo = visiblesEnVitrina(completo)
  const navigate = useNavigate()

  return (
    <section aria-labelledby="novedades-titulo" className="mt-2">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <h2
          id="novedades-titulo"
          className="text-xs font-bold uppercase tracking-widest text-cai-black flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4 text-amber-500" /> Decisiones de diseño ({catalogo.length})
        </h2>
        <ControlesNovedades oscuro={false} />
      </div>
      <p className="text-xs text-cai-gray mb-4">
        Cada una abre la pantalla ya preparada con una guía de qué probar. Arriba a la derecha del
        panel puedes alternar entre la versión <strong>Original</strong> y la con{' '}
        <strong>Mejoras</strong> para comparar.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {catalogo.map(n => {
          const Icono = n.icono
          return (
            <article
              key={n.id}
              className="relative flex flex-col bg-white border-2 border-cai-yellow rounded-lg p-5"
            >
              <span className="absolute -top-3 left-4 px-2 py-0.5 rounded-full bg-cai-yellow text-cai-black text-[10px] font-black uppercase tracking-wide">
                {etiquetaNovedad(n)}
              </span>
              <Icono className="w-6 h-6 text-mod-prestamos mb-3" />
              <h3 className="font-bold text-cai-black mb-2">{n.titulo}</h3>
              <p className="text-xs text-cai-gray leading-relaxed mb-1">
                <strong className="text-cai-black">Problema:</strong> {n.problema}
              </p>
              <p className="text-xs text-cai-gray leading-relaxed mb-4">
                <strong className="text-cai-black">Propuesta:</strong> {n.solucion}
              </p>
              <button
                onClick={() => {
                  iniciarEscenario(n.id)
                  navigate(n.ruta)
                }}
                className="mt-auto w-full py-2 rounded-lg bg-cai-black hover:bg-black text-white text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-[120ms]"
              >
                Probar <ArrowRight className="w-4 h-4" />
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
