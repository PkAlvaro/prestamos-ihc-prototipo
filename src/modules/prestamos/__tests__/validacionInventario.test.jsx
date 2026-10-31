import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import {
  validarCantidad,
  validarNombre,
  validarMaterialRegistrado,
} from '../utils/validacionInventario'
import { AgregarExistenciasForm, NuevoArticuloForm } from '../components/FormulariosInventario'

const materiales = [
  { id: 1, nombre: 'Paraguas', codigo: 'VAR-01', stock_total: 3, stock_disponible: 2 },
  {
    id: 2,
    nombre: 'Calculadora científica #1',
    codigo: 'CALC-01',
    stock_total: 5,
    stock_disponible: 5,
  },
]

describe('reglas de validación de inventario', () => {
  it('cantidades: enteros ≥ 0 para stock y > 0 para agregar', () => {
    expect(validarCantidad('0', { minimo: 0 })).toBeNull()
    expect(validarCantidad('0', { minimo: 1 })).toBe('Debe ser mayor que 0.')
    expect(validarCantidad('', { minimo: 0 })).toBe('Indica una cantidad.')
    expect(validarCantidad('2,5')).toBe('Usa un número entero, sin decimales.')
    expect(validarCantidad('2.5')).toBe('Usa un número entero, sin decimales.')
    expect(validarCantidad('-1')).toBe('No puede ser negativa.')
    expect(validarCantidad('dos')).toBe('Escribe solo números.')
  })

  it('nombre reconocible: al menos 3 letras', () => {
    expect(validarNombre('')).toMatch(/Escribe/)
    expect(validarNombre('123')).toMatch(/reconocible/)
    expect(validarNombre('  a1 ')).toMatch(/reconocible/)
    expect(validarNombre('Regla T')).toBeNull()
  })

  it('el material para agregar existencias debe estar registrado', () => {
    expect(validarMaterialRegistrado('paraguas', materiales)).toBeNull()
    expect(validarMaterialRegistrado('calc-01', materiales)).toBeNull()
    expect(validarMaterialRegistrado('Sombrero', materiales)).toMatch(/No hay un material/)
  })
})

describe('formularios con mensaje junto al campo', () => {
  it('al enviar vacío marca cada campo y no envía', async () => {
    const onEnviar = vi.fn()
    render(
      <NuevoArticuloForm
        materiales={materiales}
        onEnviar={onEnviar}
        onCerrar={() => {}}
        onAgregarExistencias={() => {}}
      />
    )
    fireEvent.change(screen.getByLabelText(/Stock inicial/), { target: { value: '' } })
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Crear artículo' })))
    expect(onEnviar).not.toHaveBeenCalled()
    expect(screen.getByText('Escribe el nombre del artículo.')).toBeTruthy()
    expect(screen.getByText('Indica una cantidad.')).toBeTruthy()
    expect(screen.getByLabelText(/Nombre/).getAttribute('aria-invalid')).toBe('true')
  })

  it('un dato inválido no borra lo demás y al corregirlo se envía', async () => {
    const onEnviar = vi.fn().mockResolvedValue(true)
    render(
      <NuevoArticuloForm
        materiales={materiales}
        onEnviar={onEnviar}
        onCerrar={() => {}}
        onAgregarExistencias={() => {}}
      />
    )
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Regla T' } })
    fireEvent.change(screen.getByLabelText(/Categoría/), { target: { value: 'Dibujo' } })
    fireEvent.change(screen.getByLabelText(/Stock inicial/), { target: { value: '2,5' } })
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Crear artículo' })))
    expect(screen.getByText('Usa un número entero, sin decimales.')).toBeTruthy()
    expect(screen.getByLabelText(/Nombre/).value).toBe('Regla T')
    expect(screen.getByLabelText(/Categoría/).value).toBe('Dibujo')
    fireEvent.change(screen.getByLabelText(/Stock inicial/), { target: { value: '0' } })
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Crear artículo' })))
    expect(onEnviar).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Regla T', stock_total: '0' })
    )
  })

  it('un nombre ya registrado se rechaza y ofrece agregar existencias', async () => {
    const onAgregarExistencias = vi.fn()
    render(
      <NuevoArticuloForm
        materiales={materiales}
        onEnviar={vi.fn()}
        onCerrar={() => {}}
        onAgregarExistencias={onAgregarExistencias}
      />
    )
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'paraguas' } })
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Crear artículo' })))
    expect(screen.getByText('Ya existe «Paraguas».')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'agrégale existencias' }))
    expect(onAgregarExistencias).toHaveBeenCalledWith(materiales[0])
  })

  it('agregar existencias pide un material registrado y una cantidad mayor que 0', async () => {
    const onEnviar = vi.fn().mockResolvedValue(true)
    render(
      <AgregarExistenciasForm materiales={materiales} onEnviar={onEnviar} onCerrar={() => {}} />
    )
    fireEvent.change(screen.getByLabelText(/Material registrado/), {
      target: { value: 'Sombrero' },
    })
    fireEvent.change(screen.getByLabelText(/Cantidad que se agrega/), { target: { value: '0' } })
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Agregar' })))
    expect(screen.getByText(/No hay un material registrado/)).toBeTruthy()
    expect(screen.getByText('Debe ser mayor que 0.')).toBeTruthy()
    fireEvent.change(screen.getByLabelText(/Material registrado/), {
      target: { value: 'Paraguas' },
    })
    fireEvent.change(screen.getByLabelText(/Cantidad que se agrega/), { target: { value: '3' } })
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Agregar' })))
    expect(onEnviar).toHaveBeenCalledWith(materiales[0], 3)
  })
})
