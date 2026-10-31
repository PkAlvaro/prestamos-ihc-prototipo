import { useNovedad } from './NovedadesContext'

/** Muestra `children` solo con la mejora activa; si no, `original` (lo que había antes). */
export default function SoloConMejora({ novedad, children, original = null }) {
  const { activa } = useNovedad(novedad)
  return activa ? children : original
}
