import React from 'react'
import { CalendarClock, Package, User } from 'lucide-react'
import { formatFechaHora, haceCuanto } from '../utils/fechas'

/**
 * Ficha que se muestra antes de registrar una devolución: quién devuelve, qué
 * objeto (con su código de inventario, el de la etiqueta) y desde cuándo lo
 * tenía. Sirve para comprobar contra el objeto físico antes de confirmar.
 */
export default function ResumenDevolucion({ prestamo }) {
  const filas = [
    {
      icono: User,
      etiqueta: 'Estudiante',
      valor: prestamo.estudiante_nombre,
      detalle: prestamo.estudiante_rut,
    },
    {
      icono: Package,
      etiqueta: 'Objeto',
      valor: prestamo.articulo_nombre,
      detalle: prestamo.articulo_codigo ? `Código ${prestamo.articulo_codigo}` : null,
    },
    {
      icono: CalendarClock,
      etiqueta: 'Prestado el',
      valor: formatFechaHora(prestamo.fecha_prestamo),
      detalle: haceCuanto(prestamo.fecha_prestamo),
    },
  ]
  return (
    <dl className="rounded-xl border border-cai-border bg-cai-surface divide-y divide-cai-border">
      {filas.map(({ icono: Icono, etiqueta, valor, detalle }) => (
        <div key={etiqueta} className="flex items-center gap-3 px-4 py-3">
          <Icono className="w-4 h-4 text-gray-400 shrink-0" />
          <dt className="w-24 shrink-0 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {etiqueta}
          </dt>
          <dd className="min-w-0">
            <p className="text-sm font-bold text-cai-black truncate">{valor}</p>
            {detalle && <p className="text-[11px] text-gray-500 font-mono">{detalle}</p>}
          </dd>
        </div>
      ))}
    </dl>
  )
}
