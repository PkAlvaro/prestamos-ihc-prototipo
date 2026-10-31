import React, { useEffect, useState } from 'react'
import {
  Zap,
  Package,
  Archive,
  AlertCircle,
  ScanBarcode,
  User,
  Users,
  Clock,
  BarChart2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Mail,
  Wallet,
  MoreHorizontal,
  HelpCircle,
} from 'lucide-react'
import { useModuleColor } from '../../../core/theme'

import {
  SidebarItem,
  MainHeader,
  PageLayout,
  PageLayoutProvider,
  usePageLayout,
} from '../../shared'
import { usePrestamosPageState } from '../hooks/usePrestamosPageState'
import { GuiaNovedad, useNovedad } from '../../../novedades'
import EscaneoTab from '../components/EscaneoTab'
import ActivosTab from '../components/ActivosTab'
import VencidosTab from '../components/VencidosTab'
import ArticulosTab from '../components/ArticulosTab'
import HistorialTab from '../components/HistorialTab'
import EstudiantesTab from '../components/EstudiantesTab'
import AnalisisTab from '../components/AnalisisTab'
import QRTab from '../components/QRTab'
import MailingTab from '../components/MailingTab'
import PrestamosModals from '../components/PrestamosModals'
import ContabilidadTab from '../components/ContabilidadTab'
import AyudaModal from '../components/AyudaModal'
import { cn } from '../components/ui'

const MOD_COLOR = '#16A34A'

const BOTTOM_NAV_TABS = [
  { key: 'escaneo', icon: Zap, label: 'Préstamo' },
  { key: 'activos', icon: Package, label: 'Activos' },
  { key: 'vencidos', icon: AlertCircle, label: 'Vencidos' },
  { key: 'historial', icon: Clock, label: 'Historial' },
]

function MobileBottomNav({ activeTab, onNavigate }) {
  const { toggleMobile } = usePageLayout()
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-cai-black border-t border-white/[0.06] flex"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {BOTTOM_NAV_TABS.map(({ key, icon: Icon, label }) => {
        const active = activeTab === key
        return (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors"
            style={{ color: active ? MOD_COLOR : 'rgba(255,255,255,0.35)' }}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
          </button>
        )
      })}
      <button
        onClick={toggleMobile}
        className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors text-white/35 hover:text-white/70"
      >
        <MoreHorizontal className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-wider">Más</span>
      </button>
    </nav>
  )
}

const SortIcon = ({ col, sort }) => {
  if (sort.col !== col) return <ChevronsUpDown className="w-3 h-3 opacity-30" />
  return sort.dir === 'asc' ? (
    <ChevronUp className="w-3 h-3" />
  ) : (
    <ChevronDown className="w-3 h-3" />
  )
}

export default function PrestamosPage({ onBack }) {
  const ctx = usePrestamosPageState(onBack)
  const { prestamosTab, handleBack, navigateToPrestamosTab, currentUser } = ctx
  const { setModuleColor } = useModuleColor()
  const [ayudaAbierta, setAyudaAbierta] = useState(false)
  const { activa: atencionesActiva } = useNovedad('atenciones-espera')

  useEffect(() => {
    setModuleColor(MOD_COLOR)
  }, [setModuleColor])

  const navigate = tab => navigateToPrestamosTab(tab)

  const renderTab = () => {
    if (prestamosTab === 'escaneo') return <EscaneoTab ctx={ctx} cn={cn} />
    if (prestamosTab === 'activos') return <ActivosTab ctx={ctx} cn={cn} SortIcon={SortIcon} />
    if (prestamosTab === 'vencidos') return <VencidosTab ctx={ctx} cn={cn} SortIcon={SortIcon} />
    if (prestamosTab === 'articulos') return <ArticulosTab ctx={ctx} cn={cn} />
    if (prestamosTab === 'historial') return <HistorialTab ctx={ctx} cn={cn} SortIcon={SortIcon} />
    if (prestamosTab === 'estudiantes')
      return <EstudiantesTab ctx={ctx} cn={cn} SortIcon={SortIcon} />
    if (prestamosTab === 'analisis') return <AnalisisTab />
    if (prestamosTab === 'qr') return <QRTab ctx={ctx} cn={cn} />
    if (prestamosTab === 'mailing') return <MailingTab ctx={ctx} />
    if (prestamosTab === 'contabilidad') return <ContabilidadTab />
    return null
  }

  return (
    <PageLayoutProvider>
      <div className="flex flex-col h-screen bg-[var(--surface-page)]">
        <MainHeader />

        <PageLayout
          sidebarContent={({ collapsed }) => (
            <>
              {/* ← Inicio */}
              <button
                onClick={handleBack}
                className={`flex items-center w-full cursor-pointer transition-colors duration-150 text-xs text-white/35 bg-transparent border-0 pt-[14px] pb-[10px] ${collapsed ? 'px-0 justify-center' : 'px-5 justify-start'}`}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
              >
                {collapsed ? '←' : '← Inicio'}
              </button>

              {/* Módulo header */}
              <div
                className={`flex items-center px-5 py-4 ${collapsed ? 'gap-0 justify-center' : 'gap-3 justify-start'}`}
              >
                <div className="flex items-center justify-center shrink-0 w-10 h-10 rounded-[10px] bg-[var(--mod-color)]">
                  <ScanBarcode className="w-5 h-5 text-white" />
                </div>
                {!collapsed && (
                  <div>
                    <p className="font-bold text-sm text-white leading-tight">Préstamos</p>
                    <p className="text-[10px] text-white/35 tracking-[0.5px] uppercase font-bold">
                      Gestión de préstamos
                    </p>
                  </div>
                )}
              </div>

              <div className="h-px bg-white/[0.06] my-1" />

              <nav className="flex-1 py-2">
                <SidebarItem
                  icon={Zap}
                  label="Nuevo préstamo"
                  badge={atencionesActiva ? ctx.atencionesEnEspera.length : 0}
                  badgeTitle={`${ctx.atencionesEnEspera.length} en espera`}
                  active={prestamosTab === 'escaneo'}
                  onClick={() => navigate('escaneo')}
                  collapsed={collapsed}
                />
                <SidebarItem
                  icon={Package}
                  label="Activos"
                  active={prestamosTab === 'activos'}
                  onClick={() => navigate('activos')}
                  collapsed={collapsed}
                />
                <SidebarItem
                  icon={AlertCircle}
                  label="Vencidos"
                  active={prestamosTab === 'vencidos'}
                  onClick={() => navigate('vencidos')}
                  collapsed={collapsed}
                />
                <SidebarItem
                  icon={Archive}
                  label="Stock"
                  active={prestamosTab === 'articulos'}
                  onClick={() => navigate('articulos')}
                  collapsed={collapsed}
                />
                <SidebarItem
                  icon={Clock}
                  label="Historial"
                  active={prestamosTab === 'historial'}
                  onClick={() => navigate('historial')}
                  collapsed={collapsed}
                />
                <SidebarItem
                  icon={Users}
                  label="Estudiantes"
                  active={prestamosTab === 'estudiantes'}
                  onClick={() => navigate('estudiantes')}
                  collapsed={collapsed}
                />
                <SidebarItem
                  icon={BarChart2}
                  label="Análisis"
                  active={prestamosTab === 'analisis'}
                  onClick={() => navigate('analisis')}
                  collapsed={collapsed}
                />
                <SidebarItem
                  icon={Mail}
                  label="Mailing"
                  active={prestamosTab === 'mailing'}
                  onClick={() => navigate('mailing')}
                  collapsed={collapsed}
                />
                <SidebarItem
                  icon={Wallet}
                  label="Contabilidad"
                  active={prestamosTab === 'contabilidad'}
                  onClick={() => navigate('contabilidad')}
                  collapsed={collapsed}
                />
                <SidebarItem
                  icon={HelpCircle}
                  label="Ayuda"
                  active={ayudaAbierta}
                  onClick={() => setAyudaAbierta(true)}
                  collapsed={collapsed}
                />
              </nav>

              {/* Avatar usuario */}
              <div
                className={`flex items-center mt-auto ${collapsed ? 'py-4 px-0 justify-center gap-0' : 'py-4 px-5 justify-start gap-[10px]'}`}
              >
                <span className="flex items-center justify-center shrink-0 font-bold text-xs w-[30px] h-[30px] rounded-full bg-cai-yellow text-cai-black">
                  {currentUser?.full_name ? (
                    currentUser.full_name
                      .split(' ')
                      .slice(0, 2)
                      .map(w => w[0])
                      .join('')
                      .toUpperCase()
                  ) : (
                    <User className="w-3 h-3" />
                  )}
                </span>
                {!collapsed && (
                  <span className="text-xs text-white/50 font-medium">
                    {currentUser?.full_name?.split(' ')[0] || 'Usuario'}
                  </span>
                )}
              </div>
            </>
          )}
        >
          <div className="pb-20 lg:pb-0">
            <GuiaNovedad contexto={ctx} />
            {renderTab()}
          </div>
        </PageLayout>

        <PrestamosModals ctx={ctx} />
        {ayudaAbierta && <AyudaModal onClose={() => setAyudaAbierta(false)} />}
        <MobileBottomNav activeTab={prestamosTab} onNavigate={navigate} />
      </div>
    </PageLayoutProvider>
  )
}
