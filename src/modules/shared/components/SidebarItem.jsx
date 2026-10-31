import React from 'react'

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }) => {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-full flex items-center cursor-pointer transition-colors duration-150 border-0 text-left text-sm rounded-none py-[11px] ${collapsed ? 'px-0 justify-center gap-0' : 'px-5 justify-start gap-3'} ${active ? 'font-bold text-white bg-[var(--mod-color)]' : 'font-medium text-white/50 bg-transparent'}`}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.85)'
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
      }}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </button>
  )
}

export default SidebarItem
