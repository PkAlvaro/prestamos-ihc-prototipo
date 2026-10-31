import React from 'react'
import { Navigate, Route, Routes, useNavigate, Link } from 'react-router-dom'
import { ClipboardList, Smartphone, FlaskConical } from 'lucide-react'
import { ThemeProvider } from './core/theme'
import { ROUTE_PATHS, buildPrestamosPath } from './core/routing'
import { DemoAuthProvider } from './modules/auth'
import { PrestamosProvider, PrestamosPage, PrestamosAutorregistroPage } from './modules/prestamos'
import { NOVEDADES_PRESTAMOS } from './modules/prestamos/novedades'
import { NovedadesProvider, SeccionNovedades } from './novedades'

function AvisoPrototipo() {
  return (
    <div className="fixed bottom-[72px] lg:bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-cai-black text-white/80 text-[11px] font-medium border border-white/10 pointer-events-none">
      <FlaskConical className="w-3.5 h-3.5 text-cai-yellow" />
      Prototipo académico · datos ficticios
    </div>
  )
}

function Inicio() {
  const opciones = [
    {
      to: buildPrestamosPath(),
      icono: ClipboardList,
      titulo: 'Panel de préstamos (staff)',
      texto:
        'Lo que usa el equipo en el mesón: escanear la TUC, prestar y devolver artículos, multas, inventario, reportes.',
    },
    {
      to: ROUTE_PATHS.autorregistro,
      icono: Smartphone,
      titulo: 'Autorregistro (estudiante)',
      texto:
        'Formulario que abre el estudiante desde su celular (QR del mesón) para registrarse y aceptar el uso de sus datos.',
    },
  ]
  return (
    <div className="min-h-screen bg-cai-surface flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full">
        <p className="text-xs font-bold uppercase tracking-widest text-mod-prestamos mb-2">
          Prototipo · Interacción Humano-Computador
        </p>
        <h1 className="text-3xl font-black text-cai-black mb-3">Módulo de Préstamos</h1>
        <p className="text-sm text-cai-gray mb-8 max-w-xl">
          Copia de la interfaz del sistema de préstamos funcionando sin servidor. Todos los datos
          son ficticios, se guardan solo en este navegador y no se envía ningún correo.
        </p>
        <SeccionNovedades />
        <h2 className="mt-10 mb-3 text-xs font-bold uppercase tracking-widest text-cai-black">
          Explorar libremente
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {opciones.map(({ to, icono: Icono, titulo, texto }) => (
            <Link
              key={to}
              to={to}
              className="group block bg-white border border-cai-border rounded-lg p-5 cursor-pointer transition-colors duration-150 hover:border-mod-prestamos"
            >
              <Icono className="w-6 h-6 text-mod-prestamos mb-3" />
              <h2 className="font-bold text-cai-black mb-1">{titulo}</h2>
              <p className="text-xs text-cai-gray leading-relaxed">{texto}</p>
            </Link>
          ))}
        </div>
        <ul className="mt-8 text-xs text-cai-gray space-y-1">
          <li>
            · RUT de prueba para escanear: elige uno en la pestaña <em>Estudiantes</em>, o ingresa
            uno nuevo para ver el registro con consentimiento.
          </li>
          <li>
            · Código de verificación por correo: siempre <strong>123456</strong>.
          </li>
          <li>
            · Arriba a la derecha puedes cambiar el rol (Admin / Miembro) y reiniciar los datos.
          </li>
        </ul>
      </div>
    </div>
  )
}

function PrestamosRoute() {
  const navigate = useNavigate()
  return (
    <PrestamosProvider>
      <PrestamosPage onBack={() => navigate(ROUTE_PATHS.home)} />
    </PrestamosProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <DemoAuthProvider>
        <NovedadesProvider catalogo={NOVEDADES_PRESTAMOS}>
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/prestamos/autorregistro" element={<PrestamosAutorregistroPage />} />
            <Route path="/prestamos" element={<Navigate to={buildPrestamosPath()} replace />} />
            <Route path="/prestamos/:tab" element={<PrestamosRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <AvisoPrototipo />
        </NovedadesProvider>
      </DemoAuthProvider>
    </ThemeProvider>
  )
}
