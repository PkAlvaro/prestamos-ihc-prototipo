import { describe, it, expect } from 'vitest'
import { terminosAlternativos, explicarCoincidencia } from '../utils/sinonimos'

const delantal = { nombre: 'Delantal de laboratorio talla M', categoria: 'Delantal', alias: [] }
const grafica = { nombre: 'Calculadora gráfica', categoria: 'Calculadora', alias: ['la TI'] }

describe('sinónimos del mesón', () => {
  it('un delantal también se encuentra como bata, cotona o guardapolvo', () => {
    const alt = terminosAlternativos(delantal)
    expect(alt).toEqual(expect.arrayContaining(['bata', 'cotona', 'guardapolvo']))
    expect(alt).not.toContain('delantal')
  })

  it('explica por qué aparece un resultado buscado por sinónimo, también en plural y con tildes', () => {
    expect(explicarCoincidencia('bata', delantal)).toMatchObject({
      es: 'delantal',
      tipo: 'sinonimo',
    })
    expect(explicarCoincidencia('Batas', delantal)).toMatchObject({ es: 'delantal' })
    expect(explicarCoincidencia('casio', grafica)).toMatchObject({ es: 'calculadora' })
  })

  it('no explica nada cuando se buscó por el nombre del propio artículo', () => {
    expect(explicarCoincidencia('delantal', delantal)).toBeNull()
    expect(explicarCoincidencia('laboratorio', delantal)).toBeNull()
  })

  it('los otros nombres propios del artículo también cuentan', () => {
    expect(terminosAlternativos(grafica)).toContain('la ti')
    expect(explicarCoincidencia('la ti', grafica)).toMatchObject({ tipo: 'alias' })
  })
})
