import { getDatabase } from '@voneb/database'
import type { AIEvent } from './event-bus.js'
import { memoryStore } from './memory-store.js'
import { anomalyDetector } from './anomaly-detector.js'
import { patternDetector } from './pattern-detector.js'
import { predictor } from './predictor.js'
import { consultationManager } from './consultation-manager.js'
import { actionExecutor } from './action-executor.js'

// ─────────────────────────────────────────────
// Capa 2 — Motor de decision del cerebro AI
// Procesa cada evento y decide que accion tomar:
//   - Accion autonoma (sin aprobacion)
//   - Consulta (requiere aprobacion humana)
//   - Solo registro/metricas
// ─────────────────────────────────────────────

/** Umbrales de estancamiento por estado (en horas) */
const STALE_THRESHOLDS: Record<string, number> = {
  EN_DISENO: 48,
  ESPERANDO_APROBACION_CLIENTE: 72,
  EN_IMPRESION: 24,
  EN_CORTE: 24,
  EN_ARMADO: 24,
  EN_CONTROL_CALIDAD: 8,
  LISTO_PARA_ENTREGA: 48,
}

class DecisionEngine {
  /**
   * Punto de entrada principal: procesa cualquier evento del bus.
   */
  async processEvent(event: AIEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'work_order.created':
          await this.onWorkOrderCreated(event.data)
          break
        case 'work_order.status_changed':
          await this.onWorkOrderStatusChanged(event.data)
          break
        case 'production.scanned_in':
          await this.onProductionScanned(event.data, 'in')
          break
        case 'production.scanned_out':
          await this.onProductionScanned(event.data, 'out')
          break
        case 'quality.checked':
          await this.onQualityChecked(event.data)
          break
        case 'incident.created':
          await this.onIncidentCreated(event.data)
          break
        case 'incident.resolved':
          await this.onIncidentResolved(event.data)
          break
        case 'design.uploaded':
          await this.onDesignUploaded(event.data)
          break
        case 'timer.periodic':
          await this.onTimerPeriodic()
          break
        case 'timer.hourly':
          await this.onTimerHourly()
          break
        case 'timer.daily':
          await this.onTimerDaily()
          break
        default:
          // Otros eventos: solo log
          break
      }
    } catch (err) {
      console.error(`[AI DecisionEngine] Error procesando ${event.type}:`, err)
    }
  }

  // ── Handlers de eventos ──

  /**
   * Orden creada: calcular riesgo inicial, predecir entrega.
   */
  private async onWorkOrderCreated(data: Record<string, unknown>): Promise<void> {
    const workOrderId = data['workOrderId'] as string | undefined
    if (!workOrderId) return

    // Predecir fecha de entrega
    const delivery = await predictor.predictDeliveryDate(workOrderId)

    // Calcular riesgo inicial
    const risk = await predictor.predictDelayRisk(workOrderId)

    await actionExecutor.executeAutonomous({
      type: 'ORDER_ANALYSIS',
      title: 'Analisis de nueva orden',
      description: `Fecha estimada de entrega: ${delivery.estimatedDate.toLocaleDateString('es-CR')} (confianza: ${delivery.confidencePercent}%). Riesgo de atraso: ${Math.round(risk.riskScore * 100)}%.`,
      triggeredBy: 'work_order.created',
      targetId: workOrderId,
      targetType: 'WorkOrder',
      metadata: {
        estimatedDelivery: delivery.estimatedDate.toISOString(),
        confidence: delivery.confidencePercent,
        riskScore: risk.riskScore,
        riskReasons: risk.reasons,
      },
    })
  }

  /**
   * Cambio de estado de orden: disparar acciones segun el nuevo estado.
   */
  private async onWorkOrderStatusChanged(data: Record<string, unknown>): Promise<void> {
    const workOrderId = data['workOrderId'] as string | undefined
    const newStatus = data['newStatus'] as string | undefined
    const oldStatus = data['oldStatus'] as string | undefined

    if (!workOrderId || !newStatus) return

    // Actualizar metrica de tiempo en estado anterior
    if (oldStatus) {
      const changedAt = data['changedAt'] as string | undefined
      if (changedAt) {
        const durationMs = Date.now() - new Date(changedAt).getTime()
        const durationSeconds = Math.round(durationMs / 1000)
        await memoryStore.updateMetric(`avg_time_${oldStatus}`, durationSeconds)
      }
    }

    // Acciones segun nuevo estado
    switch (newStatus) {
      case 'ORDEN_CONFIRMADA': {
        // Auto-asignar disenador
        const designerName = await actionExecutor.autoAssignDesigner(workOrderId)
        if (designerName !== 'Sin disenadores disponibles') {
          // Log ya se crea dentro de autoAssignDesigner
        }
        break
      }

      case 'ESPERANDO_APROBACION_CLIENTE': {
        // Notificar al cliente que su diseno esta listo
        await actionExecutor.autoNotifyClient(workOrderId, 'DESIGN_READY')
        break
      }

      case 'APROBADO_PARA_PRODUCCION': {
        // Notificar que entro a produccion
        await actionExecutor.autoNotifyClient(workOrderId, 'PRODUCTION_STARTED')
        break
      }

      case 'LISTO_PARA_ENTREGA': {
        // Notificar que esta listo
        await actionExecutor.autoNotifyClient(workOrderId, 'READY_PICKUP')
        break
      }

      case 'ENTREGADO': {
        // Notificar entrega y evaluar auto-cierre
        await actionExecutor.autoNotifyClient(workOrderId, 'DELIVERED')
        // Auto-cerrar si no hay incidentes abiertos
        await actionExecutor.autoCloseOrder(workOrderId)
        break
      }

      default:
        break
    }

    // Actualizar throughput diario
    if (newStatus === 'ENTREGADO' || newStatus === 'CERRADO') {
      const metric = await memoryStore.getMetric('daily_throughput')
      const currentCount = metric?.value ?? 0
      await memoryStore.updateMetric('daily_throughput', currentCount + 1)
    }
  }

  /**
   * Escaneo de produccion: registrar tiempo, detectar anomalias.
   */
  private async onProductionScanned(
    data: Record<string, unknown>,
    direction: 'in' | 'out',
  ): Promise<void> {
    const station = data['station'] as string | undefined
    if (!station) return

    if (direction === 'out') {
      const durationSeconds = data['durationSeconds'] as number | undefined
      if (durationSeconds && durationSeconds > 0) {
        // Actualizar metrica de tiempo de estacion
        await memoryStore.updateMetric(`avg_time_${station}`, durationSeconds)

        // Verificar anomalia de tiempo
        const anomaly = await anomalyDetector.checkTimeAnomaly(station, durationSeconds)
        if (anomaly.isAnomaly) {
          await actionExecutor.autoAlertDashboard(
            `Tiempo anomalo en ${station}`,
            `Duracion de ${Math.round(durationSeconds / 60)} min es anomala (esperado: ~${Math.round(anomaly.expected / 60)} min, z-score: ${anomaly.zScore}).`,
            'WARNING',
          )
        }
      }
    }

    // Actualizar profundidad de cola
    const db = getDatabase()
    const queueDepth = await db.workOrderLine.count({
      where: { currentStation: station as 'IMPRESION' | 'CORTE' | 'ARMADO' | 'EMPAQUE' },
    })
    await memoryStore.updateMetric(`queue_depth_${station}`, queueDepth)
  }

  /**
   * Control de calidad: actualizar tasa de aprobacion, detectar picos.
   */
  private async onQualityChecked(data: Record<string, unknown>): Promise<void> {
    const result = data['result'] as string | undefined
    const workOrderLineId = data['workOrderLineId'] as string | undefined

    if (!result) return

    // Actualizar tasa de aprobacion QC
    const passed = result === 'PASSED' ? 1 : 0
    await memoryStore.updateMetric('qc_pass_rate', passed)

    // Si falla, verificar si es el 2do rechazo → consultar al supervisor
    if (result === 'FAILED' && workOrderLineId) {
      const db = getDatabase()

      const failCount = await db.qualityCheck.count({
        where: {
          workOrderLineId,
          result: 'FAILED',
        },
      })

      if (failCount >= 2) {
        // Buscar un supervisor para la consulta
        const supervisor = await db.user.findFirst({
          where: {
            role: { in: ['SUPERVISOR_GENERAL', 'ADMIN'] },
            active: true,
          },
          select: { id: true },
        })

        if (supervisor) {
          const line = await db.workOrderLine.findUnique({
            where: { id: workOrderLineId },
            select: {
              barcode: true,
              workOrder: { select: { id: true, workOrderNumber: true } },
            },
          })

          await consultationManager.createConsultation({
            targetUserId: supervisor.id,
            targetRole: 'SUPERVISOR_GENERAL',
            title: `Linea rechazada ${failCount} veces en QC`,
            description: `La linea ${line?.barcode ?? workOrderLineId} de la orden ${line?.workOrder.workOrderNumber ?? '?'} ha sido rechazada ${failCount} veces en control de calidad.`,
            recommendation: 'Recomendacion: escalar a incidente o evaluar reproceso total.',
            options: [
              { label: 'Escalar a incidente', action: 'escalate_incident' },
              { label: 'Continuar reproceso', action: 'continue_rework' },
              { label: 'Descartar pieza', action: 'discard' },
            ],
            workOrderId: line?.workOrder.id,
            expiresInHours: 8,
          })
        }
      }

      // Verificar pico de errores en las ultimas 4 horas
      const fourHoursAgo = new Date()
      fourHoursAgo.setHours(fourHoursAgo.getHours() - 4)

      const recentFailures = await db.qualityCheck.count({
        where: {
          result: 'FAILED',
          createdAt: { gte: fourHoursAgo },
        },
      })

      const spike = await anomalyDetector.checkErrorSpike('QC_FAILURE', recentFailures, 4)
      if (spike.isSpike) {
        await actionExecutor.autoAlertDashboard(
          'Pico de rechazos en QC',
          `${recentFailures} rechazos en las ultimas 4 horas (tasa normal: ${spike.normalRate}/hora, actual: ${spike.rate}/hora).`,
          'WARNING',
        )
      }
    }
  }

  /**
   * Incidente creado: actualizar metricas, predecir costo, alertar si es severo.
   */
  private async onIncidentCreated(data: Record<string, unknown>): Promise<void> {
    const incidentId = data['incidentId'] as string | undefined
    const type = data['type'] as string | undefined
    const severity = data['severity'] as string | undefined

    if (!type) return

    // Actualizar tasa de errores por tipo
    await memoryStore.updateMetric(`error_rate_${type}`, 1)

    // Predecir costo
    if (severity) {
      const cost = await predictor.predictIncidentCost(type, severity)
      if (cost.estimatedCostCents > 0) {
        await actionExecutor.executeAutonomous({
          type: 'INCIDENT_COST_PREDICTION',
          title: `Costo estimado de incidente: ${Math.round(cost.estimatedCostCents / 100).toLocaleString()} CRC`,
          description: `Incidente tipo ${type} (${severity}): costo estimado ${Math.round(cost.estimatedCostCents / 100).toLocaleString()} CRC basado en ${cost.basedOnSamples} incidentes similares.`,
          triggeredBy: 'incident.created',
          targetId: incidentId,
          targetType: 'Incident',
          metadata: { estimatedCostCents: cost.estimatedCostCents, samples: cost.basedOnSamples },
        })
      }
    }

    // Auto-alertar supervisor si severidad alta o critica
    if (severity === 'HIGH' || severity === 'CRITICAL') {
      if (incidentId) {
        await actionExecutor.autoEscalateIncident(incidentId)
      }
    }
  }

  /**
   * Incidente resuelto: actualizar metricas de costo real.
   */
  private async onIncidentResolved(data: Record<string, unknown>): Promise<void> {
    const costRealCents = data['costRealCents'] as number | undefined
    const type = data['type'] as string | undefined

    if (costRealCents && type) {
      await memoryStore.updateMetric(`incident_cost_${type}`, costRealCents)
    }
  }

  /**
   * Diseno subido: validar formato basico y registrar.
   */
  private async onDesignUploaded(data: Record<string, unknown>): Promise<void> {
    const workOrderId = data['workOrderId'] as string | undefined
    const filename = data['filename'] as string | undefined
    const mimeType = data['mimeType'] as string | undefined

    if (!workOrderId) return

    const validFormats = [
      'image/png', 'image/jpeg', 'image/tiff', 'image/svg+xml',
      'application/pdf', 'application/postscript', 'application/illustrator',
    ]

    const isValidFormat = mimeType ? validFormats.includes(mimeType) : true

    if (!isValidFormat) {
      await actionExecutor.autoAlertDashboard(
        'Formato de archivo no recomendado',
        `Archivo "${filename ?? 'desconocido'}" subido con formato ${mimeType}. Formatos recomendados: PNG, JPEG, TIFF, SVG, PDF, AI.`,
        'INFO',
      )
    }
  }

  // ── Timers ──

  /**
   * Cada 5 minutos: verificar ordenes estancadas, colas, consultas expiradas.
   */
  private async onTimerPeriodic(): Promise<void> {
    const db = getDatabase()

    // 1. Verificar ordenes estancadas
    for (const [status, thresholdHours] of Object.entries(STALE_THRESHOLDS)) {
      const thresholdDate = new Date()
      thresholdDate.setHours(thresholdDate.getHours() - thresholdHours)

      const staleOrders = await db.workOrder.findMany({
        where: {
          status,
          updatedAt: { lt: thresholdDate },
        },
        select: { id: true, workOrderNumber: true, priority: true },
        take: 10,
      })

      for (const order of staleOrders) {
        await actionExecutor.autoAlertDashboard(
          `Orden estancada: ${order.workOrderNumber}`,
          `Orden ${order.workOrderNumber} (${order.priority}) lleva mas de ${thresholdHours}h en estado ${status}.`,
          order.priority === 'URGENTE' || order.priority === 'ALTA' ? 'WARNING' : 'INFO',
        )
      }
    }

    // 2. Verificar profundidad de colas
    const stations = ['IMPRESION', 'CORTE', 'ARMADO', 'EMPAQUE'] as const
    for (const station of stations) {
      const depth = await db.workOrderLine.count({
        where: { currentStation: station },
      })
      await memoryStore.updateMetric(`queue_depth_${station}`, depth)

      const queueAnomaly = await anomalyDetector.checkQueueAnomaly(station, depth)
      if (queueAnomaly.isAnomaly) {
        await actionExecutor.autoAlertDashboard(
          `Cola inusualmente larga en ${station}`,
          `${depth} items en cola (esperado: ~${queueAnomaly.expected}). Posible cuello de botella.`,
          'WARNING',
        )
      }
    }

    // 3. Verificar carga de disenadores
    const designers = await db.user.findMany({
      where: { role: { in: ['DISENADOR'] }, active: true },
      select: { id: true, name: true },
    })

    for (const designer of designers) {
      const load = await db.workOrder.count({
        where: {
          assignedDesignerId: designer.id,
          status: { in: ['EN_COLA_DISENO', 'EN_DISENO', 'DISENO_EN_REVISION'] },
        },
      })
      await memoryStore.updateMetric(`designer_load_${designer.id}`, load)

      if (load > 5) {
        await actionExecutor.autoAlertDashboard(
          `Alta carga de disenador: ${designer.name}`,
          `${designer.name} tiene ${load} ordenes en diseno. Considerar redistribuir.`,
          'WARNING',
        )
      }
    }

    // 4. Expirar consultas viejas
    await consultationManager.expireStale()
  }

  /**
   * Cada hora: detectar patrones, analizar cuellos de botella, calcular tendencias.
   */
  private async onTimerHourly(): Promise<void> {
    // Ejecutar deteccion de patrones
    const patterns = await patternDetector.detectAll()

    if (patterns.length > 0) {
      await actionExecutor.executeAutonomous({
        type: 'PATTERN_DETECTION',
        title: `${patterns.length} patron(es) detectado(s)`,
        description: patterns
          .map((p) => `- ${p.title} (confianza: ${Math.round(p.confidence * 100)}%)`)
          .join('\n'),
        triggeredBy: 'timer.hourly',
        metadata: { patternCount: patterns.length, patterns: patterns.map((p) => p.type) },
      })
    }

    // Actualizar metricas de QC pass rate con query directa
    const db = getDatabase()
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    const recentQC = await db.qualityCheck.groupBy({
      by: ['result'],
      where: { createdAt: { gte: oneHourAgo } },
      _count: true,
    })

    const passedCount = recentQC.find((r: { result: string; _count: number }) => r.result === 'PASSED')?._count ?? 0
    const failedCount = recentQC.find((r: { result: string; _count: number }) => r.result === 'FAILED')?._count ?? 0
    const totalQC = passedCount + failedCount

    if (totalQC > 0) {
      await memoryStore.updateMetric('qc_pass_rate_hourly', passedCount / totalQC)
    }
  }

  /**
   * Cada dia: reporte diario, metricas de largo plazo, tendencias.
   */
  private async onTimerDaily(): Promise<void> {
    const db = getDatabase()

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // Ordenes completadas hoy
    const completedToday = await db.workOrder.count({
      where: {
        status: { in: ['ENTREGADO', 'CERRADO'] },
        updatedAt: { gte: todayStart },
      },
    })

    // Incidentes creados hoy
    const incidentsToday = await db.incident.count({
      where: { createdAt: { gte: todayStart } },
    })

    // Ordenes activas totales
    const activeOrders = await db.workOrder.count({
      where: { status: { notIn: ['CERRADO', 'CANCELADO'] } },
    })

    // Actualizar metricas diarias
    await memoryStore.updateMetric('daily_completed', completedToday)
    await memoryStore.updateMetric('daily_incidents', incidentsToday)
    await memoryStore.updateMetric('daily_active_orders', activeOrders)

    // Generar resumen del dia
    await actionExecutor.executeAutonomous({
      type: 'DAILY_REPORT',
      title: 'Resumen diario de produccion',
      description: `Completadas: ${completedToday} | Incidentes: ${incidentsToday} | Activas: ${activeOrders}`,
      triggeredBy: 'timer.daily',
      severity: 'INFO',
      metadata: {
        completedToday,
        incidentsToday,
        activeOrders,
        date: todayStart.toISOString(),
      },
    })

    // Detectar tendencias de largo plazo
    const dailyMetric = await memoryStore.getMetric('daily_completed')
    if (dailyMetric && dailyMetric.trend === 'BAJANDO') {
      await actionExecutor.autoAlertDashboard(
        'Tendencia: produccion diaria bajando',
        `El throughput diario muestra tendencia a la baja. Promedio actual: ${Math.round(dailyMetric.value)} ordenes/dia.`,
        'WARNING',
      )
    }
  }
}

/** Singleton del motor de decision */
export const decisionEngine = new DecisionEngine()
