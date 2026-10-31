import React from 'react'

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed, badge, badgeTitle }) => {
  return (
    <button
      onClick={onClick}
      title={badge ? `${label} · ${badgeTitle ?? badge}` : label}
      className={`w-full flex items-center cursor-pointer transition-colors duration-150 border-0 text-left text-sm rounded-none py-[11px] ${collapsed ? 'px-0 justify-center gap-0' : 'px-5 justify-start gap-3'} ${active ? 'font-bold text-white bg-[var(--mod-color)]' : 'font-medium text-white/50 bg-transparent'}`}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.85)'
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
      }}
    >
      <span className="relative shrink-0">
        <Icon className="w-4 h-4" />
        {badge > 0 && collapsed && (
          <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-amber-400" />
        )}
      </span>
      {!collapsed && <span className="flex-1">{label}</span>}
      {!collapsed && badge > 0 && (
        <span className="min-w-5 h-5 px-1.5 rounded-full bg-amber-400 text-cai-black text-[11px] font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  )
}

export default SidebarItem
