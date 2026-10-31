import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NovedadesProvider, MarcaNuevo, SoloConMejora, ControlesNovedades } from '..'
import { actualizarEstado, novedadActiva } from '../estado'
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
    expect(screen.getByText('Nuevo 2')).toHaveProperty('title', 'Mejora 2: Búsqueda por sinónimos')
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
})
