import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

const ATENCIONES_KEY = 'prestamos-demo-atenciones-en-espera'

function leerAtenciones() {
  try {
    return JSON.parse(localStorage.getItem(ATENCIONES_KEY)) || []
  } catch {
    return []
  }
}

export const EscaneoContext = createContext()

export const EscaneoProvider = ({ children }) => {
  const [estudianteEscaneado, setEstudianteEscaneado] = useState(null)
  const [articuloEscaneado, setArticuloEscaneado] = useState(null)
  const [articulosEscaneados, setArticulosEscaneados] = useState([])
  const [smartInput, setSmartInput] = useState('')
  const smartInputRef = useRef(null)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [terminosTexto, setTerminosTexto] = useState('')
  const [nuevoEstudiante, setNuevoEstudiante] = useState({
    rut: '',
    nombre: '',
    email: '',
    carrera: '',
    es_intercambio: false,
  })
  const [rutNormalizado, setRutNormalizado] = useState('')
  const [rutError, setRutError] = useState('')
  const [searchRutNormalizado, setSearchRutNormalizado] = useState('')
  const [searchRutError, setSearchRutError] = useState('')
  const [rutReadOnly, setRutReadOnly] = useState(false)
  // Verificación de correo pendiente (paso 2 del registro de consentimiento)
  const [verificacion, setVerificacion] = useState(null) // { verificacionId, emailEnmascarado, expiraEn } | null
  const [codigoVerificacion, setCodigoVerificacion] = useState('')
  // Atenciones que el operario minimizó para atender a otra persona (esperando el
  // código del correo, la credencial, etc.). Cada una guarda estudiante, carrito y
  // registro a medio llenar para retomarla tal cual quedó. Se guardan en el
  // navegador: un recargo de página no hace perder a nadie de la fila.
  const [atencionesEnEspera, setAtencionesEnEspera] = useState(leerAtenciones)
  useEffect(() => {
    try {
      localStorage.setItem(ATENCIONES_KEY, JSON.stringify(atencionesEnEspera))
    } catch {
      // Sin persistencia: la bandeja sigue funcionando en memoria
    }
  }, [atencionesEnEspera])

  return (
    <EscaneoContext.Provider
      value={{
        estudianteEscaneado,
        setEstudianteEscaneado,
        articuloEscaneado,
        setArticuloEscaneado,
        articulosEscaneados,
        setArticulosEscaneados,
        smartInput,
        setSmartInput,
        smartInputRef,
        showConsentModal,
        setShowConsentModal,
        terminosTexto,
        setTerminosTexto,
        nuevoEstudiante,
        setNuevoEstudiante,
        rutNormalizado,
        setRutNormalizado,
        rutError,
        setRutError,
        searchRutNormalizado,
        setSearchRutNormalizado,
        searchRutError,
        setSearchRutError,
        rutReadOnly,
        setRutReadOnly,
        verificacion,
        setVerificacion,
        codigoVerificacion,
        setCodigoVerificacion,
        atencionesEnEspera,
        setAtencionesEnEspera,
      }}
    >
      {children}
    </EscaneoContext.Provider>
  )
}

export const useEscaneo = () => useContext(EscaneoContext)
