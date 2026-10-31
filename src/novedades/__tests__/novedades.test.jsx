import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import {
  NovedadesProvider,
  MarcaNuevo,
  SoloConMejora,
  ControlesNovedades,
  visiblesEnVitrina,
} from '..'
import { actualizarEstado, novedadActiva, simularRed } from '../estado'
import MensajeListaVacia from '../../modules/prestamos/components/MensajeListaVacia'
import { NOVEDADES_PRESTAMOS } from '../../modules/prestamos/novedades'
import { prestamosApi } from '../../modules/prestamos/services/prestamosApi'

const conVitrina = ui =>
  render(
    <MemoryRouter>
      <NovedadesProvider catalogo={NOVEDADES_PRESTAMOS}>{ui}</NovedadesProvider>
    </MemoryRouter>
  )

beforeEach(() => act(() => actualizarEstado({ modo: 'mejoras', marcas: true })))

describe('vitrina de novedades', () => {
  it('cada entrada del catálogo tiene lo necesario para su tarjeta y su guía', () => {
    const ids = NOVEDADES_PRESTAMOS.map(n => n.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const n of NOVEDADES_PRESTAMOS) {
      expect(n).toMatchObject({ titulo: expect.any(String), ruta: expect.stringMatching(/^\//) })
      expect(n.pasos.length).toBeGreaterThan(0)
      expect(n.icono).toBeTruthy()
    }
  })

  it('la marca "Nuevo" dice a qué mejora pertenece y desaparece al apagar las marcas', () => {
    conVitrina(<MarcaNuevo novedad="busqueda-sinonimos" />)
    expect(screen.getByText('Nuevo 2')).toHaveProperty(
      'title',
      'Decisión 2: Encontrar materiales usando nombres habituales y sinónimos'
    )
    act(() => actualizarEstado({ marcas: false }))
    expect(screen.queryByText(/Nuevo/)).toBeNull()
  })

  it('en modo original se ve lo de antes y no hay marcas', () => {
    conVitrina(
      <>
        <ControlesNovedades />
        <SoloConMejora novedad="resumen-devolucion" original={<p>antes</p>}>
          <p>después</p>
        </SoloConMejora>
        <MarcaNuevo novedad="resumen-devolucion" />
      </>
    )
    expect(screen.getByText('después')).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: 'Original' }))
    expect(screen.getByText('antes')).toBeTruthy()
    expect(screen.queryByText(/Nuevo/)).toBeNull()
    expect(novedadActiva('busqueda-sinonimos')).toBe(false)
  })

  it('la API simulada deja de entender sinónimos en modo original', async () => {
    const conMejora = await prestamosApi.buscarArticulosSemantico('guardapolvo', false)
    expect(conMejora.length).toBeGreaterThan(0)
    act(() => actualizarEstado({ modo: 'original' }))
    expect(await prestamosApi.buscarArticulosSemantico('guardapolvo', false)).toHaveLength(0)
  })

  it('la numeración calza con el informe (1 a 6) y lo que no está en él no se muestra', () => {
    const numeros = NOVEDADES_PRESTAMOS.filter(n => n.numero).map(n => n.numero)
    expect(numeros).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(NOVEDADES_PRESTAMOS.find(n => n.numero === 3).titulo).toBe(
      'Confirmar y poder revertir una devolución'
    )
    expect(NOVEDADES_PRESTAMOS.find(n => n.numero === 7).titulo).toBe(
      'Diferenciar una lista vacía de una que todavía está cargando'
    )
    const sinNumero = { ...NOVEDADES_PRESTAMOS[0], id: 'fuera-del-informe', numero: null }
    expect(visiblesEnVitrina([...NOVEDADES_PRESTAMOS, sinNumero]).map(n => n.numero)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ])
  })

  it('Decisión 5: distingue cargando de vacío; en modo original se ve vacío mientras carga', () => {
    const lista = props =>
      conVitrina(
        <MensajeListaVacia textoCarga="Cargando préstamos..." onRetry={() => {}} {...props}>
          No hay préstamos activos
        </MensajeListaVacia>
      )
    const { unmount } = lista({ isLoading: true })
    expect(screen.getByRole('status').textContent).toMatch('Cargando préstamos...')
    expect(screen.queryByText('No hay préstamos activos')).toBeNull()
    unmount()
    act(() => actualizarEstado({ modo: 'original' }))
    lista({ isLoading: true })
    expect(screen.getByText('No hay préstamos activos')).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('la simulación de red deja la lista vacía o falla, y se limpia', async () => {
    simularRed({ vacia: true })
    expect(await prestamosApi.listarPrestamosActivos()).toHaveLength(0)
    simularRed({ falla: true })
    await expect(prestamosApi.listarPrestamosActivos()).rejects.toThrow('Network Error')
    simularRed(null)
    expect((await prestamosApi.listarPrestamosActivos()).length).toBeGreaterThan(0)
  })

  it('lo que no está en el informe no lleva marca "Nuevo"', () => {
    const fuera = { ...NOVEDADES_PRESTAMOS[0], id: 'fuera-del-informe', numero: null }
    render(
      <MemoryRouter>
        <NovedadesProvider catalogo={[fuera]}>
          <MarcaNuevo novedad="fuera-del-informe" />
        </NovedadesProvider>
      </MemoryRouter>
    )
    expect(screen.queryByText(/Nuevo/)).toBeNull()
  })
})
