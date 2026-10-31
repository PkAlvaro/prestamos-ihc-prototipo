import React, { createContext, useContext, useMemo, useState, useSyncExternalStore } from 'react'
import { actualizarEstado, obtenerEstado, suscribir } from './estado'

const NovedadesContext = createContext(null)

/**
 * Provee el catálogo de novedades y el estado de la vitrina. El catálogo es una
 * lista de entradas `{ id, numero, titulo, problema, solucion, icono, ruta, pasos,
 * preparar }` (ver `modules/prestamos/novedades.js`); todo lo demás —tarjetas del
 * inicio, guía "Prueba esto", marcas "Nuevo", interruptor Original/Mejoras— sale
 * de ahí, así que una mejora nueva solo requiere agregar su entrada.
 */
export function NovedadesProvider({ catalogo, children }) {
  const estado = useSyncExternalStore(suscribir, obtenerEstado)
  // Novedad que el revisor eligió "Probar": la pantalla de destino la prepara y
  // muestra su guía hasta que se cierre.
  const [escenario, setEscenario] = useState(null) // { id, preparado } | null

  const value = useMemo(
    () => ({
      catalogo,
      modo: estado.modo,
      marcas: estado.marcas,
      setModo: modo => actualizarEstado({ modo }),
      setMarcas: marcas => actualizarEstado({ marcas }),
      escenario,
      iniciarEscenario: id => {
        actualizarEstado({ modo: 'mejoras' })
        setEscenario({ id, preparado: false })
      },
      marcarPreparado: () => setEscenario(e => e && { ...e, preparado: true }),
      cerrarEscenario: () => setEscenario(null),
    }),
    [catalogo, estado, escenario]
  )

  return <NovedadesContext.Provider value={value}>{children}</NovedadesContext.Provider>
}

export function useNovedades() {
  return useContext(NovedadesContext)
}

/** `{ activa, novedad }` de una mejora: `activa` es false en modo original. */
export function useNovedad(id) {
  const ctx = useNovedades()
  const novedad = ctx?.catalogo.find(n => n.id === id)
  return { activa: !ctx || ctx.modo === 'mejoras', novedad }
}
