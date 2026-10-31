// Lista de carreras del selector. Elegir de este dropdown en vez de tipear
// "Otro" evita que se acumulen variantes de la misma carrera (typos, tildes).
export const CARRERAS = [
  'Administración Pública',
  'Agronomía',
  'Agronomía y Forestal',
  'Antropología',
  'Antropología y Arqueología',
  'Arqueología',
  'Arquitectura',
  'Arte y Humanidades',
  'Astronomía',
  'Bachillerato',
  'Bachillerato en Ciencias Naturales y Matemáticas',
  'Bachillerato Inicia',
  'Biología',
  'Biología Marina',
  'Bioquímica',
  'Ciencia Política',
  'Ciencias Biológicas',
  'College',
  'College Artes y Humanidades',
  'College Ciencias Naturales',
  'College Ciencias Sociales',
  'Construcción Civil',
  'Derecho',
  'Doctorado Sociología',
  'Educación',
  'Educación Física',
  'Enfermería',
  'Estadística',
  'Farmacia',
  'Filosofía',
  'Física',
  'Fonoaudiología',
  'Geografía',
  'Ingeniería Civil',
  'Ingeniería Comercial',
  'Ingeniería en Ciencia de la Computación',
  'Ingeniería en Recursos Naturales',
  'Ingeniería Forestal',
  'Intercambio',
  'Intercambio/Ing',
  'Kinesiología',
  'Letras Hispánicas',
  'Licenciatura en Ciencias de Datos',
  'Licenciatura en Ciencias de la Computación',
  'Licenciatura en Ciencias Naturales',
  'Licenciatura en Ciencias Naturales y Matemáticas',
  'Licenciatura en Ciencias Sociales',
  'Licenciatura en Matemáticas',
  'Magíster',
  'Matemáticas',
  'Medicina',
  'Nutrición',
  'Nutrición y Dietética',
  'Odontología',
  'Pedagogía',
  'Pedagogía en Educación Media Ciencias Naturales',
  'Pedagogía en Matemáticas',
  'Pedagogía General Básica',
  'Psicología',
  'Química',
  'Química y Farmacia',
  'Recursos Naturales',
  'Sin Especificar',
  'Sociología',
  'Terapia Ocupacional',
  'Trabajo Social',
  'Veterinaria',
]

// Regla de multa (misma que aplica el servidor): se muestra al operador
// para que pueda explicársela al estudiante.
export const MULTA_MAXIMA = 6000

export const REGLA_MULTA =
  'Pasadas 48 horas hábiles (lunes a viernes) se cobran $500 por cada 24 horas hábiles de atraso. El máximo es $6.000 por préstamo y, si se devuelven varios juntos, $6.000 en total por persona.'

// Main tabs
export const PRESTAMOS_TABS = {
  ESCANEO: 'escaneo',
  ACTIVOS: 'activos',
  VENCIDOS: 'vencidos',
  ARTICULOS: 'articulos',
  INSUMOS: 'insumos',
  ESTUDIANTES: 'estudiantes',
  HISTORIAL: 'historial',
  ANALISIS: 'analisis',
  QR: 'qr',
  MAILING: 'mailing',
}

// Scanner modes
export const SCANNER_MODES = {
  PRESTAMO: 'prestamo',
  INSUMO: 'insumo',
}

// Inventory tabs
export const INVENTORY_TABS = {
  ARTICULOS: 'articulos',
  INSUMOS: 'insumos',
}
