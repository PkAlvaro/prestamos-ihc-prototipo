// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CarrerasPanel } from '../components/ContabilidadTab'
import { prestamosApi } from '../services/prestamosApi'

vi.mock('../services/prestamosApi', () => ({
  prestamosApi: {
    listarCarrerasArriendo: vi.fn(),
    configurarCarreraArriendo: vi.fn(),
    restablecerCarreraArriendo: vi.fn(),
  },
}))

const CARRERAS = [
  { carrera: 'Agronomía', exenta: false, configurada: false, estudiantes: 12 },
  { carrera: 'Enfermería', exenta: true, configurada: true, estudiantes: 3 },
  { carrera: 'Ing/Licc', exenta: true, configurada: false, estudiantes: 1 },
]

const renderPanel = async (carreras = CARRERAS) => {
  prestamosApi.listarCarrerasArriendo.mockResolvedValue(carreras)
  render(<CarrerasPanel />)
  await screen.findByText('Agronomía')
}

describe('CarrerasPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prestamosApi.configurarCarreraArriendo.mockResolvedValue({})
    prestamosApi.restablecerCarreraArriendo.mockResolvedValue({})
  })

  it('lista las carreras con su conteo de estudiantes', async () => {
    await renderPanel()

    expect(screen.getByText('12 estudiantes')).toBeTruthy()
    expect(screen.getByText('1 estudiante')).toBeTruthy()
  })

  it('marca una carrera como exenta al pulsar Exenta', async () => {
    await renderPanel()

    const fila = screen.getByText('Agronomía').closest('div')
    fireEvent.click(within(fila).getByText('Exenta'))

    await waitFor(() =>
      expect(prestamosApi.configurarCarreraArriendo).toHaveBeenCalledWith('Agronomía', true)
    )
  })

  it('no llama al backend si la carrera ya está en ese estado', async () => {
    await renderPanel()

    const fila = screen.getByText('Ing/Licc').closest('div')
    fireEvent.click(within(fila).getByText('Exenta'))

    expect(prestamosApi.configurarCarreraArriendo).not.toHaveBeenCalled()
  })

  it('solo permite restablecer las carreras configuradas a mano', async () => {
    await renderPanel()

    // Solo Enfermería viene con `configurada: true`
    const habilitados = screen.getAllByTitle('Volver al valor por defecto')
    expect(habilitados).toHaveLength(1)
    expect(screen.getAllByTitle('Ya está en el valor por defecto').every(b => b.disabled)).toBe(
      true
    )

    fireEvent.click(habilitados[0])
    await waitFor(() =>
      expect(prestamosApi.restablecerCarreraArriendo).toHaveBeenCalledWith('Enfermería')
    )
  })

  it('filtra por nombre de carrera', async () => {
    await renderPanel()

    fireEvent.change(screen.getByPlaceholderText('Buscar carrera…'), {
      target: { value: 'enfer' },
    })

    expect(screen.queryByText('Agronomía')).toBeNull()
    expect(screen.getByText('Enfermería')).toBeTruthy()
  })

  it('agrega una carrera nueva como exenta', async () => {
    await renderPanel()

    fireEvent.change(screen.getByPlaceholderText('Agregar carrera que no está en la lista'), {
      target: { value: '  Odontología ' },
    })
    fireEvent.click(screen.getByText('Agregar exenta'))

    await waitFor(() =>
      expect(prestamosApi.configurarCarreraArriendo).toHaveBeenCalledWith('Odontología', true)
    )
  })

  it('muestra el error del backend cuando la acción falla', async () => {
    await renderPanel()
    prestamosApi.configurarCarreraArriendo.mockRejectedValue({
      response: { data: { detail: 'No autorizado' } },
    })

    const fila = screen.getByText('Agronomía').closest('div')
    fireEvent.click(within(fila).getByText('Exenta'))

    expect(await screen.findByText('No autorizado')).toBeTruthy()
  })
})
