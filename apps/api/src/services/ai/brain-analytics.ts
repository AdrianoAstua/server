import { getDatabase } from '@voneb/database'
import { memoryStore } from './memory-store.js'
import { predictor } from './predictor.js'
import { consultationManager } from './consultation-manager.js'
import { aiBus } from './event-bus.js'

// ─────────────────────────────────────────────
// Analiticas del cerebro AI — proveedor de datos
// para el dashboard. Combina todos los subsistemas.
// ─────────────────────────────────────────────

export interface BrainDashboard {
  healthScore: number
  actionsToday: number
  consultationsPending: number
  insightsActive: number
  anomaliesDetected: number
  predictions: {
    atRiskOrders: number
    bottleneck: string | null
    dailyCapacity: number
  }
  recentActions: Array<{
    id: string
    title: string
    type: string
    severity: string
    time: string
  }>
  topInsights: Array<{
    id: string
    title: string
    type: string
    confidence: number
    description: string
  }>
}

class BrainAnalytics {
  /**
   * Dashboard completo del cerebro AI.
   */
  async getDashboard(): Promise<BrainDashboard> {
    const [
      healthResult,
      actionsToday,
      consultations,
      insights,
      anomalies,
      predictions,
      recentActions,
      topInsights,
    ] = await Promise.all([
      this.getHealthScore(),
      this.getActionCountToday(),
      consultationManager.getStats(),
      memoryStore.getActivePatterns(10),
      this.getAnomalyCount(),
      this.getPredictions(),
      this.getRecentActions(10),
      memoryStore.getActivePatterns(5),
    ])

    return {
      healthScore: healthResult.score,
      actionsToday,
      consultationsPending: consultations.pending,
      insightsActive: insights.length,
      anomaliesDetected: anomalies,
      predictions: {
        atRiskOrders: predictions.atRiskOrders,
        bottleneck: predictions.bottleneckStation,
        dailyCapacity: predictions.estimatedDailyCapacity,
      },
      recentActions: recentActions.map((a: { id: string; title: string; actionType: string; severity: string; createdAt: Date }) => ({
        id: a.id,
        title: a.title,
        type: a.actionType,
        severity: a.severity,
        time: a.createdAt.toISOString(),
      })),
      topInsights: topInsights.map((p: { id: string; title: string; type: string; confidence: number; description: string }) => ({
        id: p.id,
        title: p.title,
        type: p.type,
        confidence: p.confidence,
        description: p.description,
      })),
    }
  }

  /**
   * Acciones recientes del AI (paginadas).
   */
  async getRecentActions(limit = 20, offset = 0) {
    const db = getDatabase()

    return db.aIActionLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  }

  /**
   * Acciones de hoy.
   */
  async getActionsToday() {
    const db = getDatabase()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    return db.aIActionLog.findMany({
      where: { createdAt: { gte: todayStart } },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Insights/patrones activos.
   */
  async getActiveInsights() {
    return memoryStore.getActivePatterns(50)
  }

  /**
   * Consultas pendientes.
   */
  async getPendingConsultations() {
    const db = getDatabase()

    return db.aIConsultation.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        workOrder: {
          select: { id: true, workOrderNumber: true },
        },
        targetUser: {
          select: { id: true, name: true },
        },
      },
    })
  }

  /**
   * Puntaje de salud del sistema (0-100).
   * Factores: tasa on-time, QC pass rate, lead time, balance de colas, tendencia de errores.
   */
  async getHealthScore(): Promise<{
    score: number
    factors: Array<{ name: string; value: number; weight: number; status: string }>
  }> {
    const factors: Array<{ name: string; value: number; weight: number; status: string }> = []

    // Factor 1: QC Pass Rate (peso: 25%)
    const qcRate = await memoryStore.getMetric('qc_pass_rate')
    const qcValue = qcRate?.value ?? 0.95
    factors.push({
      name: 'Tasa de aprobacion QC',
      value: Math.round(qcValue * 100),
      weight: 25,
      status: qcValue >= 0.9 ? 'good' : qcValue >= 0.7 ? 'warning' : 'critical',
    })

    // Factor 2: Ordenes activas vs capacidad (peso: 20%)
    const capacity = await predictor.predictDailyCapacity()
    const loadScore = capacity.utilizationPercent <= 80
      ? 100
      : Math.max(0, 100 - (capacity.utilizationPercent - 80) * 2)
    factors.push({
      name: 'Carga de trabajo',
      value: Math.round(loadScore),
      weight: 20,
      status: loadScore >= 70 ? 'good' : loadScore >= 40 ? 'warning' : 'critical',
    })

    // Factor 3: Incidentes recientes (peso: 20%)
    const db = getDatabase()
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    const recentIncidents = await db.incident.count({
      where: { createdAt: { gte: oneDayAgo } },
    })
    const incidentScore = recentIncidents === 0
      ? 100
      : Math.max(0, 100 - recentIncidents * 15)
    factors.push({
      name: 'Tasa de incidentes (24h)',
      value: Math.round(incidentScore),
      weight: 20,
      status: incidentScore >= 70 ? 'good' : incidentScore >= 40 ? 'warning' : 'critical',
    })

    // Factor 4: Ordenes estancadas (peso: 20%)
    const staleCount = await this.getStaleOrderCount()
    const staleScore = staleCount === 0
      ? 100
      : Math.max(0, 100 - staleCount * 20)
    factors.push({
      name: 'Ordenes estancadas',
      value: Math.round(staleScore),
      weight: 20,
      status: staleScore >= 70 ? 'good' : staleScore >= 40 ? 'warning' : 'critical',
    })

    // Factor 5: Tendencia de produccion (peso: 15%)
    const throughput = await memoryStore.getMetric('daily_completed')
    const trendScore = !throughput
      ? 75
      : throughput.trend === 'SUBIENDO'
        ? 100
        : throughput.trend === 'STABLE'
          ? 75
          : 40
    factors.push({
      name: 'Tendencia de produccion',
      value: Math.round(trendScore),
      weight: 15,
      status: trendScore >= 70 ? 'good' : trendScore >= 40 ? 'warning' : 'critical',
    })

    // Calcular score ponderado
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0)
    const score = Math.round(
      factors.reduce((sum, f) => sum + (f.value * f.weight) / totalWeight, 0),
    )

    return { score: Math.min(Math.max(score, 0), 100), factors }
  }

  /**
   * Predicciones actuales.
   */
  async getPredictions(): Promise<{
    atRiskOrders: number
    estimatedDailyCapacity: number
    bottleneckStation: string | null
  }> {
    const db = getDatabase()

    // Ordenes en riesgo (riskScore > 0.5)
    const activeOrders = await db.workOrder.findMany({
      where: {
        status: {
          notIn: ['CERRADO', 'CANCELADO', 'BORRADOR', 'ENTREGADO'],
        },
      },
      select: { id: true },
      take: 50,
    })

    let atRiskCount = 0
    for (const order of activeOrders) {
      const risk = await predictor.predictDelayRisk(order.id)
      if (risk.riskScore > 0.5) atRiskCount++
    }

    const capacity = await predictor.predictDailyCapacity()

    // Buscar patron de cuello de botella activo
    const patterns = await memoryStore.getActivePatterns(10)
    const bottleneck = patterns.find((p) => p.type === 'BOTTLENECK')

    return {
      atRiskOrders: atRiskCount,
      estimatedDailyCapacity: capacity.ordersCanHandle,
      bottleneckStation: bottleneck
        ? ((bottleneck as unknown as { description: string }).description.match(/en (\w+)/)?.[1] ?? null)
        : null,
    }
  }

  /**
   * Progreso de aprendizaje del sistema.
   */
  async getLearningProgress(): Promise<{
    totalSamples: number
    metricsTracked: number
    patternsDetected: number
    accuracy: number
  }> {
    const db = getDatabase()

    const metrics = await memoryStore.getAllMetrics()
    let totalSamples = 0
    for (const [, m] of metrics) {
      totalSamples += m.sampleCount
    }

    const patternsDetected = await db.aIPattern.count()

    // "Accuracy" basado en cuantas metricas tienen datos suficientes
    const metricsWithEnoughData = Array.from(metrics.values()).filter(
      (m) => m.sampleCount >= 10,
    ).length
    const accuracy = metrics.size > 0
      ? Math.round((metricsWithEnoughData / metrics.size) * 100)
      : 0

    return {
      totalSamples,
      metricsTracked: metrics.size,
      patternsDetected,
      accuracy: Math.min(accuracy, 95),
    }
  }

  // ── Helpers privados ──

  private async getActionCountToday(): Promise<number> {
    const db = getDatabase()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    return db.aIActionLog.count({
      where: { createdAt: { gte: todayStart } },
    })
  }

  private async getAnomalyCount(): Promise<number> {
    const db = getDatabase()
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    return db.aIActionLog.count({
      where: {
        createdAt: { gte: oneDayAgo },
        actionType: { in: ['DASHBOARD_ALERT'] },
        severity: { in: ['WARNING', 'CRITICAL'] },
      },
    })
  }

  private async getStaleOrderCount(): Promise<number> {
    const db = getDatabase()
    let count = 0

    const staleThresholds: Record<string, number> = {
      EN_DISENO: 48,
      ESPERANDO_APROBACION_CLIENTE: 72,
      EN_IMPRESION: 24,
      EN_CORTE: 24,
      EN_ARMADO: 24,
      EN_CONTROL_CALIDAD: 8,
      LISTO_PARA_ENTREGA: 48,
    }

    for (const [status, hours] of Object.entries(staleThresholds)) {
      const threshold = new Date()
      threshold.setHours(threshold.getHours() - hours)

      const stale = await db.workOrder.count({
        where: {
          status,
          updatedAt: { lt: threshold },
        },
      })
      count += stale
    }

    return count
  }

  /**
   * Obtiene estadisticas del bus de eventos (para debugging).
   */
  getEventBusStats() {
    return aiBus.getBufferStats()
  }
}

/** Singleton de analiticas del cerebro */
export const brainAnalytics = new BrainAnalytics()
