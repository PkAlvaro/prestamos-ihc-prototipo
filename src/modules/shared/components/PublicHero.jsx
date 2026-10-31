import React from 'react'

/**
 * Franja oscura de título de las páginas PÚBLICAS (bajo `PublicHeader`): eyebrow
 * amarillo, título y bajada. Es el mismo bloque en salas, solicitudes, préstamos y
 * entradas, para que todas se lean como una sola familia.
 */
export default function PublicHero({ eyebrow = 'Servicios', title, description }) {
  return (
    <div style={{ background: 'var(--pub-negro)' }} className="py-6 px-6 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute -top-10 -right-5 w-40 h-40 rounded-full blur-3xl"
        style={{ background: 'rgba(253,212,7,.10)' }}
      />
      <div className="max-w-2xl mx-auto relative">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-1.5 text-[var(--pub-amarillo)]">
          {eyebrow}
        </p>
        <h1 className="font-extrabold text-white text-2xl leading-[1.2]">{title}</h1>
        {description && <p className="text-[13px] text-white/60 mt-1.5">{description}</p>}
      </div>
    </div>
  )
}
