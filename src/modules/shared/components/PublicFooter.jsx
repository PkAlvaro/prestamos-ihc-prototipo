import React from 'react'

/**
 * Pie compartido de las páginas PÚBLICAS. `variant`: 'full' (dirección
 * institucional) | 'minimal' (una línea con el logo pequeño, para pantallas cortas como
 * check-in o la papeleta de votación, donde cada centímetro extra es fricción).
 */
export default function PublicFooter({ variant = 'full' }) {
  if (variant === 'minimal') {
    return (
      <footer
        style={{
          background: 'var(--pub-negro)',
          borderTop: '3px solid var(--pub-amarillo)',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="Logo CAi"
          style={{ width: 22, height: 22, objectFit: 'contain' }}
        />
        <p style={{ margin: 0, color: 'rgba(255,255,255,.5)', fontSize: 11 }}>
          Centro de Alumnos Ingeniería UC
        </p>
      </footer>
    )
  }

  return (
    <footer
      style={{
        background: 'var(--pub-negro)',
        borderTop: '3px solid var(--pub-amarillo)',
        padding: '20px 24px',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="Logo CAi"
          style={{ width: 28, height: 28, objectFit: 'contain' }}
        />
        <p style={{ margin: 0, color: 'rgba(255,255,255,.6)', fontSize: 11 }}>
          Centro de Alumnos Ingeniería UC
        </p>
      </div>
    </footer>
  )
}
