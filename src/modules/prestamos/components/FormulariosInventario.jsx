import React from 'react'
import { AlertTriangle } from 'lucide-react'
import FormularioValidado from './FormularioValidado'
import { MarcaNuevo } from '../../../novedades'
import {
  validarNombre,
  validarCantidad,
  validarMaterialRegistrado,
  buscarMaterialRegistrado,
  materialDuplicado,
  aEntero,
} from '../utils/validacionInventario'

/*
 * Formularios de inventario con validación por campo (mejora 5). Todos usan
 * <FormularioValidado>: cada campo dice qué le falta y lo escrito se conserva.
 * Existencias: enteros ≥ 0. Lo que se agrega o repone: enteros > 0.
 */

const marca = <MarcaNuevo novedad="validacion-inventario" />

const sinTildes = s =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

function Aviso({ children }) {
  return (
    <div className="mt-2 flex items-start gap-2 rounded-lg p-2.5 bg-[#F59E0B1A] border border-[#F59E0B59]">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" />
      <div className="text-xs font-semibold text-[#B45309]">{children}</div>
    </div>
  )
}

export function NuevoArticuloForm({ materiales, onEnviar, onCerrar, onAgregarExistencias }) {
  return (
    <FormularioValidado
      titulo="Nuevo artículo"
      marca={marca}
      textoEnviar="Crear artículo"
      valoresIniciales={{ stock_total: '1' }}
      onEnviar={onEnviar}
      onCerrar={onCerrar}
      campos={[
        {
          id: 'nombre',
          etiqueta: 'Nombre',
          placeholder: 'Ej: Calculadora Casio',
          validar: valor => {
            const error = validarNombre(valor, { etiqueta: 'el nombre del artículo' })
            if (error) return error
            const igual = materialDuplicado(valor, materiales)
            return igual ? `Ya existe «${igual.nombre}».` : null
          },
          aviso: valor => {
            const igual = materialDuplicado(valor, materiales)
            const q = sinTildes(valor)
            const parecido =
              !igual &&
              q.length >= 3 &&
              materiales.find(m => {
                const n = sinTildes(m.nombre)
                return n.includes(q) || q.includes(n)
              })
            const existente = igual || parecido
            if (!existente) return null
            return (
              <Aviso>
                {igual
                  ? 'Si es el mismo material, '
                  : `Ya existe «${existente.nombre}». Si es ese, `}
                <button
                  type="button"
                  onClick={() => onAgregarExistencias(existente)}
                  className="underline font-bold cursor-pointer"
                >
                  agrégale existencias
                </button>{' '}
                en vez de crear otro.
              </Aviso>
            )
          },
        },
        { id: 'categoria', etiqueta: 'Categoría', placeholder: 'Ej: Calculadora', opcional: true },
        {
          id: 'descripcion',
          etiqueta: 'Descripción',
          placeholder: 'Ej: Casio fx-570',
          opcional: true,
        },
        {
          id: 'stock_total',
          etiqueta: 'Stock inicial',
          tipo: 'cantidad',
          ayuda: 'Unidades que hay hoy. Número entero, 0 o más.',
          validar: valor => validarCantidad(valor, { minimo: 0 }),
        },
      ]}
    />
  )
}

export function AgregarExistenciasForm({ materiales, nombreInicial = '', onEnviar, onCerrar }) {
  return (
    <FormularioValidado
      titulo="Agregar existencias"
      marca={marca}
      textoEnviar="Agregar"
      valoresIniciales={{ material: nombreInicial }}
      onCerrar={onCerrar}
      onEnviar={({ material, cantidad }) =>
        onEnviar(buscarMaterialRegistrado(material, materiales), aEntero(cantidad))
      }
      cabecera={
        <p className="text-sm text-gray-600">
          Para sumar unidades a un material que ya está registrado. Si es un material nuevo, usa
          “Nuevo artículo”.
        </p>
      }
      campos={[
        {
          id: 'material',
          etiqueta: 'Material registrado',
          tipo: 'material',
          materiales,
          placeholder: 'Escribe para buscar, ej: Paraguas',
          validar: valor => validarMaterialRegistrado(valor, materiales),
        },
        {
          id: 'cantidad',
          etiqueta: 'Cantidad que se agrega',
          tipo: 'cantidad',
          placeholder: 'Ej: 2',
          ayuda: 'Número entero mayor que 0.',
          validar: valor => validarCantidad(valor, { minimo: 1 }),
        },
      ]}
    />
  )
}

export function AjustarStockForm({ articulo, onEnviar, onCerrar }) {
  const prestados = articulo.stock_total - articulo.stock_disponible
  return (
    <FormularioValidado
      titulo="Ajustar stock"
      marca={marca}
      ancho="max-w-xs"
      valoresIniciales={{ stock_total: String(articulo.stock_total) }}
      onCerrar={onCerrar}
      onEnviar={({ stock_total }) => onEnviar(articulo, aEntero(stock_total))}
      cabecera={
        <div className="text-center">
          <p className="text-sm font-semibold text-cai-dark">{articulo.nombre}</p>
          {prestados > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {prestados} prestado{prestados !== 1 ? 's' : ''} ahora mismo
            </p>
          )}
        </div>
      }
      campos={[
        {
          id: 'stock_total',
          etiqueta: 'Stock total',
          tipo: 'cantidad',
          ayuda: 'Número entero, 0 o más.',
          validar: valor =>
            validarCantidad(valor, { minimo: 0 }) ??
            (aEntero(valor) < prestados
              ? `No puede ser menor a ${prestados}: hay ${prestados} unidad${prestados !== 1 ? 'es' : ''} prestada${prestados !== 1 ? 's' : ''} ahora.`
              : null),
        },
      ]}
    />
  )
}

export function NuevoInsumoForm({ onEnviar, onCerrar }) {
  return (
    <FormularioValidado
      titulo="Nuevo insumo"
      marca={marca}
      textoEnviar="Crear insumo"
      valoresIniciales={{ stock_inicial: '0', stock_critico: '5' }}
      onEnviar={onEnviar}
      onCerrar={onCerrar}
      campos={[
        {
          id: 'nombre',
          etiqueta: 'Nombre',
          placeholder: 'Ej: Destacador',
          validar: valor => validarNombre(valor, { etiqueta: 'el nombre del insumo' }),
        },
        {
          id: 'categoria',
          etiqueta: 'Categoría',
          placeholder: 'Ej: Librería',
          validar: valor => (String(valor).trim() ? null : 'Escribe la categoría.'),
        },
        {
          id: 'stock_inicial',
          etiqueta: 'Stock inicial',
          tipo: 'cantidad',
          ayuda: 'Número entero, 0 o más.',
          validar: valor => validarCantidad(valor, { minimo: 0 }),
        },
        {
          id: 'stock_critico',
          etiqueta: 'Avisar cuando queden',
          tipo: 'cantidad',
          ayuda: 'Se marca en rojo al llegar a esta cantidad o menos.',
          validar: valor => validarCantidad(valor, { minimo: 0 }),
        },
      ]}
    />
  )
}

export function ReponerInsumoForm({ insumo, onEnviar, onCerrar }) {
  return (
    <FormularioValidado
      titulo="Reponer stock"
      marca={marca}
      ancho="max-w-xs"
      textoEnviar="Reponer"
      valoresIniciales={{ cantidad: '1' }}
      onCerrar={onCerrar}
      onEnviar={({ cantidad }) => onEnviar(insumo.id, aEntero(cantidad))}
      cabecera={
        <p className="text-sm font-semibold text-cai-dark text-center">
          {insumo.nombre}
          <span className="block text-xs font-normal text-gray-400">
            Hoy quedan {insumo.stock_actual}
          </span>
        </p>
      }
      campos={[
        {
          id: 'cantidad',
          etiqueta: 'Cantidad que se agrega',
          tipo: 'cantidad',
          ayuda: 'Número entero mayor que 0.',
          validar: valor => validarCantidad(valor, { minimo: 1 }),
        },
      ]}
    />
  )
}
