import type { FastifyInstance } from 'fastify'

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'voneb_webhook_2026'

export default async function whatsappWebhookRoutes(fastify: FastifyInstance) {
  // ─── GET: Verificacion del webhook (Meta lo llama una vez para validar) ───
  fastify.get('/api/webhooks/whatsapp', async (request, reply) => {
    const query = request.query as Record<string, string>

    const mode = query['hub.mode']
    const token = query['hub.verify_token']
    const challenge = query['hub.challenge']

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      fastify.log.info('Webhook WhatsApp verificado exitosamente')
      return reply.code(200).send(challenge)
    }

    fastify.log.warn('Verificacion de webhook fallida — token invalido')
    return reply.code(403).send('Forbidden')
  })

  // ─── POST: Recibir mensajes entrantes de WhatsApp ─────────────────────────
  fastify.post('/api/webhooks/whatsapp', async (request, reply) => {
    const body = request.body as any

    // Meta siempre espera 200 inmediato
    reply.code(200).send('EVENT_RECEIVED')

    // Procesar async
    try {
      if (!body?.entry) return

      for (const entry of body.entry) {
        for (const change of entry.changes || []) {
          if (change.field !== 'messages') continue

          const value = change.value
          if (!value?.messages) continue

          for (const message of value.messages) {
            const from = message.from // numero del cliente
            const text = message.text?.body || ''
            const type = message.type // text, image, document, audio, etc.
            const timestamp = message.timestamp
            const messageId = message.id

            fastify.log.info({
              from,
              type,
              text: text.substring(0, 100),
              messageId,
            }, 'Mensaje WhatsApp recibido')

            // TODO: Aqui se conecta con el ClientCommunicationEngine
            // const intent = await clientCommunicationEngine.parseClientMessage(text, {
            //   channel: 'whatsapp',
            //   clientPhone: from,
            // })
            // const response = await clientCommunicationEngine.generateResponse(intent, context)
            // await sendWhatsAppMessage(from, response.message)
          }
        }
      }
    } catch (err) {
      fastify.log.error({ err }, 'Error procesando webhook WhatsApp')
    }
  })
}
