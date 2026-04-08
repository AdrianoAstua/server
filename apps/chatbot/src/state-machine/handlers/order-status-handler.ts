// ─────────────────────────────────────────────
// Order Status Handler
// ─────────────────────────────────────────────

import { getDatabase } from '@voneb/database'
import type { StateHandlerInput, StateResult } from '../types.js'

const STATUS_EMOJI: Record<string, string> = {
  PENDING: '🕐',
  CONFIRMED: '✅',
  IN_PRODUCTION: '🏭',
  READY: '📦',
  SHIPPED: '🚚',
  DELIVERED: '🎉',
  CANCELLED: '❌',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  IN_PRODUCTION: 'En produccion',
  READY: 'Listo para envio',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}

export async function handleOrderStatus(
  input: StateHandlerInput,
): Promise<StateResult> {
  const { customerId } = input
  const db = getDatabase()

  // Find active orders (not delivered or cancelled)
  const orders = await db.order.findMany({
    where: {
      customerId,
      status: { notIn: ['DELIVERED', 'CANCELLED'] },
    },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  if (orders.length === 0) {
    return {
      nextState: 'MAIN_MENU',
      responses: [
        {
          type: 'text',
          text: [
            'No tenes pedidos activos en este momento.',
            '',
            'En que mas te puedo ayudar?',
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

  const lines: string[] = ['Tus pedidos activos:\n']

  for (const order of orders) {
    const emoji = STATUS_EMOJI[order.status] ?? '❓'
    const label = STATUS_LABEL[order.status] ?? order.status
    const total = formatPrice(order.totalCents)

    lines.push(`${emoji} *Pedido ${order.orderNumber}*`)
    lines.push(`   Estado: ${label}`)

    // Items summary
    for (const item of order.items) {
      const productName = item.variant.product.name
      const size = item.variant.size
      const color = item.variant.color
      lines.push(`   - ${productName} (${size}/${color}) x${item.quantity}`)
    }

    lines.push(`   Total: ${total}`)

    if (order.estimatedDeliveryDate) {
      const estDate = formatDate(order.estimatedDeliveryDate)
      lines.push(`   Entrega estimada: ${estDate}`)
    }

    if (order.deliveryTrackingNumber) {
      lines.push(`   Tracking: ${order.deliveryTrackingNumber}`)
    }

    lines.push('')
  }

  lines.push('Escribi "menu" para volver al menu principal.')

  return {
    nextState: 'MAIN_MENU',
    responses: [
      {
        type: 'text',
        text: lines.join('\n'),
      },
    ],
    sideEffects: [],
  }
}

// ── Helpers ──────────────────────────────────

function formatPrice(cents: number): string {
  const colones = Math.round(cents / 100)
  return `C${colones.toLocaleString('es-CR')}`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-CR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
