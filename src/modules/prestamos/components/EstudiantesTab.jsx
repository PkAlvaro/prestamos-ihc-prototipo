import React, { useState } from 'react'
import {
  AlertCircle,
  RefreshCw,
  User,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  Receipt,
  Filter,
  Pencil,
} from 'lucide-react'
import { prestamosApi } from '../services/prestamosApi'
import { CARRERAS } from '../constants'
import { mensajeDeError } from '../utils/mensajeDeError'

const CAMPOS_EDITABLES = ['nombre', 'rut', 'email', 'carrera', 'es_intercambio']

const estudianteAFormulario = e => ({
  nombre: e.nombre || '',
  rut: e.rut || '',
  email: e.email || '',
  carrera: e.carrera || '',
  es_intercambio: !!e.es_intercambio,
})

export default function EstudiantesTab({ ctx, cn, SortIcon }) {
  const {
    ESTUDIANTES_LIMIT,
    estudiantesData,
    setEstudiantesData,
    estudiantesTotal,
    estudiantesLoading,
    estudiantesQuery,
    setEstudiantesQuery,
    estudiantesOffset,
    setEstudiantesOffset,
    estudiantesSort,
    estudiantesConMulta,
    setEstudiantesConMulta,
    estudiantesCarrera,
    setEstudiantesCarrera,
    loadEstudiantes,
    handleEstudiantesSort,
    estudianteToDelete,
    setEstudianteToDelete,
    estudianteDeleteLoading,
    estudianteDeleteError,
    setEstudianteDeleteError,
    estudianteDeleteBlocked,
    setEstudianteDeleteBlocked,
    handleEliminarEstudiante,
    currentUser,
  } = ctx

  const [deudaDetalle, setDeudaDetalle] = useState(null)
  const [deudaLoading, setDeudaLoading] = useState(false)

  const [editingEstudiante, setEditingEstudiante] = useState(null) // estudiante original | null
  const [editForm, setEditForm] = useState(null)
  const [editCarreraOtro, setEditCarreraOtro] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const handleVerDeuda = async estudiante => {
    setDeudaLoading(true)
    try {
      const data = await prestamosApi.obtenerDeudaEstudiante(estudiante.rut)
      setDeudaDetalle(data)
    } finally {
      setDeudaLoading(false)
    }
  }

  const handleAbrirEdicion = estudiante => {
    setEditingEstudiante(estudiante)
    setEditForm(estudianteAFormulario(estudiante))
    setEditCarreraOtro(false)
    setEditError('')
  }

  const handleCerrarEdicion = () => {
    setEditingEstudiante(null)
    setEditForm(null)
    setEditError('')
  }

  const handleGuardarEdicion = async () => {
    if (!editingEstudiante || !editForm) return
    if (!editForm.nombre.trim()) {
      setEditError('El nombre no puede estar vacío')
      return
    }
    if (!editForm.rut.trim()) {
      setEditError('El RUT/identificador no puede estar vacío')
      return
    }

    // Solo se envian los campos que realmente cambiaron.
    const cambios = {}
    for (const campo of CAMPOS_EDITABLES) {
      const original = estudianteAFormulario(editingEstudiante)[campo]
      const nuevo = editForm[campo]
      if (nuevo !== original) {
        cambios[campo] = campo === 'carrera' ? nuevo || null : nuevo
      }
    }
    if (Object.keys(cambios).length === 0) {
      handleCerrarEdicion()
      return
    }

    setEditSaving(true)
    setEditError('')
    try {
      const actualizado = await prestamosApi.actualizarEstudiante(editingEstudiante.id, cambios)
      setEstudiantesData(prev =>
        prev.map(e => (e.id === editingEstudiante.id ? { ...e, ...actualizado } : e))
      )
      handleCerrarEdicion()
    } catch (e) {
      setEditError(mensajeDeError(e, 'Error al guardar los cambios'))
    } finally {
      setEditSaving(false)
    }
  }

  const isAdmin = currentUser?.role === 'ADMIN'
  // Cualquier miembro CAi (staff) puede eliminar estudiantes sin prestamos pendientes;
  // el borrado forzoso (con prestamos sin devolver) sigue restringido a ADMIN.
  const canDelete = ['ADMIN', 'MIEMBRO'].includes(currentUser?.role)
  const gridCols = canDelete
    ? 'grid-cols-[1.8fr_1.2fr_1.6fr_1.4fr_0.9fr_4.5rem]'
    : 'grid-cols-[1.8fr_1.2fr_1.6fr_1.4fr_0.9fr]'

  return (
    <div className="space-y-5">
      {/* Modal desglose deuda */}
      {deudaDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Receipt className="w-4 h-4 text-red-500" />
                  <p className="font-bold text-cai-dark text-sm">Desglose de deuda</p>
                </div>
                <p className="text-xs text-gray-400 font-semibold">
                  {deudaDetalle.estudiante_nombre}
                </p>
              </div>
              <button
                onClick={() => setDeudaDetalle(null)}
                className="text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2 bg-gray-50 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                <span>Artículo</span>
                <span>Estado</span>
                <span className="text-right">Multa</span>
              </div>
              {deudaDetalle.items.length === 0 ? (
                <p className="text-xs text-gray-400 px-4 py-3">Sin préstamos pendientes.</p>
              ) : (
                deudaDetalle.items.map(item => (
                  <div
                    key={item.prestamo_id}
                    className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-3 border-t border-gray-100 items-center"
                  >
                    <div>
                      <p className="text-sm font-semibold text-cai-dark">{item.articulo_nombre}</p>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-lg',
                        item.estado === 'VENCIDO'
                          ? 'bg-red-50 text-red-500'
                          : 'bg-amber-50 text-amber-600'
                      )}
                    >
                      {item.estado}
                    </span>
                    <span className="text-sm font-bold text-red-600 text-right tabular-nums">
                      {item.multa_actual > 0
                        ? `$${item.multa_actual.toLocaleString('es-CL')}`
                        : '—'}
                    </span>
                  </div>
                ))
              )}
              {deudaDetalle.total > 0 && (
                <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-3 border-t border-gray-200 bg-red-50/50">
                  <span className="text-xs font-bold text-cai-dark col-span-2">Total</span>
                  <span className="text-sm font-bold text-red-600 text-right tabular-nums">
                    ${deudaDetalle.total.toLocaleString('es-CL')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal editar estudiante: cualquier campo, en un solo lugar */}
      {editingEstudiante && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 p-6 pb-4">
              <div>
                <p className="font-bold text-cai-dark text-sm">Editar estudiante</p>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">
                  Corrige cualquier dato mal tipeado
                </p>
              </div>
              <button
                onClick={handleCerrarEdicion}
                className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editForm.nombre}
                  onChange={ev => setEditForm({ ...editForm, nombre: ev.target.value })}
                  className="w-full bg-cai-surface border border-cai-border rounded-xl py-2.5 px-3 text-sm font-semibold text-cai-black outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                    {editForm.es_intercambio ? 'Identificador' : 'RUT'}
                  </label>
                  <input
                    type="text"
                    value={editForm.rut}
                    onChange={ev => setEditForm({ ...editForm, rut: ev.target.value })}
                    className="w-full bg-cai-surface border border-cai-border rounded-xl py-2.5 px-3 text-sm font-semibold text-cai-black outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                  />
                </div>
                <div className="flex items-end pb-2.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editForm.es_intercambio}
                      onChange={ev =>
                        setEditForm({ ...editForm, es_intercambio: ev.target.checked })
                      }
                      className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-gray-500 uppercase">Intercambio</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={ev => setEditForm({ ...editForm, email: ev.target.value })}
                  placeholder="correo@ejemplo.cl"
                  className="w-full bg-cai-surface border border-cai-border rounded-xl py-2.5 px-3 text-sm font-semibold text-cai-black outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                  Carrera
                </label>
                {editCarreraOtro ? (
                  <input
                    autoFocus
                    type="text"
                    value={editForm.carrera}
                    onChange={ev => setEditForm({ ...editForm, carrera: ev.target.value })}
                    placeholder="Escribe la carrera..."
                    className="w-full bg-cai-surface border border-cai-border rounded-xl py-2.5 px-3 text-sm font-semibold text-cai-black outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                  />
                ) : (
                  <select
                    value={CARRERAS.includes(editForm.carrera) ? editForm.carrera : ''}
                    onChange={ev => {
                      if (ev.target.value === '__otro__') {
                        setEditCarreraOtro(true)
                        setEditForm({ ...editForm, carrera: '' })
                      } else {
                        setEditForm({ ...editForm, carrera: ev.target.value })
                      }
                    }}
                    className="w-full bg-cai-surface border border-cai-border rounded-xl py-2.5 px-3 text-sm font-semibold text-cai-black outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 cursor-pointer"
                  >
                    <option value="">Sin carrera</option>
                    {CARRERAS.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__otro__">✏ Escribir manualmente...</option>
                  </select>
                )}
              </div>
              {editError && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 rounded-xl px-3 py-2">
                  {editError}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCerrarEdicion}
                  disabled={editSaving}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardarEdicion}
                  disabled={editSaving}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {editSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal eliminar */}
      {estudianteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <button
                onClick={() => {
                  setEstudianteToDelete(null)
                  setEstudianteDeleteError(null)
                  setEstudianteDeleteBlocked(false)
                }}
                className="text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <p className="font-bold text-cai-dark text-sm">Eliminar estudiante</p>
              <p className="text-gray-500 text-sm mt-1">
                ¿Eliminar a{' '}
                <span className="font-semibold text-cai-dark">{estudianteToDelete.nombre}</span>?
                Esta acción no se puede deshacer.
              </p>
            </div>
            {estudianteDeleteError && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 rounded-xl px-3 py-2">
                {estudianteDeleteError}
              </p>
            )}
            {estudianteDeleteBlocked && (
              <p className="text-xs font-semibold text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
                {isAdmin
                  ? 'El borrado forzoso elimina también los préstamos sin devolver y libera los artículos asociados. Úsalo solo si estás seguro.'
                  : 'Solo un administrador puede forzar la eliminación de un estudiante con préstamos sin devolver.'}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setEstudianteToDelete(null)
                  setEstudianteDeleteError(null)
                  setEstudianteDeleteBlocked(false)
                }}
                disabled={estudianteDeleteLoading}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              {estudianteDeleteBlocked && isAdmin ? (
                <button
                  onClick={() => handleEliminarEstudiante(true)}
                  disabled={estudianteDeleteLoading}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {estudianteDeleteLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Forzar eliminación
                </button>
              ) : estudianteDeleteBlocked ? null : (
                <button
                  onClick={() => handleEliminarEstudiante(false)}
                  disabled={estudianteDeleteLoading}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {estudianteDeleteLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-cai-dark">Estudiantes</h2>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">
            {estudiantesTotal > 0 && `${estudiantesTotal.toLocaleString('es-CL')} registrados`}
          </p>
        </div>
        <button
          onClick={() =>
            loadEstudiantes(
              estudiantesQuery,
              estudiantesOffset,
              estudiantesSort,
              estudiantesConMulta,
              estudiantesCarrera
            )
          }
          className="px-4 py-2 bg-white/70 border border-gray-100 rounded-xl text-xs font-semibold flex gap-2 items-center hover:bg-white transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', estudiantesLoading && 'animate-spin')} />{' '}
          Actualizar
        </button>
      </div>

      {/* Barra de búsqueda + filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder="Buscar por nombre, RUT o email..."
            value={estudiantesQuery}
            onChange={e => {
              setEstudiantesQuery(e.target.value)
              setEstudiantesOffset(0)
            }}
            className="w-full pl-9 pr-4 py-2.5 bg-white/70 border border-gray-100 rounded-xl text-sm font-medium text-cai-dark placeholder:text-gray-300 focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
          <select
            value={estudiantesCarrera}
            onChange={e => {
              setEstudiantesCarrera(e.target.value)
              setEstudiantesOffset(0)
            }}
            className={cn(
              'pl-8 pr-3 py-2.5 rounded-xl text-xs font-bold border transition-all appearance-none cursor-pointer',
              estudiantesCarrera
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200'
                : 'bg-white/70 text-gray-500 border-gray-100 hover:border-emerald-200 hover:text-emerald-600'
            )}
          >
            <option value="">Todas las carreras</option>
            {CARRERAS.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            setEstudiantesConMulta(v => !v)
            setEstudiantesOffset(0)
          }}
          className={cn(
            'px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all shrink-0',
            estudiantesConMulta
              ? 'bg-red-500 text-white border-red-500 shadow-sm shadow-red-200'
              : 'bg-white/70 text-gray-500 border-gray-100 hover:border-red-200 hover:text-red-500'
          )}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Con deuda
        </button>
      </div>

      {/* Tabla */}
      {estudiantesLoading && estudiantesData.length === 0 ? (
        <div className="glass-panel rounded-[24px] p-10 text-center">
          <RefreshCw className="w-6 h-6 text-gray-300 animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-semibold">Cargando estudiantes...</p>
        </div>
      ) : estudiantesData.length === 0 ? (
        <div className="glass-panel rounded-[24px] p-10 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-400 text-sm font-semibold">
            {estudiantesConMulta
              ? 'No hay estudiantes con deuda pendiente'
              : estudiantesCarrera
                ? `Sin resultados para carrera "${estudiantesCarrera}"`
                : estudiantesQuery
                  ? 'Sin resultados para esa búsqueda'
                  : 'No hay estudiantes registrados'}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            'glass-panel rounded-[24px] overflow-hidden transition-opacity',
            estudiantesLoading && 'opacity-60'
          )}
        >
          {/* Header tabla — solo desktop */}
          <div
            className={cn(
              'hidden lg:grid gap-4 px-5 py-3 border-b border-gray-100 text-[10px] font-bold uppercase text-gray-400 tracking-wider',
              gridCols
            )}
          >
            <button
              onClick={() => handleEstudiantesSort('nombre')}
              className="flex items-center gap-1 hover:text-cai-dark transition-colors cursor-pointer text-left"
            >
              Nombre <SortIcon col="nombre" sort={estudiantesSort} />
            </button>
            <button
              onClick={() => handleEstudiantesSort('rut')}
              className="flex items-center gap-1 hover:text-cai-dark transition-colors cursor-pointer text-left"
            >
              RUT <SortIcon col="rut" sort={estudiantesSort} />
            </button>
            <span>Carrera</span>
            <span>Email</span>
            <button
              onClick={() => handleEstudiantesSort('multa_acumulada')}
              className="flex items-center gap-1 hover:text-cai-dark transition-colors cursor-pointer text-left"
            >
              Deuda <SortIcon col="multa_acumulada" sort={estudiantesSort} />
            </button>
            {canDelete && (
              <button
                onClick={() => handleEstudiantesSort('created_at')}
                className="flex items-center gap-1 hover:text-cai-dark transition-colors cursor-pointer"
                title="Ordenar por antigüedad"
              >
                <SortIcon col="created_at" sort={estudiantesSort} />
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {estudiantesData.map(e => (
              <div
                key={e.id}
                className={cn(
                  'lg:grid gap-4 px-5 py-4 items-center hover:bg-gray-50/50 transition-colors',
                  gridCols
                )}
              >
                {/* Nombre */}
                <div className="flex items-center gap-3 mb-1 lg:mb-0">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="font-semibold text-sm text-cai-dark truncate">{e.nombre}</p>
                </div>
                {/* RUT */}
                <p className="text-xs font-mono font-bold text-gray-500 mb-1 lg:mb-0">{e.rut}</p>
                {/* Carrera */}
                <p className="text-xs font-semibold text-gray-500 truncate mb-1 lg:mb-0">
                  {e.carrera || <span className="text-gray-300 italic">—</span>}
                </p>
                {/* Email */}
                <p className="text-xs font-semibold text-gray-500 truncate mb-1 lg:mb-0">
                  {e.email || <span className="text-gray-300 italic">sin email</span>}
                </p>
                {/* Multa */}
                <div className="mb-1 lg:mb-0">
                  {e.multa_acumulada > 0 ? (
                    <button
                      onClick={() => handleVerDeuda(e)}
                      disabled={deudaLoading}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                      title="Ver desglose de deuda"
                    >
                      {deudaLoading ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Receipt className="w-3 h-3" />
                      )}
                      ${e.multa_acumulada.toLocaleString('es-CL')}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </div>
                {/* Editar / Eliminar (cualquier miembro CAi) */}
                {canDelete && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAbrirEdicion(e)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                      title={`Editar a ${e.nombre}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEstudianteDeleteError(null)
                        setEstudianteDeleteBlocked(false)
                        setEstudianteToDelete({ id: e.id, nombre: e.nombre })
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title={`Eliminar a ${e.nombre}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer paginación */}
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between gap-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase">
              {estudiantesTotal === 0
                ? '0 registros'
                : `${estudiantesOffset + 1}–${Math.min(estudiantesOffset + ESTUDIANTES_LIMIT, estudiantesTotal)} de ${estudiantesTotal.toLocaleString('es-CL')}`}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={estudiantesOffset === 0}
                onClick={() =>
                  setEstudiantesOffset(Math.max(0, estudiantesOffset - ESTUDIANTES_LIMIT))
                }
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-cai-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-bold text-gray-400">
                Pág {Math.floor(estudiantesOffset / ESTUDIANTES_LIMIT) + 1} /{' '}
                {Math.ceil(estudiantesTotal / ESTUDIANTES_LIMIT) || 1}
              </span>
              <button
                disabled={estudiantesOffset + ESTUDIANTES_LIMIT >= estudiantesTotal}
                onClick={() => setEstudiantesOffset(estudiantesOffset + ESTUDIANTES_LIMIT)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-cai-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
