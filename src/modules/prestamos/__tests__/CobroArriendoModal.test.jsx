// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import CobroArriendoModal from '../components/CobroArriendoModal'

const EVAL_COBRA = {
  aplica: true,
  monto: 500,
  carrera_conocida: true,
  carrera: 'Agronomía',
  grupo: 'Otras Carreras',
  categorias_cobrables: ['Calculadora'],
  motivo: 'Agronomía paga arriendo por Calculadora',
  estudiante_id: 7,
  estudiante_nombre: 'Ana Pérez',
}

const EVAL_SIN_CARRERA = {
  ...EVAL_COBRA,
  aplica: false,
  monto: 0,
  carrera_conocida: false,
  carrera: null,
  grupo: null,
  motivo: 'El estudiante no tiene carrera registrada',
}

const ARTICULOS = [{ sku: 'CAL0001', nombre: 'Calculadora UC Casio #1' }]

const renderModal = (evaluacion, overrides = {}) => {
  const props = {
    evaluacion,
    articulos: ARTICULOS,
    onGuardarCarrera: vi.fn(),
    onConfirm: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  }
  render(<CobroArriendoModal {...props} />)
  return props
}

describe('CobroArriendoModal — paso de cobro', () => {
  it('muestra el monto y a quién se le cobra', () => {
    renderModal(EVAL_COBRA)

    expect(screen.getByText('Cobrar arriendo')).toBeTruthy()
    expect(screen.getByText('$500')).toBeTruthy()
    expect(screen.getByText(/Ana Pérez/)).toBeTruthy()
    expect(screen.getByText(/Agronomía/)).toBeTruthy()
  })

  it('deja claro que el cobro es por préstamo y no por artículo', () => {
    renderModal(EVAL_COBRA)

    expect(screen.getByText(/una vez por préstamo, no por artículo/i)).toBeTruthy()
  })

  it('confirma un pago total con el monto completo', async () => {
    const { onConfirm } = renderModal(EVAL_COBRA)

    fireEvent.click(screen.getByText('Pagó el total'))
    fireEvent.click(screen.getByText('Confirmar préstamo'))

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith({
        monto_cobrado: 500,
        tipo_pago: 'TOTAL',
        comentario: null,
      })
    )
  })

  it('no deja confirmar hasta elegir cómo se resuelve el cobro', () => {
    const { onConfirm } = renderModal(EVAL_COBRA)

    expect(screen.getByText('Confirmar préstamo').closest('button').disabled).toBe(true)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('exige justificación al no cobrar', async () => {
    const { onConfirm } = renderModal(EVAL_COBRA)

    fireEvent.click(screen.getByText('No cobrar'))
    fireEvent.click(screen.getByText('Confirmar préstamo'))

    await waitFor(() => expect(screen.getByText(/justificación es obligatoria/i)).toBeTruthy())
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('registra la condonación cuando hay justificación', async () => {
    const { onConfirm } = renderModal(EVAL_COBRA)

    fireEvent.click(screen.getByText('No cobrar'))
    fireEvent.change(screen.getByPlaceholderText(/¿Por qué no se cobra/i), {
      target: { value: 'Autorizado por presidencia' },
    })
    fireEvent.click(screen.getByText('Confirmar préstamo'))

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith({
        monto_cobrado: 0,
        tipo_pago: 'CONDONADO',
        comentario: 'Autorizado por presidencia',
      })
    )
  })

  it('rechaza un monto parcial fuera de rango', async () => {
    const { onConfirm } = renderModal(EVAL_COBRA)

    fireEvent.click(screen.getByText('Monto parcial'))
    fireEvent.change(screen.getByPlaceholderText('1 – 499'), { target: { value: '500' } })
    fireEvent.click(screen.getByText('Confirmar préstamo'))

    await waitFor(() => expect(screen.getByText(/Ingresa un monto entre/i)).toBeTruthy())
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('difiere el cobro al devolver sin exigir monto ni justificación', async () => {
    const { onConfirm } = renderModal(EVAL_COBRA)

    fireEvent.click(screen.getByText('Cobrar al devolver'))
    fireEvent.click(screen.getByText('Confirmar préstamo'))

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith({
        monto_cobrado: 0,
        tipo_pago: 'PENDIENTE',
        comentario: null,
      })
    )
  })

  it('cancelar el préstamo cierra sin cobrar', () => {
    const { onClose, onConfirm } = renderModal(EVAL_COBRA)

    fireEvent.click(screen.getByText('Cancelar préstamo'))

    expect(onClose).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })
})

describe('CobroArriendoModal — paso de carrera', () => {
  it('pide la carrera cuando el estudiante no la tiene registrada', () => {
    renderModal(EVAL_SIN_CARRERA)

    expect(screen.getByText('Falta la carrera')).toBeTruthy()
    expect(screen.getByText(/no tiene carrera registrada/i)).toBeTruthy()
    expect(screen.queryByText('Monto parcial')).toBeNull()
  })

  it('no continúa sin seleccionar carrera', async () => {
    const { onGuardarCarrera } = renderModal(EVAL_SIN_CARRERA)

    fireEvent.click(screen.getByText('Guardar y continuar'))

    await waitFor(() => expect(screen.getByText(/Selecciona la carrera/i)).toBeTruthy())
    expect(onGuardarCarrera).not.toHaveBeenCalled()
  })

  it('guarda la carrera elegida del catálogo', async () => {
    const { onGuardarCarrera } = renderModal(EVAL_SIN_CARRERA)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Enfermería' } })
    fireEvent.click(screen.getByText('Guardar y continuar'))

    await waitFor(() => expect(onGuardarCarrera).toHaveBeenCalledWith('Enfermería'))
  })

  it('permite escribir una carrera fuera del catálogo', async () => {
    const { onGuardarCarrera } = renderModal(EVAL_SIN_CARRERA)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '__otro__' } })
    fireEvent.change(screen.getByPlaceholderText('Escribe la carrera'), {
      target: { value: 'Agronomía' },
    })
    fireEvent.click(screen.getByText('Guardar y continuar'))

    await waitFor(() => expect(onGuardarCarrera).toHaveBeenCalledWith('Agronomía'))
  })
})
