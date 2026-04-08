// ─────────────────────────────────────────────
// Menu Handler
// ─────────────────────────────────────────────

import type { BotState, StateHandlerInput, StateResult } from '../types.js'

/** Keywords for basic NLU routing */
const CATALOG_KEYWORDS = [
  'producto', 'productos', 'catalogo', 'ver', 'comprar', 'pedido',
  'jersey', 'camiseta', 'short', 'licra', 'ropa',
]
const AVAILABILITY_KEYWORDS = [
  'disponibilidad', 'disponible', 'stock', 'talla', 'tallas', 'hay',
]
const ORDER_KEYWORDS = [
  'estado', 'pedido', 'orden', 'seguimiento', 'envio', 'tracking',
]
const AGENT_KEYWORDS = [
  'asesor', 'agente', 'persona', 'humano', 'hablar', 'ayuda',
]

export async function handleMenu(
  input: StateHandlerInput,
): Promise<StateResult> {
  const { message } = input
  const text = message.text.trim().toLowerCase()

  // Button response IDs
  if (
    message.buttonResponseId === 'menu_catalog' ||
    message.listResponseId === 'menu_catalog'
  ) {
    return routeTo('BROWSING_CATALOG')
  }
  if (
    message.buttonResponseId === 'menu_availability' ||
    message.listResponseId === 'menu_availability'
  ) {
    return routeTo('CHECKING_AVAILABILITY')
  }
  if (
    message.buttonResponseId === 'menu_order_status' ||
    message.listResponseId === 'menu_order_status'
  ) {
    return routeTo('CHECKING_ORDER_STATUS')
  }
  if (
    message.buttonResponseId === 'menu_agent' ||
    message.listResponseId === 'menu_agent'
  ) {
    return routeTo('REQUESTING_AGENT')
  }

  // Numeric input
  if (text === '1') return routeTo('BROWSING_CATALOG')
  if (text === '2') return routeTo('CHECKING_AVAILABILITY')
  if (text === '3') return routeTo('CHECKING_ORDER_STATUS')
  if (text === '4') return routeTo('REQUESTING_AGENT')

  // Basic NLU
  const matchedState = matchKeywords(text)
  if (matchedState) return routeTo(matchedState)

  // Unrecognized input
  return {
    nextState: 'MAIN_MENU',
    responses: [
      {
        type: 'text',
        text: [
          'No entendi bien tu mensaje. Selecciona una opcion:',
          '',
          '1. Ver productos / Hacer pedido',
          '2. Consultar disponibilidad',
          '3. Estado de mi pedido',
          '4. Hablar con un asesor',
        ].join('\n'),
      },
    ],
    sideEffects: [],
  }
}

function routeTo(state: BotState): StateResult {
  const prompts: Record<string, string> = {
    BROWSING_CATALOG:
      'Que tipo de producto buscas? (ej: jersey ciclismo, licra running, camiseta)',
    CHECKING_AVAILABILITY:
      'Que producto te interesa? Escribi el nombre o tipo de prenda y te digo que hay disponible.',
    CHECKING_ORDER_STATUS:
      'Dejame revisar tus pedidos...',
    REQUESTING_AGENT:
      'Te voy a conectar con un asesor.',
  }

  return {
    nextState: state,
    responses: [
      {
        type: 'text',
        text: prompts[state] ?? 'En que te puedo ayudar?',
      },
    ],
    sideEffects: [],
  }
}

function matchKeywords(text: string): BotState | null {
  const words = text.split(/\s+/)

  if (words.some((w) => CATALOG_KEYWORDS.includes(w))) {
    return 'BROWSING_CATALOG'
  }
  if (words.some((w) => AVAILABILITY_KEYWORDS.includes(w))) {
    return 'CHECKING_AVAILABILITY'
  }
  if (words.some((w) => ORDER_KEYWORDS.includes(w))) {
    return 'CHECKING_ORDER_STATUS'
  }
  if (words.some((w) => AGENT_KEYWORDS.includes(w))) {
    return 'REQUESTING_AGENT'
  }

  return null
}
