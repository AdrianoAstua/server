import type { FastifyInstance } from 'fastify'
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js'
import { success, paginated } from '../lib/reply.js'
import { ForbiddenError, NotFoundError } from '../lib/errors.js'
import {
  consultationParamsSchema,
  aiActionsQuerySchema,
  respondConsultationSchema,
  triggerAnalysisSchema,
} from '../schemas/ai-schemas.js'
import type {
  ConsultationParams,
  AIActionsQuery,
  RespondConsultation,
  TriggerAnalysis,
} from '../schemas/ai-schemas.js'
import { brainAnalytics } from '../services/ai/brain-analytics.js'
import { consultationManager } from '../services/ai/consultation-manager.js'
import { actionExecutor } from '../services/ai/action-executor.js'
import { patternDetector } from '../services/ai/pattern-detector.js'
import { predictor } from '../services/ai/predictor.js'
import { aiBus } from '../services/ai/event-bus.js'
import { realtimeAssistant } from '../services/ai/realtime-assistant.js'
import { seedAIBrain, TRAINING_SCENARIOS } from '../services/ai/training-data.js'
import { clientCommunicationEngine } from '../services/ai/client-communication.js'
import {
  testCommunicationAccuracy,
  getTrainingStats,
  CONVERSATION_TRAINING,
} from '../services/ai/communication-training.js'

const ADMIN_ROLES = ['ADMIN']
const VENTAS_ROLES = ['ADMIN', 'VENTAS']
const SUPERVISOR_ROLES = ['ADMIN', 'SUPERVISOR_GENERAL']

export default async function aiRoutes(fastify: FastifyInstance): Promise<void> {
  // ─────────────────────────────────────────────
  // GET /api/ai/dashboard — Dashboard completo del cerebro AI
  // ─────────────────────────────────────────────
  fastify.get(
    '/api/ai/dashboard',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userRole = request.user?.role
      if (!SUPERVISOR_ROLES.includes(userRole)) {
        throw new ForbiddenError('Solo ADMIN o SUPERVISOR_GENERAL pueden ver el dashboard AI')
      }
      const dashboard = await brainAnalytics.getDashboard()
      return success(reply, dashboard)
    },
  )

  // ─────────────────────────────────────────────
  // GET /api/ai/actions — Acciones recientes (paginadas)
  // ─────────────────────────────────────────────
  fastify.get(
    '/api/ai/actions',
    {
      preHandler: [fastify.authenticate, validateQuery(aiActionsQuerySchema)],
    },
    async (request, reply) => {
      const { page, limit } = request.query as AIActionsQuery
      const offset = (page - 1) * limit
      const actions = await brainAnalytics.getRecentActions(limit, offset)

      // Contar total para paginacion
      const { getDatabase } = await import('@voneb/database')
      const db = getDatabase()
      const total = await db.aIActionLog.count()

      return paginated(reply, actions, page, limit, total)
    },
  )

  // ─────────────────────────────────────────────
  // GET /api/ai/actions/today — Resumen de hoy
  // ─────────────────────────────────────────────
  fastify.get(
    '/api/ai/actions/today',
    {
      preHandler: [fastify.authenticate],
    },
    async (_request, reply) => {
      const actions = await brainAnalytics.getActionsToday()
      return success(reply, {
        count: actions.length,
        actions,
      })
    },
  )

  // ─────────────────────────────────────────────
  // GET /api/ai/insights — Patrones/insights activos
  // ─────────────────────────────────────────────
  fastify.get(
    '/api/ai/insights',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userRole = request.user?.role
      if (!SUPERVISOR_ROLES.includes(userRole)) {
        throw new ForbiddenError('Solo ADMIN o SUPERVISOR_GENERAL pueden ver insights')
      }
      const insights = await brainAnalytics.getActiveInsights()
      return success(reply, insights)
    },
  )

  // ─────────────────────────────────────────────
  // GET /api/ai/consultations — Consultas pendientes del usuario actual
  // ─────────────────────────────────────────────
  fastify.get(
    '/api/ai/consultations',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.id
      const userRole = request.user.role

      // Obtener consultas dirigidas al usuario O a su rol
      const [forUser, forRole] = await Promise.all([
        consultationManager.getPendingForUser(userId),
        consultationManager.getPendingForRole(userRole),
      ])

      // Combinar y deduplicar
      const seen = new Set<string>()
      const combined = []
      for (const c of [...forUser, ...forRole]) {
        if (!seen.has(c.id)) {
          seen.add(c.id)
          combined.push(c)
        }
      }

      return success(reply, combined)
    },
  )

  // ─────────────────────────────────────────────
  // POST /api/ai/consultations/:id/respond — Responder consulta
  // ─────────────────────────────────────────────
  fastify.post(
    '/api/ai/consultations/:id/respond',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(consultationParamsSchema),
        validateBody(respondConsultationSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as ConsultationParams
      const { response } = request.body as RespondConsultation
      const userId = request.user.id

      const consultation = await consultationManager.getById(id)
      if (!consultation) {
        throw new NotFoundError('Consulta no encontrada')
      }

      const updated = await consultationManager.respond(id, response, userId)

      // Si fue aprobada, ejecutar la accion
      if (updated.status === 'APPROVED') {
        const options = updated.options as Array<{ label: string; action: string }>
        const firstAction = options?.[0]?.action ?? 'approved'
        await actionExecutor.executeApproved(id, firstAction)
      }

      return success(reply, updated)
    },
  )

  // ─────────────────────────────────────────────
  // GET /api/ai/health — Puntaje de salud del sistema
  // ─────────────────────────────────────────────
  fastify.get(
    '/api/ai/health',
    {
      preHandler: [fastify.authenticate],
    },
    async (_request, reply) => {
      const health = await brainAnalytics.getHealthScore()
      return success(reply, health)
    },
  )

  // ─────────────────────────────────────────────
  // GET /api/ai/predictions — Predicciones actuales
  // ─────────────────────────────────────────────
  fastify.get(
    '/api/ai/predictions',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userRole = request.user?.role
      if (!SUPERVISOR_ROLES.includes(userRole)) {
        throw new ForbiddenError('Solo ADMIN o SUPERVISOR_GENERAL pueden ver predicciones')
      }

      const [predictions, capacity, learning] = await Promise.all([
        brainAnalytics.getPredictions(),
        predictor.predictDailyCapacity(),
        brainAnalytics.getLearningProgress(),
      ])

      return success(reply, {
        ...predictions,
        capacity,
        learning,
      })
    },
  )

  // ─────────────────────────────────────────────
  // POST /api/ai/analyze — Disparar analisis manual
  // ─────────────────────────────────────────────
  fastify.post(
    '/api/ai/analyze',
    {
      preHandler: [fastify.authenticate, validateBody(triggerAnalysisSchema)],
    },
    async (request, reply) => {
      const userRole = request.user?.role
      if (!ADMIN_ROLES.includes(userRole)) {
        throw new ForbiddenError('Solo ADMIN puede disparar analisis manual')
      }

      const { type } = request.body as TriggerAnalysis

      const results: Record<string, unknown> = {}

      if (type === 'patterns' || type === 'full') {
        const patterns = await patternDetector.detectAll()
        results['patterns'] = patterns
      }

      if (type === 'predictions' || type === 'full') {
        const predictions = await brainAnalytics.getPredictions()
        const capacity = await predictor.predictDailyCapacity()
        results['predictions'] = predictions
        results['capacity'] = capacity
      }

      if (type === 'full') {
        const health = await brainAnalytics.getHealthScore()
        const learning = await brainAnalytics.getLearningProgress()
        results['health'] = health
        results['learning'] = learning

        // Emitir evento de timer para que el engine procese
        aiBus.emitEvent('timer.hourly', {}, 'manual_analysis')
      }

      await actionExecutor.executeAutonomous({
        type: 'MANUAL_ANALYSIS',
        title: `Analisis manual disparado (${type})`,
        description: `Analisis tipo "${type}" ejecutado por administrador.`,
        triggeredBy: 'manual',
        metadata: { analysisType: type },
      })

      return success(reply, results)
    },
  )

  // ─────────────────────────────────────────────
  // GET /api/ai/learning — Progreso de aprendizaje
  // ─────────────────────────────────────────────
  fastify.get(
    '/api/ai/learning',
    {
      preHandler: [fastify.authenticate],
    },
    async (_request, reply) => {
      const learning = await brainAnalytics.getLearningProgress()
      const eventStats = brainAnalytics.getEventBusStats()

      return success(reply, {
        ...learning,
        eventBus: eventStats,
      })
    },
  )

  // ─────────────────────────────────────────────
  // GET /api/ai/help — Ayuda contextual en tiempo real
  // Query: panel, action, workOrderId (opcional)
  // ─────────────────────────────────────────────
  fastify.get(
    '/api/ai/help',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const query = request.query as {
        panel?: string
        action?: string
        workOrderId?: string
        lineBarcode?: string
      }

      const context = {
        panel: query.panel ?? 'produccion',
        action: query.action ?? 'scanning',
        workOrderId: query.workOrderId,
        lineBarcode: query.lineBarcode,
        userId: request.user.id,
      }

      const help = await realtimeAssistant.getHelp(context)
      return success(reply, help)
    },
  )

  // ─────────────────────────────────────────────
  // GET /api/ai/suggest — Sugerencia de siguiente accion
  // ─────────────────────────────────────────────
  fastify.get(
    '/api/ai/suggest',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.id
      const userRole = request.user.role

      const [suggestion, stuck] = await Promise.all([
        realtimeAssistant.getSuggestedNextAction(userId, userRole),
        realtimeAssistant.checkOperatorStuck(userId),
      ])

      return success(reply, {
        suggestion,
        stuck,
      })
    },
  )

  // ─────────────────────────────────────────────
  // GET /api/ai/help/preaction — Advertencias pre-accion
  // Query: action, workOrderId
  // ─────────────────────────────────────────────
  fastify.get(
    '/api/ai/help/preaction',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const query = request.query as {
        action?: string
        workOrderId?: string
      }

      if (!query.action || !query.workOrderId) {
        return success(reply, { warnings: [] })
      }

      const warnings = await realtimeAssistant.getPreActionWarnings({
        action: query.action,
        workOrderId: query.workOrderId,
      })

      return success(reply, { warnings })
    },
  )

  // ─────────────────────────────────────────────
  // POST /api/ai/parse-message — Parsear mensaje de cliente y retornar intencion
  // ─────────────────────────────────────────────
  fastify.post(
    '/api/ai/parse-message',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userRole = request.user?.role
      if (!VENTAS_ROLES.includes(userRole)) {
        throw new ForbiddenError('Solo ADMIN o VENTAS pueden parsear mensajes')
      }

      const body = request.body as {
        message: string
        clientId?: string
        workOrderId?: string
        channel?: 'whatsapp' | 'email' | 'phone' | 'in_person'
        previousMessages?: string[]
      }

      if (!body.message && body.message !== '') {
        return success(reply, { error: 'Se requiere el campo "message"' })
      }

      const intent = await clientCommunicationEngine.parseClientMessage(body.message, {
        clientId: body.clientId,
        workOrderId: body.workOrderId,
        channel: body.channel ?? 'whatsapp',
        previousMessages: body.previousMessages,
      })

      return success(reply, intent)
    },
  )

  // ─────────────────────────────────────────────
  // POST /api/ai/generate-response — Generar respuesta para una intencion
  // ─────────────────────────────────────────────
  fastify.post(
    '/api/ai/generate-response',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userRole = request.user?.role
      if (!VENTAS_ROLES.includes(userRole)) {
        throw new ForbiddenError('Solo ADMIN o VENTAS pueden generar respuestas')
      }

      const body = request.body as {
        message: string
        clientId?: string
        clientName?: string
        workOrderId?: string
        channel?: 'whatsapp' | 'email' | 'phone' | 'in_person'
        previousMessages?: string[]
      }

      if (!body.message && body.message !== '') {
        return success(reply, { error: 'Se requiere el campo "message"' })
      }

      // Parsear intencion
      const intent = await clientCommunicationEngine.parseClientMessage(body.message, {
        clientId: body.clientId,
        workOrderId: body.workOrderId,
        channel: body.channel ?? 'whatsapp',
        previousMessages: body.previousMessages,
      })

      // Generar respuesta
      const response = await clientCommunicationEngine.generateResponse(intent, {
        clientId: body.clientId,
        clientName: body.clientName,
        workOrderId: body.workOrderId,
        channel: body.channel ?? 'whatsapp',
        previousMessages: body.previousMessages,
      })

      return success(reply, {
        intent,
        response,
      })
    },
  )

  // ─────────────────────────────────────────────
  // GET /api/ai/communication-stats — Stats del sistema de comunicacion
  // ─────────────────────────────────────────────
  fastify.get(
    '/api/ai/communication-stats',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userRole = request.user?.role
      if (!ADMIN_ROLES.includes(userRole)) {
        throw new ForbiddenError('Solo ADMIN puede ver stats de comunicacion')
      }

      const stats = getTrainingStats()

      return success(reply, {
        trainingScenarios: stats.total,
        byCategory: stats.byCategory,
        byIntent: stats.byIntent,
        ambiguousScenarios: stats.ambiguous,
        clearScenarios: stats.clear,
      })
    },
  )

  // ─────────────────────────────────────────────
  // POST /api/ai/test-communication — Test de precision contra datos de entrenamiento
  // ─────────────────────────────────────────────
  fastify.post(
    '/api/ai/test-communication',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userRole = request.user?.role
      if (!ADMIN_ROLES.includes(userRole)) {
        throw new ForbiddenError('Solo ADMIN puede ejecutar test de comunicacion')
      }

      const results = await testCommunicationAccuracy()

      return success(reply, results)
    },
  )

  // ─────────────────────────────────────────────
  // POST /api/ai/seed — Sembrar cerebro con datos de entrenamiento (ADMIN)
  // ─────────────────────────────────────────────
  fastify.post(
    '/api/ai/seed',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userRole = request.user?.role
      if (!ADMIN_ROLES.includes(userRole)) {
        throw new ForbiddenError('Solo ADMIN puede sembrar el cerebro AI')
      }

      const result = await seedAIBrain()

      await actionExecutor.executeAutonomous({
        type: 'BRAIN_SEED',
        title: 'Cerebro AI sembrado manualmente',
        description: `${result.scenariosLoaded} escenarios y ${result.metricsSeeded} metricas cargadas. Total escenarios disponibles: ${TRAINING_SCENARIOS.length}.`,
        triggeredBy: 'manual',
        metadata: result,
      })

      return success(reply, {
        ...result,
        totalScenariosAvailable: TRAINING_SCENARIOS.length,
      })
    },
  )
}
