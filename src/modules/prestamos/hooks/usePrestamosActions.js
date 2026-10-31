import React, { useState } from 'react'
import { prestamosApi } from '../services/prestamosApi'
import { normalizeRut, isValidRut } from '../../../utils/rutUtils'
import { useToast } from '../components/PrestamosToast'
import { useEscaneo } from '../context/EscaneoContext'
import { useInventario } from '../context/InventarioContext'
import { useHistorial } from '../context/HistorialContext'
import { usePrestamosUI } from '../context/PrestamosUIContext'
import { mensajeDeError } from '../utils/mensajeDeError'
import useConfirmacion from './useConfirmacion'
import { useAuth } from '../../auth'
import { novedadActiva } from '../../../novedades'

// --- HELPERS PUROS (sin estado) ---

const parseRutFromTuc = scanned => {
  const clean = scanned.replace(/\s+/g, '').toUpperCase()
  const sinRelleno = clean.slice(0, -2)
  const verificador = sinRelleno.slice(-1)
  const numero = sinRelleno.slice(0, -1)
  return `${numero}-${verificador}`
}

const normalizeRutDigits = rawDigits => {
  if (!rawDigits) return null
  const onlyDigits = String(rawDigits).replace(/\D/g, '')
  if (!onlyDigits) return null
  const withoutLeftZeros = onlyDigits.replace(/^0+/, '')
  const baseDigits = withoutLeftZeros || onlyDigits
  const normalizedDigits = baseDigits.length > 8 ? baseDigits.slice(-8) : baseDigits
  if (normalizedDigits.length < 7 || normalizedDigits.length > 8) return null
  return normalizedDigits
}

const extractRutFromChileanIdQr = rawValue => {
  if (!rawValue) return null
  const scannedValues = [rawValue]
  try {
    const decoded = decodeURIComponent(rawValue)
    if (decoded !== rawValue) scannedValues.unshift(decoded)
  } catch {
    // Ignorar errores de decode cuando el scanner entrega texto no-URI
  }
  const patterns = [
    /RUN[^0-9Kk]*([0-9]{7,12})[^0-9Kk]?([0-9Kk])/gi,
    /RUN(?:Â¿|%C2%BF|=)([0-9]{7,12})(?:'|%27|-|%2D)?([0-9Kk])/gi,
  ]
  const candidates = []
  scannedValues.forEach(value => {
    patterns.forEach(pattern => {
      for (const match of value.matchAll(pattern)) {
        const digits = normalizeRutDigits(match[1])
        const dv = String(match[2] || '').toUpperCase()
        if (!digits || !/^[0-9K]$/.test(dv)) continue
        candidates.push({ rut: `${digits}-${dv}`, score: digits.length })
      }
    })
  })
  if (!candidates.length) return null
  candidates.sort((a, b) => b.score - a.score)
  return candidates[0].rut
}

// --- HOOK PRINCIPAL ---

export function usePrestamosActions() {
  const toast = useToast()
  const escaneo = useEscaneo()
  const inventario = useInventario()
  const historial = useHistorial()
  const ui = usePrestamosUI()
  const { currentUser } = useAuth()

  const [deleteArticuloPending, setDeleteArticuloPending] = useState(null)
  const [articuloDeleteBlocked, setArticuloDeleteBlocked] = useState(false)

  const { confirmacion, confirmar, resolverConfirmacion } = useConfirmacion()

  // --- CARGA DE DATOS ---

  // La búsqueda del historial se manda al servidor con un pequeño retraso para no
  // consultar en cada tecla.
  const [historialBusqueda, setHistorialBusqueda] = useState('')
  React.useEffect(() => {
    const timer = setTimeout(() => setHistorialBusqueda(historial.historialQuery.trim()), 400)
    return () => clearTimeout(timer)
  }, [historial.historialQuery])

  const loadPrestamosData = React.useCallback(async () => {
    ui.setIsLoading(true)
    ui.setLoadError(false)
    try {
      if (
        ui.prestamosTab === 'insumos' ||
        ui.prestamosTab === 'escaneo' ||
        ui.activeScannerTab === 'insumo'
      ) {
        const [insResult, histResult, artsResult, combosResult] = await Promise.allSettled([
          prestamosApi.listarInsumos(),
          prestamosApi.listarHistorialEntregas(),
          prestamosApi.listarArticulos(),
          prestamosApi.listarCombos(),
        ])
        if (insResult.status === 'fulfilled') inventario.setInsumos(insResult.value || [])
        if (histResult.status === 'fulfilled')
          inventario.setHistorialEntregas(histResult.value || [])
        if (artsResult.status === 'fulfilled')
          inventario.setPrestamosArticulos(artsResult.value || [])
        if (combosResult.status === 'fulfilled') inventario.setCombos(combosResult.value || [])
      }

      if (ui.prestamosTab === 'activos' || ui.prestamosTab === 'vencidos') {
        const [lista, movimientos] = await Promise.all([
          ui.prestamosTab === 'activos'
            ? prestamosApi.listarPrestamosActivos()
            : prestamosApi.listarPrestamosVencidos(),
          prestamosApi.listarMovimientosTurno(),
        ])
        if (ui.prestamosTab === 'activos') historial.setPrestamosActivos(lista || [])
        else historial.setPrestamosVencidos(lista || [])
        setMovimientosTurno(movimientos || [])
      } else if (ui.prestamosTab === 'articulos') {
        const [artsResult, vencidosResult] = await Promise.allSettled([
          prestamosApi.listarArticulos(),
          prestamosApi.listarPrestamosVencidos(),
        ])
        if (artsResult.status === 'fulfilled')
          inventario.setPrestamosArticulos(artsResult.value || [])
        if (vencidosResult.status === 'fulfilled')
          historial.setPrestamosVencidos(vencidosResult.value || [])
      } else if (ui.prestamosTab === 'mailing') {
        const data = await prestamosApi.listarPrestamosVencidos()
        historial.setPrestamosVencidos(data || [])
      } else if (ui.prestamosTab === 'historial') {
        const data = await prestamosApi.listarHistorialPrestamos(
          historial.HISTORIAL_LIMIT,
          historial.historialOffset,
          historialBusqueda
        )
        historial.setPrestamosHistorial(data?.items || [])
        historial.setHistorialTotal(data?.total ?? 0)
      }
    } catch (e) {
      console.error('Error cargando datos de prestamos:', e)
      ui.setLoadError(true)
    } finally {
      ui.setIsLoading(false)
    }
  }, [ui.prestamosTab, ui.activeScannerTab, historial.historialOffset, historialBusqueda]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh
  React.useEffect(() => {
    loadPrestamosData()
    const interval = setInterval(() => {
      if (['activos', 'vencidos', 'articulos', 'insumos'].includes(ui.prestamosTab)) {
        loadPrestamosData()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [ui.prestamosTab, ui.activeScannerTab, historial.historialOffset, historialBusqueda]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus scanner input
  React.useEffect(() => {
    if (
      ui.prestamosTab === 'escaneo' &&
      !escaneo.showConsentModal &&
      escaneo.smartInputRef.current
    ) {
      escaneo.smartInputRef.current.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ui.prestamosTab,
    escaneo.estudianteEscaneado,
    escaneo.articuloEscaneado,
    escaneo.showConsentModal,
  ])

  // Normalizar RUT del formulario de consentimiento
  React.useEffect(() => {
    const { rut, es_intercambio } = escaneo.nuevoEstudiante
    if (!rut) {
      escaneo.setRutNormalizado('')
      escaneo.setRutError('')
      return
    }
    if (es_intercambio) {
      escaneo.setRutNormalizado(rut.trim())
      escaneo.setRutError('')
      return
    }
    const normalized = normalizeRut(rut)
    if (normalized && isValidRut(normalized)) {
      escaneo.setRutNormalizado(normalized)
      escaneo.setRutError('')
    } else if (rut.length > 0) {
      escaneo.setRutNormalizado('')
      escaneo.setRutError('RUT inválido. Formato esperado: 12345678-9')
    }
  }, [escaneo.nuevoEstudiante]) // eslint-disable-line react-hooks/exhaustive-deps

  // Normalizar RUT del smart input
  React.useEffect(() => {
    const input = escaneo.smartInput
    if (!input) {
      escaneo.setSearchRutNormalizado('')
      escaneo.setSearchRutError('')
      return
    }
    const possibleRut = /^[0-9Kk.\-\s]+$/.test(input)
    if (!possibleRut) {
      escaneo.setSearchRutNormalizado('')
      escaneo.setSearchRutError('')
      return
    }
    const normalized = normalizeRut(input)
    if (normalized && input.length > 2) {
      escaneo.setSearchRutNormalizado(normalized)
      escaneo.setSearchRutError('')
    } else {
      escaneo.setSearchRutNormalizado('')
      escaneo.setSearchRutError('')
    }
  }, [escaneo.smartInput]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- ACCIONES DE ESCANEO ---

  const openConsentForm = async ({
    rut = '',
    nombre = '',
    email = '',
    carrera = '',
    es_intercambio = false,
    rutLocked = false,
  } = {}) => {
    const terminos = await prestamosApi.obtenerTerminos()
    escaneo.setTerminosTexto(terminos.texto)
    escaneo.setNuevoEstudiante({ rut, nombre, email, carrera, es_intercambio })
    escaneo.setRutReadOnly(rutLocked)
    escaneo.setShowConsentModal(true)
  }

  const handleAbrirIngresoManual = async () => {
    ui.setIsLoading(true)
    try {
      await openConsentForm({ rutLocked: false })
    } catch (e) {
      toast.error('Error al abrir ingreso manual: ' + e.message)
    } finally {
      ui.setIsLoading(false)
    }
  }

  const handleScan = async val => {
    if (escaneo.showConsentModal) return
    if (!val) return
    const inputVal = val.trim()
    const normalizedRut = normalizeRut(inputVal)

    const isTuc = /^[0-9]{11}$/.test(inputVal)
    const isRutManual = !!normalizedRut
    const rutFromChileanIdQr = extractRutFromChileanIdQr(inputVal)
    const isChileanIdQr = !!rutFromChileanIdQr

    if (isTuc || isRutManual || isChileanIdQr) {
      let rutNorm
      if (isChileanIdQr) rutNorm = rutFromChileanIdQr
      else if (isRutManual) rutNorm = normalizedRut
      else rutNorm = parseRutFromTuc(inputVal)

      ui.setIsLoading(true)
      try {
        const result = await prestamosApi.buscarEstudiante(rutNorm)
        if (!result.existe) {
          await openConsentForm({ rut: rutNorm, rutLocked: false })
        } else if (!result.consentimiento_aceptado) {
          await openConsentForm({
            rut: rutNorm,
            nombre: result.estudiante.nombre,
            email: result.estudiante.email || '',
            rutLocked: false,
          })
        } else {
          escaneo.setEstudianteEscaneado(result.estudiante)
        }
        escaneo.setSmartInput('')
      } catch (e) {
        toast.error('Error al buscar estudiante: ' + e.message)
      } finally {
        ui.setIsLoading(false)
      }
    } else {
      toast.warning('No se reconoce esta entrada. Busca el artículo por nombre.')
      escaneo.setSmartInput('')
    }
  }

  /**
   * Agrega una unidad del articulo al carrito de la transaccion actual, o
   * incrementa la cantidad si ya estaba agregado. Ya no se identifica una
   * unidad fisica especifica (sin SKU unico): solo importa cuantas unidades
   * de ese tipo se piden, contra el stock disponible.
   */
  const handleAgregarArticulo = (articulo, cantidad = 1) => {
    const yaEnCarrito = escaneo.articulosEscaneados.find(a => a.articulo_id === articulo.id)
    const cantidadActual = yaEnCarrito ? yaEnCarrito.cantidad : 0
    if (cantidadActual + cantidad > articulo.stock_disponible) {
      toast.warning(
        `No hay stock suficiente de "${articulo.nombre}" (disponibles: ${articulo.stock_disponible})`
      )
      return
    }

    if (yaEnCarrito) {
      escaneo.setArticulosEscaneados(prev =>
        prev.map(a =>
          a.articulo_id === articulo.id ? { ...a, cantidad: a.cantidad + cantidad } : a
        )
      )
    } else {
      escaneo.setArticulosEscaneados(prev => [
        ...prev,
        {
          articulo_id: articulo.id,
          nombre: articulo.nombre,
          categoria: articulo.categoria,
          cantidad,
          stock_disponible: articulo.stock_disponible,
        },
      ])
    }
    escaneo.setArticuloEscaneado(articulo)
    escaneo.setSmartInput('')
  }

  /**
   * Agrega al carrito todos los articulos de un combo (atajo para
   * combinaciones frecuentes, ej. Delantal+Antiparra). Reutiliza
   * handleAgregarArticulo por cada item, así la validación de stock no se
   * duplica: si algún item del combo no tiene stock suficiente, ese item se
   * omite (con su propio toast de aviso) y el resto se agrega igual.
   */
  const handleAgregarCombo = combo => {
    combo.items.forEach(item => {
      const articulo = inventario.prestamosArticulos.find(a => a.id === item.articulo_id) || {
        id: item.articulo_id,
        nombre: item.articulo_nombre,
        categoria: '',
        stock_disponible: item.stock_disponible,
      }
      handleAgregarArticulo(articulo, item.cantidad)
    })
  }

  const handleGuardarCombo = async datos => {
    ui.setIsLoading(true)
    try {
      if (datos.id) {
        await prestamosApi.actualizarCombo(datos.id, { nombre: datos.nombre, items: datos.items })
      } else {
        await prestamosApi.crearCombo({ nombre: datos.nombre, items: datos.items })
      }
      toast.success('Combo guardado exitosamente')
      inventario.setEditingCombo(null)
      await loadPrestamosData()
      return true
    } catch (e) {
      toast.error('Error al guardar combo: ' + mensajeDeError(e))
      return false
    } finally {
      ui.setIsLoading(false)
    }
  }

  const handleEliminarCombo = async comboId => {
    ui.setIsLoading(true)
    try {
      await prestamosApi.eliminarCombo(comboId)
      toast.success('Combo eliminado exitosamente')
      inventario.setEditingCombo(null)
      await loadPrestamosData()
    } catch (e) {
      toast.error('Error al eliminar combo: ' + mensajeDeError(e))
    } finally {
      ui.setIsLoading(false)
    }
  }

  // Aviso de cobro de arriendo a otras carreras: { evaluacion, articulos } | null
  const [cobroArriendoModal, setCobroArriendoModal] = useState(null)

  const limpiarEscaneo = () => {
    escaneo.setEstudianteEscaneado(null)
    escaneo.setArticuloEscaneado(null)
    escaneo.setArticulosEscaneados([])
  }

  const _aItemsApi = articulos =>
    articulos.map(a => ({ articulo_id: a.articulo_id, cantidad: a.cantidad }))

  const registrarLote = async (articulos, cobro = null) => {
    const total = articulos.reduce((sum, a) => sum + a.cantidad, 0)
    await prestamosApi.registrarPrestamoLote({
      estudiante_rut: escaneo.estudianteEscaneado.rut,
      articulos: _aItemsApi(articulos),
      cobro,
    })
    toast.success(`Préstamo registrado (${total} artículo${total !== 1 ? 's' : ''})`)
    limpiarEscaneo()
    setCobroArriendoModal(null)
    await loadPrestamosData()
  }

  const handleRealizarPrestamo = async () => {
    if (!escaneo.estudianteEscaneado || escaneo.articulosEscaneados.length === 0) {
      return { success: false }
    }
    ui.setIsLoading(true)
    const articulos = [...escaneo.articulosEscaneados]
    try {
      const evaluacion = await prestamosApi.evaluarCobroArriendo({
        estudiante_rut: escaneo.estudianteEscaneado.rut,
        articulos: _aItemsApi(articulos),
      })

      // Sin carrera no se puede decidir el cobro, y con cobro pendiente no se registra nada:
      // en ambos casos decide el operario desde el modal.
      if (!evaluacion.carrera_conocida || evaluacion.aplica) {
        setCobroArriendoModal({ evaluacion, articulos })
        return { success: false, pendienteCobro: true }
      }

      await registrarLote(articulos)
      return { success: true }
    } catch (e) {
      toast.error('Error al registrar préstamo: ' + mensajeDeError(e))
      return { success: false, error: e }
    } finally {
      ui.setIsLoading(false)
    }
  }

  /**
   * Guarda la carrera que el operario preguntó y vuelve a evaluar el cobro.
   * Si tras conocerla resulta exenta, el préstamo se registra de inmediato.
   */
  const handleGuardarCarreraCobro = async carrera => {
    if (!cobroArriendoModal) return { registrado: false }
    const { evaluacion, articulos } = cobroArriendoModal
    await prestamosApi.actualizarCarreraEstudiante(evaluacion.estudiante_id, carrera)

    const nueva = await prestamosApi.evaluarCobroArriendo({
      estudiante_rut: escaneo.estudianteEscaneado.rut,
      articulos: _aItemsApi(articulos),
    })
    escaneo.setEstudianteEscaneado(prev => (prev ? { ...prev, carrera } : prev))

    if (!nueva.aplica) {
      await registrarLote(articulos)
      return { registrado: true }
    }
    setCobroArriendoModal({ evaluacion: nueva, articulos })
    return { registrado: false }
  }

  const handleConfirmarCobroArriendo = async ({ monto_cobrado, tipo_pago, comentario }) => {
    if (!cobroArriendoModal) return { registrado: false }
    await registrarLote(cobroArriendoModal.articulos, {
      monto_cobrado,
      tipo_pago,
      comentario: comentario || null,
    })
    return { registrado: true }
  }

  const removeArticuloEscaneado = articuloId => {
    escaneo.setArticulosEscaneados(prev => {
      const next = prev.filter(item => item.articulo_id !== articuloId)
      escaneo.setArticuloEscaneado(next.length ? next[next.length - 1] : null)
      return next
    })
  }

  const resetConsentForm = () => {
    escaneo.setShowConsentModal(false)
    escaneo.setNuevoEstudiante({
      rut: '',
      nombre: '',
      email: '',
      carrera: '',
      es_intercambio: false,
    })
    escaneo.setRutNormalizado('')
    escaneo.setRutError('')
    escaneo.setVerificacion(null)
    escaneo.setCodigoVerificacion('')
  }

  /**
   * Paso 1: envía el código de verificación al correo declarado. El registro
   * del estudiante NO se crea hasta que el código se confirma — así evitamos
   * que alguien registre un correo ajeno (ver incidente del 2026-08).
   */
  const handleSolicitarVerificacion = async () => {
    if (
      !escaneo.nuevoEstudiante.rut ||
      !escaneo.nuevoEstudiante.nombre ||
      !escaneo.nuevoEstudiante.email ||
      !escaneo.nuevoEstudiante.carrera
    ) {
      toast.error('Faltan datos obligatorios (RUT/Identificador, Nombre, Email, Carrera)')
      return
    }
    if (!escaneo.nuevoEstudiante.es_intercambio && !isValidRut(escaneo.rutNormalizado)) {
      toast.error('RUT inválido. Formato esperado: 12345678-9')
      return
    }
    ui.setIsLoading(true)
    try {
      const result = await prestamosApi.solicitarVerificacion({
        rut: escaneo.rutNormalizado,
        nombre: escaneo.nuevoEstudiante.nombre,
        email: escaneo.nuevoEstudiante.email,
        carrera: escaneo.nuevoEstudiante.carrera || null,
        es_intercambio: escaneo.nuevoEstudiante.es_intercambio,
      })
      escaneo.setVerificacion({
        verificacionId: result.verificacion_id,
        emailEnmascarado: result.email_enmascarado,
        expiraEnSegundos: result.expira_en_segundos,
        expiraEn: Date.now() + result.expira_en_segundos * 1000,
      })
      escaneo.setCodigoVerificacion('')
      toast.success(`Código enviado a ${result.email_enmascarado}`)
    } catch (e) {
      toast.error('Error al enviar el código de verificación: ' + mensajeDeError(e))
    } finally {
      ui.setIsLoading(false)
    }
  }

  /** Paso 2: confirma el código y recién ahí crea/actualiza al estudiante. */
  const handleConfirmarVerificacion = async () => {
    if (!escaneo.verificacion) return
    if (!/^\d{6}$/.test(escaneo.codigoVerificacion)) {
      toast.error('Ingresa el código de 6 dígitos recibido por correo')
      return
    }
    ui.setIsLoading(true)
    try {
      const result = await prestamosApi.confirmarVerificacion({
        verificacion_id: escaneo.verificacion.verificacionId,
        codigo: escaneo.codigoVerificacion,
      })
      escaneo.setEstudianteEscaneado(result)
      resetConsentForm()
      toast.success('Estudiante registrado correctamente')
    } catch (e) {
      toast.error(mensajeDeError(e, 'Código incorrecto'))
    } finally {
      ui.setIsLoading(false)
    }
  }

  const handleVolverAEditarDatos = () => {
    escaneo.setVerificacion(null)
    escaneo.setCodigoVerificacion('')
  }

  // --- ATENCIONES EN ESPERA ---
  //
  // El operario puede "minimizar" a quien está atendiendo (estudiante escaneado,
  // artículos ya agregados o un registro a medio llenar) para atender a otra
  // persona mientras la primera espera: el código del correo, ir a buscar la
  // credencial, etc. Nada se pierde: queda en la bandeja hasta retomarla.

  const hayDatosDeRegistro = ne => !!(ne.rut || ne.nombre || ne.email)

  /** Lo que hay en pantalla ahora mismo, o null si no se está atendiendo a nadie. */
  const atencionActual = () => {
    const registro =
      escaneo.showConsentModal &&
      (escaneo.verificacion || hayDatosDeRegistro(escaneo.nuevoEstudiante))
        ? { nuevoEstudiante: escaneo.nuevoEstudiante, verificacion: escaneo.verificacion }
        : null
    if (!escaneo.estudianteEscaneado && escaneo.articulosEscaneados.length === 0 && !registro) {
      return null
    }
    return {
      id: `atencion-${Date.now()}`,
      desde: Date.now(),
      estudiante: escaneo.estudianteEscaneado,
      articulos: escaneo.articulosEscaneados,
      registro,
    }
  }

  const limpiarAtencion = () => {
    escaneo.setEstudianteEscaneado(null)
    escaneo.setArticuloEscaneado(null)
    escaneo.setArticulosEscaneados([])
    escaneo.setSmartInput('')
    resetConsentForm()
  }

  const nombreAtencion = a =>
    a.estudiante?.nombre ||
    a.registro?.nuevoEstudiante.nombre ||
    a.registro?.nuevoEstudiante.rut ||
    'Registro sin nombre'

  const handleMinimizarAtencion = motivo => {
    const actual = atencionActual()
    if (!actual) return
    escaneo.setAtencionesEnEspera(prev => [...prev, { ...actual, motivo }])
    limpiarAtencion()
    toast.success(`${nombreAtencion(actual)} quedó en espera. Puedes atender a otra persona.`)
  }

  /** Atajo desde el paso del código de verificación. */
  const handleAtenderOtroMientras = () => handleMinimizarAtencion('Esperando código del correo')

  /**
   * Vuelve a poner en pantalla una atención en espera. Si había otra en curso,
   * esa pasa a la bandeja en su lugar (nunca se pierde una por retomar otra).
   */
  const handleRetomarAtencion = async id => {
    const atencion = escaneo.atencionesEnEspera.find(a => a.id === id)
    if (!atencion) return
    const actual = atencionActual()
    escaneo.setAtencionesEnEspera(prev => [
      ...prev.filter(a => a.id !== id),
      ...(actual ? [{ ...actual, motivo: 'En pausa (se retomó a otra persona)' }] : []),
    ])
    limpiarAtencion()

    escaneo.setEstudianteEscaneado(atencion.estudiante)
    escaneo.setArticulosEscaneados(atencion.articulos)
    escaneo.setArticuloEscaneado(atencion.articulos.at(-1) ?? null)
    if (atencion.registro) {
      try {
        const terminos = await prestamosApi.obtenerTerminos()
        escaneo.setTerminosTexto(terminos.texto)
      } catch {
        // Sin términos visibles igual se puede confirmar el código
      }
      escaneo.setNuevoEstudiante(atencion.registro.nuevoEstudiante)
      escaneo.setVerificacion(atencion.registro.verificacion)
      escaneo.setCodigoVerificacion('')
      escaneo.setShowConsentModal(true)
    }

    // El stock pudo cambiar mientras la persona esperaba
    const sinStock = atencion.articulos.filter(item => {
      const art = inventario.prestamosArticulos.find(a => a.id === item.articulo_id)
      return art && art.stock_disponible < item.cantidad
    })
    if (sinStock.length) {
      toast.warning(
        `Mientras esperaba se prestó lo último de: ${sinStock.map(i => i.nombre).join(', ')}. Revisa el carrito.`
      )
    }
    if (actual) toast.success(`${nombreAtencion(actual)} pasó a la bandeja de espera.`)
  }

  const handleDescartarAtencion = async id => {
    const atencion = escaneo.atencionesEnEspera.find(a => a.id === id)
    if (!atencion) return
    const unidades = atencion.articulos.reduce((n, a) => n + a.cantidad, 0)
    const acepta = await confirmar({
      titulo: 'Descartar atención en espera',
      mensaje: `Se quitará a ${nombreAtencion(atencion)} de la espera${unidades ? ` junto con ${unidades} artículo${unidades !== 1 ? 's' : ''} del carrito` : ''}. No se registra ningún préstamo.`,
      confirmar: 'Descartar',
      tono: 'advertencia',
    })
    if (!acepta) return
    escaneo.setAtencionesEnEspera(prev => prev.filter(a => a.id !== id))
  }

  // --- ACCIONES DE HISTORIAL ---

  const [devolucionModal, setDevolucionModal] = useState(null) // { prestamo, multa } | null
  // Resumen previo de una devolución sin multa: estudiante, objeto, código y fecha
  const [resumenDevolucion, setResumenDevolucion] = useState(null) // prestamo | null
  const [movimientosTurno, setMovimientosTurno] = useState([])

  const handleDevolver = async prestamo => {
    try {
      const preview = await prestamosApi.previewMulta(prestamo.id)
      if (preview.multa > 0 || prestamo.cobro_arriendo_pendiente) {
        setDevolucionModal({ prestamo, multa: preview.multa })
      } else if (novedadActiva('resumen-devolucion')) {
        setResumenDevolucion(prestamo)
      } else {
        // Versión original: confirmación genérica, sin ficha del préstamo
        const acepta = await confirmar({
          titulo: 'Registrar devolución',
          mensaje: `${prestamo.articulo_nombre} de ${prestamo.estudiante_nombre}. No tiene multa ni cobros pendientes.`,
          confirmar: 'Devolver',
        })
        if (!acepta) return
        const result = await prestamosApi.devolverPrestamo(prestamo.id, {
          monto_cobrado: 0,
          tipo_pago: 'SIN_MULTA',
        })
        toast.success(result.mensaje)
        await loadPrestamosData()
      }
    } catch (e) {
      toast.error('Error al devolver: ' + mensajeDeError(e))
    }
  }

  const handleConfirmarDevolucionSimple = async () => {
    if (!resumenDevolucion) return
    try {
      const result = await prestamosApi.devolverPrestamo(resumenDevolucion.id, {
        monto_cobrado: 0,
        tipo_pago: 'SIN_MULTA',
      })
      toast.success(
        `${result.mensaje}. Si fue un error, puedes revertirla en Movimientos del turno.`
      )
      setResumenDevolucion(null)
      await loadPrestamosData()
    } catch (e) {
      toast.error('Error al devolver: ' + mensajeDeError(e))
    }
  }

  /** Revierte una devolución desde "Movimientos del turno": el préstamo vuelve a quedar
   * activo a nombre del mismo estudiante y queda registrado quién lo revirtió. */
  const handleRevertirMovimiento = movimiento =>
    handleRevertirDevolucion({ ...movimiento, id: movimiento.prestamo_id })

  // --- DEVOLVER TODO EL LOTE DE UNA PERSONA ---

  const [devolverLoteModal, setDevolverLoteModal] = useState(null) // { estudianteNombre, prestamos } | null

  const handleAbrirDevolverTodo = prestamos => {
    setDevolverLoteModal({ estudianteNombre: prestamos[0].estudiante_nombre, prestamos })
  }

  const handleConfirmarDevolverLote = async payload => {
    try {
      const { devueltos, errores } = await prestamosApi.devolverLote(payload)
      if (errores.length) {
        toast.error(
          `Se devolvieron ${devueltos.length}, pero fallaron ${errores.length}: ` +
            errores.map(e => e.detalle).join('; ')
        )
      } else {
        toast.success(`${devueltos.length} préstamos devueltos`)
      }
      setDevolverLoteModal(null)
      await loadPrestamosData()
    } catch (e) {
      toast.error('Error al devolver: ' + mensajeDeError(e))
    }
  }

  // Reabre un préstamo devuelto por error o cuya multa el estudiante reclama. Si ya se
  // cobró dinero, el servidor pide confirmar el reintegro para que Contabilidad cuadre.
  const handleRevertirDevolucion = async prestamo => {
    const abrir = await confirmar({
      titulo: 'Revertir devolución',
      mensaje: `${prestamo.articulo_nombre} de ${prestamo.estudiante_nombre} volverá a figurar como préstamo activo del mismo estudiante. Quedará registrado que lo revertiste tú (${currentUser?.full_name ?? 'operador'}).`,
      confirmar: 'Revertir devolución',
    })
    if (!abrir) return
    try {
      let resultado
      try {
        resultado = await prestamosApi.revertirDevolucion(prestamo.id)
      } catch (e) {
        if (e.response?.status !== 409) throw e
        const sigue = await confirmar({
          titulo: 'Hay multa cobrada',
          mensaje: e.response.data.detail,
          confirmar: 'Reabrir de todos modos',
          tono: 'advertencia',
        })
        if (!sigue) return
        resultado = await prestamosApi.revertirDevolucion(prestamo.id, true)
      }
      toast.success(
        resultado.monto_a_reintegrar > 0
          ? `Devolución revertida. Reintegra $${resultado.monto_a_reintegrar.toLocaleString('es-CL')} al estudiante para que la contabilidad cuadre.`
          : `Devolución revertida: ${prestamo.articulo_nombre} vuelve a estar prestado a ${prestamo.estudiante_nombre}.`
      )
      await loadPrestamosData()
    } catch (e) {
      toast.error('Error al reabrir: ' + mensajeDeError(e))
    }
  }

  const handleConfirmarDevolucion = async ({
    monto_cobrado,
    tipo_pago,
    comentario,
    cobro_arriendo,
  }) => {
    if (!devolucionModal) return
    try {
      const result = await prestamosApi.devolverPrestamo(devolucionModal.prestamo.id, {
        monto_cobrado,
        tipo_pago,
        comentario: comentario || null,
        cobro_arriendo: cobro_arriendo || null,
      })
      toast.success(result.mensaje)
      setDevolucionModal(null)
      await loadPrestamosData()
    } catch (e) {
      toast.error('Error al devolver: ' + mensajeDeError(e))
    }
  }

  // --- TRANSFERENCIA DE PRESTAMO (canje de TUC) ---

  const [transferirModal, setTransferirModal] = useState(null) // { prestamo, otrosActivosDelEstudiante } | null

  const handleAbrirTransferir = prestamo => {
    const otrosActivosDelEstudiante = historial.prestamosActivos.filter(
      p => p.estudiante_id === prestamo.estudiante_id && p.id !== prestamo.id
    )
    setTransferirModal({ prestamo, otrosActivosDelEstudiante })
  }

  const handleConfirmarTransferir = async ({ prestamoIds, nuevoRut }) => {
    if (!transferirModal) return false
    ui.setIsLoading(true)
    try {
      await prestamosApi.transferirPrestamos({
        prestamo_ids: prestamoIds,
        nuevo_estudiante_rut: nuevoRut,
      })
      toast.success('Préstamo(s) transferido(s) correctamente')
      setTransferirModal(null)
      await loadPrestamosData()
      return true
    } catch (e) {
      toast.error('Error al transferir: ' + mensajeDeError(e))
      return false
    } finally {
      ui.setIsLoading(false)
    }
  }

  // --- ACCIONES DE INVENTARIO ---

  const handleCrearArticulo = async () => {
    ui.setIsLoading(true)
    try {
      await prestamosApi.crearArticulo(inventario.nuevoArticulo)
      toast.success('Artículo creado exitosamente')
      inventario.setShowNuevoArticulo(false)
      inventario.setNuevoArticulo({ nombre: '', categoria: '', descripcion: '', stock_total: 1 })
      await loadPrestamosData()
    } catch (e) {
      toast.error('Error al crear artículo: ' + mensajeDeError(e))
    } finally {
      ui.setIsLoading(false)
    }
  }

  const handleEliminarArticulo = articulo => {
    setArticuloDeleteBlocked(false)
    setDeleteArticuloPending(articulo)
  }

  const confirmEliminarArticulo = async (forzoso = false) => {
    if (!deleteArticuloPending) return
    const articulo = deleteArticuloPending
    ui.setIsLoading(true)
    try {
      await prestamosApi.eliminarArticulo(articulo.id, { forzoso })
      toast.success('Artículo eliminado exitosamente')
      setDeleteArticuloPending(null)
      setArticuloDeleteBlocked(false)
      await loadPrestamosData()
    } catch (e) {
      if (e.response?.status === 409) {
        // Tiene historial de préstamos: ofrecer el borrado forzoso en vez de cerrar el modal.
        setArticuloDeleteBlocked(true)
      } else {
        toast.error('Error al eliminar artículo: ' + mensajeDeError(e))
      }
    } finally {
      ui.setIsLoading(false)
    }
  }

  const cancelEliminarArticulo = () => {
    setDeleteArticuloPending(null)
    setArticuloDeleteBlocked(false)
  }

  const handleRenombrarArticulo = async (articuloId, nombreActual, nombreNuevo) => {
    if (!nombreNuevo.trim() || nombreNuevo.trim() === nombreActual) return
    ui.setIsLoading(true)
    try {
      const result = await prestamosApi.actualizarArticulo(articuloId, {
        nombre: nombreNuevo.trim(),
      })
      await loadPrestamosData()
      return result
    } catch (e) {
      toast.error('Error al renombrar artículo: ' + mensajeDeError(e))
    } finally {
      ui.setIsLoading(false)
    }
  }

  const handleGuardarAlias = async (articulo, alias) => {
    try {
      await prestamosApi.actualizarArticulo(articulo.id, { alias })
      toast.success(`Otros nombres de ${articulo.nombre} guardados`)
      await loadPrestamosData()
      return true
    } catch (e) {
      toast.error('Error al guardar: ' + mensajeDeError(e))
      return false
    }
  }

  /**
   * Fija el stock_total de un articulo a un valor absoluto (no un delta):
   * control total del stock, para sumar, restar, corregir un conteo o
   * marcar unidades perdidas/dadas de baja. El servidor rechaza bajar el
   * stock por debajo de lo que ya esta prestado ahora mismo.
   */
  const handleAjustarStockArticulo = async (articulo, nuevoStockTotal) => {
    if (nuevoStockTotal === articulo.stock_total) {
      inventario.setAjustarStockArticulo(null)
      return true
    }
    ui.setIsLoading(true)
    try {
      await prestamosApi.actualizarArticulo(articulo.id, { stock_total: nuevoStockTotal })
      toast.success('Stock actualizado')
      inventario.setAjustarStockArticulo(null)
      await loadPrestamosData()
      return true
    } catch (e) {
      toast.error('Error al ajustar stock: ' + mensajeDeError(e))
      return false
    } finally {
      ui.setIsLoading(false)
    }
  }

  /** Atajo para +1/-1 rapido desde la tarjeta del artículo, sin abrir el modal. */
  const handleIncrementarStockArticulo = (articulo, delta) => {
    const nuevoStockTotal = articulo.stock_total + delta
    if (nuevoStockTotal < 0) return
    handleAjustarStockArticulo(articulo, nuevoStockTotal)
  }

  const handleCrearInsumo = async () => {
    ui.setIsLoading(true)
    try {
      await prestamosApi.crearInsumo(inventario.nuevoInsumo)
      toast.success('Insumo creado exitosamente')
      inventario.setShowNuevoInsumo(false)
      inventario.setNuevoInsumo({ nombre: '', categoria: '', stock_inicial: 0, stock_critico: 5 })
      await loadPrestamosData()
    } catch (e) {
      toast.error('Error al crear insumo: ' + mensajeDeError(e))
    } finally {
      ui.setIsLoading(false)
    }
  }

  const handleReponerInsumo = async (id, cantidad) => {
    ui.setIsLoading(true)
    try {
      await prestamosApi.reponerInsumo(id, cantidad)
      toast.success('Stock repuesto exitosamente')
      inventario.setShowReponerInsumo(null)
      inventario.setReponerCantidad(1)
      await loadPrestamosData()
    } catch (e) {
      toast.error('Error al reponer insumo: ' + mensajeDeError(e))
    } finally {
      ui.setIsLoading(false)
    }
  }

  const handleEntregarInsumo = async (insumo_id, cantidad) => {
    ui.setIsLoading(true)
    try {
      await prestamosApi.entregarInsumo({
        estudiante_rut: escaneo.estudianteEscaneado ? escaneo.estudianteEscaneado.rut : null,
        insumo_id,
        cantidad,
      })
      return true
    } catch (e) {
      toast.error('Error al entregar insumo: ' + mensajeDeError(e))
      return false
    } finally {
      ui.setIsLoading(false)
      await loadPrestamosData()
    }
  }

  const handleUpdateInsumoStock = async (insumo_id, current_stock, new_stock) => {
    const delta = new_stock - current_stock
    if (delta === 0) return true
    ui.setIsLoading(true)
    try {
      if (delta > 0) {
        await prestamosApi.reponerInsumo(insumo_id, delta)
      } else {
        await prestamosApi.entregarInsumo({ insumo_id, cantidad: Math.abs(delta) })
      }
      return true
    } catch (e) {
      toast.error('Error al actualizar stock: ' + mensajeDeError(e))
      return false
    } finally {
      ui.setIsLoading(false)
      await loadPrestamosData()
    }
  }

  return {
    // Estado local
    deleteArticuloPending,
    articuloDeleteBlocked,
    // Carga
    loadPrestamosData,
    // Escaneo
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
    // Historial
    handleDevolver,
    resumenDevolucion,
    setResumenDevolucion,
    handleConfirmarDevolucionSimple,
    movimientosTurno,
    handleRevertirMovimiento,
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
    // Inventario
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
    handleEntregarInsumo,
    handleUpdateInsumoStock,
  }
}
