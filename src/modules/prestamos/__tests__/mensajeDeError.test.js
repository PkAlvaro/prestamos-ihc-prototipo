import { describe, it, expect } from 'vitest'
import { mensajeDeError } from '../utils/mensajeDeError'

const conRespuesta = (status, detail) => ({ response: { status, data: { detail } } })

describe('mensajeDeError', () => {
  it('muestra el detalle de negocio tal cual', () => {
    expect(mensajeDeError(conRespuesta(400, 'Este prestamo ya fue devuelto'))).toBe(
      'Este prestamo ya fue devuelto'
    )
  })

  it('junta los mensajes de una validación 422 en vez de [object Object]', () => {
    const error = conRespuesta(422, [{ msg: 'Campo requerido' }, { msg: 'Valor inválido' }])
    expect(mensajeDeError(error)).toBe('Datos inválidos: Campo requerido; Valor inválido')
  })

  it('explica una red caída en español', () => {
    expect(mensajeDeError({ message: 'Network Error' })).toMatch(/No hay conexión/)
  })

  it('explica un timeout en español', () => {
    expect(
      mensajeDeError({ code: 'ECONNABORTED', message: 'timeout of 300000ms exceeded' })
    ).toMatch(/tardó demasiado/)
  })

  it('usa el texto por defecto si el servidor no dio detalle', () => {
    expect(mensajeDeError(conRespuesta(500, undefined), 'No se pudo guardar')).toBe(
      'No se pudo guardar'
    )
  })
})
