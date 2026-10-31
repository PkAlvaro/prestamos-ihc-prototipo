import React from 'react'

/**
 * Cabecera compartida de las páginas PÚBLICAS (sin sesión) — replica el
 * bloque de marca del header real del sitio de CAi (logo + wordmark con
 * reveal letra-por-letra + "UC", línea amarilla inferior) para que ambos
 * proyectos se sientan la misma familia. Ver `publicBrand.css` para los
 * tokens.
 *
 * `variant`: 'light' (fondo blanco, texto negro — la mayoría) | 'dark' (fondo
 * negro, para páginas que ya abren con una franja oscura, como la papeleta).
 */

let revealCounter = 0
function revealLetters(text) {
  const nbsp = ' '
  return Array.from(text.split(' ').join(nbsp)).map(ch => ({ ch, i: revealCounter++ }))
}

function BrandWordmark() {
  revealCounter = 0
  const centro = revealLetters('entro de ')
  const alumnos = revealLetters('lumnos ')
  const ingenieria = revealLetters('ngeniería')
  return (
    <span className="pub-brand-copy">
      <span className="pub-brand-wordmark">
        <span className="pub-brand-initial">C</span>
        <span className="pub-brand-reveal pub-brand-reveal-centro">
          {centro.map(({ ch, i }) => (
            <span key={i} className="pub-brand-reveal-letter" style={{ '--i': i }}>
              {ch}
            </span>
          ))}
        </span>
        <span className="pub-brand-initial">A</span>
        <span className="pub-brand-reveal pub-brand-reveal-alumnos">
          {alumnos.map(({ ch, i }) => (
            <span key={i} className="pub-brand-reveal-letter" style={{ '--i': i }}>
              {ch}
            </span>
          ))}
        </span>
        <span className="pub-brand-initial pub-brand-initial-i">i</span>
        <span className="pub-brand-reveal pub-brand-reveal-ingenieria">
          {ingenieria.map(({ ch, i }) => (
            <span key={i} className="pub-brand-reveal-letter" style={{ '--i': i }}>
              {ch}
            </span>
          ))}
        </span>
      </span>
      <span className="pub-brand-uc">UC</span>
    </span>
  )
}

export default function PublicHeader({ variant = 'light', homeHref = '#/', rightLink }) {
  const dark = variant === 'dark'
  return (
    <header
      style={{
        background: dark ? 'transparent' : 'var(--pub-surface)',
        borderBottom: dark ? '1px solid rgba(255,255,255,.1)' : '1px solid var(--pub-borde)',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          height: 84,
        }}
      >
        <a
          href={homeHref}
          className="pub-brand"
          style={{ color: dark ? '#fff' : 'inherit', paddingBottom: 10 }}
        >
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Logo CAi"
            style={{ width: 48, height: 48, objectFit: 'contain' }}
          />
          <BrandWordmark />
        </a>
        {rightLink && (
          <a
            href={rightLink.href}
            onClick={rightLink.onClick}
            className={`pub-u2bg${dark ? ' pub-u2bg--amber' : ''}`}
            style={{ fontSize: 12, marginBottom: 10 }}
          >
            {rightLink.label}
          </a>
        )}
      </div>
      <div style={{ height: 2, background: 'var(--pub-amarillo)' }} />
    </header>
  )
}
