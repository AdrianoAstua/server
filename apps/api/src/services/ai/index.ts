import { aiBus } from './event-bus.js'
import { decisionEngine } from './decision-engine.js'
import { seedAIBrain } from './training-data.js'

// ─────────────────────────────────────────────
// Inicializacion del cerebro AI
// Conecta el bus de eventos al motor de decision
// e inicia los timers periodicos.
// Pre-carga datos de entrenamiento al arrancar.
// ─────────────────────────────────────────────

let initialized = false
let periodicTimer: ReturnType<typeof setInterval> | null = null
let hourlyTimer: ReturnType<typeof setInterval> | null = null
let dailyTimer: ReturnType<typeof setInterval> | null = null

/**
 * Inicializa el cerebro AI:
 * 1. Suscribe todos los tipos de evento al DecisionEngine
 * 2. Inicia timers periodicos (5min, 1h, 24h)
 *
 * Llamar una sola vez al iniciar el servidor.
 */
export function initAIBrain(): void {
  if (initialized) return
  initialized = true

  console.log('[AI Brain] Inicializando cerebro AI...')

  // Suscribir TODOS los tipos de evento al motor de decision
  const eventTypes = [
    'work_order.created',
    'work_order.status_changed',
    'production.scanned_in',
    'production.scanned_out',
    'quality.checked',
    'incident.created',
    'incident.resolved',
    'design.uploaded',
    'design.approved',
    'design.rejected',
    'delivery.shipped',
    'delivery.confirmed',
    'whatsapp.message_received',
    'shopify.order_created',
    'timer.periodic',
    'timer.hourly',
    'timer.daily',
  ] as const

  for (const eventType of eventTypes) {
    aiBus.subscribe(eventType, async (event) => {
      await decisionEngine.processEvent(event)
    })
  }

  // Timer periodico: cada 5 minutos
  periodicTimer = setInterval(() => {
    aiBus.emitEvent('timer.periodic', {}, 'scheduler')
  }, 5 * 60 * 1000)

  // Timer horario: cada 60 minutos
  hourlyTimer = setInterval(() => {
    aiBus.emitEvent('timer.hourly', {}, 'scheduler')
  }, 60 * 60 * 1000)

  // Timer diario: cada 24 horas
  dailyTimer = setInterval(() => {
    aiBus.emitEvent('timer.daily', {}, 'scheduler')
  }, 24 * 60 * 60 * 1000)

  console.log('[AI Brain] Cerebro AI inicializado. Timers: 5min, 1h, 24h.')

  // Pre-cargar datos de entrenamiento (async, no bloquea el inicio)
  seedAIBrain()
    .then(({ scenariosLoaded, metricsSeeded }) => {
      console.log(
        `[AI Brain] Datos de entrenamiento cargados: ${scenariosLoaded} escenarios, ${metricsSeeded} metricas.`,
      )
    })
    .catch((err) => {
      console.warn('[AI Brain] No se pudieron cargar datos de entrenamiento (DB no lista?):', err)
    })
}

/**
 * Detiene el cerebro AI (para shutdown limpio).
 */
export function stopAIBrain(): void {
  if (periodicTimer) clearInterval(periodicTimer)
  if (hourlyTimer) clearInterval(hourlyTimer)
  if (dailyTimer) clearInterval(dailyTimer)
  periodicTimer = null
  hourlyTimer = null
  dailyTimer = null
  initialized = false
  console.log('[AI Brain] Cerebro AI detenido.')
}

// Re-exportar todo para acceso centralizado
export { aiBus } from './event-bus.js'
export { memoryStore } from './memory-store.js'
export { anomalyDetector } from './anomaly-detector.js'
export { patternDetector } from './pattern-detector.js'
export { predictor } from './predictor.js'
export { consultationManager } from './consultation-manager.js'
export { actionExecutor } from './action-executor.js'
export { decisionEngine } from './decision-engine.js'
export { brainAnalytics } from './brain-analytics.js'
export { realtimeAssistant } from './realtime-assistant.js'
export { seedAIBrain, TRAINING_SCENARIOS, searchScenarios } from './training-data.js'
export { clientCommunicationEngine } from './client-communication.js'
export {
  CONVERSATION_TRAINING,
  testCommunicationAccuracy,
  getTrainingStats,
  getTrainingByCategory,
  getTrainingByIntent,
  getAmbiguousScenarios,
} from './communication-training.js'
