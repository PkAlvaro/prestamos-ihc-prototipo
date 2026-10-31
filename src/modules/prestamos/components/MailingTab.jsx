import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Mail,
  RefreshCw,
  Send,
  AlertCircle,
  CheckCircle2,
  UserX,
  Pencil,
  Check,
  X,
  Clock,
  Search,
  Activity,
  AlertTriangle,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Play,
} from 'lucide-react'
import { useAuth } from '../../auth'
import { prestamosApi } from '../services/prestamosApi'

const MOD_COLOR = '#16A34A'

const hasEmail = email => Boolean(email && email.includes('@'))

function formatFecha(fecha) {
  if (!fecha) return null
  return new Date(fecha).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatMulta(multa) {
  if (!multa) return '$0'
  return `$${multa.toLocaleString('es-CL')}`
}

const FILTROS_ESTADO = [
  { key: 'todos', label: 'Todos' },
  { key: 'sin_notificar', label: 'Sin notificar' },
  { key: 'notificados', label: 'Ya notificados' },
  { key: 'sin_correo', label: 'Sin correo' },
]

const FILTROS_MULTA = [
  { key: 'todos', label: 'Cualquier multa' },
  { key: 'cero', label: '$0' },
  { key: 'parcial', label: '$1 – $5.999' },
  { key: 'tope', label: '$6.000 (tope)' },
]

// ── Resend event config ──────────────────────────────────────────────────────

const EVENT_CONFIG = {
  delivered: {
    label: 'Entregado',
    color: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  opened: { label: 'Abierto', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  clicked: { label: 'Clic', color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  bounced: { label: 'Rebotado', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  delivery_delayed: {
    label: 'Retrasado',
    color: 'bg-orange-100 text-orange-700',
    dot: 'bg-orange-400',
  },
  complained: { label: 'Spam', color: 'bg-pink-100 text-pink-700', dot: 'bg-pink-500' },
  queued: { label: 'En cola', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
  sent: { label: 'Enviado', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
  suppressed: { label: 'Suprimido', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  unknown: { label: 'Desconocido', color: 'bg-gray-100 text-gray-400', dot: 'bg-gray-300' },
}

function EventBadge({ event }) {
  const cfg = EVENT_CONFIG[event] ?? EVENT_CONFIG.unknown
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ── Sub-componentes Recordatorios ────────────────────────────────────────────

function EditEmailCell({ prestamo, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!value.trim() || !value.includes('@')) return
    setSaving(true)
    try {
      await prestamosApi.actualizarEmailEstudiante(prestamo.estudiante_id, value.trim())
      onSaved(prestamo.id, value.trim().toLowerCase())
      setEditing(false)
      setValue('')
    } catch {
      // silently ignore — user can retry
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <button
        onClick={e => {
          e.stopPropagation()
          setEditing(true)
          setValue('')
        }}
        className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-600 cursor-pointer"
      >
        <UserX className="w-3 h-3" />
        Sin correo
        <Pencil className="w-2.5 h-2.5 opacity-60" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      <input
        autoFocus
        type="email"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') setEditing(false)
        }}
        placeholder="correo@ejemplo.cl"
        className="w-36 px-2 py-1 text-xs border border-emerald-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
      >
        {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
      </button>
      <button
        onClick={() => setEditing(false)}
        className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

const normalizeStr = s => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function RecordatoriosView({ ctx }) {
  const { prestamosVencidos, loadPrestamosData } = ctx
  const [selected, setSelected] = useState(new Set())
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroMulta, setFiltroMulta] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [emailOverrides, setEmailOverrides] = useState({})

  const rawVencidos = useMemo(() => {
    return (prestamosVencidos || []).map(p => ({
      ...p,
      estudiante_email: emailOverrides[p.id] ?? p.estudiante_email,
    }))
  }, [prestamosVencidos, emailOverrides])

  const vencidos = useMemo(() => {
    const q = normalizeStr(busqueda)
    return rawVencidos.filter(p => {
      if (filtroEstado === 'sin_notificar' && p.ultima_notificacion) return false
      if (filtroEstado === 'notificados' && !p.ultima_notificacion) return false
      if (filtroEstado === 'sin_correo' && hasEmail(p.estudiante_email)) return false

      const multa = p.multa_calculada ?? 0
      if (filtroMulta === 'cero' && multa !== 0) return false
      if (filtroMulta === 'parcial' && (multa <= 0 || multa >= 6000)) return false
      if (filtroMulta === 'tope' && multa < 6000) return false

      if (q) {
        const nombre = normalizeStr(p.estudiante_nombre)
        const rut = normalizeStr(p.estudiante_rut)
        if (!nombre.includes(q) && !rut.includes(q)) return false
      }

      return true
    })
  }, [rawVencidos, filtroEstado, filtroMulta, busqueda])

  const allIds = vencidos.map(p => p.id)
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id))
  const someSelected = selected.size > 0

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(allIds))
  }

  function toggleOne(id) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleEmailSaved(prestamoId, email) {
    setEmailOverrides(prev => ({ ...prev, [prestamoId]: email }))
  }

  async function handleEnviar() {
    if (!someSelected) return
    setSending(true)
    setResult(null)
    try {
      const ids = [...selected]
      const data = await prestamosApi.notificarVencidos(ids)
      setResult({ ok: true, ...data })
      setSelected(new Set())
      loadPrestamosData()
    } catch {
      setResult({ ok: false })
    } finally {
      setSending(false)
    }
  }

  const sinCorreoCount = rawVencidos.filter(p => !hasEmail(p.estudiante_email)).length
  const notificadosCount = rawVencidos.filter(p => p.ultima_notificacion).length

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-cai-dark">Recordatorios — Préstamos vencidos</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {rawVencidos.length} vencidos · {notificadosCount} notificados · {sinCorreoCount} sin
            correo
          </p>
        </div>
        <button
          onClick={() => {
            loadPrestamosData()
            setResult(null)
          }}
          className="px-4 py-2 bg-white/70 border border-gray-100 rounded-xl text-xs font-semibold flex gap-2 items-center hover:bg-white transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl px-1 py-1">
          {FILTROS_ESTADO.map(f => (
            <button
              key={f.key}
              onClick={() => {
                setFiltroEstado(f.key)
                setSelected(new Set())
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filtroEstado === f.key ? 'text-white' : 'text-gray-400 hover:text-gray-600'
              }`}
              style={filtroEstado === f.key ? { backgroundColor: MOD_COLOR } : {}}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl px-1 py-1">
          {FILTROS_MULTA.map(f => (
            <button
              key={f.key}
              onClick={() => {
                setFiltroMulta(f.key)
                setSelected(new Set())
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filtroMulta === f.key ? 'text-white' : 'text-gray-400 hover:text-gray-600'
              }`}
              style={filtroMulta === f.key ? { backgroundColor: MOD_COLOR } : {}}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
        <input
          type="text"
          placeholder="Buscar por nombre o RUT…"
          value={busqueda}
          onChange={e => {
            setBusqueda(e.target.value)
            setSelected(new Set())
          }}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-medium text-cai-dark placeholder:text-gray-300 focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>

      {/* Feedback envío */}
      {result && (
        <div
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
            result.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {result.ok ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
          )}
          <span>
            {result.ok
              ? `${result.enviados} correo${result.enviados !== 1 ? 's' : ''} enviado${result.enviados !== 1 ? 's' : ''} de ${result.total}.${result.sin_email > 0 ? ` ${result.sin_email} sin correo registrado.` : ''}`
              : 'Error al enviar notificaciones. Intenta de nuevo.'}
          </span>
        </div>
      )}

      {vencidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-300">
          <CheckCircle2 className="w-10 h-10" />
          <p className="text-sm font-medium">Sin resultados para este filtro</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
              />
              {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
              <span className="ml-1 text-xs text-gray-400">
                ({selected.size}/{vencidos.length})
              </span>
            </label>

            <button
              onClick={handleEnviar}
              disabled={!someSelected || sending}
              style={someSelected && !sending ? { backgroundColor: MOD_COLOR } : {}}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                someSelected && !sending
                  ? 'text-white hover:opacity-90'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              {sending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? 'Enviando…' : `Notificar (${selected.size})`}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 font-bold uppercase tracking-wide">
                  <th className="py-3 pl-4 pr-2 text-left w-10"></th>
                  <th className="py-3 px-3 text-left">Estudiante</th>
                  <th className="py-3 px-3 text-left">Artículo</th>
                  <th className="py-3 px-3 text-right">Multa</th>
                  <th className="py-3 px-3 text-left">Correo</th>
                  <th className="py-3 pl-3 pr-4 text-left">Última notificación</th>
                </tr>
              </thead>
              <tbody>
                {vencidos.map((p, i) => {
                  const isSelected = selected.has(p.id)
                  const fechaNotif = formatFecha(p.ultima_notificacion)
                  return (
                    <tr
                      key={p.id}
                      onClick={() => toggleOne(p.id)}
                      className={`border-t border-gray-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      } hover:bg-emerald-50/60`}
                    >
                      <td className="py-3 pl-4 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(p.id)}
                          onClick={e => e.stopPropagation()}
                          className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-cai-dark">{p.estudiante_nombre}</p>
                        <p className="text-xs text-gray-400">{p.estudiante_rut}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium text-cai-dark">{p.articulo_nombre}</p>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-bold ${
                            (p.multa_calculada ?? 0) >= 6000
                              ? 'text-red-600'
                              : (p.multa_calculada ?? 0) > 0
                                ? 'text-orange-500'
                                : 'text-gray-400'
                          }`}
                        >
                          {formatMulta(p.multa_calculada)}
                        </span>
                      </td>
                      <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                        {hasEmail(p.estudiante_email) ? (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="w-3 h-3 text-gray-300 shrink-0" />
                            {p.estudiante_email}
                          </span>
                        ) : (
                          <EditEmailCell prestamo={p} onSaved={handleEmailSaved} />
                        )}
                      </td>
                      <td className="py-3 pl-3 pr-4">
                        {fechaNotif ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                            <Clock className="w-3 h-3 shrink-0" />
                            {fechaNotif}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ── Sub-componente Historial ─────────────────────────────────────────────────

const FILTROS_EVENT = [
  { key: 'todos', label: 'Todos' },
  { key: 'delivered', label: 'Entregados' },
  { key: 'bounced', label: 'Rebotados' },
  { key: 'complained', label: 'Spam' },
  { key: 'delivery_delayed', label: 'Retrasados' },
  { key: 'queued', label: 'En cola' },
]

const EMAIL_TYPE_LABEL = {
  confirmacion: 'Confirmación',
  devolucion: 'Devolución',
  recordatorio_vencido: 'Recordatorio',
  aviso_automatico: 'Aviso automático',
}

const FILTROS_TIPO = [
  { key: 'todos', label: 'Todos' },
  { key: 'recordatorio_vencido', label: 'Recordatorios' },
  { key: 'aviso_automatico', label: 'Automáticos' },
  { key: 'confirmacion', label: 'Confirmaciones' },
  { key: 'devolucion', label: 'Devoluciones' },
]

const PAGE_SIZE = 50

function HistorialView() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [filtroEvent, setFiltroEvent] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [offset, setOffset] = useState(0)

  const load = useCallback(
    async (newOffset = 0) => {
      setLoading(true)
      setError(null)
      try {
        const res = await prestamosApi.getHistorial({
          limit: PAGE_SIZE,
          offset: newOffset,
          emailType: filtroTipo !== 'todos' ? filtroTipo : undefined,
        })
        setData(res)
        setOffset(newOffset)
      } catch {
        setError('No se pudo cargar el historial.')
      } finally {
        setLoading(false)
      }
    },
    [filtroTipo]
  )

  useEffect(() => {
    load(0)
  }, [load])

  async function handleRefreshStatus() {
    setRefreshing(true)
    try {
      const res = await prestamosApi.refreshHistorialStatus()
      if (res.actualizados > 0) load(offset)
    } catch {
      // silently ignore
    } finally {
      setRefreshing(false)
    }
  }

  const emails = useMemo(() => {
    if (!data?.emails) return []
    const q = (busqueda ?? '').toLowerCase()
    return data.emails.filter(e => {
      const ev = e.last_event ?? 'unknown'
      const isDelivered = ['delivered', 'opened', 'clicked'].includes(ev)
      if (filtroEvent === 'todos') {
        // pass
      } else if (filtroEvent === 'delivered') {
        if (!isDelivered) return false
      } else {
        if (ev !== filtroEvent) return false
      }
      if (q) {
        const rec = (e.recipient ?? '').toLowerCase()
        const subj = (e.subject ?? '').toLowerCase()
        if (!rec.includes(q) && !subj.includes(q)) return false
      }
      return true
    })
  }, [data, filtroEvent, busqueda])

  const total = data?.total ?? 0
  const hasPrev = offset > 0
  const hasNext = data?.has_more ?? false

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-cai-dark">Historial de correos</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {total} correo{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''} · solo módulo
            préstamos
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefreshStatus}
            disabled={refreshing}
            className="px-3 py-2 bg-white/70 border border-gray-100 rounded-xl text-xs font-semibold flex gap-1.5 items-center hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar estados
          </button>
          <button
            onClick={() => load(offset)}
            disabled={loading}
            className="px-3 py-2 bg-white/70 border border-gray-100 rounded-xl text-xs font-semibold flex gap-1.5 items-center hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
        </div>
      </div>

      {/* Filtros tipo */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl px-1 py-1 flex-wrap">
          {FILTROS_TIPO.map(f => (
            <button
              key={f.key}
              onClick={() => {
                setFiltroTipo(f.key)
                setOffset(0)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filtroTipo === f.key ? 'text-white' : 'text-gray-400 hover:text-gray-600'
              }`}
              style={filtroTipo === f.key ? { backgroundColor: MOD_COLOR } : {}}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl px-1 py-1 flex-wrap">
          {FILTROS_EVENT.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltroEvent(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filtroEvent === f.key ? 'text-white' : 'text-gray-400 hover:text-gray-600'
              }`}
              style={filtroEvent === f.key ? { backgroundColor: MOD_COLOR } : {}}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
        <input
          type="text"
          placeholder="Buscar por destinatario o asunto…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-medium text-cai-dark placeholder:text-gray-300 focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando historial…</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border bg-red-50 border-red-200 text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        data &&
        (emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-300">
            <Inbox className="w-10 h-10" />
            <p className="text-sm font-medium">Sin correos para este filtro</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-400 font-bold uppercase tracking-wide">
                    <th className="py-3 px-4 text-left">Destinatario</th>
                    <th className="py-3 px-3 text-left">Asunto</th>
                    <th className="py-3 px-3 text-left">Tipo</th>
                    <th className="py-3 px-3 text-left">Estado</th>
                    <th className="py-3 pl-3 pr-4 text-left">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map((e, i) => (
                    <tr
                      key={e.id}
                      className={`border-t border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                    >
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono text-gray-600">{e.recipient}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs text-cai-dark font-medium line-clamp-1">
                          {e.subject}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs text-gray-500">
                          {EMAIL_TYPE_LABEL[e.email_type] ?? e.email_type}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <EventBadge event={e.last_event ?? 'unknown'} />
                      </td>
                      <td className="py-3 pl-3 pr-4">
                        <span className="text-xs text-gray-400">
                          {e.sent_at ? formatFecha(e.sent_at) : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-2.5 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} de {total}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => load(offset - PAGE_SIZE)}
                    disabled={!hasPrev}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => load(offset + PAGE_SIZE)}
                    disabled={!hasNext}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ))}
    </div>
  )
}

// ── Panel automático (solo ADMIN) ────────────────────────────────────────────

const HORAS_DISPONIBLES = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`)

function AutoPanel({ onFeedback }) {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [multaMinima, setMultaMinima] = useState(1000)
  const [horaEnvio, setHoraEnvio] = useState('09:00')

  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const data = await prestamosApi.getNotificacionConfig()
      setConfig(data)
      setEnabled(data.enabled)
      setMultaMinima(data.multa_minima)
      setHoraEnvio(data.hora_envio)
    } catch {
      // silent — panel shows nothing if fails
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const isDirty =
    config &&
    (enabled !== config.enabled ||
      multaMinima !== config.multa_minima ||
      horaEnvio !== config.hora_envio)

  async function handleSave() {
    setSaving(true)
    try {
      const data = await prestamosApi.putNotificacionConfig({
        enabled,
        multa_minima: multaMinima,
        hora_envio: horaEnvio,
      })
      setConfig(data)
      onFeedback({ ok: true, msg: 'Configuración guardada.' })
    } catch {
      onFeedback({ ok: false, msg: 'Error al guardar.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleRunNow() {
    setRunning(true)
    try {
      const data = await prestamosApi.runNotificacionesNow()
      onFeedback({
        ok: true,
        msg: `Envío automático manual: ${data.enviados} enviado${data.enviados !== 1 ? 's' : ''}, ${data.sin_email} sin correo, ${data.omitidos} bajo umbral.`,
      })
      loadConfig()
    } catch {
      onFeedback({ ok: false, msg: 'Error al ejecutar el envío.' })
    } finally {
      setRunning(false)
    }
  }

  if (loading) return null

  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-cai-dark">Envío automático</p>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}
        >
          {enabled ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        {/* Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Habilitado</span>
          <button
            onClick={() => setEnabled(v => !v)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${enabled ? 'bg-emerald-500' : 'bg-gray-200'}`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'}`}
            />
          </button>
        </div>

        {/* Multa mínima */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Multa mín. $</span>
          <input
            type="number"
            min={0}
            max={6000}
            step={500}
            value={multaMinima}
            onChange={e => setMultaMinima(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-xs font-semibold text-cai-dark focus:outline-none focus:border-emerald-300"
          />
        </div>

        {/* Hora */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Hora</span>
          <select
            value={horaEnvio}
            onChange={e => setHoraEnvio(e.target.value)}
            className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-xs font-semibold text-cai-dark focus:outline-none focus:border-emerald-300 cursor-pointer"
          >
            {HORAS_DISPONIBLES.map(h => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 ml-auto">
          {config?.ultimo_envio && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatFecha(config.ultimo_envio)}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            style={isDirty && !saving ? { backgroundColor: MOD_COLOR } : {}}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${isDirty && !saving ? 'text-white hover:opacity-90' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
          >
            {saving ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Check className="w-3 h-3" />
            )}
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            onClick={handleRunNow}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            {running ? 'Enviando…' : 'Enviar ahora'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pestaña Envíos ────────────────────────────────────────────────────────────

function EnviosView({ ctx }) {
  const { isAdmin } = useAuth()
  const [feedback, setFeedback] = useState(null)

  return (
    <div className="space-y-4">
      {isAdmin && <AutoPanel onFeedback={setFeedback} />}

      {feedback && (
        <div
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
            feedback.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.ok ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
          )}
          <span>{feedback.msg}</span>
          <button
            onClick={() => setFeedback(null)}
            className="ml-auto text-current opacity-50 hover:opacity-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <RecordatoriosView ctx={ctx} />
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

const SUB_TABS = [
  { key: 'envios', label: 'Envíos', icon: Send },
  { key: 'historial', label: 'Historial', icon: Activity },
]

export default function MailingTab({ ctx }) {
  const [subTab, setSubTab] = useState('envios')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl px-1 py-1 w-fit">
        {SUB_TABS.map(t => {
          const Icon = t.icon
          const active = subTab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                active ? 'text-white' : 'text-gray-400 hover:text-gray-600'
              }`}
              style={active ? { backgroundColor: MOD_COLOR } : {}}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {subTab === 'envios' && <EnviosView ctx={ctx} />}
      {subTab === 'historial' && <HistorialView />}
    </div>
  )
}
