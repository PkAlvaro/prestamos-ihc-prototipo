import React from 'react'
import { EscaneoProvider } from './EscaneoContext'
import { InventarioProvider } from './InventarioContext'
import { HistorialProvider } from './HistorialContext'
import { PrestamosUIProvider } from './PrestamosUIContext'
import { ToastProvider } from '../components/PrestamosToast'

export const PrestamosProvider = ({ children }) => (
  <ToastProvider>
    <PrestamosUIProvider>
      <HistorialProvider>
        <InventarioProvider>
          <EscaneoProvider>{children}</EscaneoProvider>
        </InventarioProvider>
      </HistorialProvider>
    </PrestamosUIProvider>
  </ToastProvider>
)
