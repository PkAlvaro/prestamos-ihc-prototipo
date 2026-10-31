/**
 * Vitrina de novedades del prototipo: catálogo de mejoras, interruptor
 * Original/Mejoras, marcas "Nuevo" y guías "Prueba esto".
 * Cómo agregar una mejora: ver README, sección "Agregar una mejora".
 */
export {
  NovedadesProvider,
  useNovedades,
  useNovedad,
  etiquetaNovedad,
  visiblesEnVitrina,
} from './NovedadesContext'
export { novedadActiva, simularRed } from './estado'
export { default as MarcaNuevo } from './MarcaNuevo'
export { default as SoloConMejora } from './SoloConMejora'
export { default as ControlesNovedades } from './ControlesNovedades'
export { default as SeccionNovedades } from './SeccionNovedades'
export { default as GuiaNovedad } from './GuiaNovedad'
