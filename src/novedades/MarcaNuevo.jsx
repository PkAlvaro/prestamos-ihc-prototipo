import React from 'react'
import { Sparkles } from 'lucide-react'
import { useNovedades } from './NovedadesContext'

/**
 * Etiqueta "Nuevo" sobre un elemento agregado por una mejora. Se oculta en modo
 * original o si el revisor apaga las marcas. `flotante` la pega a la esquina del
 * contenedor (que debe ser `relative`).
 */
export default function MarcaNuevo({ novedad, flotante = false, className = '' }) {
  const ctx = useNovedades()
  if (!ctx || ctx.modo !== 'mejoras' || !ctx.marcas) return null
  const entrada = ctx.catalogo.find(n => n.id === novedad)
  return (
    <span
      title={entrada ? `Mejora ${entrada.numero}: ${entrada.titulo}` : 'Nuevo'}
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-cai-yellow text-cai-black text-[9px] font-black uppercase tracking-wide leading-none shadow-sm pointer-events-auto select-none ${flotante ? 'absolute -top-2 -right-2 z-10' : ''} ${className}`}
    >
      <Sparkles className="w-2.5 h-2.5" />
      Nuevo{entrada ? ` ${entrada.numero}` : ''}
    </span>
  )
}
