import { Package } from 'lucide-react'

export default function ArticuloCard({ group }) {
  if (!group) return null
  return (
    <div className="glass-panel p-5 rounded-[24px]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-cai-dark truncate">{group.nombre}</h3>
          <p className="text-xs text-gray-400 font-semibold truncate">{group.categoria}</p>
        </div>
      </div>
    </div>
  )
}
