import React, { createContext, useContext, useState } from 'react'

export const PrestamosUIContext = createContext()

export const PrestamosUIProvider = ({ children }) => {
  const [prestamosTab, setPrestamosTab] = useState('escaneo')
  const [activeScannerTab, setActiveScannerTab] = useState('prestamo')
  const [activeInventoryTab, setActiveInventoryTab] = useState('articulos')
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)

  return (
    <PrestamosUIContext.Provider
      value={{
        prestamosTab,
        setPrestamosTab,
        activeScannerTab,
        setActiveScannerTab,
        activeInventoryTab,
        setActiveInventoryTab,
        isLoading,
        setIsLoading,
        loadError,
        setLoadError,
      }}
    >
      {children}
    </PrestamosUIContext.Provider>
  )
}

export const usePrestamosUI = () => useContext(PrestamosUIContext)
