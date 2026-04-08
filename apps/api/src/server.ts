import Fastify from 'fastify'
import { validateEnv } from './config/env.js'
import securityPlugin from './plugins/security.js'
import errorHandlerPlugin from './plugins/error-handler.js'
import authPlugin from './plugins/auth.js'
import healthRoutes from './routes/health.js'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import variantRoutes from './routes/variants.js'
import categoryRoutes from './routes/categories.js'
import inventoryRoutes from './routes/inventory.js'
import customerRoutes from './routes/customers.js'
import orderRoutes from './routes/orders.js'
import dashboardRoutes from './routes/dashboard.js'
import conversationRoutes from './routes/conversations.js'
import crmRoutes from './routes/crm.js'
import notificationRoutes from './routes/notifications.js'
import configRoutes from './routes/config.js'
import workOrderRoutes from './routes/work-orders.js'
import productionRoutes from './routes/production.js'
import qualityRoutes from './routes/quality.js'
import incidentRoutes from './routes/incidents.js'
import designRoutes from './routes/design.js'
import labelRoutes from './routes/labels.js'
import deliveryRoutes from './routes/deliveries.js'
import trackingRoutes from './routes/tracking.js'
import aiRoutes from './routes/ai.js'
import whatsappWebhookRoutes from './routes/whatsapp-webhook.js'
import { disconnectDatabase } from '@voneb/database'
import { initAIBrain, stopAIBrain } from './services/ai/index.js'

async function buildApp(): Promise<ReturnType<typeof Fastify>> {
  const env = validateEnv()

  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty' }
          : undefined,
      redact: [
        'req.headers.authorization',
        'req.headers.cookie',
        'body.password',
        'body.currentPassword',
        'body.newPassword',
        'body.token',
      ],
    },
  })

  // --- Plugins (order matters) ---
  await app.register(securityPlugin)
  await app.register(errorHandlerPlugin)
  await app.register(authPlugin)

  // --- Routes ---
  await app.register(healthRoutes)
  await app.register(authRoutes)
  await app.register(productRoutes)
  await app.register(variantRoutes)
  await app.register(categoryRoutes)
  await app.register(inventoryRoutes)
  await app.register(customerRoutes)
  await app.register(orderRoutes)
  await app.register(dashboardRoutes)
  await app.register(conversationRoutes)
  await app.register(crmRoutes)
  await app.register(notificationRoutes)
  await app.register(configRoutes)
  await app.register(workOrderRoutes)
  await app.register(productionRoutes)
  await app.register(qualityRoutes)
  await app.register(incidentRoutes)
  await app.register(designRoutes)
  await app.register(labelRoutes)
  await app.register(deliveryRoutes)
  await app.register(trackingRoutes)
  await app.register(aiRoutes)
  await app.register(whatsappWebhookRoutes)

  // Inicializar el cerebro AI (timers y suscripciones al bus de eventos)
  initAIBrain()

  return app
}

async function start(): Promise<void> {
  const env = validateEnv()
  const app = await buildApp()

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']

  for (const signal of signals) {
    process.on(signal, () => {
      app.log.info(`Received ${signal}, shutting down gracefully...`)

      app
        .close()
        .then(async () => {
          stopAIBrain()
          await disconnectDatabase()
          app.log.info('Server closed')
          process.exit(0)
        })
        .catch((err: unknown) => {
          app.log.error({ err }, 'Error during shutdown')
          process.exit(1)
        })
    })
  }

  // Unhandled rejection safety net
  process.on('unhandledRejection', (reason: unknown) => {
    app.log.error({ err: reason }, 'Unhandled rejection')
  })

  await app.listen({ port: env.PORT, host: '0.0.0.0' })
  app.log.info(`V ONE B API running on http://0.0.0.0:${env.PORT}`)
}

start().catch((err: unknown) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
