import React from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from './ui'

export default function InsumoRow({ insumo, onUpdate }) {
  const [val, setVal] = React.useState(insumo.stock_actual)
  const [isEditing, setIsEditing] = React.useState(false)

  React.useEffect(() => {
    if (!isEditing) {
      setVal(insumo.stock_actual)
    }
  }, [insumo.stock_actual, isEditing])

  const handleCommit = newVal => {
    if (newVal < 0) newVal = 0
    setVal(newVal)
    setIsEditing(false)
    if (newVal !== insumo.stock_actual) {
      onUpdate(insumo.id, insumo.stock_actual, newVal)
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter') handleCommit(val)
  }

  const isDanger = val <= 0
  const isWarning = val > 0 && val <= (insumo.stock_critico || 5)

  return (
    <div
      className={cn(
        'p-4 rounded-xl border flex items-center justify-between transition-all',
        isDanger
          ? 'bg-red-50/50 border-red-100'
          : isWarning
            ? 'bg-orange-50/50 border-orange-100'
            : 'bg-white/70 border-gray-100'
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
        <div className="min-w-0">
          <p
            className={cn(
              'font-bold text-sm truncate',
              isDanger ? 'text-red-900' : isWarning ? 'text-orange-900' : 'text-cai-dark'
            )}
          >
            {insumo.nombre}
          </p>
          <p className="text-[10px] font-semibold text-gray-400 uppercase truncate">
            {insumo.categoria}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleCommit(val - 1)}
          className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-cai-dark active:scale-95 transition-all shadow-sm"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          value={val}
          onChange={e => {
            setIsEditing(true)
            setVal(parseInt(e.target.value) || 0)
          }}
          onBlur={() => handleCommit(val)}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-14 h-8 text-center text-sm font-black bg-white border a rounded-lg outline-none focus:ring-2 transition-all shadow-inner',
            isDanger
              ? 'text-red-600 border-red-200 focus:ring-red-500/20 focus:border-red-300'
              : isWarning
                ? 'text-orange-600 border-orange-200 focus:ring-orange-500/20 focus:border-orange-300'
                : 'text-cai-dark border-gray-200 focus:ring-blue-500/20 focus:border-blue-300'
          )}
        />
        <button
          onClick={() => handleCommit(val + 1)}
          className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-cai-dark active:scale-95 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
