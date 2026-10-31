import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import ActivosTab from '../components/ActivosTab'

const prestamo = (id, estudiante, articulo, extra = {}) => ({
  id,
  estudiante_id: estudiante.id,
  estudiante_nombre: estudiante.nombre,
  estudiante_rut: estudiante.rut,
  articulo_nombre: articulo,
  responsable_nombre: 'Staff',
  fecha_prestamo: '2026-06-01T09:00:00',
  estado: 'ACTIVO',
  multa_calculada: 0,
  ...extra,
})

const ANA = { id: 1, nombre: 'Ana Pérez', rut: '11111111-1' }
const LUIS = { id: 2, nombre: 'Luis Soto', rut: '22222222-2' }

const renderTab = (datos, overrides = {}) => {
  const ctx = {
    prestamosTab: 'activos',
    prestamosActivos: datos,
    prestamosVencidos: [],
    filteredPrestamosData: datos,
    loadPrestamosData: vi.fn(),
    isLoading: false,
    loadError: false,
    prestamosSearchQuery: '',
    setPrestamosSearchQuery: vi.fn(),
    prestamosSort: { col: 'fecha_prestamo', dir: 'desc' },
    handlePrestamosSort: vi.fn(),
    handleDevolver: vi.fn(),
    handleAbrirTransferir: vi.fn(),
    handleAbrirDevolverTodo: vi.fn(),
    editingComentarioId: null,
    setEditingComentarioId: vi.fn(),
    editingComentarioValue: '',
    setEditingComentarioValue: vi.fn(),
    getComentario: () => '',
    handleGuardarComentario: vi.fn(),
    ...overrides,
  }
  render(<ActivosTab ctx={ctx} cn={(...c) => c.filter(Boolean).join(' ')} SortIcon={() => null} />)
  return ctx
}

describe('ActivosTab agrupado por persona', () => {
  const datos = [
    prestamo(1, ANA, 'Calculadora'),
    prestamo(2, LUIS, 'Delantal'),
    prestamo(3, ANA, 'Colchoneta', { multa_calculada: 500 }),
  ]

  it('muestra un bloque por persona con sus préstamos dentro', () => {
    renderTab(datos)

    // Ana aparece una sola vez aunque tenga 2 préstamos
    expect(screen.getAllByText('Ana Pérez')).toHaveLength(1)
    const bloqueAna = screen.getByText('Ana Pérez').closest('section')
    expect(within(bloqueAna).getByText('Calculadora')).toBeTruthy()
    expect(within(bloqueAna).getByText('Colchoneta')).toBeTruthy()
    expect(within(bloqueAna).queryByText('Delantal')).toBeNull()
    expect(screen.getByText(/2 personas · 3 préstamos/)).toBeTruthy()
  })

  it('resume las multas de la persona en su cabecera', () => {
    renderTab(datos)

    const bloqueAna = screen.getByText('Ana Pérez').closest('section')
    expect(within(bloqueAna).getByText('Multas $500')).toBeTruthy()
  })

  it('ofrece Devolver todo solo a quien tiene varios préstamos', () => {
    const ctx = renderTab(datos)

    const botones = screen.getAllByText(/Devolver todo/)
    expect(botones).toHaveLength(1)
    fireEvent.click(botones[0])
    expect(ctx.handleAbrirDevolverTodo).toHaveBeenCalledWith([datos[0], datos[2]])
  })

  it('cada préstamo conserva sus propios botones', () => {
    const ctx = renderTab(datos)

    fireEvent.click(screen.getAllByText('Devolver')[0])
    expect(ctx.handleDevolver).toHaveBeenCalledWith(datos[0])
  })

  it('en Vencidos no ofrece Transferir', () => {
    renderTab(datos, { prestamosTab: 'vencidos' })

    expect(screen.queryByText('Transferir')).toBeNull()
  })
})
