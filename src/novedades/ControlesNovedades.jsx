import React from 'react'
import { Sparkles } from 'lucide-react'
import { useNovedades } from './NovedadesContext'

/**
 * Controles del encabezado para quien revisa: alternar entre la interfaz original
 * y la con mejoras (para comparar) y mostrar u ocultar las marcas "Nuevo".
 */
export default function ControlesNovedades({ oscuro = true }) {
  const ctx = useNovedades()
  if (!ctx) return null
  const { modo, setModo, marcas, setMarcas } = ctx
  const base = oscuro ? 'border-white/20 text-white/60' : 'border-cai-border text-gray-500'
  const activo = oscuro ? 'bg-cai-yellow text-cai-black' : 'bg-cai-black text-white'

  return (
    <div className="flex items-center gap-1.5">
      <div
        role="radiogroup"
        aria-label="Versión de la interfaz"
        className={`flex rounded-md border overflow-hidden text-[11px] font-bold ${base}`}
      >
        {[
          ['original', 'Original'],
          ['mejoras', 'Mejoras'],
        ].map(([valor, texto]) => (
          <button
            key={valor}
            role="radio"
            aria-checked={modo === valor}
            onClick={() => setModo(valor)}
            className={`px-2 py-1 cursor-pointer transition-colors duration-[120ms] ${modo === valor ? activo : ''}`}
            title={
              valor === 'original'
                ? 'Ver la interfaz como es hoy, sin las mejoras'
                : 'Ver la interfaz con las mejoras propuestas'
            }
          >
            {texto}
          </button>
        ))}
      </div>
      <button
        onClick={() => setMarcas(!marcas)}
        disabled={modo !== 'mejoras'}
        aria-pressed={marcas}
        title={marcas ? 'Ocultar marcas "Nuevo"' : 'Mostrar marcas "Nuevo"'}
        className={`p-1.5 rounded-md border cursor-pointer transition-colors duration-[120ms] disabled:opacity-30 disabled:cursor-not-allowed ${base} ${marcas && modo === 'mejoras' ? activo : ''}`}
      >
        <Sparkles className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
