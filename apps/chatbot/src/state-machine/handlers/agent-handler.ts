// ─────────────────────────────────────────────
// Agent Handler
// ─────────────────────────────────────────────

import { getDatabase } from '@voneb/database'
import type { BotState, StateHandlerInput, StateResult } from '../types.js'

export async function handleAgent(
  currentState: BotState,
  input: StateHandlerInput,
): Promise<StateResult> {
  if (currentState === 'WAITING_FOR_AGENT') {
    return handleWaitingForAgent(input)
  }

  return handleRequestingAgent(input)
}

async function handleRequestingAgent(
  input: StateHandlerInput,
): Promise<StateResult> {
  const { conversationId, customerName, customerId } = input
  const db = getDatabase()

  // Build conversation summary from recent messages
  const recentMessages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const summary = buildSummary(customerName, recentMessages)

  return {
    nextState: 'WAITING_FOR_AGENT',
    responses: [
      {
        type: 'text',
        text: [
          'Te voy a conectar con un asesor.',
          'Mientras te responde, podes seguir escribiendo y le llegara tu mensaje.',
          '',
          'Horario de atencion: Lunes a Viernes, 8am - 6pm.',
        ].join('\n'),
      },
    ],
    sideEffects: [
      {
        type: 'NOTIFY_AGENT',
        conversationId,
        summary: `Cliente ${customerName ?? customerId} solicita asesor.\n${summary}`,
      },
    ],
  }
}

async function handleWaitingForAgent(
  input: StateHandlerInput,
): Promise<StateResult> {
  const { context, message } = input

  // Buffer the message
  if (!context['bufferedMessages']) {
    context['bufferedMessages'] = []
  }
  ;(context['bufferedMessages'] as string[]).push(message.text)

  return {
    nextState: 'WAITING_FOR_AGENT',
    responses: [
      {
        type: 'text',
        text: 'Tu mensaje fue recibido. Tu asesor te respondera pronto.',
      },
    ],
    sideEffects: [],
  }
}

// ── Helpers ──────────────────────────────────

function buildSummary(
  customerName: string | undefined,
  messages: { senderType: string; content: string }[],
): string {
  const reversed = [...messages].reverse()
  const lines = reversed
    .slice(0, 5)
    .map((m) => {
      const sender = m.senderType === 'CUSTOMER' ? (customerName ?? 'Cliente') : 'Bot'
      return `${sender}: ${m.content.slice(0, 100)}`
    })

  return lines.join('\n')
}
