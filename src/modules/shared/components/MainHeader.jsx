import React from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Sun, Moon, Menu, RotateCcw } from 'lucide-react'
import { useAuth } from '../../auth'
import { useTheme } from '../../../core/theme'
import { reiniciarDatos } from '../../../mock/db'
import { ControlesNovedades } from '../../../novedades'
import { usePageLayout } from './PageLayout'

export default function MainHeader() {
  const layout = usePageLayout()
  const { currentUser, logout, setRole } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const initials = currentUser?.full_name
    ? currentUser.full_name
        .split(' ')
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase()
    : 'U'

  const displayName = currentUser?.full_name?.split(' ').slice(0, 2).join(' ') || 'Usuario'
  const role = currentUser?.display_name || currentUser?.role || 'Miembro'

  return (
    <header className="h-[60px] flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40 shrink-0 bg-cai-black border-b-[3px] border-b-[var(--mod-color)]">
      {/* Izquierda: hamburger (móvil) + logo */}
      <div className="flex items-center gap-2">
        {layout && (
          <>
            {/* Móvil: abre drawer */}
            <button
              onClick={layout.toggleMobile}
              className="lg:hidden p-2 cursor-pointer rounded text-white/60"
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              title="Menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Desktop: colapsa/expande sidebar */}
            <button
              onClick={layout.toggleCollapsed}
              className="hidden lg:flex p-2 cursor-pointer rounded text-white/60"
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              title={layout.collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              <Menu className="w-5 h-5" />
            </button>
          </>
        )}

        <button
          onClick={() => navigate('/')}
          className="flex items-center shrink-0 cursor-pointer"
          title="Ir al inicio"
        >
          <span className="flex items-center justify-center bg-cai-yellow rounded-[3px] w-[38px] h-[46px] p-[2px]">
            <img
              src={`${import.meta.env.BASE_URL}cai-logo.svg`}
              alt="CAi"
              className="w-[33px] h-auto"
            />
          </span>
        </button>
      </div>

      {/* Derecha: usuario + admin + dark mode + logout */}
      <div className="flex items-center gap-2">
        {/* Avatar + nombre */}
        <div className="hidden sm:flex items-center gap-2.5 mr-1">
          <span className="flex items-center justify-center shrink-0 font-bold text-xs bg-cai-yellow text-cai-black rounded-full w-[30px] h-[30px]">
            {initials}
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-[13px] font-semibold text-white">{displayName}</span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-white/40 mt-0.5">
              {role}
            </span>
          </div>
        </div>

        {/* Prototipo: comparar Original / Mejoras y marcas "Nuevo" */}
        <div className="hidden sm:block mr-1">
          <ControlesNovedades />
        </div>

        {/* Prototipo: rol simulado (en el sistema real viene de la sesión) */}
        <label className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-white/45">
          <span className="hidden md:inline">Rol demo</span>
          <select
            value={currentUser?.role}
            onChange={e => setRole(e.target.value)}
            className="bg-transparent text-white/80 border border-white/20 rounded px-1.5 py-1 text-[11px] cursor-pointer"
            title="Cambiar el rol simulado"
          >
            <option value="ADMIN" className="text-black">
              Admin
            </option>
            <option value="MIEMBRO" className="text-black">
              Miembro
            </option>
          </select>
        </label>

        {/* Prototipo: vuelve a los datos ficticios iniciales */}
        <button
          onClick={() => {
            if (
              window.confirm(
                '¿Reiniciar los datos de prueba? Se perderán los cambios hechos en el prototipo.'
              )
            ) {
              reiniciarDatos()
            }
          }}
          className="p-2 rounded transition-colors cursor-pointer text-white/45"
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
          title="Reiniciar datos de prueba"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded transition-colors cursor-pointer text-white/45"
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 rounded transition-colors cursor-pointer text-white/45"
          onMouseEnter={e => (e.currentTarget.style.color = '#ff6b6b')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
