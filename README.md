# Préstamos · Prototipo IHC

Prototipo de interfaz del **módulo de Préstamos** del Centro de Alumnos de Ingeniería UC, preparado
para el curso de Interacción Humano-Computador. Es una copia de la interfaz real que funciona
**completamente en el navegador, sin servidor y con datos ficticios**, para usarla como base de
las propuestas de mejora.

## Qué incluye

- **Panel de staff** (`#/prestamos/...`): lo que usa el equipo del mesón.
  - *Nuevo préstamo*: escanear TUC/RUT, armar el préstamo (artículos y combos), registrar
    estudiantes nuevos con consentimiento, entregar insumos.
  - *Activos* y *Vencidos*: devolver (de a uno o en lote), multas, transferir préstamos.
  - *Stock*: artículos, combos e insumos.
  - *Historial*, *Estudiantes*, *Análisis* (gráficos por carrera), *Mailing* y *Contabilidad*.
- **Autorregistro del estudiante** (`#/prestamos/autorregistro`): el formulario que el
  estudiante abre desde su celular escaneando el QR del mesón.

## Mejoras propuestas (curso IHC)

### 1. Atenciones en espera
Si quien está en el mesón tiene que esperar (el código de verificación de su correo, fue a buscar
la credencial…), el operador pulsa **Poner en espera**, elige el motivo con un toque y atiende a la
siguiente persona. La atención (estudiante, carrito y registro a medio llenar) queda en la bandeja
**En espera** con el motivo, hace cuánto espera y, si aplica, cuándo vence el código. **Retomar** la
vuelve a poner en pantalla; si había otra atención en curso, esa pasa a la bandeja en su lugar. El
contador en *Nuevo préstamo* recuerda que hay gente esperando aunque se esté en otra pestaña, y la
bandeja sobrevive a un recargo de página.

Código: `components/AtencionesEnEspera.jsx`, handlers en `hooks/usePrestamosActions.js`
(sección *Atenciones en espera*), estado en `context/EscaneoContext.jsx`.

### 2. Búsqueda por sinónimos
El operador no necesita saber cómo se llama cada cosa en el inventario: buscar **bata** sugiere los
**delantales**, **calcu** o **casio** las calculadoras, **zapatilla** el alargador. Cada sugerencia
explica por qué aparece («bata» = delantal). Hay dos fuentes:

- un diccionario general del mesón (`utils/sinonimos.js`), y
- los **otros nombres** propios de cada artículo, que el staff edita desde *Stock* (ej. la
  calculadora gráfica también es «la TI»).

También se puede buscar por el código del artículo (`CALC-01`).

### 3. Resumen antes de devolver y movimientos del turno
Antes de registrar una devolución se muestra el estudiante (con RUT), el objeto con su **código** y
la fecha del préstamo, con el botón **Confirmar devolución**. Cada devolución queda en
**Movimientos del turno** (junto a *Activos* y *Vencidos*) con un botón **Revertir**, que vuelve a
dejar activo el préstamo a nombre del mismo estudiante y registra quién lo revirtió y a qué hora.

Código: `components/ResumenDevolucion.jsx`, `ConfirmarDevolucionModal.jsx`, `MovimientosTurno.jsx`.

### 4. Reportar diferencia de disponibilidad
Al elegir un material por nombre (en la barra del mesón o en su ficha de Stock) aparece **Reportar
diferencia de disponibilidad**: el encargado indica cuántas unidades libres ve en el estante y, si
quiere, un comentario. La ficha queda con el aviso **Disponibilidad por revisar**. El reporte no
cambia las existencias: desde Stock, **Revisar** permite cerrarlo o corregir con *Ajustar stock*.

Código: `components/DisponibilidadPorRevisar.jsx`, API `reportarDiferenciaDisponibilidad` y
`revisarReporteDisponibilidad`.

### 5. Formularios de inventario que explican qué falta
Nuevo artículo, Ajustar stock, Nuevo insumo, Reponer y el nuevo **Agregar existencias** (elegir un
material registrado e indicar cuánto se agrega) exigen un nombre reconocible y una cantidad válida:
enteros ≥ 0 para el stock y > 0 para lo que se agrega. Al enviar, cada campo con problemas muestra
su mensaje al lado y lo demás se conserva. Un nombre ya registrado ofrece agregarle existencias.

Código: `components/FormularioValidado.jsx` (genérico), `FormulariosInventario.jsx`,
`utils/validacionInventario.js`.

### 6. Buscar personas y materiales en la misma barra
La barra del mesón busca personas por nombre o RUT (con o sin puntos) además de materiales. Los
resultados se agrupan en **Personas** (nombre y RUT) y **Materiales** (nombre y disponibilidad); si
lo escrito coincide con ambos, se ven las dos secciones. ↑/↓ y Enter para elegir.

Código: `components/SugerenciasBusqueda.jsx`, `personasSugeridas` en `hooks/usePrestamosPageState.js`.

## Para quien revisa

La página de inicio lista las mejoras. **Probar** abre cada una con la pantalla ya preparada y una
guía *Prueba esto* (con enlace a la siguiente). En el encabezado del panel:

- **Original / Mejoras** alterna entre la interfaz como es hoy y la con mejoras, para comparar.
- ✦ muestra u oculta las marcas **Nuevo N** sobre cada elemento agregado (N = número de la mejora).

## Agregar una mejora

La vitrina (`src/novedades/`) es genérica; cada mejora se declara una sola vez:

1. Agrega una entrada a `src/modules/prestamos/novedades.js` con `id`, `numero`, `titulo`,
   `problema`, `solucion`, `icono`, `ruta`, `pasos` y, opcionalmente, `preparar(ctx)` para dejar
   la pantalla lista (recibe el estado del panel; devuelve `false` si aún faltan datos). Con eso ya
   aparece su tarjeta en el inicio y su guía.
2. En la UI, envuelve lo nuevo para que el modo Original lo oculte:
   - `<SoloConMejora novedad="id" original={…lo de antes}>…</SoloConMejora>`, o
   - `const { activa } = useNovedad('id')` dentro de un componente o hook, o
   - `novedadActiva('id')` fuera de React (handlers, API simulada).
3. Marca el elemento con `<MarcaNuevo novedad="id" />` (agrega `flotante` para pegarlo a la
   esquina de un contenedor `relative`).

## Qué está simulado

| En el sistema real | En el prototipo |
|---|---|
| API y base de datos | `src/mock/` — datos en memoria guardados en `localStorage` |
| Inicio de sesión | Usuario fijo; el rol (Admin / Miembro) se cambia arriba a la derecha |
| Código de verificación por correo | Siempre `123456` |
| Verificación anti-bot | Se aprueba sola |
| Envío de correos (Mailing) | No se envía nada; solo se registra en el historial |
| Búsqueda semántica de artículos | Búsqueda difusa (fuse.js) |

La regla de multas es la misma del sistema real: 48 horas hábiles de gracia, luego $500 por cada
24 horas hábiles de atraso, con tope de $6.000.

El botón ↻ del encabezado vuelve a los datos iniciales.

> Todos los nombres, RUT y correos son inventados.

## Correr en local

Requiere Node 20.19+.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # tests de componentes y de la API simulada
npm run build    # genera dist/ (sitio estático)
```

## Estructura

```
src/
  App.jsx                       inicio del prototipo y rutas
  mock/                         "backend" simulado (semilla + reglas de negocio)
  modules/prestamos/            módulo copiado tal cual del sistema real
    services/prestamosApi.js    misma interfaz que la API real, resuelta contra src/mock
    components/ hooks/ pages/   UI (aquí van las mejoras)
  modules/shared/               encabezado, layout y componentes públicos
  modules/auth/                 sesión simulada
  index.css                     tokens del design system (Tailwind 4, @theme)
```

Las mejoras de interfaz deberían tocar `components/`, `pages/` y `hooks/`. Si una mejora necesita
datos nuevos, se agregan en `src/mock/seed.js` y en `prestamosApi.js`.

## Publicación

Cada push a `main` publica el sitio en GitHub Pages (`.github/workflows/pages.yml`). La primera vez
hay que activar *Settings → Pages → Source: GitHub Actions*.
