import { getDatabase } from '@voneb/database'
import { memoryStore } from './memory-store.js'

// ─────────────────────────────────────────────
// Predictor: estimaciones basadas en datos historicos
// Usa metricas de MemoryStore + queries directas
// para predecir tiempos, capacidad y riesgo.
// ─────────────────────────────────────────────

/** Duraciones default por estacion (en segundos) cuando no hay datos */
const DEFAULT_STAGE_DURATIONS: Record<string, number> = {
  EN_COLA_DISENO: 3600,             // 1 hora
  EN_DISENO: 14400,                 // 4 horas
  DISENO_EN_REVISION: 3600,         // 1 hora
  ESPERANDO_APROBACION_CLIENTE: 86400, // 24 horas
  APROBADO_PARA_PRODUCCION: 1800,   // 30 min (transito)
  EN_IMPRESION: 7200,               // 2 horas
  EN_CORTE: 5400,                   // 1.5 horas
  EN_ARMADO: 7200,                  // 2 horas
  EN_CONTROL_CALIDAD: 3600,         // 1 hora
  EMPACADO: 1800,                   // 30 min
}

class Predictor {
  /**
   * Predice la fecha de entrega estimada para una orden.
   * Basado en: WIP actual, tiempo promedio por estacion, prioridad.
   */
  async predictDeliveryDate(
    workOrderId: string,
  ): Promise<{ estimatedDate: Date; confidencePercent: number }> {
    const db = getDatabase()

    const workOrder = await db.workOrder.findUnique({
      where: { id: workOrderId },
      select: { status: true, priority: true, createdAt: true },
    })

    if (!workOrder) {
      return { estimatedDate: new Date(), confidencePercent: 0 }
    }

    // Calcular tiempo restante sumando duraciones de etapas pendientes
    const allStages = [
      'EN_COLA_DISENO', 'EN_DISENO', 'DISENO_EN_REVISION',
      'ESPERANDO_APROBACION_CLIENTE', 'APROBADO_PARA_PRODUCCION',
      'EN_IMPRESION', 'EN_CORTE', 'EN_ARMADO',
      'EN_CONTROL_CALIDAD', 'EMPACADO',
    ]

    const currentIdx = allStages.indexOf(workOrder.status)
    const remainingStages = currentIdx >= 0
      ? allStages.slice(currentIdx)
      : allStages // Si no esta en produccion, calcular todo

    let totalRemainingSeconds = 0
    let stagesWithData = 0

    for (const stage of remainingStages) {
      const metric = await memoryStore.getMetric(`avg_time_${stage}`)
      if (metric && metric.sampleCount >= 3) {
        totalRemainingSeconds += metric.value
        stagesWithData++
      } else {
        totalRemainingSeconds += DEFAULT_STAGE_DURATIONS[stage] ?? 7200
      }
    }

    // Factor de prioridad: URGENTE = 0.7x, ALTA = 0.85x, NORMAL = 1x, BAJA = 1.2x
    const priorityFactors: Record<string, number> = {
      URGENTE: 0.7,
      ALTA: 0.85,
      NORMAL: 1.0,
      BAJA: 1.2,
    }
    const priorityFactor = priorityFactors[workOrder.priority] ?? 1.0

    // Factor de WIP: mas ordenes activas = mas lento
    const activeOrders = await db.workOrder.count({
      where: { status: { notIn: ['CERRADO', 'CANCELADO', 'BORRADOR'] } },
    })
    const wipFactor = Math.max(1.0, 1.0 + (activeOrders - 5) * 0.05) // +5% por cada orden sobre 5

    const adjustedSeconds = totalRemainingSeconds * priorityFactor * wipFactor

    const estimatedDate = new Date()
    estimatedDate.setSeconds(estimatedDate.getSeconds() + adjustedSeconds)

    // Confianza basada en cuantas etapas tienen datos reales
    const totalStages = remainingStages.length
    const confidencePercent = totalStages > 0
      ? Math.round((stagesWithData / totalStages) * 80 + 10) // 10-90%
      : 10

    return { estimatedDate, confidencePercent: Math.min(confidencePercent, 90) }
  }

  /**
   * Predice la capacidad diaria de produccion.
   */
  async predictDailyCapacity(): Promise<{
    ordersCanHandle: number
    currentLoad: number
    utilizationPercent: number
  }> {
    const db = getDatabase()

    // Ordenes completadas por dia (ultimos 14 dias)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const completedRecently = await db.workOrder.count({
      where: {
        status: { in: ['ENTREGADO', 'CERRADO'] },
        updatedAt: { gte: fourteenDaysAgo },
      },
    })

    const avgDailyCapacity = completedRecently > 0
      ? Math.ceil(completedRecently / 14)
      : 5 // Default: 5 ordenes/dia

    const currentLoad = await db.workOrder.count({
      where: {
        status: {
          notIn: ['CERRADO', 'CANCELADO', 'BORRADOR', 'ENTREGADO'],
        },
      },
    })

    // Capacidad teorica vs carga actual
    const utilizationPercent = avgDailyCapacity > 0
      ? Math.min(Math.round((currentLoad / (avgDailyCapacity * 3)) * 100), 100)
      : 0 // 3 dias de buffer como capacidad

    return {
      ordersCanHandle: avgDailyCapacity,
      currentLoad,
      utilizationPercent,
    }
  }

  /**
   * Predice el riesgo de atraso de una orden.
   * riskScore 0-1. Factores: tiempo en estado actual, prioridad, carga de disenador, historial QC.
   */
  async predictDelayRisk(
    workOrderId: string,
  ): Promise<{ riskScore: number; reasons: string[] }> {
    const db = getDatabase()

    const workOrder = await db.workOrder.findUnique({
      where: { id: workOrderId },
      select: {
        status: true,
        priority: true,
        updatedAt: true,
        assignedDesignerId: true,
        incidents: { select: { severity: true, status: true } },
        statusHistory: {
          orderBy: { createdAt: 'desc' as const },
          take: 1,
          select: { createdAt: true },
        },
      },
    })

    if (!workOrder) return { riskScore: 0, reasons: [] }

    let riskScore = 0
    const reasons: string[] = []

    // Factor 1: Tiempo en estado actual vs promedio
    const lastChange = workOrder.statusHistory[0]?.createdAt ?? workOrder.updatedAt
    const hoursInState = (Date.now() - lastChange.getTime()) / (1000 * 60 * 60)

    const staleThresholds: Record<string, number> = {
      EN_DISENO: 48,
      ESPERANDO_APROBACION_CLIENTE: 72,
      EN_IMPRESION: 24,
      EN_CORTE: 24,
      EN_ARMADO: 24,
      EN_CONTROL_CALIDAD: 8,
      LISTO_PARA_ENTREGA: 48,
    }

    const threshold = staleThresholds[workOrder.status]
    if (threshold && hoursInState > threshold * 0.7) {
      const overtime = hoursInState / threshold
      riskScore += Math.min(overtime * 0.3, 0.4)
      reasons.push(`${Math.round(hoursInState)}h en estado ${workOrder.status} (limite: ${threshold}h)`)
    }

    // Factor 2: Incidentes abiertos
    const openIncidents = workOrder.incidents.filter(
      (i: { severity: string; status: string }) => i.status === 'OPEN' || i.status === 'INVESTIGATING',
    )
    if (openIncidents.length > 0) {
      riskScore += 0.15 * openIncidents.length
      reasons.push(`${openIncidents.length} incidentes abiertos`)
    }

    // Factor 3: Incidentes criticos
    const criticalIncidents = openIncidents.filter(
      (i: { severity: string; status: string }) => i.severity === 'HIGH' || i.severity === 'CRITICAL',
    )
    if (criticalIncidents.length > 0) {
      riskScore += 0.2
      reasons.push(`${criticalIncidents.length} incidentes de alta severidad`)
    }

    // Factor 4: Carga del disenador (si aplica)
    if (workOrder.assignedDesignerId && workOrder.status.includes('DISENO')) {
      const designerLoad = await db.workOrder.count({
        where: {
          assignedDesignerId: workOrder.assignedDesignerId,
          status: { in: ['EN_COLA_DISENO', 'EN_DISENO', 'DISENO_EN_REVISION'] },
        },
      })
      if (designerLoad > 3) {
        riskScore += 0.1
        reasons.push(`Disenador tiene ${designerLoad} ordenes asignadas`)
      }
    }

    // Factor 5: Prioridad inversa (baja prioridad = mas riesgo de ser pospuesta)
    if (workOrder.priority === 'BAJA') {
      riskScore += 0.05
      reasons.push('Prioridad baja (riesgo de postergacion)')
    }

    return {
      riskScore: Math.min(Math.round(riskScore * 100) / 100, 1.0),
      reasons,
    }
  }

  /**
   * Predice el costo de un incidente potencial basado en historico.
   */
  async predictIncidentCost(
    type: string,
    severity: string,
  ): Promise<{ estimatedCostCents: number; basedOnSamples: number }> {
    const db = getDatabase()

    const similar = await db.incident.aggregate({
      where: {
        type,
        severity,
        costRealCents: { not: null, gt: 0 },
      },
      _avg: { costRealCents: true },
      _count: true,
    })

    if (similar._count === 0 || !similar._avg.costRealCents) {
      // Estimaciones por default basadas en severidad
      const defaultCosts: Record<string, number> = {
        LOW: 500000,       // 5,000 CRC
        MEDIUM: 1500000,   // 15,000 CRC
        HIGH: 5000000,     // 50,000 CRC
        CRITICAL: 15000000, // 150,000 CRC
      }
      return {
        estimatedCostCents: defaultCosts[severity] ?? 1000000,
        basedOnSamples: 0,
      }
    }

    return {
      estimatedCostCents: Math.round(similar._avg.costRealCents),
      basedOnSamples: similar._count,
    }
  }
}

/** Singleton del predictor */
export const predictor = new Predictor()
