import { useMemo, useState } from 'react'
import { isValidRut, normalizeRut } from '../../../utils/rutUtils'

const initialFields = { nombre: '', rut: '', correo: '', carrera: '' }

export function useEstudianteForm(initialValue = {}) {
  const [fields, setFields] = useState({ ...initialFields, ...initialValue })
  const normalizedRut = useMemo(() => normalizeRut(fields.rut), [fields.rut])
  const errors = useMemo(
    () => ({
      nombre: fields.nombre.trim() ? '' : 'Nombre requerido',
      rut: isValidRut(normalizedRut) ? '' : 'RUT inválido',
      correo: /.+@.+\..+/.test(fields.correo) ? '' : 'Correo inválido',
      carrera: fields.carrera.trim() ? '' : 'Carrera requerida',
    }),
    [fields, normalizedRut]
  )
  const isValid = Object.values(errors).every(error => !error)
  const setField = (field, value) => setFields(prev => ({ ...prev, [field]: value }))
  const reset = () => setFields({ ...initialFields, ...initialValue })

  return { fields, setFields, setField, reset, errors, isValid, normalizedRut }
}
