// ─────────────────────────────────────────────
// V ONE B WhatsApp Chatbot — Entry Point
// ─────────────────────────────────────────────

import pino from 'pino'
import { getDatabase, disconnectDatabase } from '@voneb/database'
import { createWhatsAppProvider } from './providers/factory.js'
import { createMessageRouter } from './message-router.js'

const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  transport:
    process.env['NODE_ENV'] === 'development'
      ? { target: 'pino-pretty' }
      : undefined,
})

async function main(): Promise<void> {
  logger.info('V ONE B Chatbot starting...')

  // 1. Test database connection
  const db = getDatabase()
  await db.$connect()
  logger.info('Database connected')

  // 2. Initialize WhatsApp provider
  const provider = createWhatsAppProvider()
  await provider.initialize()
  logger.info('WhatsApp provider initialized')

  // 3. Set up message routing
  const routeMessage = createMessageRouter(provider)
  provider.onMessage(routeMessage)
  logger.info('Message router active')

  logger.info('V ONE B Chatbot ready and listening for messages')

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down...`)

    try {
      await provider.shutdown()
      logger.info('WhatsApp provider disconnected')
    } catch (err: unknown) {
      logger.error({ err }, 'Error shutting down provider')
    }

    try {
      await disconnectDatabase()
      logger.info('Database disconnected')
    } catch (err: unknown) {
      logger.error({ err }, 'Error disconnecting database')
    }

    process.exit(0)
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error({ err: reason }, 'Unhandled rejection')
  })
}

main().catch((err: unknown) => {
  logger.error({ err }, 'Failed to start chatbot')
  process.exit(1)
})
