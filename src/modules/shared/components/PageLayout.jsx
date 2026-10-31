import React, { useState, useCallback, useEffect, createContext, useContext } from 'react'
import { X } from 'lucide-react'

const PageLayoutContext = createContext(null)
export const usePageLayout = () => useContext(PageLayoutContext)

export function PageLayoutProvider({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('cai-sidebar-collapsed') === 'true'
    } catch (_) {
      return false
    }
  })

  const toggleMobile = useCallback(() => setMobileOpen(o => !o), [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])
  const toggleCollapsed = useCallback(() => {
    setCollapsed(c => {
      const next = !c
      try {
        localStorage.setItem('cai-sidebar-collapsed', String(next))
      } catch (_) {
        // localStorage no disponible
      }
      return next
    })
  }, [])

  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape') closeMobile()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [closeMobile])

  return (
    <PageLayoutContext.Provider
      value={{ toggleMobile, mobileOpen, closeMobile, collapsed, toggleCollapsed }}
    >
      {children}
    </PageLayoutContext.Provider>
  )
}

export default function PageLayout({ sidebarContent, children }) {
  const { mobileOpen, closeMobile, collapsed } = usePageLayout()

  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden bg-black/60" onClick={closeMobile} />
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 overflow-y-auto bg-cai-black border-r border-white/[0.06] transition-[width] duration-150 ${collapsed ? 'w-16' : 'w-60'}`}
      >
        {sidebarContent({ collapsed })}
      </aside>

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col overflow-y-auto lg:hidden w-60 bg-cai-black transition-transform duration-150 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button
          onClick={closeMobile}
          className="absolute top-3 right-3 z-10 p-1.5 cursor-pointer rounded text-white/45"
          title="Cerrar menú"
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
        >
          <X className="w-4 h-4" />
        </button>

        {sidebarContent({ collapsed: false })}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  )
}
