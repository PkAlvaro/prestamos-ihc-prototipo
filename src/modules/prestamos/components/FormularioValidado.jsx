import React, { useMemo, useRef, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import useEscape from '../hooks/useEscape'
import { buscarMaterialRegistrado } from '../utils/validacionInventario'

const sinTildes = s =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

const INPUT =
  'w-full bg-cai-surface border rounded-xl py-3 px-4 text-sm font-semibold text-cai-black outline-none transition-shadow duration-[120ms] focus:ring-2'
const INPUT_OK = 'border-cai-border focus:ring-emerald-500/30'
const INPUT_ERROR = 'border-red-400 bg-red-50/40 focus:ring-red-400/30'

/** Campo de texto que sugiere materiales registrados mientras se escribe. */
function CampoMaterial({ campo, valor, onCambiar, onSalir, error, inputRef, describedBy }) {
  const [abierto, setAbierto] = useState(false)
  const q = sinTildes(valor).trim()
  const opciones = useMemo(
    () =>
      q
        ? campo.materiales
            .filter(m => sinTildes(`${m.nombre} ${m.codigo ?? ''}`).includes(q))
            .slice(0, 6)
        : [],
    [q, campo.materiales]
  )
  const elegido = buscarMaterialRegistrado(valor, campo.materiales)

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={campo.id}
        type="text"
        role="combobox"
        aria-expanded={abierto && opciones.length > 0}
        aria-autocomplete="list"
        aria-invalid={!!error}
        aria-describedby={describedBy}
        autoComplete="off"
        value={valor}
        placeholder={campo.placeholder}
        onChange={e => {
          onCambiar(e.target.value)
          setAbierto(true)
        }}
        onFocus={() => setAbierto(true)}
        onBlur={() => setTimeout(() => (setAbierto(false), onSalir()), 120)}
        className={`${INPUT} ${error ? INPUT_ERROR : INPUT_OK}`}
      />
      {abierto && opciones.length > 0 && !elegido && (
        <ul
          role="listbox"
          className="absolute z-20 left-0 right-0 mt-1 rounded-xl bg-white border border-cai-border shadow-xl overflow-hidden"
        >
          {opciones.map(m => (
            <li key={m.id} role="option" aria-selected="false">
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => {
                  onCambiar(m.nombre)
                  setAbierto(false)
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 cursor-pointer transition-colors duration-[120ms]"
              >
                <span className="block text-sm font-semibold text-cai-black">{m.nombre}</span>
                <span className="block text-[11px] text-gray-400">
                  {m.codigo && <span className="font-mono">{m.codigo} · </span>}
                  {m.stock_disponible} libres de {m.stock_total}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {elegido && (
        <p className="mt-1.5 text-[11px] text-emerald-700 font-semibold">
          ✓ {elegido.nombre}: hoy tiene {elegido.stock_total} en total ({elegido.stock_disponible}{' '}
          libres)
        </p>
      )}
    </div>
  )
}

/**
 * Formulario en ventana con validación por campo (mejora 5): al enviar se revisan
 * todos los campos; los que fallan muestran su mensaje al lado y se enfoca el
 * primero. Lo ya escrito nunca se borra. Tras salir de un campo con error, el
 * mensaje se actualiza mientras se corrige.
 *
 * `campos`: [{ id, etiqueta, tipo: 'texto' | 'cantidad' | 'material', placeholder,
 *   ayuda, opcional, validar(valor, valores) → mensaje | null, aviso(valor, valores)
 *   → nodo | null, materiales (solo 'material') }]
 * `onEnviar(valores)` devuelve true si se guardó (se cierra) o false (se mantiene abierto).
 */
export default function FormularioValidado({
  titulo,
  marca = null,
  cabecera = null,
  campos,
  valoresIniciales = {},
  textoEnviar = 'Guardar',
  onEnviar,
  onCerrar,
  ancho = 'max-w-sm',
}) {
  const [valores, setValores] = useState(() =>
    Object.fromEntries(campos.map(c => [c.id, valoresIniciales[c.id] ?? '']))
  )
  const [errores, setErrores] = useState({})
  const [revisados, setRevisados] = useState({})
  const [enviando, setEnviando] = useState(false)
  const refs = useRef({})
  // Valores al día para validar al salir de un campo (el de material lo hace con retardo)
  const valoresRef = useRef(valores)
  valoresRef.current = valores
  useEscape(onCerrar)

  const validarCampo = (campo, vals) => campo.validar?.(vals[campo.id], vals) ?? null

  const cambiar = (campo, valor) => {
    const nuevos = { ...valores, [campo.id]: valor }
    setValores(nuevos)
    if (revisados[campo.id]) {
      setErrores(e => ({ ...e, [campo.id]: validarCampo(campo, nuevos) }))
    }
  }

  const salir = campo => {
    const actuales = valoresRef.current
    if (!String(actuales[campo.id] ?? '').trim() && !revisados[campo.id]) return
    setRevisados(r => ({ ...r, [campo.id]: true }))
    setErrores(e => ({ ...e, [campo.id]: validarCampo(campo, actuales) }))
  }

  const enviar = async e => {
    e.preventDefault()
    const nuevosErrores = Object.fromEntries(campos.map(c => [c.id, validarCampo(c, valores)]))
    setErrores(nuevosErrores)
    setRevisados(Object.fromEntries(campos.map(c => [c.id, true])))
    const primero = campos.find(c => nuevosErrores[c.id])
    if (primero) {
      refs.current[primero.id]?.focus()
      return
    }
    setEnviando(true)
    const ok = await onEnviar(valores)
    setEnviando(false)
    if (ok) onCerrar()
  }

  const cantidadErrores = Object.values(errores).filter(Boolean).length

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="formulario-titulo"
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    >
      <form
        noValidate
        onSubmit={enviar}
        className={`rounded-2xl w-full ${ancho} overflow-visible shadow-2xl bg-white border border-cai-border`}
      >
        <div className="p-6 flex justify-between items-center bg-cai-surface border-b border-cai-border rounded-t-2xl">
          <div className="flex items-center gap-2">
            <h3 id="formulario-titulo" className="font-bold text-lg text-cai-black">
              {titulo}
            </h3>
            {marca}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer bg-white border border-cai-border text-[#888884] hover:bg-cai-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {cabecera}
          {campos.map(campo => {
            const error = errores[campo.id]
            const idAyuda = `${campo.id}-ayuda`
            const idError = `${campo.id}-error`
            const describedBy = [campo.ayuda && idAyuda, error && idError].filter(Boolean).join(' ')
            const aviso = campo.aviso?.(valores[campo.id], valores)
            const comunes = {
              id: campo.id,
              value: valores[campo.id],
              placeholder: campo.placeholder,
              'aria-invalid': !!error,
              'aria-describedby': describedBy || undefined,
              ref: el => (refs.current[campo.id] = el),
              onChange: e => cambiar(campo, e.target.value),
              onBlur: () => salir(campo),
              className: `${INPUT} ${error ? INPUT_ERROR : INPUT_OK}`,
            }
            return (
              <div key={campo.id}>
                <label
                  htmlFor={campo.id}
                  className="block text-xs font-bold text-gray-500 uppercase mb-1.5"
                >
                  {campo.etiqueta}
                  {campo.opcional && (
                    <span className="ml-1 normal-case font-medium text-gray-400">(opcional)</span>
                  )}
                </label>
                {campo.tipo === 'material' ? (
                  <CampoMaterial
                    campo={campo}
                    valor={valores[campo.id]}
                    onCambiar={v => cambiar(campo, v)}
                    onSalir={() => salir(campo)}
                    error={error}
                    inputRef={el => (refs.current[campo.id] = el)}
                    describedBy={describedBy || undefined}
                  />
                ) : campo.tipo === 'cantidad' ? (
                  <input {...comunes} type="text" inputMode="numeric" autoComplete="off" />
                ) : (
                  <input {...comunes} type="text" />
                )}
                {campo.ayuda && !error && (
                  <p id={idAyuda} className="mt-1.5 text-[11px] text-gray-400">
                    {campo.ayuda}
                  </p>
                )}
                {error && (
                  <p
                    id={idError}
                    role="alert"
                    className="mt-1.5 flex items-start gap-1 text-xs font-semibold text-red-600"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                    {error}
                  </p>
                )}
                {aviso}
              </div>
            )
          })}
          {cantidadErrores > 0 && (
            <p className="text-xs text-gray-500">
              Corrige{' '}
              {cantidadErrores === 1
                ? 'el campo marcado'
                : `los ${cantidadErrores} campos marcados`}
              ; lo demás se mantiene como lo dejaste.
            </p>
          )}
          <button
            type="submit"
            disabled={enviando}
            className="w-full py-3.5 mt-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? 'Guardando…' : textoEnviar}
          </button>
        </div>
      </form>
    </div>
  )
}
