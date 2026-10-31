import React, { useEffect, useState } from 'react'
import { Package, Plus, Trash2, X } from 'lucide-react'
import useEscape from '../hooks/useEscape'

const INPUT_CLS =
  'w-full bg-cai-surface border border-cai-border rounded-xl py-3 px-4 text-sm font-semibold text-cai-black outline-none transition-shadow duration-[120ms] focus:ring-2 focus:ring-emerald-500/20'

/**
 * Crea o edita un combo (atajo para prestar varios artículos juntos, ej.
 * Delantal+Antiparra). `combo` es `{}` para uno nuevo, el combo completo
 * (con `id`) para editar, o cae a valores por defecto si viene incompleto.
 */
export default function ComboModal({ combo, articulos, onSave, onDelete, onClose }) {
  const [nombre, setNombre] = useState('')
  const [items, setItems] = useState([{ articulo_id: '', cantidad: 1 }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEscape(onClose, !loading)

  useEffect(() => {
    setNombre(combo?.nombre || '')
    setItems(
      combo?.items?.length
        ? combo.items.map(i => ({ articulo_id: i.articulo_id, cantidad: i.cantidad }))
        : [{ articulo_id: '', cantidad: 1 }]
    )
    setError('')
  }, [combo])

  if (!combo) return null

  const articulosOrdenados = [...(articulos || [])].sort((a, b) => a.nombre.localeCompare(b.nombre))

  const updateItem = (index, patch) => {
    setItems(prev => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  const removeItem = index => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const addItem = () => {
    setItems(prev => [...prev, { articulo_id: '', cantidad: 1 }])
  }

  const handleGuardar = async () => {
    setError('')
    if (!nombre.trim()) {
      setError('El combo necesita un nombre')
      return
    }
    const itemsValidos = items.filter(i => i.articulo_id)
    if (itemsValidos.length === 0) {
      setError('Agrega al menos un artículo')
      return
    }
    setLoading(true)
    try {
      const ok = await onSave({
        id: combo.id,
        nombre: nombre.trim(),
        items: itemsValidos.map(i => ({
          articulo_id: Number(i.articulo_id),
          cantidad: Math.max(parseInt(i.cantidad, 10) || 1, 1),
        })),
      })
      if (!ok) setError('No se pudo guardar el combo')
    } finally {
      setLoading(false)
    }
  }

  const handleEliminar = async () => {
    if (!combo.id) return
    setLoading(true)
    try {
      await onDelete(combo.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl w-full max-w-md overflow-hidden shadow-2xl bg-white border border-cai-border">
        <div className="p-6 flex justify-between items-center bg-cai-surface border-b border-cai-border">
          <h3 className="font-bold text-lg text-cai-black flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            {combo.id ? 'Editar Combo' : 'Nuevo Combo'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer bg-white border border-cai-border text-[#888884] hover:bg-cai-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
              Nombre del combo
            </label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className={INPUT_CLS}
              placeholder="Ej: Delantal + Antiparra"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
              Artículos incluidos
            </label>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={item.articulo_id}
                    onChange={e => updateItem(index, { articulo_id: e.target.value })}
                    className={`${INPUT_CLS} cursor-pointer flex-1`}
                  >
                    <option value="">Selecciona un artículo...</option>
                    {articulosOrdenados.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={item.cantidad}
                    onChange={e => updateItem(index, { cantidad: e.target.value })}
                    className={`${INPUT_CLS} w-16 text-center shrink-0`}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="w-9 h-9 shrink-0 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Quitar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar artículo
            </button>
          </div>

          {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            {combo.id && (
              <button
                type="button"
                onClick={handleEliminar}
                disabled={loading}
                className="px-4 py-3.5 rounded-xl border border-red-200 text-red-500 text-sm font-bold hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Eliminar
              </button>
            )}
            <button
              type="button"
              onClick={handleGuardar}
              disabled={loading}
              className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors cursor-pointer active:scale-[0.98]"
            >
              {loading ? 'Guardando…' : 'Guardar combo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
