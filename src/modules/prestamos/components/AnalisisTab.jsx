import React, { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart2, RefreshCw, AlertTriangle, Printer, Clock, X, Users } from 'lucide-react'
import { useTheme } from '../../../core/theme'
import { prestamosApi } from '../services/prestamosApi'

const formatPesosLong = v => `$${v.toLocaleString('es-CL')}`

function MorosoPanelModal({ grupo, color, params, onClose, minMulta = null, titulo = null }) {
  const [morosos, setMorosos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    prestamosApi
      .getMorososPorGrupo({
        grupo,
        fechaInicio: params.fi,
        fechaFin: params.ff,
        minMulta,
      })
      .then(setMorosos)
      .finally(() => setLoading(false))
  }, [grupo, params, minMulta])

  const totalMulta = morosos.reduce((s, m) => s + m.multa_calculada, 0)

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden bg-white">
        {/* Header */}
        <div
          className="p-5 flex items-center justify-between shrink-0 bg-cai-surface border-b border-cai-border"
          style={{ '--border-top': `3px solid ${color}` }}
        >
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4" style={{ '--text-c': color }} />
            <div>
              <h3 className="font-bold text-base text-cai-black">
                {titulo ?? `Morosos — ${grupo}`}
              </h3>
              {!loading && (
                <p className="text-xs mt-0.5 text-[#888884]">
                  {morosos.length} préstamo{morosos.length !== 1 ? 's' : ''} vencido
                  {morosos.length !== 1 ? 's' : ''} · Total multas:{' '}
                  <span className="font-bold text-red-500">{formatPesosLong(totalMulta)}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer bg-white border border-cai-border text-[#888884]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-16">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : morosos.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 gap-3">
              <AlertTriangle className="w-8 h-8 text-gray-300" />
              <p className="text-sm font-semibold text-gray-400">
                Sin préstamos vencidos en este período
              </p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left sticky top-0 z-10 bg-cai-surface border-b border-cai-border">
                  <th className="px-5 py-3 font-bold text-gray-500 uppercase tracking-wide">
                    Estudiante
                  </th>
                  <th className="px-3 py-3 font-bold text-gray-500 uppercase tracking-wide">
                    Artículo
                  </th>
                  <th className="px-3 py-3 font-bold text-gray-500 uppercase tracking-wide text-center">
                    Días
                  </th>
                  <th className="px-5 py-3 font-bold text-gray-500 uppercase tracking-wide text-right">
                    Multa
                  </th>
                </tr>
              </thead>
              <tbody>
                {morosos.map((m, i) => (
                  <tr
                    key={m.prestamo_id}
                    className="border-b border-cai-border"
                    style={{ '--bg-c': i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}
                  >
                    <td className="px-5 py-3">
                      <p className="font-semibold text-cai-black">{m.estudiante_nombre}</p>
                      <p className="text-[11px] mt-0.5 text-[#888884]">
                        {m.estudiante_rut}
                        {m.carrera ? ` · ${m.carrera}` : ''}
                      </p>
                      {m.estudiante_email && (
                        <a
                          href={`mailto:${m.estudiante_email}`}
                          className="text-[11px] mt-0.5 hover:underline text-[#16A34A]"
                          onClick={e => e.stopPropagation()}
                        >
                          {m.estudiante_email}
                        </a>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-cai-black">{m.articulo_nombre}</p>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`font-bold text-sm ${m.dias_vencido > 7 ? 'text-[#DC2626]' : 'text-[#D97706]'}`}
                      >
                        {m.dias_vencido}d
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {m.multa_calculada > 0 ? (
                        <span className="font-bold text-red-500">
                          {formatPesosLong(m.multa_calculada)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

const fmt = d => d.toISOString().slice(0, 10)

const RANGOS = (() => {
  const hoy = new Date()
  const y = hoy.getFullYear()
  const m = hoy.getMonth() + 1 // 1-12
  const esSem1 = m >= 3 && m <= 7

  const semActualInicio = esSem1 ? new Date(y, 2, 1) : new Date(y, 7, 1)
  const [semAntInicio, semAntFin] = esSem1
    ? [new Date(y - 1, 7, 1), new Date(y, 2, 0)] // Ago año ant → último día Feb
    : [new Date(y, 2, 1), new Date(y, 6, 31)] // Mar → Jul mismo año

  return [
    {
      label: esSem1 ? `Sem 1 ${y}` : `Sem 2 ${y}`,
      fi: fmt(semActualInicio),
      ff: null,
    },
    {
      label: esSem1 ? `Sem 2 ${y - 1}` : `Sem 1 ${y}`,
      fi: fmt(semAntInicio),
      ff: fmt(semAntFin),
    },
    { label: `Año ${y}`, fi: fmt(new Date(y, 0, 1)), ff: null },
    {
      label: `Año ${y - 1}`,
      fi: fmt(new Date(y - 1, 0, 1)),
      ff: fmt(new Date(y - 1, 11, 31)),
    },
    { label: 'Todo', fi: null, ff: null },
  ]
})()

const GRUPO_COLORES = {
  'ING/LICC': '#16A34A',
  College: '#4F46E5',
  'Otras Carreras': '#D97706',
}

const formatPesos = v => (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`)

export default function AnalisisTab() {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const [rango, setRango] = useState(RANGOS[0])
  const [stats, setStats] = useState([])
  const [topArticulos, setTopArticulos] = useState([])
  const [tiempoRetorno, setTiempoRetorno] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [grupoPanel, setGrupoPanel] = useState(null)
  const [perdidosPanel, setPerdidosPanel] = useState(null)

  const cargarDatos = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { fechaInicio: rango.fi, fechaFin: rango.ff }
      const [s, t, tr] = await Promise.all([
        prestamosApi.getAnalisisPorCarrera(params),
        prestamosApi.getArticulosTopPorCarrera(params),
        prestamosApi.getTiempoRetornoPorArticulo(params),
      ])
      setStats(s)
      setTopArticulos(t)
      setTiempoRetorno(tr)
    } catch (_e) {
      setError('No se pudo cargar el análisis. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rango])

  // Colores recharts adaptados al tema
  const chartColors = {
    grid: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    tooltipBg: dark ? '#242424' : '#ffffff',
    tooltipBorder: dark ? '#333330' : '#E2E2DE',
    tooltipText: dark ? '#f2f2ef' : '#0f0f0f',
    axisText: dark ? '#9a9a96' : '#6b7280',
  }

  const tooltipStyle = {
    backgroundColor: chartColors.tooltipBg,
    border: `1px solid ${chartColors.tooltipBorder}`,
    borderRadius: 10,
    fontSize: 12,
    color: chartColors.tooltipText,
  }

  // Keys simples sin acentos/espacios/caracteres especiales (recharts 3.x)
  const chartData = stats.map(s => ({
    name: s.grupo === 'Otras Carreras' ? 'Otras' : s.grupo,
    total: s.total_prestamos,
    conMulta: s.prestamos_con_multa,
    vencidos: s.actualmente_vencidos,
  }))

  const tasaData = stats.map(s => ({
    name: s.grupo === 'Otras Carreras' ? 'Otras' : s.grupo,
    tasa: s.tasa_atraso_pct,
  }))

  return (
    <>
      <div className="space-y-6" id="analisis-print-root">
        {/* Header */}
        <div className="flex justify-between items-center print:hidden">
          <div className="flex items-center gap-3">
            <BarChart2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-cai-dark">Análisis por Carrera</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white/70 border border-gray-100 rounded-xl overflow-hidden">
              {RANGOS.map(r => (
                <button
                  key={r.label}
                  onClick={() => setRango(r)}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    rango.label === r.label
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              onClick={cargarDatos}
              title="Actualizar"
              className="px-3 py-2 bg-white/70 border border-gray-100 rounded-xl text-xs font-semibold flex gap-2 items-center hover:bg-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => window.print()}
              title="Exportar PDF / Imprimir"
              className="px-3 py-2 bg-white/70 border border-gray-100 rounded-xl text-xs font-semibold flex gap-2 items-center hover:bg-white transition-colors cursor-pointer text-gray-500"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Título para print (invisible en pantalla) */}
        <div className="hidden print:block mb-2">
          <h1 className="text-2xl font-bold">Análisis de Préstamos por Carrera</h1>
          <p className="text-sm text-gray-500 mt-1">Período: {rango.label} · Sistema CAi</p>
        </div>

        {error && (
          <div className="glass-panel rounded-[20px] p-6 text-center text-sm text-red-500 print:hidden">
            {error}
            <button onClick={cargarDatos} className="ml-3 underline cursor-pointer">
              Reintentar
            </button>
          </div>
        )}

        {loading ? (
          <div className="glass-panel rounded-[24px] p-16 flex items-center justify-center print:hidden">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Cards resumen por grupo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.map(s => (
                <button
                  key={s.grupo}
                  onClick={() => setGrupoPanel(s.grupo)}
                  className="glass-panel rounded-[20px] p-5 space-y-4 text-left cursor-pointer transition-shadow hover:shadow-lg active:scale-[0.99]"
                  style={{ borderTop: `3px solid ${GRUPO_COLORES[s.grupo] ?? '#888'}` }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm font-bold"
                      style={{ '--text-c': GRUPO_COLORES[s.grupo] ?? '#888' }}
                    >
                      {s.grupo}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {s.estudiantes_unicos} estudiante{s.estudiantes_unicos !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-cai-dark">{s.total_prestamos}</p>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">
                        Préstamos
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#D97706]">{s.tasa_atraso_pct}%</p>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">
                        % Atraso
                      </p>
                    </div>
                    <div
                      className="text-center rounded-lg px-1 py-0.5 hover:bg-red-50 transition-colors cursor-pointer"
                      onClick={e => {
                        e.stopPropagation()
                        if (s.perdidos_count > 0) setPerdidosPanel(s.grupo)
                      }}
                      title={
                        s.perdidos_count > 0
                          ? `Ver ${s.perdidos_count} elemento${s.perdidos_count !== 1 ? 's' : ''} perdido${s.perdidos_count !== 1 ? 's' : ''}`
                          : 'Sin elementos perdidos'
                      }
                    >
                      <p className="text-2xl font-bold text-[#DC2626]">{s.tasa_perdida_pct}%</p>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">
                        % Pérdida
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-lg font-bold text-[#DC2626]">
                        {formatPesos(s.multas_activas_pesos)}
                      </p>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">
                        Multas activas
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-400">
                        {formatPesos(s.multas_historicas_pesos)}
                      </p>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">
                        Multas hist.
                      </p>
                    </div>
                  </div>
                  {s.actualmente_vencidos > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      {s.actualmente_vencidos} vencido{s.actualmente_vencidos !== 1 ? 's' : ''}{' '}
                      activo
                      {s.actualmente_vencidos !== 1 ? 's' : ''} · Ver lista →
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* BarChart: préstamos por carrera */}
            <div className="glass-panel rounded-[20px] p-5">
              <h3 className="text-sm font-bold text-cai-dark mb-4">Préstamos por carrera</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fontWeight: 600, fill: chartColors.axisText }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: chartColors.axisText }}
                    allowDecimals={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="total"
                    name="Total préstamos"
                    fill="#16A34A"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar dataKey="conMulta" name="Con multa" fill="#D97706" radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="vencidos"
                    name="Vencidos activos"
                    fill="#DC2626"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* BarChart: tasa de atraso % */}
            <div className="glass-panel rounded-[20px] p-5">
              <h3 className="text-sm font-bold text-cai-dark mb-4">Tasa de atraso por carrera</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={tasaData} barCategoryGap="40%">
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fontWeight: 600, fill: chartColors.axisText }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: chartColors.axisText }}
                    unit="%"
                    domain={[0, 100]}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={v => [`${v}%`, 'Tasa de atraso']}
                  />
                  <Bar dataKey="tasa" name="Tasa de atraso" radius={[4, 4, 0, 0]}>
                    {tasaData.map((entry, i) => {
                      const grupo = stats[i]?.grupo
                      return <Cell key={`cell-${i}`} fill={GRUPO_COLORES[grupo] ?? '#888'} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top artículos por carrera */}
            <div className="glass-panel rounded-[20px] p-5">
              <h3 className="text-sm font-bold text-cai-dark mb-4">
                Top artículos pedidos por carrera
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topArticulos.map(grupo => (
                  <div key={grupo.grupo}>
                    <p
                      className="text-xs font-bold mb-2"
                      style={{ '--text-c': GRUPO_COLORES[grupo.grupo] ?? '#888' }}
                    >
                      {grupo.grupo}
                    </p>
                    {grupo.top_articulos.length === 0 ? (
                      <p className="text-xs text-gray-400">Sin datos</p>
                    ) : (
                      <ol className="space-y-1.5">
                        {grupo.top_articulos.map((art, idx) => (
                          <li
                            key={art.articulo_nombre}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold text-[9px] shrink-0"
                                style={{ '--bg-c': GRUPO_COLORES[grupo.grupo] ?? '#888' }}
                              >
                                {idx + 1}
                              </span>
                              <span className="text-cai-dark font-medium truncate max-w-[160px]">
                                {art.articulo_nombre}
                              </span>
                            </span>
                            <span className="text-gray-400 font-semibold shrink-0 ml-2">
                              ×{art.count}
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tiempo de retorno por artículo y carrera */}
            {tiempoRetorno.length > 0 && (
              <div className="glass-panel rounded-[20px] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-cai-dark">
                    Días promedio de retorno por artículo y carrera
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left font-bold text-gray-500 pb-2 pr-4">Artículo</th>
                        {['ING/LICC', 'College', 'Otras Carreras'].map(g => (
                          <th
                            key={g}
                            className="text-center font-bold pb-2 px-3"
                            style={{ color: GRUPO_COLORES[g] ?? '#888' }}
                          >
                            {g === 'Otras Carreras' ? 'Otras' : g}
                          </th>
                        ))}
                        <th className="text-center font-bold text-gray-500 pb-2 pl-3">Global</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {tiempoRetorno.map(item => {
                        const byGrupo = Object.fromEntries(item.grupos.map(g => [g.grupo, g]))
                        return (
                          <tr key={item.articulo_nombre} className="hover:bg-gray-50/50">
                            <td className="py-2 pr-4 font-semibold text-cai-dark">
                              {item.articulo_nombre}
                            </td>
                            {['ING/LICC', 'College', 'Otras Carreras'].map(g => {
                              const entry = byGrupo[g]
                              return (
                                <td key={g} className="py-2 px-3 text-center">
                                  {entry ? (
                                    <span>
                                      <span className="font-bold text-cai-dark">
                                        {entry.promedio_dias}
                                      </span>
                                      <span className="text-gray-400 ml-1">
                                        d <span className="text-[10px]">({entry.n})</span>
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="text-gray-300">—</span>
                                  )}
                                </td>
                              )
                            })}
                            <td className="py-2 pl-3 text-center">
                              <span className="font-bold text-gray-500">
                                {item.promedio_global}
                              </span>
                              <span className="text-gray-400 ml-1">
                                d <span className="text-[10px]">({item.n_total})</span>
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-gray-400 mt-3">
                  Calculado sobre préstamos devueltos. Solo artículos con ≥ 2 devoluciones.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {grupoPanel && (
        <MorosoPanelModal
          grupo={grupoPanel}
          color={GRUPO_COLORES[grupoPanel] ?? '#888'}
          params={rango}
          onClose={() => setGrupoPanel(null)}
        />
      )}

      {perdidosPanel && (
        <MorosoPanelModal
          grupo={perdidosPanel}
          color="#DC2626"
          params={rango}
          minMulta={6000}
          titulo={`Elementos perdidos — ${perdidosPanel}`}
          onClose={() => setPerdidosPanel(null)}
        />
      )}
    </>
  )
}
