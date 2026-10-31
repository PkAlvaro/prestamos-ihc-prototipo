import React, { createContext, useContext, useState } from 'react'

export const InventarioContext = createContext()

export const InventarioProvider = ({ children }) => {
  const [prestamosArticulos, setPrestamosArticulos] = useState([])
  const [showNuevoArticulo, setShowNuevoArticulo] = useState(false)
  const [nuevoArticulo, setNuevoArticulo] = useState({
    nombre: '',
    categoria: '',
    descripcion: '',
    stock_total: 1,
  })
  const [ajustarStockArticulo, setAjustarStockArticulo] = useState(null) // articulo | null
  const [ajustarStockValor, setAjustarStockValor] = useState(1)
  const [insumos, setInsumos] = useState([])
  const [historialEntregas, setHistorialEntregas] = useState([])
  const [showNuevoInsumo, setShowNuevoInsumo] = useState(false)
  const [showReponerInsumo, setShowReponerInsumo] = useState(null)
  const [nuevoInsumo, setNuevoInsumo] = useState({
    nombre: '',
    categoria: '',
    stock_inicial: 0,
    stock_critico: 5,
  })
  const [reponerCantidad, setReponerCantidad] = useState(1)
  const [combos, setCombos] = useState([])
  const [editingCombo, setEditingCombo] = useState(null) // {} nuevo, combo existente, o null (cerrado)

  return (
    <InventarioContext.Provider
      value={{
        prestamosArticulos,
        setPrestamosArticulos,
        showNuevoArticulo,
        setShowNuevoArticulo,
        nuevoArticulo,
        setNuevoArticulo,
        ajustarStockArticulo,
        setAjustarStockArticulo,
        ajustarStockValor,
        setAjustarStockValor,
        insumos,
        setInsumos,
        historialEntregas,
        setHistorialEntregas,
        showNuevoInsumo,
        setShowNuevoInsumo,
        showReponerInsumo,
        setShowReponerInsumo,
        nuevoInsumo,
        setNuevoInsumo,
        reponerCantidad,
        setReponerCantidad,
        combos,
        setCombos,
        editingCombo,
        setEditingCombo,
      }}
    >
      {children}
    </InventarioContext.Provider>
  )
}

export const useInventario = () => useContext(InventarioContext)
