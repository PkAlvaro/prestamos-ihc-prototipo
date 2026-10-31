import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DevolverLoteModal from '../components/DevolverLoteModal'
import { prestamosApi } from '../services/prestamosApi'

vi.mock('../services/prestamosApi', () => ({
  prestamosApi: { previewMultasLote: vi.fn() },
}))

// El servidor calcula la multa por id (0 = sin multa)
const servidorCalcula = (multas, cobrables) =>
  prestamosApi.previewMultasLote.mockResolvedValue({
    items: Object.entries(multas).map(([id, multa]) => ({
      prestamo_id: Number(id),
      multa,
      multa_cobrable: cobrables?.[id] ?? multa,
      tope_lote_aplicado: cobrables ? cobrables[id] < multa : false,
      horas_habiles: 0,
      horas_atraso: 0,
      bloques: multa / 500,
      tope_alcanzado: false,
      gracia_restante_horas: multa ? 0 : 20,
    })),
    total: Object.values(cobrables ?? multas).reduce((a, b) => a + b, 0),
    total_sin_tope: Object.values(multas).reduce((a, b) => a + b, 0),
  })

const prestamo = (id, extra = {}) => ({
  id,
  estudiante_nombre: 'Ana Pérez',
  articulo_nombre: `Artículo ${id}`,
  fecha_prestamo: '2026-06-01T09:00:00',
  multa_calculada: 0,
  ...extra,
})

const renderModal = prestamos => {
  const onConfirm = vi.fn().mockResolvedValue()
  const onClose = vi.fn()
  render(
    <DevolverLoteModal
      modal={{ estudianteNombre: 'Ana Pérez', prestamos }}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
  return { onConfirm, onClose }
}

describe('DevolverLoteModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lista cada préstamo con su fecha y hora', async () => {
    servidorCalcula({ 1: 0, 2: 0 })
    renderModal([prestamo(1), prestamo(2)])

    expect(screen.getByText('Devolver todo (2)')).toBeTruthy()
    expect(screen.getAllByText(/Prestado 01\/06\/2026 09:00/)).toHaveLength(2)
    await waitFor(() => expect(screen.getAllByText(/Dentro del plazo/)).toHaveLength(2))
  })

  it('sin multas ni arriendo se puede devolver apenas termina el cálculo', async () => {
    servidorCalcula({ 1: 0, 2: 0 })
    const { onConfirm } = renderModal([prestamo(1), prestamo(2)])

    await waitFor(() => expect(screen.queryByText('Calculando multas…')).toBeNull())
    fireEvent.click(screen.getByText('Confirmar devolución (2)'))

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith({
        prestamo_ids: [1, 2],
        tipo_pago_multa: null,
        comentario_multa: null,
        tipo_pago_arriendo: null,
        comentario_arriendo: null,
      })
    )
  })

  it('usa la multa calculada en vivo por el servidor, no la de la lista', async () => {
    servidorCalcula({ 1: 1000, 2: 500 })
    // la lista traía datos viejos (multa 0)
    renderModal([prestamo(1), prestamo(2)])

    await waitFor(() => expect(screen.getByText(/Multas: \$1\.500/)).toBeTruthy())
    expect(screen.getByText('2 días hábiles de atraso × $500')).toBeTruthy()
    expect(screen.getByText('1 día hábil de atraso × $500')).toBeTruthy()
  })

  it('aplica el tope de $6.000 al lote completo y lo avisa', async () => {
    // 3 préstamos que ya están en el tope: sin tope serían $18.000
    servidorCalcula({ 1: 6000, 2: 6000, 3: 6000 }, { 1: 6000, 2: 0, 3: 0 })
    renderModal([prestamo(1), prestamo(2), prestamo(3)])

    await waitFor(() => expect(screen.getByText(/Multas: \$6\.000 en 3/)).toBeTruthy())
    expect(screen.getByText(/sin tope serían \$18\.000/)).toBeTruthy()
    expect(screen.getAllByText(/por el tope del lote/)).toHaveLength(2)
  })

  it('con multas obliga a elegir cómo se resuelven', async () => {
    servidorCalcula({ 1: 500, 2: 1000 })
    const { onConfirm } = renderModal([prestamo(1), prestamo(2)])
    await waitFor(() => expect(screen.getByText(/Multas: \$1\.500/)).toBeTruthy())
    const boton = screen.getByText('Confirmar devolución (2)').closest('button')

    expect(boton.disabled).toBe(true)

    fireEvent.click(screen.getByText('Pagó el total'))
    fireEvent.click(boton)

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ tipo_pago_multa: 'TOTAL' }))
    )
  })

  it('condonar exige justificación', async () => {
    servidorCalcula({ 1: 500, 2: 0 })
    const { onConfirm } = renderModal([prestamo(1), prestamo(2)])
    await waitFor(() => expect(screen.getByText(/Multas: \$500/)).toBeTruthy())

    fireEvent.click(screen.getByText('Condonar'))
    fireEvent.click(screen.getByText('Confirmar devolución (2)'))

    await waitFor(() => expect(screen.getByText(/justificación es obligatoria/)).toBeTruthy())
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('si el cálculo en vivo falla usa la multa de la lista', async () => {
    prestamosApi.previewMultasLote.mockRejectedValue(new Error('red'))
    renderModal([prestamo(1, { multa_calculada: 500 }), prestamo(2)])

    await waitFor(() => expect(screen.getByText(/Multas: \$500/)).toBeTruthy())
  })
})
