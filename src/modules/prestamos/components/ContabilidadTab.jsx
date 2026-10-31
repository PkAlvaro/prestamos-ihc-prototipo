import React, { useState, useEffect, useCallback } from 'react'
import {
  DollarSign,
  TrendingDown,
  Clock,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Tag,
  Plus,
  Trash2,
  Search,
  RotateCcw,
  CalendarOff,
} from 'lucide-react'
import { prestamosApi } from '../services/prestamosApi'
import { useAuth } from '../../auth'
import { mensajeDeError } from '../utils/mensajeDeError'

const formatPesos = n => `$${(n ?? 0).toLocaleString('es-CL')}`

const TIPO_LABELS = {
  TOTAL: { label: 'Pago total', color: 'bg-green-100 text-green-700' },
  PARCIAL: { label: 'Pago parcial', color: 'bg-blue-100 text-blue-700' },
  CONDONADO: { label: 'Condonado', color: 'bg-red-100 text-red-600' },
  PENDIENTE: { label: 'Cobra al devolver', color: 'bg-amber-100 text-amber-700' },
}

const LIMIT = 50

const SECCIONES = [
  { id: 'multas', label: 'Multas por atraso' },
  { id: 'arriendos', label: 'Arriendos otras carreras' },
]

export default function ContabilidadTab() {
  const { isAdmin } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [seccion, setSeccion] = useState('multas')

  const load = useCallback(async o => {
    setLoading(true)
    try {
      const res = await prestamosApi.listarContabilidad({ limit: LIMIT, offset: o })
      setData(res)
    } catch (e) {
      console.error('Error cargando contabilidad:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(offset)
  }, [offset, load])

  const totalPages = data ? Math.ceil(data.cobros_total / LIMIT) : 0
  const currentPage = Math.floor(offset / LIMIT) + 1

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Total general */}
      <div className="px-5 pt-5 shrink-0">
        <div className="rounded-2xl border border-cai-border bg-cai-surface p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <Wallet className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wide">
              Total recaudado (multas + arriendos)
            </span>
          </div>
          <p className="text-2xl font-black text-cai-black">
            {formatPesos(data?.total_recaudado_general)}
          </p>
        </div>
      </div>

      {/* Selector de sección */}
      <div className="px-5 pt-4 flex gap-2 shrink-0">
        {SECCIONES.map(s => (
          <button
            key={s.id}
            onClick={() => setSeccion(s.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-[120ms] cursor-pointer ${
              seccion === s.id
                ? 'bg-cai-black text-white'
                : 'bg-white border border-cai-border text-gray-500 hover:bg-cai-surface'
            }`}
          >
            {s.label}
          </button>
        ))}
        {isAdmin && (
          <button
            onClick={() => setSeccion('tarifas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-[120ms] cursor-pointer flex items-center gap-1.5 ${
              seccion === 'tarifas'
                ? 'bg-cai-black text-white'
                : 'bg-white border border-cai-border text-gray-500 hover:bg-cai-surface'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Tarifas
          </button>
        )}
      </div>

      {seccion === 'tarifas' ? (
        <TarifasPanel />
      ) : seccion === 'multas' ? (
        <>
          <div className="px-5 pt-4 pb-4 grid grid-cols-3 gap-3 shrink-0">
            <SummaryCard
              icon={<DollarSign className="w-4 h-4" />}
              label="Recaudado en multas"
              value={formatPesos(data?.total_recaudado)}
              color="text-green-600"
              bg="bg-green-50"
              loading={loading}
            />
            <SummaryCard
              icon={<TrendingDown className="w-4 h-4" />}
              label="Condonado / parcial"
              value={formatPesos(data?.total_condonado)}
              color="text-red-500"
              bg="bg-red-50"
              loading={loading}
            />
            <SummaryCard
              icon={<Clock className="w-4 h-4" />}
              label="Pendiente activo"
              value={formatPesos(data?.total_pendiente)}
              color="text-orange-500"
              bg="bg-orange-50"
              loading={loading}
            />
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-5">
            <div className="bg-white rounded-2xl border border-cai-border overflow-hidden">
              {loading && !data ? (
                <div className="py-16 text-center text-sm text-gray-400">Cargando…</div>
              ) : !data?.cobros?.length ? (
                <div className="py-16 text-center text-sm text-gray-400">
                  No hay multas registradas aún
                </div>
              ) : (
                <>
                  <div className="hidden lg:grid grid-cols-[1fr_1fr_100px_100px_100px_1fr] gap-3 px-5 py-3 bg-gray-50 border-b border-cai-border text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    <span>Estudiante</span>
                    <span>Artículo</span>
                    <span>Multa</span>
                    <span>Cobrado</span>
                    <span>Tipo</span>
                    <span>Fecha</span>
                  </div>

                  {data.cobros.map(cobro => (
                    <CobroRow key={cobro.id} cobro={cobro} />
                  ))}

                  {totalPages > 1 && (
                    <Paginacion
                      total={data.cobros_total}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      offset={offset}
                      setOffset={setOffset}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="px-5 pt-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
            <SummaryCard
              icon={<DollarSign className="w-4 h-4" />}
              label="Recaudado en arriendos"
              value={formatPesos(data?.arriendos_recaudado)}
              color="text-green-600"
              bg="bg-green-50"
              loading={loading}
            />
            <SummaryCard
              icon={<TrendingDown className="w-4 h-4" />}
              label="No cobrado"
              value={formatPesos(data?.arriendos_condonado)}
              color="text-red-500"
              bg="bg-red-50"
              loading={loading}
            />
            <SummaryCard
              icon={<Clock className="w-4 h-4" />}
              label="Pendiente (al devolver)"
              value={formatPesos(data?.arriendos_pendiente)}
              color="text-orange-500"
              bg="bg-orange-50"
              loading={loading}
            />
            <SummaryCard
              icon={<Wallet className="w-4 h-4" />}
              label="Transacciones"
              value={String(data?.arriendos_count ?? 0)}
              color="text-amber-600"
              bg="bg-amber-50"
              loading={loading}
            />
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-5">
            <div className="bg-white rounded-2xl border border-cai-border overflow-hidden">
              {loading && !data ? (
                <div className="py-16 text-center text-sm text-gray-400">Cargando…</div>
              ) : !data?.cobros_arriendo?.length ? (
                <div className="py-16 text-center text-sm text-gray-400">
                  No hay cobros de arriendo registrados aún
                </div>
              ) : (
                <>
                  <div className="hidden lg:grid grid-cols-[1fr_1fr_100px_100px_100px_1fr] gap-3 px-5 py-3 bg-gray-50 border-b border-cai-border text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    <span>Estudiante</span>
                    <span>Artículos</span>
                    <span>Arriendo</span>
                    <span>Cobrado</span>
                    <span>Tipo</span>
                    <span>Fecha</span>
                  </div>

                  {data.cobros_arriendo.map(cobro => (
                    <CobroArriendoRow key={cobro.id} cobro={cobro} />
                  ))}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Paginacion({ total, currentPage, totalPages, offset, setOffset }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-cai-border">
      <p className="text-[10px] font-bold text-gray-400 uppercase">
        {total} registros · página {currentPage} de {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setOffset(o => Math.max(0, o - LIMIT))}
          disabled={offset === 0}
          className="p-1.5 rounded-lg border border-cai-border text-gray-400 hover:bg-cai-surface disabled:opacity-30 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => setOffset(o => o + LIMIT)}
          disabled={offset + LIMIT >= total}
          className="p-1.5 rounded-lg border border-cai-border text-gray-400 hover:bg-cai-surface disabled:opacity-30 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function SummaryCard({ icon, label, value, color, bg, loading }) {
  return (
    <div className={`rounded-2xl border border-cai-border p-4 ${bg}`}>
      <div className={`flex items-center gap-1.5 mb-2 ${color}`}>
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-xl font-black ${color}`}>
        {loading && value === undefined ? '…' : (value ?? '$0')}
      </p>
    </div>
  )
}

function formatFechaHora(iso) {
  const fecha = new Date(iso)
  return {
    fechaStr: fecha.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }),
    horaStr: fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
  }
}

function TipoBadge({ tipoPago }) {
  const tipo = TIPO_LABELS[tipoPago] ?? { label: tipoPago, color: 'bg-gray-100 text-gray-500' }
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tipo.color}`}>
      {tipo.label}
    </span>
  )
}

function CobroRow({ cobro }) {
  const { fechaStr, horaStr } = formatFechaHora(cobro.fecha_cobro)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_100px_100px_100px_1fr] gap-1 lg:gap-3 px-5 py-3 border-b border-cai-border/50 last:border-0 hover:bg-gray-50/50 transition-colors">
      <div>
        <p className="text-xs font-bold text-cai-black truncate">{cobro.estudiante_nombre}</p>
        <p className="text-[10px] text-gray-400">{cobro.estudiante_rut}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-600 truncate">{cobro.articulo_nombre}</p>
      </div>
      <div className="flex items-center">
        <span className="text-xs font-bold text-gray-500">
          {formatPesos(cobro.multa_calculada)}
        </span>
      </div>
      <div className="flex items-center">
        <span className="text-xs font-bold text-cai-black">{formatPesos(cobro.monto_cobrado)}</span>
      </div>
      <div className="flex items-center">
        <TipoBadge tipoPago={cobro.tipo_pago} />
      </div>
      <div>
        <p className="text-xs text-gray-500">
          {fechaStr} {horaStr}
        </p>
        {cobro.comentario && (
          <p className="text-[10px] text-gray-400 italic truncate">{cobro.comentario}</p>
        )}
        <p className="text-[10px] text-gray-300">{cobro.registrado_por}</p>
      </div>
    </div>
  )
}

function CobroArriendoRow({ cobro }) {
  const { fechaStr, horaStr } = formatFechaHora(cobro.fecha_cobro)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_100px_100px_100px_1fr] gap-1 lg:gap-3 px-5 py-3 border-b border-cai-border/50 last:border-0 hover:bg-gray-50/50 transition-colors">
      <div>
        <p className="text-xs font-bold text-cai-black truncate">{cobro.estudiante_nombre}</p>
        <p className="text-[10px] text-gray-400">{cobro.estudiante_rut}</p>
        {cobro.carrera && <p className="text-[10px] text-amber-600 truncate">{cobro.carrera}</p>}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-600 truncate">
          {cobro.articulos.join(' · ')}
        </p>
        <p className="text-[10px] text-gray-400">
          {cobro.articulos.length} artículo{cobro.articulos.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="flex items-center">
        <span className="text-xs font-bold text-gray-500">
          {formatPesos(cobro.monto_calculado)}
        </span>
      </div>
      <div className="flex items-center">
        <span className="text-xs font-bold text-cai-black">{formatPesos(cobro.monto_cobrado)}</span>
      </div>
      <div className="flex items-center">
        <TipoBadge tipoPago={cobro.tipo_pago} />
      </div>
      <div>
        <p className="text-xs text-gray-500">
          {fechaStr} {horaStr}
        </p>
        {cobro.comentario && (
          <p className="text-[10px] text-gray-400 italic truncate">{cobro.comentario}</p>
        )}
        <p className="text-[10px] text-gray-300">{cobro.registrado_por}</p>
      </div>
    </div>
  )
}

/** Editor de tarifas de arriendo. Solo ADMIN: el backend rechaza al resto. */
function TarifasPanel() {
  const [tarifas, setTarifas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nueva, setNueva] = useState({ categoria: '', monto: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setTarifas(await prestamosApi.listarTarifas())
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const ejecutar = async accion => {
    setError('')
    try {
      await accion()
      await load()
    } catch (e) {
      setError(mensajeDeError(e))
    }
  }

  const handleCrear = () => {
    const monto = parseInt(nueva.monto, 10)
    if (!nueva.categoria.trim() || isNaN(monto) || monto < 0) {
      setError('Indica una categoría y un monto válido')
      return
    }
    return ejecutar(async () => {
      await prestamosApi.crearTarifa({ categoria: nueva.categoria.trim(), monto, activa: true })
      setNueva({ categoria: '', monto: '' })
    })
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-4 pb-5">
      <div className="bg-white rounded-2xl border border-cai-border overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-cai-border">
          <p className="text-xs font-bold text-cai-black">Tarifas de arriendo</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Se cobra una vez por préstamo a los estudiantes de carreras no exentas. La categoría
            debe coincidir con la del artículo.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Cargando…</div>
        ) : (
          <>
            {tarifas.map(tarifa => (
              <div
                key={tarifa.id}
                className="flex items-center gap-3 px-5 py-3 border-b border-cai-border/50 last:border-0"
              >
                <span className="flex-1 text-xs font-bold text-cai-black">{tarifa.categoria}</span>
                <input
                  type="number"
                  min={0}
                  defaultValue={tarifa.monto}
                  onBlur={e => {
                    const monto = parseInt(e.target.value, 10)
                    if (!isNaN(monto) && monto !== tarifa.monto) {
                      ejecutar(() => prestamosApi.actualizarTarifa(tarifa.id, { monto }))
                    }
                  }}
                  className="w-24 bg-cai-surface border border-cai-border rounded-lg py-1.5 px-2 text-xs font-bold text-cai-black outline-none"
                />
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tarifa.activa}
                    onChange={e =>
                      ejecutar(() =>
                        prestamosApi.actualizarTarifa(tarifa.id, { activa: e.target.checked })
                      )
                    }
                    className="accent-[#16A34A] cursor-pointer"
                  />
                  Activa
                </label>
                <button
                  onClick={() => ejecutar(() => prestamosApi.eliminarTarifa(tarifa.id))}
                  className="p-1.5 rounded-lg border border-cai-border text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors duration-[120ms] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <div className="flex items-center gap-3 px-5 py-3 bg-cai-surface">
              <input
                type="text"
                value={nueva.categoria}
                onChange={e => setNueva(n => ({ ...n, categoria: e.target.value }))}
                placeholder="Categoría del artículo"
                className="flex-1 bg-white border border-cai-border rounded-lg py-1.5 px-2 text-xs font-semibold text-cai-black outline-none"
              />
              <input
                type="number"
                min={0}
                value={nueva.monto}
                onChange={e => setNueva(n => ({ ...n, monto: e.target.value }))}
                placeholder="Monto"
                className="w-24 bg-white border border-cai-border rounded-lg py-1.5 px-2 text-xs font-bold text-cai-black outline-none"
              />
              <button
                onClick={handleCrear}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16A34A] hover:bg-green-700 text-white text-xs font-bold transition-colors duration-[120ms] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar
              </button>
            </div>
          </>
        )}

        {error && <p className="px-5 py-3 text-xs text-red-500 font-semibold">{error}</p>}
      </div>

      <CarrerasPanel />
      <PeriodosSinMultaPanel />
    </div>
  )
}

/**
 * Ajuste de qué carreras pagan arriendo. Solo ADMIN: el backend rechaza al resto.
 *
 * Una carrera sin configurar hereda el default por grupo (Ing/LICC, LICD y
 * College exentos), así que la lista muestra el estado efectivo, no solo lo
 * que alguien tocó.
 */
export function CarrerasPanel() {
  const [carreras, setCarreras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('')
  const [nueva, setNueva] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setCarreras(await prestamosApi.listarCarrerasArriendo())
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const ejecutar = async accion => {
    setError('')
    try {
      await accion()
      await load()
    } catch (e) {
      setError(mensajeDeError(e))
    }
  }

  const handleAgregar = () => {
    const carrera = nueva.trim()
    if (!carrera) {
      setError('Escribe el nombre de la carrera')
      return
    }
    return ejecutar(async () => {
      await prestamosApi.configurarCarreraArriendo(carrera, true)
      setNueva('')
    })
  }

  const visibles = carreras.filter(c =>
    c.carrera.toLowerCase().includes(filtro.trim().toLowerCase())
  )

  return (
    <div className="bg-white rounded-2xl border border-cai-border overflow-hidden mt-4">
      <div className="px-5 py-3 bg-gray-50 border-b border-cai-border">
        <p className="text-xs font-bold text-cai-black">Carreras y cobro de arriendo</p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          Las carreras exentas no pagan arriendo. Sin configurar, Ing/LICC, LICD y College quedan
          exentas y el resto paga.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Cargando…</div>
      ) : (
        <>
          <div className="px-5 py-2.5 border-b border-cai-border/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
                placeholder="Buscar carrera…"
                className="w-full bg-cai-surface border border-cai-border rounded-lg py-1.5 pl-8 pr-2 text-xs font-semibold text-cai-black outline-none"
              />
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {visibles.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400">Sin carreras que coincidan</p>
            ) : (
              visibles.map(c => (
                <div
                  key={c.carrera}
                  className="flex items-center gap-3 px-5 py-2.5 border-b border-cai-border/50 last:border-0"
                >
                  <span className="flex-1 text-xs font-bold text-cai-black">{c.carrera}</span>
                  <span className="text-[10px] font-semibold text-gray-400 tabular-nums">
                    {c.estudiantes} {c.estudiantes === 1 ? 'estudiante' : 'estudiantes'}
                  </span>

                  <div className="flex rounded-lg border border-cai-border overflow-hidden">
                    {[
                      { exenta: false, label: 'Cobra' },
                      { exenta: true, label: 'Exenta' },
                    ].map(opcion => (
                      <button
                        key={opcion.label}
                        onClick={() =>
                          c.exenta !== opcion.exenta &&
                          ejecutar(() =>
                            prestamosApi.configurarCarreraArriendo(c.carrera, opcion.exenta)
                          )
                        }
                        className={`px-2.5 py-1 text-[10px] font-bold transition-colors duration-[120ms] cursor-pointer ${
                          c.exenta === opcion.exenta
                            ? 'bg-[#16A34A] text-white'
                            : 'bg-white text-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {opcion.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      ejecutar(() => prestamosApi.restablecerCarreraArriendo(c.carrera))
                    }
                    disabled={!c.configurada}
                    title={
                      c.configurada
                        ? 'Volver al valor por defecto'
                        : 'Ya está en el valor por defecto'
                    }
                    className="p-1.5 rounded-lg border border-cai-border text-gray-400 transition-colors duration-[120ms] enabled:hover:bg-gray-50 enabled:hover:text-cai-black enabled:cursor-pointer disabled:opacity-30"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-3 px-5 py-3 bg-cai-surface border-t border-cai-border">
            <input
              type="text"
              value={nueva}
              onChange={e => setNueva(e.target.value)}
              placeholder="Agregar carrera que no está en la lista"
              className="flex-1 bg-white border border-cai-border rounded-lg py-1.5 px-2 text-xs font-semibold text-cai-black outline-none"
            />
            <button
              onClick={handleAgregar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16A34A] hover:bg-green-700 text-white text-xs font-bold transition-colors duration-[120ms] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar exenta
            </button>
          </div>
        </>
      )}

      {error && <p className="px-5 py-3 text-xs text-red-500 font-semibold">{error}</p>}
    </div>
  )
}

/**
 * Semanas de receso u otras fechas en que no corren multas por atraso.
 * Solo ADMIN: el backend rechaza al resto.
 */
function PeriodosSinMultaPanel() {
  const [periodos, setPeriodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nuevo, setNuevo] = useState({ fecha_inicio: '', fecha_fin: '', descripcion: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setPeriodos(await prestamosApi.listarPeriodosSinMulta())
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const ejecutar = async accion => {
    setError('')
    try {
      await accion()
      await load()
    } catch (e) {
      setError(mensajeDeError(e))
    }
  }

  const handleCrear = () => {
    if (!nuevo.fecha_inicio || !nuevo.fecha_fin) {
      setError('Indica fecha de inicio y de fin')
      return
    }
    if (nuevo.fecha_fin < nuevo.fecha_inicio) {
      setError('La fecha de fin no puede ser anterior a la de inicio')
      return
    }
    return ejecutar(async () => {
      await prestamosApi.crearPeriodoSinMulta({
        fecha_inicio: nuevo.fecha_inicio,
        fecha_fin: nuevo.fecha_fin,
        descripcion: nuevo.descripcion.trim() || null,
      })
      setNuevo({ fecha_inicio: '', fecha_fin: '', descripcion: '' })
    })
  }

  const formatFecha = iso =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

  return (
    <div className="bg-white rounded-2xl border border-cai-border overflow-hidden mt-4">
      <div className="px-5 py-3 bg-gray-50 border-b border-cai-border">
        <p className="text-xs font-bold text-cai-black">Semanas sin multa</p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          Rangos de fecha (ambas inclusive) en que la multa por atraso no corre — semanas de receso,
          feriados extendidos, etc.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Cargando…</div>
      ) : (
        <>
          {periodos.length === 0 ? (
            <p className="py-8 text-center text-xs text-gray-400">No hay periodos configurados</p>
          ) : (
            periodos.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-5 py-3 border-b border-cai-border/50 last:border-0"
              >
                <CalendarOff className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-cai-black">
                    {formatFecha(p.fecha_inicio)} — {formatFecha(p.fecha_fin)}
                  </p>
                  {p.descripcion && (
                    <p className="text-[10px] text-gray-400 truncate">{p.descripcion}</p>
                  )}
                </div>
                <button
                  onClick={() => ejecutar(() => prestamosApi.eliminarPeriodoSinMulta(p.id))}
                  className="p-1.5 rounded-lg border border-cai-border text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors duration-[120ms] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-5 py-3 bg-cai-surface">
            <input
              type="date"
              value={nuevo.fecha_inicio}
              onChange={e => setNuevo(n => ({ ...n, fecha_inicio: e.target.value }))}
              className="bg-white border border-cai-border rounded-lg py-1.5 px-2 text-xs font-semibold text-cai-black outline-none"
            />
            <input
              type="date"
              value={nuevo.fecha_fin}
              onChange={e => setNuevo(n => ({ ...n, fecha_fin: e.target.value }))}
              className="bg-white border border-cai-border rounded-lg py-1.5 px-2 text-xs font-semibold text-cai-black outline-none"
            />
            <input
              type="text"
              value={nuevo.descripcion}
              onChange={e => setNuevo(n => ({ ...n, descripcion: e.target.value }))}
              placeholder="Descripción (opcional)"
              className="flex-1 bg-white border border-cai-border rounded-lg py-1.5 px-2 text-xs font-semibold text-cai-black outline-none"
            />
            <button
              onClick={handleCrear}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16A34A] hover:bg-green-700 text-white text-xs font-bold transition-colors duration-[120ms] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar
            </button>
          </div>
        </>
      )}

      {error && <p className="px-5 py-3 text-xs text-red-500 font-semibold">{error}</p>}
    </div>
  )
}
