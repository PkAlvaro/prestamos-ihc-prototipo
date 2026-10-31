import React from 'react'
import Fuse from 'fuse.js'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { prestamosApi } from '../services/prestamosApi'
import { useAuth } from '../../auth'
import { ROUTE_PATHS, buildPrestamosPath, parsePrestamosRoute } from '../../../core/routing'
import { useEscaneo } from '../context/EscaneoContext'
import { useInventario } from '../context/InventarioContext'
import { useHistorial } from '../context/HistorialContext'
import { usePrestamosUI } from '../context/PrestamosUIContext'
import { usePrestamosActions } from './usePrestamosActions'
import { mensajeDeError } from '../utils/mensajeDeError'
import { terminosAlternativos, explicarCoincidencia } from '../utils/sinonimos'
import { useNovedad } from '../../../novedades'

const normalizeSearch = str => (str ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function usePrestamosPageState(onBack) {
  const navigate = useNavigate()
  const location = useLocation()
  const { tab } = useParams()

  const { currentUser } = useAuth()
  // Mejora 2: sin ella, la búsqueda solo mira nombre y categoría (como el sistema original)
  const { activa: sinonimosActiva } = useNovedad('busqueda-sinonimos')
  const explicar = (consulta, articulo) =>
    sinonimosActiva ? explicarCoincidencia(consulta, articulo) : null

  const {
    prestamosTab,
    setPrestamosTab,
    activeScannerTab,
    setActiveScannerTab,
    activeInventoryTab,
    setActiveInventoryTab,
    isLoading,
    loadError,
  } = usePrestamosUI()

  const {
    smartInput,
    setSmartInput,
    smartInputRef,
    searchRutNormalizado,
    searchRutError,
    estudianteEscaneado,
    setEstudianteEscaneado,
    articuloEscaneado,
    setArticuloEscaneado,
    articulosEscaneados,
    setArticulosEscaneados,
    showConsentModal,
    setShowConsentModal,
    terminosTexto,
    nuevoEstudiante,
    setNuevoEstudiante,
    rutReadOnly,
    rutNormalizado,
    rutError,
    verificacion,
    codigoVerificacion,
    setCodigoVerificacion,
    atencionesEnEspera,
  } = useEscaneo()

  const {
    prestamosActivos,
    prestamosVencidos,
    prestamosHistorial,
    historialTotal,
    historialOffset,
    setHistorialOffset,
    historialQuery: historialSearchQuery,
    setHistorialQuery,
    HISTORIAL_LIMIT,
  } = useHistorial()

  const {
    prestamosArticulos,
    showNuevoArticulo,
    setShowNuevoArticulo,
    nuevoArticulo,
    setNuevoArticulo,
    ajustarStockArticulo,
    setAjustarStockArticulo,
    ajustarStockValor,
    setAjustarStockValor,
    showNuevoInsumo,
    setShowNuevoInsumo,
    nuevoInsumo,
    setNuevoInsumo,
    insumos,
    showReponerInsumo,
    setShowReponerInsumo,
    reponerCantidad,
    setReponerCantidad,
    combos,
    editingCombo,
    setEditingCombo,
  } = useInventario()

  const {
    deleteArticuloPending,
    articuloDeleteBlocked,
    loadPrestamosData,
    handleAbrirIngresoManual,
    handleScan,
    handleAgregarArticulo,
    handleAgregarCombo,
    handleGuardarCombo,
    handleEliminarCombo,
    handleRealizarPrestamo,
    cobroArriendoModal,
    setCobroArriendoModal,
    handleGuardarCarreraCobro,
    handleConfirmarCobroArriendo,
    removeArticuloEscaneado,
    handleSolicitarVerificacion,
    handleConfirmarVerificacion,
    handleVolverAEditarDatos,
    handleAtenderOtroMientras,
    handleMinimizarAtencion,
    handleRetomarAtencion,
    handleDescartarAtencion,
    resumenDevolucion,
    setResumenDevolucion,
    handleConfirmarDevolucionSimple,
    movimientosTurno,
    handleRevertirMovimiento,
    handleDevolver,
    handleRevertirDevolucion,
    confirmacion,
    resolverConfirmacion,
    devolverLoteModal,
    setDevolverLoteModal,
    handleAbrirDevolverTodo,
    handleConfirmarDevolverLote,
    devolucionModal,
    setDevolucionModal,
    handleConfirmarDevolucion,
    transferirModal,
    setTransferirModal,
    handleAbrirTransferir,
    handleConfirmarTransferir,
    handleCrearArticulo,
    handleEliminarArticulo,
    confirmEliminarArticulo,
    cancelEliminarArticulo,
    handleRenombrarArticulo,
    handleGuardarAlias,
    handleAjustarStockArticulo,
    handleIncrementarStockArticulo,
    handleCrearInsumo,
    handleReponerInsumo,
    handleUpdateInsumoStock,
  } = usePrestamosActions()

  const routeState = React.useMemo(
    () => parsePrestamosRoute(tab, location.search),
    [tab, location.search]
  )

  React.useEffect(() => {
    const currentPath = `${location.pathname}${location.search}`
    if (currentPath !== routeState.canonicalPath) {
      navigate(routeState.canonicalPath, { replace: true })
      return
    }

    if (prestamosTab !== routeState.tab) {
      setPrestamosTab(routeState.tab)
    }

    if (routeState.tab === 'escaneo' && activeScannerTab !== routeState.mode) {
      setActiveScannerTab(routeState.mode)
    }

    if (routeState.tab === 'articulos' && activeInventoryTab !== routeState.view) {
      setActiveInventoryTab(routeState.view)
    }
  }, [
    activeInventoryTab,
    activeScannerTab,
    location.pathname,
    location.search,
    navigate,
    prestamosTab,
    routeState,
    setActiveInventoryTab,
    setActiveScannerTab,
    setPrestamosTab,
  ])

  const handleBack = React.useCallback(() => {
    if (onBack) {
      onBack()
      return
    }

    navigate(ROUTE_PATHS.home)
  }, [navigate, onBack])

  const navigateToPrestamosTab = React.useCallback(
    nextTab => {
      if (nextTab === 'escaneo') {
        navigate(buildPrestamosPath('escaneo', { mode: activeScannerTab }))
        return
      }

      if (nextTab === 'articulos') {
        navigate(buildPrestamosPath('articulos', { view: activeInventoryTab }))
        return
      }

      navigate(buildPrestamosPath(nextTab))
    },
    [activeInventoryTab, activeScannerTab, navigate]
  )

  const navigateToScannerMode = React.useCallback(
    mode => {
      navigate(buildPrestamosPath('escaneo', { mode }))
    },
    [navigate]
  )

  const navigateToInventoryView = React.useCallback(
    view => {
      navigate(buildPrestamosPath('articulos', { view }))
    },
    [navigate]
  )

  const handleRealizarPrestamoAndNavigate = React.useCallback(async () => {
    const result = await handleRealizarPrestamo()
    if (result?.success) {
      navigate(buildPrestamosPath('activos'))
    }
  }, [handleRealizarPrestamo, navigate])

  // El cobro de arriendo interrumpe el registro, así que la navegación a "activos"
  // ocurre cuando el modal termina, no cuando se aprieta "Realizar Préstamo".
  const handleGuardarCarreraCobroAndNavigate = React.useCallback(
    async carrera => {
      const result = await handleGuardarCarreraCobro(carrera)
      if (result?.registrado) navigate(buildPrestamosPath('activos'))
      return result
    },
    [handleGuardarCarreraCobro, navigate]
  )

  const handleConfirmarCobroArriendoAndNavigate = React.useCallback(
    async cobro => {
      const result = await handleConfirmarCobroArriendo(cobro)
      if (result?.registrado) navigate(buildPrestamosPath('activos'))
      return result
    },
    [handleConfirmarCobroArriendo, navigate]
  )

  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [insumosSearchQuery, setInsumosSearchQuery] = React.useState('')
  const [insumosCategoryFilter, setInsumosCategoryFilter] = React.useState('Todos')
  const [prestamosSearchQuery, setPrestamosSearchQuery] = React.useState('')
  // La búsqueda del historial la hace el servidor (sobre todos los registros, no solo la página
  // cargada); al cambiarla se vuelve a la primera página.
  const setHistorialSearchQuery = React.useCallback(
    q => {
      setHistorialQuery(q)
      setHistorialOffset(0)
    },
    [setHistorialQuery, setHistorialOffset]
  )
  const [stockSearchQuery, setStockSearchQuery] = React.useState('')
  const [stockSemanticResults, setStockSemanticResults] = React.useState(null) // null = sin búsqueda activa
  const [stockSemanticLoading, setStockSemanticLoading] = React.useState(false)
  const [editingArticuloId, setEditingArticuloId] = React.useState(null) // id del articulo en edición
  const [editingArticuloNombre, setEditingArticuloNombre] = React.useState('')
  const [prestamosSort, setPrestamosSort] = React.useState({
    col: 'fecha_prestamo',
    dir: 'desc',
  })
  const [historialSort, setHistorialSort] = React.useState({
    col: 'fecha_prestamo',
    dir: 'desc',
  })
  const [editingComentarioId, setEditingComentarioId] = React.useState(null)
  const [editingComentarioValue, setEditingComentarioValue] = React.useState('')
  const [comentariosMap, setComentariosMap] = React.useState({})

  // --- Estado Tab Estudiantes ---
  const ESTUDIANTES_LIMIT = 50
  const [estudiantesData, setEstudiantesData] = React.useState([])
  const [estudiantesTotal, setEstudiantesTotal] = React.useState(0)
  const [estudiantesLoading, setEstudiantesLoading] = React.useState(false)
  const [estudiantesQuery, setEstudiantesQuery] = React.useState('')
  const [estudiantesOffset, setEstudiantesOffset] = React.useState(0)
  const [estudiantesSort, setEstudiantesSort] = React.useState({
    col: 'nombre',
    dir: 'asc',
  })
  const [estudiantesConMulta, setEstudiantesConMulta] = React.useState(false)
  const [estudiantesCarrera, setEstudiantesCarrera] = React.useState('')
  const estudiantesTimerRef = React.useRef(null)
  const [estudianteToDelete, setEstudianteToDelete] = React.useState(null)
  const [estudianteDeleteLoading, setEstudianteDeleteLoading] = React.useState(false)
  const [estudianteDeleteError, setEstudianteDeleteError] = React.useState(null)
  const [estudianteDeleteBlocked, setEstudianteDeleteBlocked] = React.useState(false)

  const loadEstudiantes = React.useCallback(async (query, offset, sort, conMulta, carrera) => {
    setEstudiantesLoading(true)
    try {
      const data = await prestamosApi.listarEstudiantes({
        ...(query && { q: query }),
        limit: ESTUDIANTES_LIMIT,
        offset,
        sort_by: sort.col,
        sort_dir: sort.dir,
        ...(conMulta && { solo_con_multa: true }),
        ...(carrera && { carrera }),
      })
      setEstudiantesData(data.items || [])
      setEstudiantesTotal(data.total || 0)
    } catch (e) {
      console.error('Error cargando estudiantes:', e)
    } finally {
      setEstudiantesLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (prestamosTab !== 'estudiantes') return
    clearTimeout(estudiantesTimerRef.current)
    estudiantesTimerRef.current = setTimeout(() => {
      loadEstudiantes(
        estudiantesQuery,
        estudiantesOffset,
        estudiantesSort,
        estudiantesConMulta,
        estudiantesCarrera
      )
    }, 300)
    return () => clearTimeout(estudiantesTimerRef.current)
  }, [
    prestamosTab,
    estudiantesQuery,
    estudiantesOffset,
    estudiantesSort,
    estudiantesConMulta,
    estudiantesCarrera,
    loadEstudiantes,
  ])

  const handleEstudiantesSort = React.useCallback(col => {
    setEstudiantesSort(prev => ({
      col,
      dir: prev.col === col && prev.dir === 'asc' ? 'desc' : 'asc',
    }))
    setEstudiantesOffset(0)
  }, [])

  const handleEliminarEstudiante = React.useCallback(
    async (forzoso = false) => {
      if (!estudianteToDelete) return
      setEstudianteDeleteLoading(true)
      setEstudianteDeleteError(null)
      try {
        await prestamosApi.eliminarEstudiante(estudianteToDelete.id, { forzoso })
        setEstudianteToDelete(null)
        setEstudianteDeleteBlocked(false)
        loadEstudiantes(
          estudiantesQuery,
          estudiantesOffset,
          estudiantesSort,
          estudiantesConMulta,
          estudiantesCarrera
        )
      } catch (e) {
        setEstudianteDeleteError(mensajeDeError(e, 'Error al eliminar estudiante.'))
        setEstudianteDeleteBlocked(e.response?.status === 409)
      } finally {
        setEstudianteDeleteLoading(false)
      }
    },
    [
      estudianteToDelete,
      loadEstudiantes,
      estudiantesQuery,
      estudiantesOffset,
      estudiantesSort,
      estudiantesConMulta,
      estudiantesCarrera,
    ]
  )

  React.useEffect(() => {
    setPrestamosSearchQuery('')
    setHistorialSearchQuery('')
    setStockSearchQuery('')
    setStockSemanticResults(null)
    setInsumosSearchQuery('')
    setPrestamosSort({ col: 'fecha_prestamo', dir: 'desc' })
    setHistorialSort({ col: 'fecha_prestamo', dir: 'desc' })
    if (prestamosTab !== 'estudiantes') {
      setEstudiantesQuery('')
      setEstudiantesOffset(0)
      setEstudiantesConMulta(false)
      setEstudiantesCarrera('')
    }
  }, [prestamosTab, setHistorialSearchQuery])

  // Búsqueda semántica con debounce para el stock de artículos. Cada resultado
  // ya es un tipo de articulo con stock_total/stock_disponible calculados por
  // el servidor: no hace falta agrupar nada del lado del cliente.
  React.useEffect(() => {
    if (!stockSearchQuery || stockSearchQuery.length < 2) {
      setStockSemanticResults(null)
      return
    }
    setStockSemanticLoading(true)
    const timer = setTimeout(async () => {
      try {
        const results = await prestamosApi.buscarArticulosSemantico(stockSearchQuery, false)
        setStockSemanticResults(results)
      } catch {
        setStockSemanticResults(null) // fallback a Fuse
      } finally {
        setStockSemanticLoading(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [stockSearchQuery, sinonimosActiva])
  const rutInputRef = React.useRef(null)
  const nombreInputRef = React.useRef(null)

  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [pendingArticulo, setPendingArticulo] = React.useState(null)
  const [pendingCantidad, setPendingCantidad] = React.useState(1)

  // Articulos con campos normalizados para busqueda por nombre/categoria.
  const articulosParaBuscar = React.useMemo(
    () =>
      prestamosArticulos.map(a => ({
        ...a,
        _nombreNorm: normalizeSearch(a.nombre),
        _categoriaNorm: normalizeSearch(a.categoria),
        _codigoNorm: sinonimosActiva ? normalizeSearch(a.codigo) : '',
        // Sinónimos y "otros nombres": "bata" encuentra los delantales
        _alternativos: sinonimosActiva ? terminosAlternativos(a) : [],
      })),
    [prestamosArticulos, sinonimosActiva]
  )

  const fuseArticulos = React.useMemo(
    () =>
      new Fuse(articulosParaBuscar, {
        keys: [
          { name: '_nombreNorm', weight: 0.6 },
          { name: '_categoriaNorm', weight: 0.15 },
          { name: '_codigoNorm', weight: 0.1 },
          { name: '_alternativos', weight: 0.15 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [articulosParaBuscar]
  )

  const filteredSuggestions = React.useMemo(() => {
    if (!smartInput || smartInput.length < 2) return []
    const isRutOrTuc = /^[0-9Kk-]+$/.test(smartInput)
    if (isRutOrTuc) return []

    const qNorm = normalizeSearch(smartInput)
    return fuseArticulos
      .search(qNorm)
      .map(r => ({ ...r.item, _coincidencia: explicar(smartInput, r.item) }))
      .filter(a => a.stock_disponible > 0)
      .slice(0, 5)
  }, [smartInput, fuseArticulos]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (filteredSuggestions.length > 0) {
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [filteredSuggestions])

  // Calcular multas del estudiante actual
  const estudianteFines = React.useMemo(() => {
    if (!estudianteEscaneado) return []
    return prestamosVencidos.filter(v => v.estudiante_id === estudianteEscaneado.id)
  }, [estudianteEscaneado, prestamosVencidos])

  // Cerrar dropdown/selector de cantidad cuando se hace click fuera o se presiona Escape
  React.useEffect(() => {
    const handleClickOutside = e => {
      const container = document.getElementById('smartInputContainer')
      if (container && !container.contains(e.target)) {
        setShowSuggestions(false)
        setPendingArticulo(null)
      }
    }

    const handleKeyDown = e => {
      if (e.key === 'Escape') {
        setShowSuggestions(false)
        setPendingArticulo(null)
      }
    }

    if (showSuggestions || pendingArticulo) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [showSuggestions, pendingArticulo])

  React.useEffect(() => {
    if (!showConsentModal) return

    const focusTarget = !rutReadOnly ? rutInputRef.current : nombreInputRef.current

    const timer = setTimeout(() => {
      focusTarget?.focus()
    }, 0)

    return () => clearTimeout(timer)
  }, [showConsentModal, rutReadOnly])

  const pendingMaxCantidad = React.useMemo(() => {
    if (!pendingArticulo) return 1
    const enCarrito = articulosEscaneados.find(a => a.articulo_id === pendingArticulo.id)
    const disponibleRestante = pendingArticulo.stock_disponible - (enCarrito?.cantidad || 0)
    return Math.max(disponibleRestante, 1)
  }, [pendingArticulo, articulosEscaneados])

  const handleSuggestionClick = articulo => {
    setShowSuggestions(false)
    setSmartInput('')
    setPendingArticulo(articulo)
    setPendingCantidad(1)
  }

  const handleConfirmarPendiente = () => {
    if (!pendingArticulo) return
    handleAgregarArticulo(pendingArticulo, pendingCantidad)
    setPendingArticulo(null)
    setPendingCantidad(1)
  }

  const handleCancelarPendiente = () => {
    setPendingArticulo(null)
    setPendingCantidad(1)
  }

  const insumosCategories = React.useMemo(() => {
    const cats = new Set(insumos.map(i => i.categoria).filter(Boolean))
    return ['Todos', ...Array.from(cats)].sort()
  }, [insumos])

  const filteredInsumos = React.useMemo(() => {
    const q = normalizeSearch(insumosSearchQuery)
    return insumos.filter(insumo => {
      const matchSearch =
        !q ||
        normalizeSearch(insumo.nombre).includes(q) ||
        normalizeSearch(insumo.categoria).includes(q)
      const matchCategory =
        insumosCategoryFilter === 'Todos' || insumo.categoria === insumosCategoryFilter
      return matchSearch && matchCategory
    })
  }, [insumos, insumosSearchQuery, insumosCategoryFilter])

  const sortData = React.useCallback((data, col, dir) => {
    return [...data].sort((a, b) => {
      let va = a[col],
        vb = b[col]
      if (col === 'fecha_prestamo' || col === 'fecha_devolucion') {
        va = va ? new Date(va).getTime() : 0
        vb = vb ? new Date(vb).getTime() : 0
      } else if (col === 'multa_calculada') {
        va = va ?? 0
        vb = vb ?? 0
      } else {
        va = (va ?? '').toString().toLowerCase()
        vb = (vb ?? '').toString().toLowerCase()
      }
      if (va < vb) return dir === 'asc' ? -1 : 1
      if (va > vb) return dir === 'asc' ? 1 : -1
      return 0
    })
  }, [])

  const getComentario = React.useCallback(
    p => (comentariosMap[p.id] !== undefined ? comentariosMap[p.id] : p.comentario || ''),
    [comentariosMap]
  )

  const handleGuardarComentario = React.useCallback(
    async prestamoId => {
      const comentario = editingComentarioValue.trim() || null
      setEditingComentarioId(null)
      try {
        await prestamosApi.actualizarComentarioPrestamo(prestamoId, comentario)
        setComentariosMap(prev => ({
          ...prev,
          [prestamoId]: comentario || '',
        }))
      } catch (e) {
        console.error('Error al guardar comentario:', e)
      }
    },
    [editingComentarioValue]
  )

  const handlePrestamosSort = React.useCallback(col => {
    setPrestamosSort(prev => ({
      col,
      dir: prev.col === col && prev.dir === 'asc' ? 'desc' : 'asc',
    }))
  }, [])

  const handleHistorialSort = React.useCallback(col => {
    setHistorialSort(prev => ({
      col,
      dir: prev.col === col && prev.dir === 'asc' ? 'desc' : 'asc',
    }))
  }, [])

  const filteredPrestamosData = React.useMemo(() => {
    const datos = prestamosTab === 'activos' ? prestamosActivos : prestamosVencidos
    const filtered = !prestamosSearchQuery
      ? datos
      : (() => {
          const q = normalizeSearch(prestamosSearchQuery)
          return datos.filter(
            p =>
              normalizeSearch(p.articulo_nombre).includes(q) ||
              normalizeSearch(p.estudiante_nombre).includes(q) ||
              normalizeSearch(p.estudiante_rut).includes(q)
          )
        })()
    return sortData(filtered, prestamosSort.col, prestamosSort.dir)
  }, [
    prestamosTab,
    prestamosActivos,
    prestamosVencidos,
    prestamosSearchQuery,
    prestamosSort,
    sortData,
  ])

  const filteredHistorial = React.useMemo(
    () => sortData(prestamosHistorial, historialSort.col, historialSort.dir),
    [prestamosHistorial, historialSort, sortData]
  )

  const fuseStock = React.useMemo(
    () =>
      new Fuse(articulosParaBuscar, {
        keys: [
          { name: '_nombreNorm', weight: 0.6 },
          { name: '_categoriaNorm', weight: 0.15 },
          { name: '_codigoNorm', weight: 0.1 },
          { name: '_alternativos', weight: 0.15 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [articulosParaBuscar]
  )

  const filteredStock = React.useMemo(() => {
    if (!stockSearchQuery) return articulosParaBuscar
    // Semántico con resultados → úsalo; vacío o null → Fuse.js como fallback
    const conExplicacion = a => ({
      ...a,
      _coincidencia: explicar(stockSearchQuery, a),
    })
    if (stockSemanticResults !== null && stockSemanticResults.length > 0)
      return stockSemanticResults.map(conExplicacion)
    return fuseStock.search(normalizeSearch(stockSearchQuery)).map(r => conExplicacion(r.item))
  }, [stockSearchQuery, fuseStock, articulosParaBuscar, stockSemanticResults]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    prestamosTab,
    isLoading,
    loadError,
    activeScannerTab,
    setActiveScannerTab,
    smartInput,
    setSmartInput,
    smartInputRef,
    searchRutNormalizado,
    searchRutError,
    estudianteEscaneado,
    setEstudianteEscaneado,
    articuloEscaneado,
    setArticuloEscaneado,
    articulosEscaneados,
    setArticulosEscaneados,
    prestamosActivos,
    prestamosVencidos,
    prestamosArticulos,
    prestamosHistorial,
    historialTotal,
    historialOffset,
    setHistorialOffset,
    HISTORIAL_LIMIT,
    loadPrestamosData,
    handleAbrirIngresoManual,
    handleScan,
    handleAgregarArticulo,
    removeArticuloEscaneado,
    handleDevolver,
    handleRevertirDevolucion,
    confirmacion,
    resolverConfirmacion,
    devolverLoteModal,
    setDevolverLoteModal,
    handleAbrirDevolverTodo,
    handleConfirmarDevolverLote,
    devolucionModal,
    setDevolucionModal,
    handleConfirmarDevolucion,
    transferirModal,
    setTransferirModal,
    handleAbrirTransferir,
    handleConfirmarTransferir,
    combos,
    editingCombo,
    setEditingCombo,
    handleAgregarCombo,
    handleGuardarCombo,
    handleEliminarCombo,
    cobroArriendoModal,
    setCobroArriendoModal,
    handleGuardarCarreraCobro: handleGuardarCarreraCobroAndNavigate,
    handleConfirmarCobroArriendo: handleConfirmarCobroArriendoAndNavigate,
    activeInventoryTab,
    showNuevoArticulo,
    setShowNuevoArticulo,
    nuevoArticulo,
    setNuevoArticulo,
    ajustarStockArticulo,
    setAjustarStockArticulo,
    ajustarStockValor,
    setAjustarStockValor,
    showNuevoInsumo,
    setShowNuevoInsumo,
    nuevoInsumo,
    setNuevoInsumo,
    insumos,
    handleCrearArticulo,
    handleCrearInsumo,
    showReponerInsumo,
    setShowReponerInsumo,
    reponerCantidad,
    setReponerCantidad,
    handleReponerInsumo,
    handleUpdateInsumoStock,
    handleEliminarArticulo,
    handleRenombrarArticulo,
    handleGuardarAlias,
    handleAjustarStockArticulo,
    handleIncrementarStockArticulo,
    deleteArticuloPending,
    articuloDeleteBlocked,
    confirmEliminarArticulo,
    cancelEliminarArticulo,
    showConsentModal,
    setShowConsentModal,
    terminosTexto,
    nuevoEstudiante,
    setNuevoEstudiante,
    handleSolicitarVerificacion,
    handleConfirmarVerificacion,
    handleVolverAEditarDatos,
    handleAtenderOtroMientras,
    handleMinimizarAtencion,
    handleRetomarAtencion,
    handleDescartarAtencion,
    resumenDevolucion,
    setResumenDevolucion,
    handleConfirmarDevolucionSimple,
    movimientosTurno,
    handleRevertirMovimiento,
    atencionesEnEspera,
    verificacion,
    codigoVerificacion,
    setCodigoVerificacion,
    rutReadOnly,
    rutNormalizado,
    rutError,
    currentUser,
    handleBack,
    navigateToPrestamosTab,
    navigateToScannerMode,
    navigateToInventoryView,
    handleRealizarPrestamoAndNavigate,
    sidebarCollapsed,
    setSidebarCollapsed,
    insumosSearchQuery,
    setInsumosSearchQuery,
    insumosCategoryFilter,
    setInsumosCategoryFilter,
    prestamosSearchQuery,
    setPrestamosSearchQuery,
    historialSearchQuery,
    setHistorialSearchQuery,
    stockSearchQuery,
    setStockSearchQuery,
    stockSemanticLoading,
    editingArticuloId,
    setEditingArticuloId,
    editingArticuloNombre,
    setEditingArticuloNombre,
    prestamosSort,
    historialSort,
    editingComentarioId,
    setEditingComentarioId,
    editingComentarioValue,
    setEditingComentarioValue,
    ESTUDIANTES_LIMIT,
    estudiantesData,
    estudiantesTotal,
    estudiantesLoading,
    estudiantesQuery,
    setEstudiantesQuery,
    estudiantesOffset,
    setEstudiantesOffset,
    estudiantesSort,
    estudiantesConMulta,
    setEstudiantesConMulta,
    estudiantesCarrera,
    setEstudiantesCarrera,
    setEstudiantesData,
    loadEstudiantes,
    handleEstudiantesSort,
    estudianteToDelete,
    setEstudianteToDelete,
    estudianteDeleteLoading,
    estudianteDeleteError,
    setEstudianteDeleteError,
    estudianteDeleteBlocked,
    setEstudianteDeleteBlocked,
    handleEliminarEstudiante,
    rutInputRef,
    nombreInputRef,
    showSuggestions,
    setShowSuggestions,
    filteredSuggestions,
    estudianteFines,
    handleSuggestionClick,
    pendingArticulo,
    pendingCantidad,
    setPendingCantidad,
    pendingMaxCantidad,
    handleConfirmarPendiente,
    handleCancelarPendiente,
    insumosCategories,
    filteredInsumos,
    getComentario,
    handleGuardarComentario,
    handlePrestamosSort,
    handleHistorialSort,
    filteredPrestamosData,
    filteredHistorial,
    filteredStock,
  }
}
