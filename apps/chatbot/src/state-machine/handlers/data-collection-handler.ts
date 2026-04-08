// ─────────────────────────────────────────────
// Data Collection Handler
// ─────────────────────────────────────────────

import type { BotState, StateHandlerInput, StateResult } from '../types.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function handleDataCollection(
  currentState: BotState,
  input: StateHandlerInput,
): Promise<StateResult> {
  const { message, customerId, context } = input
  const text = message.text.trim()

  switch (currentState) {
    case 'COLLECTING_NAME':
      return handleCollectName(text, customerId, context)
    case 'COLLECTING_EMAIL':
      return handleCollectEmail(text, customerId, context)
    case 'COLLECTING_ADDRESS':
      return handleCollectAddress(text, customerId, context)
    default:
      return handleCollectName(text, customerId, context)
  }
}

function handleCollectName(
  text: string,
  customerId: string,
  context: Record<string, unknown>,
): StateResult {
  // Validate name (at least 2 characters, letters and spaces)
  const cleaned = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').trim()

  if (cleaned.length < 2) {
    return {
      nextState: 'COLLECTING_NAME',
      responses: [
        {
          type: 'text',
          text: 'Hmm, no entendi bien. Podrias decirme tu nombre completo? (ej: Juan Perez)',
        },
      ],
      sideEffects: [],
    }
  }

  const parts = cleaned.split(/\s+/)
  const firstName = parts[0] ?? cleaned
  const lastName = parts.slice(1).join(' ') || undefined

  // Store in context for the side effect
  context['collectingName'] = cleaned

  return {
    nextState: 'COLLECTING_EMAIL',
    responses: [
      {
        type: 'text',
        text: `Mucho gusto ${firstName}! Ahora, me podrias compartir tu correo electronico?\n\nSi preferis no darlo, escribi "no".`,
      },
    ],
    sideEffects: [
      {
        type: 'UPDATE_CUSTOMER',
        data: {
          customerId,
          firstName,
          lastName,
        },
      },
    ],
  }
}

function handleCollectEmail(
  text: string,
  customerId: string,
  context: Record<string, unknown>,
): StateResult {
  const lower = text.toLowerCase().trim()

  // Skip email
  if (lower === 'no' || lower === 'saltar' || lower === 'skip') {
    return {
      nextState: 'COLLECTING_ADDRESS',
      responses: [
        {
          type: 'text',
          text: 'Sin problema! Por ultimo, cual es tu direccion de entrega? (provincia, canton, distrito y senas)\n\nSi preferis no darla ahora, escribi "no".',
        },
      ],
      sideEffects: [],
    }
  }

  // Validate email
  if (!EMAIL_REGEX.test(lower)) {
    return {
      nextState: 'COLLECTING_EMAIL',
      responses: [
        {
          type: 'text',
          text: 'Ese correo no parece valido. Podrias intentar de nuevo?\n\nEscribi tu correo (ej: juan@gmail.com) o "no" para saltar.',
        },
      ],
      sideEffects: [],
    }
  }

  context['collectingEmail'] = lower

  return {
    nextState: 'COLLECTING_ADDRESS',
    responses: [
      {
        type: 'text',
        text: 'Perfecto! Por ultimo, cual es tu direccion de entrega? (provincia, canton, distrito y senas)\n\nSi preferis no darla ahora, escribi "no".',
      },
    ],
    sideEffects: [
      {
        type: 'UPDATE_CUSTOMER',
        data: { customerId, email: lower },
      },
    ],
  }
}

function handleCollectAddress(
  text: string,
  customerId: string,
  _context: Record<string, unknown>,
): StateResult {
  const lower = text.toLowerCase().trim()
  const skipAddress = lower === 'no' || lower === 'saltar' || lower === 'skip'

  const sideEffects: StateResult['sideEffects'] = [
    {
      type: 'UPDATE_CUSTOMER',
      data: {
        customerId,
        dataCollectionComplete: true,
        ...(skipAddress ? {} : { deliveryAddress: text.trim() }),
      },
    },
  ]

  const menuText = skipAddress
    ? 'Listo! Ya quedaste registrado/a.'
    : 'Excelente! Ya tengo tu direccion guardada.'

  return {
    nextState: 'MAIN_MENU',
    responses: [
      {
        type: 'buttons',
        text: [
          `${menuText}`,
          '',
          'En que te puedo ayudar?',
        ].join('\n'),
        buttons: [
          { id: 'menu_catalog', title: 'Ver productos' },
          { id: 'menu_availability', title: 'Disponibilidad' },
          { id: 'menu_order_status', title: 'Estado pedido' },
        ],
      },
      {
        type: 'text',
        text: [
          '1. Ver productos / Hacer pedido',
          '2. Consultar disponibilidad',
          '3. Estado de mi pedido',
          '4. Hablar con un asesor',
        ].join('\n'),
      },
    ],
    sideEffects,
  }
}
