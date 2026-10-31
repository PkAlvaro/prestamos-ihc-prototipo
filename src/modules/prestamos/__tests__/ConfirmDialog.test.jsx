import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react'
import ConfirmDialog from '../components/ConfirmDialog'
import useConfirmacion from '../hooks/useConfirmacion'

describe('ConfirmDialog', () => {
  const renderDialog = (extra = {}) => {
    const onResolve = vi.fn()
    render(
      <ConfirmDialog
        confirmacion={{ titulo: 'Reabrir préstamo', mensaje: 'Calculadora de Ana', ...extra }}
        onResolve={onResolve}
      />
    )
    return onResolve
  }

  it('muestra título y mensaje y confirma', () => {
    const onResolve = renderDialog({ confirmar: 'Reabrir' })

    expect(screen.getByText('Reabrir préstamo')).toBeTruthy()
    expect(screen.getByText('Calculadora de Ana')).toBeTruthy()
    fireEvent.click(screen.getByText('Reabrir'))
    expect(onResolve).toHaveBeenCalledWith(true)
  })

  it('cancela con el botón y con Esc', () => {
    const onResolve = renderDialog()

    fireEvent.click(screen.getByText('Cancelar'))
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(onResolve).toHaveBeenNthCalledWith(1, false)
    expect(onResolve).toHaveBeenNthCalledWith(2, false)
  })
})

describe('useConfirmacion', () => {
  it('resuelve la promesa con la respuesta del usuario y cierra el diálogo', async () => {
    const { result } = renderHook(() => useConfirmacion())

    let promesa
    act(() => {
      promesa = result.current.confirmar({ titulo: 'x', mensaje: 'y' })
    })
    expect(result.current.confirmacion.titulo).toBe('x')

    act(() => result.current.resolverConfirmacion(true))

    await expect(promesa).resolves.toBe(true)
    expect(result.current.confirmacion).toBeNull()
  })
})
