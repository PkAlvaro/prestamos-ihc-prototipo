/**
 * Utilidades y contrato de rutas del frontend.
 */

export const ROUTE_PATHS = {
  home: '/',
  prestamos: '/prestamos',
  autorregistro: '/prestamos/autorregistro',
}

export const PRESTAMOS_TABS = [
  'escaneo',
  'activos',
  'vencidos',
  'articulos',
  'historial',
  'estudiantes',
  'analisis',
  'mailing',
  'contabilidad',
]
export const DEFAULT_PRESTAMOS_TAB = 'escaneo'

export const PRESTAMOS_SCANNER_MODES = ['prestamo', 'insumo']
export const DEFAULT_PRESTAMOS_SCANNER_MODE = 'prestamo'

export const PRESTAMOS_INVENTORY_VIEWS = ['articulos', 'insumos']
export const DEFAULT_PRESTAMOS_INVENTORY_VIEW = 'articulos'

export function normalizeOption(value, allowedValues, fallback) {
  if (!value || typeof value !== 'string') {
    return fallback
  }

  return allowedValues.includes(value) ? value : fallback
}

export function normalizePrestamosTab(tab) {
  return normalizeOption(tab, PRESTAMOS_TABS, DEFAULT_PRESTAMOS_TAB)
}

export function normalizePrestamosScannerMode(mode) {
  return normalizeOption(mode, PRESTAMOS_SCANNER_MODES, DEFAULT_PRESTAMOS_SCANNER_MODE)
}

export function normalizePrestamosInventoryView(view) {
  return normalizeOption(view, PRESTAMOS_INVENTORY_VIEWS, DEFAULT_PRESTAMOS_INVENTORY_VIEW)
}

export function buildPrestamosPath(tab = DEFAULT_PRESTAMOS_TAB, options = {}) {
  const normalizedTab = normalizePrestamosTab(tab)
  const params = new URLSearchParams()

  if (normalizedTab === 'escaneo') {
    params.set('mode', normalizePrestamosScannerMode(options.mode))
  }

  if (normalizedTab === 'articulos') {
    params.set('view', normalizePrestamosInventoryView(options.view))
  }

  const search = params.toString()
  return `${ROUTE_PATHS.prestamos}/${normalizedTab}${search ? `?${search}` : ''}`
}

export function parsePrestamosRoute(tabParam, search = '') {
  const tab = normalizePrestamosTab(tabParam)
  const params = new URLSearchParams(search)

  const mode =
    tab === 'escaneo'
      ? normalizePrestamosScannerMode(params.get('mode'))
      : DEFAULT_PRESTAMOS_SCANNER_MODE

  const view =
    tab === 'articulos'
      ? normalizePrestamosInventoryView(params.get('view'))
      : DEFAULT_PRESTAMOS_INVENTORY_VIEW

  const canonicalPath = buildPrestamosPath(tab, { mode, view })
  return { tab, mode, view, canonicalPath }
}
