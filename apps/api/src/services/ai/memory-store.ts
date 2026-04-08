import { getDatabase } from '@voneb/database'

// ─────────────────────────────────────────────
// Capa 3 — Memoria persistente del cerebro AI
// Usa la tabla AIMemory para almacenar metricas
// con media movil exponencial y deteccion de tendencia.
// ─────────────────────────────────────────────

/** Factor de aprendizaje para EMA (lento y estable) */
const ALPHA = 0.1

/** Muestras minimas para calcular tendencia */
const MIN_SAMPLES_FOR_TREND = 5

/**
 * Calcula la tendencia comparando valor actual vs promedio.
 * Si el valor esta consistentemente por encima = SUBIENDO,
 * si esta por debajo = BAJANDO, si no = ESTABLE.
 */
function calculateTrend(currentValue: number, emaValue: number, sampleCount: number): string {
  if (sampleCount < MIN_SAMPLES_FOR_TREND) return 'STABLE'

  const deviation = (currentValue - emaValue) / (Math.abs(emaValue) || 1)

  if (deviation > 0.15) return 'SUBIENDO'
  if (deviation < -0.15) return 'BAJANDO'
  return 'STABLE'
}

class MemoryStore {
  /**
   * Actualiza una metrica con media movil exponencial.
   * Si no existe, la crea. Si existe, recalcula el EMA.
   *
   * Formula: newAvg = alpha * newValue + (1-alpha) * oldAvg
   */
  async updateMetric(key: string, newValue: number): Promise<void> {
    const db = getDatabase()

    const existing = await db.aIMemory.findUnique({
      where: { metricKey: key },
    })

    if (!existing) {
      await db.aIMemory.create({
        data: {
          metricKey: key,
          value: newValue,
          sampleCount: 1,
          trend: 'STABLE',
          metadata: { lastRawValue: newValue, recentValues: [newValue] },
        },
      })
      return
    }

    // EMA: newAvg = alpha * newValue + (1 - alpha) * oldAvg
    const newEma = ALPHA * newValue + (1 - ALPHA) * existing.value
    const newSampleCount = existing.sampleCount + 1

    // Mantener ultimos 10 valores para tendencia
    const meta = (existing.metadata as Record<string, unknown>) ?? {}
    const recentValues = Array.isArray(meta['recentValues'])
      ? (meta['recentValues'] as number[]).slice(-9)
      : []
    recentValues.push(newValue)

    const trend = calculateTrend(newValue, newEma, newSampleCount)

    await db.aIMemory.update({
      where: { metricKey: key },
      data: {
        value: newEma,
        sampleCount: newSampleCount,
        trend,
        metadata: { lastRawValue: newValue, recentValues },
      },
    })
  }

  /**
   * Obtiene una metrica con su valor EMA, conteo y tendencia.
   */
  async getMetric(key: string): Promise<{
    value: number
    sampleCount: number
    trend: string
  } | null> {
    const db = getDatabase()

    const record = await db.aIMemory.findUnique({
      where: { metricKey: key },
    })

    if (!record) return null

    return {
      value: record.value,
      sampleCount: record.sampleCount,
      trend: record.trend,
    }
  }

  /**
   * Obtiene todas las metricas almacenadas.
   */
  async getAllMetrics(): Promise<
    Map<string, { value: number; trend: string; sampleCount: number }>
  > {
    const db = getDatabase()

    const records = await db.aIMemory.findMany()
    const map = new Map<string, { value: number; trend: string; sampleCount: number }>()

    for (const r of records) {
      map.set(r.metricKey, {
        value: r.value,
        trend: r.trend,
        sampleCount: r.sampleCount,
      })
    }

    return map
  }

  /**
   * Obtiene los valores recientes crudos de una metrica (para calculo de stddev).
   */
  async getRecentValues(key: string): Promise<number[]> {
    const db = getDatabase()

    const record = await db.aIMemory.findUnique({
      where: { metricKey: key },
    })

    if (!record) return []

    const meta = (record.metadata as Record<string, unknown>) ?? {}
    return Array.isArray(meta['recentValues']) ? (meta['recentValues'] as number[]) : []
  }

  // ── Patrones ──

  /**
   * Almacena un patron detectado en la tabla AIPattern.
   */
  async storePattern(pattern: {
    type: string
    title: string
    description: string
    confidence: number
    data: unknown
  }): Promise<void> {
    const db = getDatabase()

    await db.aIPattern.create({
      data: {
        patternType: pattern.type,
        title: pattern.title,
        description: pattern.description,
        confidence: pattern.confidence,
        data: pattern.data as Record<string, unknown>,
      },
    })
  }

  /**
   * Obtiene patrones activos (no reconocidos) ordenados por confianza.
   */
  async getActivePatterns(limit = 20): Promise<
    Array<{
      id: string
      type: string
      title: string
      description: string
      confidence: number
      detectedAt: Date
    }>
  > {
    const db = getDatabase()

    const records = await db.aIPattern.findMany({
      where: { acknowledged: false },
      orderBy: { confidence: 'desc' },
      take: limit,
    })

    return records.map((r: { id: string; patternType: string; title: string; description: string; confidence: number; detectedAt: Date }) => ({
      id: r.id,
      type: r.patternType,
      title: r.title,
      description: r.description,
      confidence: r.confidence,
      detectedAt: r.detectedAt,
    }))
  }

  /**
   * Marca un patron como reconocido (ya no aparece en insights activos).
   */
  async acknowledgePattern(id: string): Promise<void> {
    const db = getDatabase()

    await db.aIPattern.update({
      where: { id },
      data: { acknowledged: true },
    })
  }
}

/** Singleton del almacen de memoria AI */
export const memoryStore = new MemoryStore()
