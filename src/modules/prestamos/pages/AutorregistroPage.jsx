import React, { useEffect, useState } from 'react'
import { ScanBarcode, Mail, CheckCircle2 } from 'lucide-react'

import { PublicHeader, PublicFooter, PublicHero, TurnstileWidget } from '../../shared'
import '../../shared/publicBrand.css'
import { normalizeRut, isValidRut } from '../../../utils/rutUtils'
import { CARRERAS } from '../constants'
import { autorregistroApi } from '../services/autorregistroApi'

function errorDetalle(err, fallback) {
  return err?.response?.data?.detail || fallback
}

function Card({ children }) {
  return (
    <div className="pub-fade-in w-full max-w-md rounded-[20px] border bg-[var(--pub-surface)] border-[var(--pub-borde)] border-t-4 border-t-[color:var(--pub-amarillo)] shadow-[0_4px_12px_rgba(0,0,0,.10)] p-8">
      {children}
    </div>
  )
}

/** Un uso específico de los datos, con su propio checkbox — nunca un "acepto
 * todo" genérico que tape varios usos distintos bajo un solo texto. */
function UsoEspecifico({ uso, aceptado, onChange }) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--pub-borde)] cursor-pointer">
      <input
        type="checkbox"
        checked={aceptado}
        onChange={e => onChange(uso.id, e.target.checked)}
        className="w-4 h-4 mt-0.5 accent-[#16A34A] cursor-pointer"
      />
      <span>
        <span className="block text-xs font-bold text-[var(--pub-texto)] mb-0.5">{uso.titulo}</span>
        <span className="block text-[11px] text-[var(--pub-muted)] leading-relaxed">
          {uso.texto}
        </span>
      </span>
    </label>
  )
}

function PasoDatos({ onSolicitado }) {
  const [esIntercambio, setEsIntercambio] = useState(false)
  const [rut, setRut] = useState('')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [carrera, setCarrera] = useState('')
  const [carreraOtro, setCarreraOtro] = useState(false)
  const [terminos, setTerminos] = useState(null)
  const [usosAceptados, setUsosAceptados] = useState({})
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')

  useEffect(() => {
    autorregistroApi
      .obtenerTerminos()
      .then(setTerminos)
      .catch(() => {})
  }, [])

  const usos = terminos?.usos || []
  const faltaAceptarAlgo = usos.length > 0 && usos.some(u => !usosAceptados[u.id])

  const rutNormalizado = esIntercambio ? rut.trim() : normalizeRut(rut)
  const rutValido = esIntercambio ? rutNormalizado.length > 0 : isValidRut(rutNormalizado)

  function marcarUso(id, checked) {
    setUsosAceptados(prev => ({ ...prev, [id]: checked }))
  }

  async function enviar(e) {
    e.preventDefault()
    if (!rutValido || !nombre.trim() || !email.trim() || !carrera.trim()) {
      setError('Completa todos los campos obligatorios.')
      return
    }
    if (faltaAceptarAlgo) {
      setError('Debes aceptar cada uso de tus datos para continuar.')
      return
    }
    if (!turnstileToken) {
      setError('Completa la verificación anti-bot.')
      return
    }
    setCargando(true)
    setError('')
    try {
      const resultado = await autorregistroApi.solicitarVerificacion({
        rut: rutNormalizado,
        nombre: nombre.trim(),
        email: email.trim(),
        carrera: carrera.trim(),
        es_intercambio: esIntercambio,
        turnstile_token: turnstileToken,
      })
      onSolicitado({ ...resultado, rut: rutNormalizado })
    } catch (err) {
      setError(errorDetalle(err, 'No pudimos enviar el código. Intenta de nuevo.'))
    } finally {
      setCargando(false)
    }
  }

  return (
    <Card>
      <ScanBarcode className="w-8 h-8 mx-auto mb-3 text-[#16A34A]" />
      <h2 className="text-lg font-black text-[var(--pub-texto)] mb-1 text-center">
        Regístrate para pedir un préstamo
      </h2>
      <p className="text-[13px] text-[var(--pub-muted)] mb-5 text-center">
        Llena tus datos y muestra la pantalla siguiente al encargado del mesón.
      </p>

      <form onSubmit={enviar} className="space-y-3">
        <label className="flex items-center gap-2 text-xs font-bold text-[var(--pub-muted)]">
          <input
            type="checkbox"
            checked={esIntercambio}
            onChange={e => {
              setEsIntercambio(e.target.checked)
              setRut('')
            }}
            className="w-4 h-4 accent-[#16A34A] cursor-pointer"
          />
          Soy estudiante de intercambio
        </label>

        <div>
          <label className="block text-xs font-bold text-[var(--pub-muted)] mb-1">
            {esIntercambio ? 'Identificador' : 'RUT'}
          </label>
          <input
            type="text"
            inputMode={esIntercambio ? 'text' : 'numeric'}
            value={rut}
            onChange={e => setRut(e.target.value)}
            placeholder={esIntercambio ? 'Pasaporte o ID' : '12345678-9'}
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--pub-borde)] text-sm outline-none focus:border-[#16A34A]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--pub-muted)] mb-1">
            Nombre completo
          </label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--pub-borde)] text-sm outline-none focus:border-[#16A34A]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--pub-muted)] mb-1">Correo</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu-correo@ejemplo.cl"
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--pub-borde)] text-sm outline-none focus:border-[#16A34A]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--pub-muted)] mb-1">Carrera</label>
          <select
            value={carreraOtro ? '__otro__' : carrera}
            onChange={e => {
              if (e.target.value === '__otro__') {
                setCarreraOtro(true)
                setCarrera('')
              } else {
                setCarreraOtro(false)
                setCarrera(e.target.value)
              }
            }}
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--pub-borde)] text-sm outline-none focus:border-[#16A34A] bg-white"
          >
            <option value="">Seleccionar carrera...</option>
            {CARRERAS.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="__otro__">Otra...</option>
          </select>
          {carreraOtro && (
            <input
              type="text"
              value={carrera}
              onChange={e => setCarrera(e.target.value)}
              placeholder="Escribe tu carrera"
              className="w-full mt-2 px-3 py-2.5 rounded-lg border border-[var(--pub-borde)] text-sm outline-none focus:border-[#16A34A]"
            />
          )}
        </div>

        {usos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-[var(--pub-texto)]">
              Para continuar, acepta cada uso de tus datos por separado:
            </p>
            {usos.map(uso => (
              <UsoEspecifico
                key={uso.id}
                uso={uso}
                aceptado={!!usosAceptados[uso.id]}
                onChange={marcarUso}
              />
            ))}
            {terminos?.derechos && (
              <p className="text-[11px] text-[var(--pub-muted)] leading-relaxed px-1">
                {terminos.derechos}
              </p>
            )}
          </div>
        )}

        <TurnstileWidget onToken={setTurnstileToken} />

        {error && <p className="text-xs text-[#DC2626]">{error}</p>}

        <button
          type="submit"
          disabled={cargando || faltaAceptarAlgo || !turnstileToken}
          className="w-full py-2.5 rounded-lg text-sm font-bold text-white border-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#16A34A' }}
        >
          {cargando ? 'Enviando…' : 'Enviar código a mi correo'}
        </button>
      </form>
    </Card>
  )
}

function PasoVerificar({ solicitud, onVerificado, onVolver }) {
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function confirmar(e) {
    e.preventDefault()
    if (codigo.length !== 6) return
    setCargando(true)
    setError('')
    try {
      await autorregistroApi.confirmarVerificacion({
        verificacion_id: solicitud.verificacion_id,
        codigo,
      })
      onVerificado(solicitud.rut)
    } catch (err) {
      setError(errorDetalle(err, 'Código incorrecto.'))
    } finally {
      setCargando(false)
    }
  }

  return (
    <Card>
      <Mail className="w-8 h-8 mx-auto mb-3 text-[#16A34A]" />
      <h2 className="text-lg font-black text-[var(--pub-texto)] mb-1 text-center">
        Revisa tu correo
      </h2>
      <p className="text-[13px] text-[var(--pub-muted)] mb-5 text-center">
        Enviamos un código a <strong>{solicitud.email_enmascarado}</strong>.
      </p>
      <form onSubmit={confirmar}>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={codigo}
          onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          className="w-full px-3 py-2.5 mb-4 rounded-lg border border-[var(--pub-borde)] text-center text-2xl font-black tracking-[8px] outline-none focus:border-[#16A34A]"
        />
        {error && <p className="text-xs text-[#DC2626] mb-3">{error}</p>}
        <button
          type="submit"
          disabled={cargando || codigo.length !== 6}
          className="w-full py-2.5 rounded-lg text-sm font-bold text-white border-0 cursor-pointer disabled:opacity-60 mb-3"
          style={{ backgroundColor: '#16A34A' }}
        >
          {cargando ? 'Verificando…' : 'Confirmar'}
        </button>
      </form>
      <button
        type="button"
        onClick={onVolver}
        className="w-full text-xs text-[var(--pub-muted)] underline cursor-pointer"
      >
        ← Volver a editar mis datos
      </button>
    </Card>
  )
}

function PasoListo({ rut }) {
  return (
    <Card>
      <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-[#16A34A]" />
      <h2 className="text-lg font-black text-[var(--pub-texto)] mb-1 text-center">¡Listo!</h2>
      <p className="text-[13px] text-[var(--pub-muted)] mb-5 text-center">
        Muestra esta pantalla al encargado del mesón para que ingrese tu RUT.
      </p>
      <div className="p-4 rounded-lg bg-[var(--pub-bg)] border border-[var(--pub-borde)] text-center">
        <p className="text-[11px] font-bold text-[var(--pub-muted)] uppercase mb-1">
          Tu identificador
        </p>
        <p className="text-2xl font-black text-[var(--pub-texto)] tracking-wider">{rut}</p>
      </div>
    </Card>
  )
}

export default function AutorregistroPage() {
  const [paso, setPaso] = useState('datos')
  const [solicitud, setSolicitud] = useState(null)
  const [rutFinal, setRutFinal] = useState('')

  // Página pública: título propio en la pestaña del navegador y forzar light
  // mode aunque el ThemeProvider del panel interno intente re-aplicar .dark.
  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('dark')
    document.title = 'Préstamos · CAi'
    const observer = new window.MutationObserver(() => {
      if (html.classList.contains('dark')) html.classList.remove('dark')
    })
    observer.observe(html, { attributes: true, attributeFilter: ['class'] })
    return () => {
      observer.disconnect()
      if (localStorage.getItem('cai-theme') === 'dark') html.classList.add('dark')
      document.title = 'Gestión CAi'
    }
  }, [])

  return (
    <div className="public-cai min-h-screen flex flex-col">
      <PublicHeader />
      <PublicHero
        title="Préstamos de implementos"
        description="Regístrate y muestra la pantalla al encargado del mesón para retirar lo que necesites."
      />

      <main className="flex-1 flex items-start justify-center px-4 py-8">
        {paso === 'datos' && (
          <PasoDatos
            onSolicitado={s => {
              setSolicitud(s)
              setPaso('verificar')
            }}
          />
        )}
        {paso === 'verificar' && (
          <PasoVerificar
            solicitud={solicitud}
            onVerificado={rut => {
              setRutFinal(rut)
              setPaso('listo')
            }}
            onVolver={() => setPaso('datos')}
          />
        )}
        {paso === 'listo' && <PasoListo rut={rutFinal} />}
      </main>

      <PublicFooter variant="minimal" />
    </div>
  )
}
