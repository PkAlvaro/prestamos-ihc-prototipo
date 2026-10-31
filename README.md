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
