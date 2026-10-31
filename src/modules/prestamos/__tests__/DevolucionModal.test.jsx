import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DevolucionModal from '../components/DevolucionModal'

const PRESTAMO = { id: 1, estudiante_nombre: 'Ana Pérez', articulo_nombre: 'Calculadora' }

const renderModal = (multa = 1500) => {
  const onConfirm = vi.fn().mockResolvedValue()
  const onClose = vi.fn()
  render(
    <DevolucionModal prestamo={PRESTAMO} multa={multa} onConfirm={onConfirm} onClose={onClose} />
  )
  return { onConfirm, onClose }
}

describe('DevolucionModal', () => {
  it('no viene con ninguna opción de pago marcada y no deja confirmar', () => {
    renderModal()

    expect(screen.getByText('Confirmar devolución').closest('button').disabled).toBe(true)
  })

  it('confirma el pago total una vez elegido', async () => {
    const { onConfirm } = renderModal()

    fireEvent.click(screen.getByText('Pagó el total'))
    fireEvent.click(screen.getByText('Confirmar devolución'))

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({ monto_cobrado: 1500, tipo_pago: 'TOTAL' })
      )
    )
  })

  it('explica la regla de la multa y cómo condonarla', () => {
    renderModal()

    expect(screen.getByText(/48 horas hábiles/)).toBeTruthy()
    expect(screen.getByText(/Condonar multa” e indica el motivo/)).toBeTruthy()
  })

  it('se cierra con Esc', () => {
    const { onClose } = renderModal()

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(onClose).toHaveBeenCalled()
  })
})
