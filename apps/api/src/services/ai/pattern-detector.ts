import { getDatabase } from '@voneb/database'
import { memoryStore } from './memory-store.js'

// ─────────────────────────────────────────────
// Detector de patrones recurrentes
// Cruza datos de produccion, incidentes, QC y
// ordenes para encontrar correlaciones utiles.
// ─────────────────────────────────────────────

export interface PatternResult {
  type: string
  title: string
  description: string
  confidence: number
  data: Record<string, unknown>
}

class PatternDetector {
  /**
   * Ejecuta todas las detecciones de patrones (llamado cada hora).
   */
  async detectAll(): Promise<PatternResult[]> {
    const results: PatternResult[] = []

    const detectors = [
      this.detectTimeCorrelation(),
      this.detectOperatorCorrelation(),
      this.detectProductCorrelation(),
      this.detectClientPatterns(),
      this.detectBottleneck(),
    ]

    const outcomes = await Promise.allSettled(detectors)

    for (const outcome of outcomes) {
      if (outcome.status === 'fulfilled' && outcome.value) {
        results.push(outcome.value)
      }
    }

    // Almacenar patrones con confianza > 0.5
    for (const pattern of results) {
      if (pattern.confidence >= 0.5) {
        await memoryStore.storePattern(pattern)
      }
    }

    return results
  }

  /**
   * Correlaciona errores con hora del dia.
   * Ejemplo: "Errores de corte aumentan 60% despues de las 3pm"
   */
  async detectTimeCorrelation(): Promise<PatternResult | null> {
    const db = getDatabase()

    // Contar incidentes por hora del dia (ultimos 30 dias)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const incidents = await db.incident.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, type: true },
    })

    if (incidents.length < 10) return null

    // Agrupar por franja: mañana (6-12), tarde (12-18), noche (18-6)
    const buckets: Record<string, number> = { manana: 0, tarde: 0, noche: 0 }
    for (const inc of incidents) {
      const hour = inc.createdAt.getHours()
      if (hour >= 6 && hour < 12) buckets['manana']!++
      else if (hour >= 12 && hour < 18) buckets['tarde']!++
      else buckets['noche']!++
    }

    const total = incidents.length
    const avgPerBucket = total / 3

    // Buscar la franja con mas incidentes
    let maxBucket = 'manana'
    let maxCount = buckets['manana']!
    for (const [bucket, count] of Object.entries(buckets)) {
      if (count > maxCount) {
        maxBucket = bucket
        maxCount = count
      }
    }

    const ratio = maxCount / avgPerBucket
    if (ratio < 1.4) return null // No hay correlacion significativa

    const labels: Record<string, string> = {
      manana: 'en la manana (6am-12pm)',
      tarde: 'en la tarde (12pm-6pm)',
      noche: 'en la noche (6pm-6am)',
    }

    const percentIncrease = Math.round((ratio - 1) * 100)

    return {
      type: 'TIME_CORRELATION',
      title: `Errores concentrados ${labels[maxBucket]}`,
      description: `Los incidentes aumentan ${percentIncrease}% ${labels[maxBucket]}. De ${total} incidentes en 30 dias, ${maxCount} ocurrieron en esa franja.`,
      confidence: Math.min(ratio / 3, 0.95),
      data: { buckets, ratio, peakPeriod: maxBucket },
    }
  }

  /**
   * Correlaciona errores con operarios.
   * Ejemplo: "Operario X tiene 3x mas rechazos que promedio"
   */
  async detectOperatorCorrelation(): Promise<PatternResult | null> {
    const db = getDatabase()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // QC checks por operario
    const qcByOperator = await db.qualityCheck.groupBy({
      by: ['inspectorId'],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
    })

    if (qcByOperator.length < 2) return null

    // Rechazos por operario (basado en quien proceso la linea, no quien inspecciono)
    const rejections = await db.qualityCheck.findMany({
      where: {
        result: 'FAILED',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        workOrderLine: {
          select: {
            productionLogs: {
              select: { operatorId: true },
              take: 1,
              orderBy: { scannedInAt: 'desc' },
            },
          },
        },
      },
    })

    const rejectionsByOperator: Record<string, number> = {}
    for (const rej of rejections) {
      const operatorId = rej.workOrderLine?.productionLogs[0]?.operatorId
      if (operatorId) {
        rejectionsByOperator[operatorId] = (rejectionsByOperator[operatorId] ?? 0) + 1
      }
    }

    const operatorIds = Object.keys(rejectionsByOperator)
    if (operatorIds.length < 2) return null

    const totalRejections = Object.values(rejectionsByOperator).reduce((a, b) => a + b, 0)
    const avgRejections = totalRejections / operatorIds.length

    // Encontrar el operario con mas rechazos
    let worstOperator = operatorIds[0]!
    let worstCount = rejectionsByOperator[worstOperator]!
    for (const [opId, count] of Object.entries(rejectionsByOperator)) {
      if (count > worstCount) {
        worstOperator = opId
        worstCount = count
      }
    }

    const ratio = avgRejections > 0 ? worstCount / avgRejections : 0
    if (ratio < 2) return null

    // Obtener nombre del operario
    const operator = await db.user.findUnique({
      where: { id: worstOperator },
      select: { name: true },
    })

    return {
      type: 'OPERATOR_CORRELATION',
      title: `Operario con alta tasa de rechazos`,
      description: `${operator?.name ?? 'Operario'} tiene ${worstCount} rechazos (${ratio.toFixed(1)}x el promedio de ${Math.round(avgRejections)}).`,
      confidence: Math.min(ratio / 5, 0.9),
      data: { operatorId: worstOperator, rejections: worstCount, avgRejections, ratio },
    }
  }

  /**
   * Correlaciona errores con tipo de producto.
   * Ejemplo: "Jerseys tienen 2x mas errores de impresion que mangas"
   */
  async detectProductCorrelation(): Promise<PatternResult | null> {
    const db = getDatabase()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Incidentes por tipo de producto (usando el productType de la linea)
    const incidents = await db.incident.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        workOrderLineId: { not: null },
      },
      select: {
        type: true,
        workOrderLine: {
          select: { productType: true },
        },
      },
    })

    if (incidents.length < 5) return null

    const byProduct: Record<string, number> = {}
    for (const inc of incidents) {
      const pType = inc.workOrderLine?.productType ?? 'DESCONOCIDO'
      byProduct[pType] = (byProduct[pType] ?? 0) + 1
    }

    const products = Object.keys(byProduct)
    if (products.length < 2) return null

    const totalErrors = Object.values(byProduct).reduce((a, b) => a + b, 0)
    const avgErrors = totalErrors / products.length

    // Producto con mas errores
    let worstProduct = products[0]!
    let worstCount = byProduct[worstProduct]!
    for (const [prod, count] of Object.entries(byProduct)) {
      if (count > worstCount) {
        worstProduct = prod
        worstCount = count
      }
    }

    const ratio = avgErrors > 0 ? worstCount / avgErrors : 0
    if (ratio < 1.8) return null

    return {
      type: 'PRODUCT_CORRELATION',
      title: `Producto con alta tasa de errores`,
      description: `"${worstProduct}" tiene ${worstCount} incidentes (${ratio.toFixed(1)}x el promedio de ${Math.round(avgErrors)} por tipo de producto).`,
      confidence: Math.min(ratio / 4, 0.85),
      data: { productType: worstProduct, errors: worstCount, avgErrors, ratio, byProduct },
    }
  }

  /**
   * Detecta patrones de clientes.
   * Ejemplo: "Cliente Y requiere 3+ revisiones en 80% de ordenes"
   */
  async detectClientPatterns(): Promise<PatternResult | null> {
    const db = getDatabase()

    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    // Contar revisiones de diseno por cliente
    const approvals = await db.designApproval.findMany({
      where: { createdAt: { gte: ninetyDaysAgo } },
      select: {
        status: true,
        workOrder: {
          select: { customerId: true },
        },
      },
    })

    if (approvals.length < 5) return null

    // Revisiones (rechazos) por cliente
    const revisionsByClient: Record<string, { total: number; rejected: number }> = {}
    for (const app of approvals) {
      const clientId = app.workOrder.customerId
      if (!revisionsByClient[clientId]) {
        revisionsByClient[clientId] = { total: 0, rejected: 0 }
      }
      revisionsByClient[clientId]!.total++
      if (app.status === 'REJECTED' || app.status === 'CHANGES_REQUESTED') {
        revisionsByClient[clientId]!.rejected++
      }
    }

    // Buscar clientes con alta tasa de revision
    let worstClient: string | null = null
    let worstRate = 0
    for (const [clientId, stats] of Object.entries(revisionsByClient)) {
      if (stats.total >= 3) {
        const rate = stats.rejected / stats.total
        if (rate > worstRate) {
          worstClient = clientId
          worstRate = rate
        }
      }
    }

    if (!worstClient || worstRate < 0.5) return null

    const stats = revisionsByClient[worstClient]!
    const customer = await db.customer.findUnique({
      where: { id: worstClient },
      select: { firstName: true, lastName: true },
    })
    const name = customer ? `${customer.firstName} ${customer.lastName}` : 'Cliente'

    return {
      type: 'CLIENT_REVISION_PATTERN',
      title: `Cliente con alta tasa de revisiones`,
      description: `${name} rechaza/pide cambios en ${Math.round(worstRate * 100)}% de los disenos (${stats.rejected} de ${stats.total} revisiones).`,
      confidence: Math.min(worstRate, 0.9),
      data: {
        clientId: worstClient,
        rejectionRate: worstRate,
        totalReviews: stats.total,
        rejections: stats.rejected,
      },
    }
  }

  /**
   * Detecta cuello de botella en produccion.
   * Ejemplo: "Estacion CORTE es cuello de botella: 2.5x mas lenta que IMPRESION"
   */
  async detectBottleneck(): Promise<PatternResult | null> {
    const db = getDatabase()

    const stations = ['IMPRESION', 'CORTE', 'ARMADO', 'EMPAQUE'] as const

    const stationStats = await Promise.all(
      stations.map(async (station) => {
        const agg = await db.productionLog.aggregate({
          where: {
            station,
            durationSeconds: { not: null },
          },
          _avg: { durationSeconds: true },
          _count: true,
        })

        const queueCount = await db.workOrderLine.count({
          where: { currentStation: station },
        })

        return {
          station,
          avgDuration: agg._avg.durationSeconds ?? 0,
          completedCount: agg._count,
          queueDepth: queueCount,
        }
      }),
    )

    // Necesitamos datos de al menos 2 estaciones
    const withData = stationStats.filter((s) => s.completedCount >= 3)
    if (withData.length < 2) return null

    const avgDuration = withData.reduce((sum, s) => sum + s.avgDuration, 0) / withData.length

    // Estacion mas lenta
    let slowest = withData[0]!
    for (const s of withData) {
      if (s.avgDuration > slowest.avgDuration) {
        slowest = s
      }
    }

    const ratio = avgDuration > 0 ? slowest.avgDuration / avgDuration : 0

    // Tambien verificar por profundidad de cola
    let deepestQueue = withData[0]!
    for (const s of withData) {
      if (s.queueDepth > deepestQueue.queueDepth) {
        deepestQueue = s
      }
    }

    // Cuello de botella si es 1.5x mas lento O tiene la cola mas grande por mucho
    const isBottleneck = ratio > 1.5 || deepestQueue.queueDepth > 5
    if (!isBottleneck) return null

    const bottleneckStation = ratio > 1.5 ? slowest : deepestQueue

    return {
      type: 'BOTTLENECK',
      title: `Cuello de botella detectado en ${bottleneckStation.station}`,
      description: `Estacion ${bottleneckStation.station}: duracion promedio ${Math.round(bottleneckStation.avgDuration)}s (${ratio.toFixed(1)}x promedio), cola de ${bottleneckStation.queueDepth} items.`,
      confidence: Math.min(ratio / 3, 0.9),
      data: {
        station: bottleneckStation.station,
        avgDuration: bottleneckStation.avgDuration,
        queueDepth: bottleneckStation.queueDepth,
        allStations: stationStats,
      },
    }
  }
}

/** Singleton del detector de patrones */
export const patternDetector = new PatternDetector()
