// ─────────────────────────────────────────────
// Availability Handler
// ─────────────────────────────────────────────

import { getDatabase } from '@voneb/database'
import { SIZE_ORDER } from '@voneb/shared'
import type { StateHandlerInput, StateResult } from '../types.js'

export async function handleAvailability(
  input: StateHandlerInput,
): Promise<StateResult> {
  const { message, context } = input
  const query = message.text.trim()

  // "menu" or "volver" → back to main menu
  if (isBackCommand(query)) {
    return backToMenu()
  }

  const db = getDatabase()

  // Search products matching query (include per-location stock)
  const products = await db.product.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: query.toLowerCase().split(/\s+/) } },
        { descriptionShort: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      variants: {
        orderBy: { sizeOrder: 'asc' },
        include: {
          locationStocks: {
            include: { location: { select: { slug: true, type: true } } },
          },
        },
      },
      category: { select: { name: true } },
    },
    take: 5,
  })

  if (products.length === 0) {
    context['availabilityQuery'] = query
    return {
      nextState: 'CHECKING_AVAILABILITY',
      responses: [
        {
          type: 'text',
          text: `No encontre productos con "${query}".\n\nProba con otro nombre o escribi "menu" para volver.`,
        },
      ],
      sideEffects: [],
    }
  }

  // Format results with per-location stock awareness
  const lines: string[] = ['Esto es lo que encontre:\n']
  let hasLocalOnlyStock = false

  for (const product of products) {
    const price = formatPrice(product.basePriceCents)
    lines.push(`*${product.name}*`)

    // Group variants by color
    const colorGroups = groupByColor(product.variants)

    for (const [color, variants] of Object.entries(colorGroups)) {
      const sizeLine = variants
        .sort((a, b) => (SIZE_ORDER[a.size] ?? 99) - (SIZE_ORDER[b.size] ?? 99))
        .map((v) => {
          // Calculate total stock and per-location stock
          const totalStock = v.stockQuantity
          const shopifyStock = getLocationStock(v.locationStocks, 'shopify')
          const localStock = getLocationStock(v.locationStocks, 'local')

          if (totalStock > 0) {
            if (shopifyStock <= 0 && localStock > 0) {
              hasLocalOnlyStock = true
              return `${v.size} 🏪(${localStock})`
            }
            return `${v.size} ✅(${totalStock})`
          }
          return `${v.size} ❌`
        })
        .join(' | ')

      lines.push(`  ${color}: ${sizeLine}`)
    }

    lines.push(`  ${price}`)
    lines.push('')
  }

  if (hasLocalOnlyStock) {
    lines.push('🏪 = disponible solo en tienda fisica')
    lines.push('Si te interesa, podemos separartelo para envio o podes pasar a recogerlo.')
    lines.push('')
  }

  lines.push('Escribi otro producto para buscar o "menu" para volver.')

  return {
    nextState: 'CHECKING_AVAILABILITY',
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

interface LocationStockInfo {
  quantity: number
  location: { slug: string; type: string }
}

interface VariantInfo {
  size: string
  stockQuantity: number
  color: string
  locationStocks: LocationStockInfo[]
}

function groupByColor(
  variants: { color: string; size: string; stockQuantity: number; locationStocks?: LocationStockInfo[] }[],
): Record<string, VariantInfo[]> {
  const groups: Record<string, VariantInfo[]> = {}

  for (const v of variants) {
    const color = v.color
    if (!groups[color]) groups[color] = []
    groups[color]!.push({
      size: v.size,
      stockQuantity: v.stockQuantity,
      color: v.color,
      locationStocks: v.locationStocks ?? [],
    })
  }

  return groups
}

function getLocationStock(locationStocks: LocationStockInfo[], slug: string): number {
  const found = locationStocks.find((ls) => ls.location.slug === slug)
  return found?.quantity ?? 0
}

function formatPrice(cents: number): string {
  const colones = Math.round(cents / 100)
  return `C${colones.toLocaleString('es-CR')}`
}

function isBackCommand(text: string): boolean {
  const lower = text.toLowerCase().trim()
  return ['menu', 'volver', 'atras', 'salir', '0'].includes(lower)
}

function backToMenu(): StateResult {
  return {
    nextState: 'MAIN_MENU',
    responses: [
      {
        type: 'text',
        text: [
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
