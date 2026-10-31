import { describe, it, expect, beforeAll } from 'vitest'
import { prestamosApi } from '../../modules/prestamos/services/prestamosApi'
import { autorregistroApi } from '../../modules/prestamos/services/autorregistroApi'
import { db } from '../db'

// La API simulada responde con latencia artificial; en tests no hace falta esperar.
beforeAll(() => {
  globalThis.setTimeout = (fn => fn()).bind(null)
})

const conConsentimiento = () =>
  db.estudiantes.find(e => e.consentimiento_aceptado && e.carrera === 'Ingeniería Civil')

describe('API simulada de préstamos', () => {
  it('lee todas las colecciones con la forma esperada', async () => {
    const est = await prestamosApi.listarEstudiantes({
      limit: 10,
      offset: 0,
      sort_by: 'nombre',
      sort_dir: 'asc',
    })
    expect(est.items).toHaveLength(10)
    expect(est.total).toBeGreaterThan(10)
    expect((await prestamosApi.listarArticulos()).length).toBeGreaterThan(10)
    expect((await prestamosApi.listarCombos())[0].items[0]).toHaveProperty('articulo_nombre')
    expect((await prestamosApi.listarInsumos()).length).toBeGreaterThan(0)
    expect((await prestamosApi.listarPrestamosActivos())[0]).toHaveProperty('estudiante_rut')
    expect((await prestamosApi.listarPrestamosVencidos()).length).toBeGreaterThan(0)
    expect((await prestamosApi.listarHistorialPrestamos(20, 0)).items).toHaveLength(20)
    const conta = await prestamosApi.listarContabilidad()
    expect(conta.total_recaudado_general).toBeGreaterThan(0)
    expect(conta.cobros_arriendo.length).toBeGreaterThan(0)
    expect(await prestamosApi.getAnalisisPorCarrera()).toHaveLength(3)
    expect(await prestamosApi.getArticulosTopPorCarrera()).toHaveLength(3)
    expect((await prestamosApi.getTiempoRetornoPorArticulo()).length).toBeGreaterThan(0)
    expect((await prestamosApi.getMorososPorGrupo({ minMulta: 0 })).length).toBeGreaterThan(0)
    expect((await prestamosApi.getHistorial({ limit: 5 })).emails).toHaveLength(5)
    expect((await prestamosApi.getResendEmails()).metrics.total).toBeGreaterThan(0)
    expect((await prestamosApi.listarCarrerasArriendo()).length).toBeGreaterThan(0)
    expect((await prestamosApi.obtenerTerminos()).usos).toHaveLength(2)
  })

  it('prestar baja el stock y devolver lo repone', async () => {
    const est = conConsentimiento()
    const art = db.articulos.find(
      a => a.stock_disponible > 0 && !['Calculadora', 'Delantal'].includes(a.categoria)
    )
    const antes = art.stock_disponible
    const { prestamos } = await prestamosApi.registrarPrestamoLote({
      estudiante_rut: est.rut,
      articulos: [{ articulo_id: art.id, cantidad: 1 }],
    })
    expect(db.articulos.find(a => a.id === art.id).stock_disponible).toBe(antes - 1)
    const res = await prestamosApi.devolverPrestamo(prestamos[0].id)
    expect(res.multa_final).toBe(0)
    expect(db.articulos.find(a => a.id === art.id).stock_disponible).toBe(antes)
  })

  it('cobra arriendo a carreras no exentas y lo exige al registrar', async () => {
    const est = db.estudiantes.find(
      e => e.consentimiento_aceptado && e.carrera === 'Ingeniería Comercial'
    )
    const calc = db.articulos.find(a => a.categoria === 'Calculadora' && a.stock_disponible > 0)
    const evaluacion = await prestamosApi.evaluarCobroArriendo({
      estudiante_rut: est.rut,
      articulos: [{ articulo_id: calc.id, cantidad: 1 }],
    })
    expect(evaluacion).toMatchObject({ aplica: true, monto: 500 })
    await expect(
      prestamosApi.registrarPrestamoLote({
        estudiante_rut: est.rut,
        articulos: [{ articulo_id: calc.id, cantidad: 1 }],
      })
    ).rejects.toMatchObject({ response: { status: 400 } })
  })

  it('devuelve un lote vencido con tope por persona', async () => {
    const vencidos = await prestamosApi.listarPrestamosVencidos()
    const sinArriendo = vencidos.filter(p => !p.cobro_arriendo_pendiente)
    const rut = sinArriendo[0].estudiante_rut
    const ids = sinArriendo.filter(p => p.estudiante_rut === rut).map(p => p.id)
    const preview = await prestamosApi.previewMultasLote(ids)
    expect(preview.total).toBeLessThanOrEqual(6000)
    const res = await prestamosApi.devolverLote({ prestamo_ids: ids, tipo_pago_multa: 'TOTAL' })
    expect(res.devueltos).toHaveLength(ids.length)
  })

  it('revertir una devolución con multa cobrada pide confirmar (409)', async () => {
    const pago = db.pagosMulta.find(p => p.tipo_pago === 'TOTAL' && p.monto_cobrado > 0)
    await expect(prestamosApi.revertirDevolucion(pago.prestamo_id)).rejects.toMatchObject({
      response: { status: 409 },
    })
  })

  it('eliminar artículo con historial responde 409', async () => {
    const conHistorial = db.articulos.find(
      a =>
        db.prestamos.some(p => p.articulo_id === a.id) &&
        !db.prestamos.some(p => p.articulo_id === a.id && p.estado !== 'DEVUELTO')
    )
    await expect(prestamosApi.eliminarArticulo(conHistorial.id)).rejects.toMatchObject({
      response: { status: 409 },
    })
  })

  it('autorregistro crea al estudiante con el código 123456', async () => {
    const { verificacion_id } = await autorregistroApi.solicitarVerificacion({
      rut: '12345678-5',
      nombre: 'Persona de Prueba',
      email: 'prueba@ejemplo.cl',
      carrera: 'Física',
      turnstile_token: 'demo-token',
    })
    await expect(
      autorregistroApi.confirmarVerificacion({ verificacion_id, codigo: '000000' })
    ).rejects.toBeTruthy()
    const est = await autorregistroApi.confirmarVerificacion({ verificacion_id, codigo: '123456' })
    expect(est.consentimiento_aceptado).toBe(true)
    expect((await prestamosApi.buscarEstudiante('12345678-5')).existe).toBe(true)
  })

  it('insumos: entregar descuenta y reponer suma', async () => {
    const ins = db.insumos.find(i => i.stock_actual > 5)
    const antes = ins.stock_actual
    await prestamosApi.entregarInsumo({ insumo_id: ins.id, cantidad: 2 })
    await prestamosApi.reponerInsumo(ins.id, 5)
    expect(db.insumos.find(i => i.id === ins.id).stock_actual).toBe(antes + 3)
  })

  it('la búsqueda encuentra delantales al escribir "bata" y por otro nombre propio', async () => {
    const porSinonimo = await prestamosApi.buscarArticulosSemantico('bata', false)
    expect(porSinonimo.length).toBeGreaterThan(0)
    expect(porSinonimo.every(a => a.categoria === 'Delantal')).toBe(true)
    const porAlias = await prestamosApi.buscarArticulosSemantico('graficadora', false)
    expect(porAlias[0].nombre).toBe('Calculadora gráfica')
  })

  it('cada artículo tiene código y viaja en el detalle del préstamo', async () => {
    expect(db.articulos.every(a => /^[A-Z]+-\d{2}$/.test(a.codigo))).toBe(true)
    const [activo] = await prestamosApi.listarPrestamosActivos()
    expect(activo.articulo_codigo).toMatch(/^[A-Z]+-\d{2}$/)
  })

  it('cada devolución queda en movimientos del turno y al revertirla registra quién lo hizo', async () => {
    const est = conConsentimiento()
    const art = db.articulos.find(
      a => a.stock_disponible > 0 && !['Calculadora', 'Delantal'].includes(a.categoria)
    )
    const { prestamos } = await prestamosApi.registrarPrestamoLote({
      estudiante_rut: est.rut,
      articulos: [{ articulo_id: art.id, cantidad: 1 }],
    })
    const id = prestamos[0].id
    await prestamosApi.devolverPrestamo(id)
    let movs = await prestamosApi.listarMovimientosTurno()
    expect(movs[0]).toMatchObject({ prestamo_id: id, tipo: 'DEVOLUCION', revertido_por: null })
    expect(movs[0]).toHaveProperty('articulo_codigo', art.codigo)

    const r = await prestamosApi.revertirDevolucion(id)
    expect(r.estado).toBe('ACTIVO')
    movs = await prestamosApi.listarMovimientosTurno()
    const mov = movs.find(m => m.prestamo_id === id)
    expect(mov.revertido_por).toBe('Usuario Demo')
    expect(mov.estado_actual).toBe('ACTIVO')
    const reabierto = db.prestamos.find(p => p.id === id)
    expect(reabierto.estudiante_id).toBe(est.id)
    expect(reabierto.comentario).toMatch(/revertida por Usuario Demo/)
  })

  it('reportar una diferencia de disponibilidad no cambia las existencias y queda pendiente', async () => {
    const art = db.articulos.find(a => a.stock_disponible > 1)
    const antes = { total: art.stock_total, libres: art.stock_disponible }
    await prestamosApi.reportarDiferenciaDisponibilidad({
      articulo_id: art.id,
      cantidad_observada: art.stock_disponible - 1,
      comentario: 'una no está',
    })
    const ficha = (await prestamosApi.listarArticulos()).find(a => a.id === art.id)
    expect(ficha.stock_total).toBe(antes.total)
    expect(ficha.stock_disponible).toBe(antes.libres)
    expect(ficha.reporte_pendiente).toMatchObject({
      cantidad_registrada: antes.libres,
      cantidad_observada: antes.libres - 1,
      estado: 'PENDIENTE',
      reportado_por: 'Usuario Demo',
    })
    // La búsqueda de Stock usa otro endpoint: también debe traer el aviso
    const [buscada] = await prestamosApi.buscarArticulosSemantico(art.nombre, false)
    expect(buscada.reporte_pendiente?.id).toBe(ficha.reporte_pendiente.id)
    await prestamosApi.revisarReporteDisponibilidad(ficha.reporte_pendiente.id, { nota: 'ok' })
    const revisada = (await prestamosApi.listarArticulos()).find(a => a.id === art.id)
    expect(revisada.reporte_pendiente).toBeNull()
    expect(revisada.stock_total).toBe(antes.total)
  })

  it('se puede crear un artículo con stock inicial 0', async () => {
    const art = await prestamosApi.crearArticulo({
      nombre: 'Lupa',
      categoria: 'Varios',
      stock_total: 0,
    })
    expect(art).toMatchObject({ stock_total: 0, stock_disponible: 0 })
  })

  it('busca personas por nombre sin tildes y por RUT con o sin puntos', async () => {
    const est = db.estudiantes.find(e => /[áéíóú]/.test(e.nombre) && /^\d{8}-/.test(e.rut))
    const sinTilde = est.nombre
      .split(' ')[0]
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    expect((await prestamosApi.listarEstudiantes({ q: sinTilde })).items.map(e => e.id)).toContain(
      est.id
    )
    const conPuntos = `${est.rut.slice(0, 2)}.${est.rut.slice(2, 5)}.${est.rut.slice(5, 7)}`
    expect((await prestamosApi.listarEstudiantes({ q: conPuntos })).items.map(e => e.id)).toContain(
      est.id
    )
  })
})
