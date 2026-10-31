import React from 'react'
import { X } from 'lucide-react'
import useEscape from '../hooks/useEscape'
import { REGLA_MULTA } from '../constants'

const SECCIONES = [
  {
    titulo: 'Prestar un artículo',
    texto:
      'En "Nuevo préstamo" escanea el TUC o escribe el RUT del estudiante, busca cada artículo por nombre y aprieta "Realizar Préstamo". Si el estudiante no está registrado, usa "Nuevo ingreso": lo más cómodo es que se autorregistre escaneando el QR.',
  },
  {
    titulo: 'Devolver',
    texto:
      'En "Activos", busca el préstamo y aprieta "Devolver". Si hay multa o un arriendo pendiente, se abre una ventana para registrar el cobro. Si la persona tiene varios préstamos, "Devolver todo" los devuelve juntos. Cada fila muestra la fecha y hora en que se prestó.',
  },
  {
    titulo: 'Cómo se calcula la multa',
    texto: `${REGLA_MULTA} Si el estudiante reclama la multa, elige "Condonar multa" e indica el motivo.`,
  },
  {
    titulo: 'Me equivoqué',
    texto:
      'Si devolviste por error, o la multa se reclama después de registrarla, abre "Historial" y aprieta "Reabrir" en ese préstamo. Si ya se había cobrado multa, el sistema te avisa el monto que hay que reintegrar al estudiante para que la contabilidad cuadre. Si el préstamo quedó a nombre de otra persona, usa "Transferir" en "Activos".',
  },
  {
    titulo: 'Vencidos y recordatorios',
    texto:
      '"Vencidos" lista lo que ya pasó las 48 horas hábiles. Desde "Mailing" puedes avisar a los estudiantes por correo, de forma manual o automática.',
  },
]

export default function AyudaModal({ onClose }) {
  useEscape(onClose)
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg sm:mx-4 overflow-hidden max-h-[92dvh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cai-border">
          <h2 className="font-bold text-base text-cai-black">Ayuda · Préstamos</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar ayuda"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-cai-surface border border-cai-border text-gray-400 hover:bg-gray-100 transition-colors duration-[120ms] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 space-y-5">
          {SECCIONES.map(({ titulo, texto }) => (
            <section key={titulo}>
              <h3 className="text-sm font-bold text-cai-black mb-1">{titulo}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{texto}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
