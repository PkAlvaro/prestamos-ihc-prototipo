import React, { createContext, useContext, useState } from 'react'

export const HistorialContext = createContext()
export const HISTORIAL_LIMIT = 50

export const HistorialProvider = ({ children }) => {
  const [prestamosActivos, setPrestamosActivos] = useState([])
  const [prestamosVencidos, setPrestamosVencidos] = useState([])
  const [prestamosHistorial, setPrestamosHistorial] = useState([])
  const [historialTotal, setHistorialTotal] = useState(0)
  const [historialOffset, setHistorialOffset] = useState(0)
  const [historialQuery, setHistorialQuery] = useState('')

  return (
    <HistorialContext.Provider
      value={{
        prestamosActivos,
        setPrestamosActivos,
        prestamosVencidos,
        setPrestamosVencidos,
        prestamosHistorial,
        setPrestamosHistorial,
        historialTotal,
        setHistorialTotal,
        historialOffset,
        setHistorialOffset,
        historialQuery,
        setHistorialQuery,
        HISTORIAL_LIMIT,
      }}
    >
      {children}
    </HistorialContext.Provider>
  )
}

export const useHistorial = () => useContext(HistorialContext)
