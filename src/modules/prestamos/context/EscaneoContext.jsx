import React, { createContext, useContext, useRef, useState } from 'react'

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
  // Verificaciones que el operario dejó "en espera" para atender a otra persona
  // mientras llega el código al correo del primero. Cada una guarda su propio
  // `nuevoEstudiante` para poder retomarla tal cual quedó.
  const [pendientesVerificacion, setPendientesVerificacion] = useState([])

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
        pendientesVerificacion,
        setPendientesVerificacion,
      }}
    >
      {children}
    </EscaneoContext.Provider>
  )
}

export const useEscaneo = () => useContext(EscaneoContext)
