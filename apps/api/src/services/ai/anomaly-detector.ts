import { memoryStore } from './memory-store.js'

// ─────────────────────────────────────────────
// Detector de anomalias basado en Z-score
// Identifica valores atipicos comparando contra
// la distribucion historica (media + stddev).
// ─────────────────────────────────────────────

/** Umbral default de Z-score para considerar anomalia */
const DEFAULT_Z_THRESHOLD = 2.0

/**
 * Calcula la desviacion estandar de un conjunto de valores.
 */
function stdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0
  const squaredDiffs = values.map((v) => (v - mean) ** 2)
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

class AnomalyDetector {
  /**
   * Verifica si un valor es anomalo dado la media y desviacion estandar historica.
   * Retorna true si |z-score| > threshold.
   */
  isAnomaly(
    value: number,
    mean: number,
    stdev: number,
    threshold = DEFAULT_Z_THRESHOLD,
  ): boolean {
    if (stdev === 0) return false // Sin varianza, no se puede determinar
    const zScore = Math.abs((value - mean) / stdev)
    return zScore > threshold
  }

  /**
   * Verifica si la duracion de una estacion es anomala.
   * Compara contra la media historica almacenada en memoria.
   */
  async checkTimeAnomaly(
    station: string,
    durationSeconds: number,
  ): Promise<{ isAnomaly: boolean; zScore: number; expected: number }> {
    const metricKey = `avg_time_${station}`
    const metric = await memoryStore.getMetric(metricKey)

    if (!metric || metric.sampleCount < 5) {
      // Sin suficientes datos para detectar anomalias
      return { isAnomaly: false, zScore: 0, expected: metric?.value ?? 0 }
    }

    const recentValues = await memoryStore.getRecentValues(metricKey)
    const stdev = stdDev(recentValues, metric.value)

    if (stdev === 0) {
      return { isAnomaly: false, zScore: 0, expected: metric.value }
    }

    const zScore = (durationSeconds - metric.value) / stdev

    return {
      isAnomaly: Math.abs(zScore) > DEFAULT_Z_THRESHOLD,
      zScore: Math.round(zScore * 100) / 100,
      expected: Math.round(metric.value),
    }
  }

  /**
   * Verifica si la tasa de errores esta en pico.
   * Compara la tasa reciente contra la tasa normal almacenada.
   */
  async checkErrorSpike(
    type: string,
    recentCount: number,
    periodHours: number,
  ): Promise<{ isSpike: boolean; rate: number; normalRate: number }> {
    const metricKey = `error_rate_${type}`
    const metric = await memoryStore.getMetric(metricKey)

    const currentRate = periodHours > 0 ? recentCount / periodHours : 0
    const normalRate = metric?.value ?? 0

    // Es pico si la tasa actual supera 2x la normal Y hay al menos 2 errores
    const isSpike = normalRate > 0
      ? currentRate > normalRate * 2 && recentCount >= 2
      : recentCount >= 3 // Sin historico, 3+ errores en el periodo = pico

    return {
      isSpike,
      rate: Math.round(currentRate * 100) / 100,
      normalRate: Math.round(normalRate * 100) / 100,
    }
  }

  /**
   * Verifica si la profundidad de cola de una estacion es anomala.
   */
  async checkQueueAnomaly(
    station: string,
    depth: number,
  ): Promise<{ isAnomaly: boolean; expected: number }> {
    const metricKey = `queue_depth_${station}`
    const metric = await memoryStore.getMetric(metricKey)

    if (!metric || metric.sampleCount < 5) {
      // Sin datos suficientes, considerar anomalia si cola > 10
      return { isAnomaly: depth > 10, expected: metric?.value ?? 0 }
    }

    const recentValues = await memoryStore.getRecentValues(metricKey)
    const stdev = stdDev(recentValues, metric.value)

    const isAnomaly = this.isAnomaly(depth, metric.value, stdev, DEFAULT_Z_THRESHOLD)

    return {
      isAnomaly: isAnomaly && depth > metric.value, // Solo alerta si la cola crece
      expected: Math.round(metric.value),
    }
  }
}

/** Singleton del detector de anomalias */
export const anomalyDetector = new AnomalyDetector()
