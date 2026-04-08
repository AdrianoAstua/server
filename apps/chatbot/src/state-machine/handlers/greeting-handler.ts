// ─────────────────────────────────────────────
// Greeting Handler
// ─────────────────────────────────────────────

import type { StateHandlerInput, StateResult } from '../types.js'

export async function handleGreeting(
  input: StateHandlerInput,
): Promise<StateResult> {
  const { isNewCustomer, customerName } = input

  if (isNewCustomer || !customerName) {
    // New customer — ask for name
    return {
      nextState: 'COLLECTING_NAME',
      responses: [
        {
          type: 'text',
          text: [
            'Hola! Bienvenido/a a V ONE B, tu tienda de ropa deportiva.',
            'Soy tu asistente virtual.',
            '',
            'Para brindarte la mejor atencion, necesito unos datos.',
            'Cual es tu nombre completo?',
          ].join('\n'),
        },
      ],
      sideEffects: [],
    }
  }

  // Returning customer — greet by name + show main menu
  return {
    nextState: 'MAIN_MENU',
    responses: [
      {
        type: 'buttons',
        text: [
          `Hola ${customerName}! Que gusto tenerte de vuelta en V ONE B.`,
          'En que te puedo ayudar hoy?',
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
          'O escribi lo que necesites:',
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
