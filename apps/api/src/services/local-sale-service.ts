import { getDatabase, PrismaClient } from '@voneb/database'
import { NotFoundError, ConflictError, ValidationError } from '../lib/errors.js'
import type { CreateLocalSale, LocalSaleFilters, DailySummaryQuery } from '../schemas/local-sale-schemas.js'

type TxClient = PrismaClient

const SALE_NUMBER_PREFIX = 'VL'

function evaluateVariantStatus(
  stockQuantity: number,
  minStockThreshold: number,
): 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' {
  if (stockQuantity <= 0) return 'OUT_OF_STOCK'
  if (stockQuantity <= minStockThreshold) return 'LOW_STOCK'
  return 'AVAILABLE'
}

async function recalculateVariantStock(
  variantId: string,
  tx: TxClient,
): Promise<void> {
  const stocks = await tx.locationStock.findMany({ where: { variantId } })
  const total = stocks.reduce((sum, s) => sum + s.quantity, 0)
  const variant = await tx.productVariant.findUnique({
    where: { id: variantId },
    select: { minStockThreshold: true },
  })
  const status = evaluateVariantStatus(total, variant?.minStockThreshold ?? 3)
  await tx.productVariant.update({
    where: { id: variantId },
    data: { stockQuantity: total, status },
  })
}

async function generateSaleNumber(tx: TxClient): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const endOfYear = new Date(year + 1, 0, 1)

  const count = await tx.localSale.count({
    where: { createdAt: { gte: startOfYear, lt: endOfYear } },
  })

  const sequence = String(count + 1).padStart(4, '0')
  return `${SALE_NUMBER_PREFIX}-${year}-${sequence}`
}

async function resolveLocationId(
  tx: TxClient,
  providedId?: string,
): Promise<string> {
  if (providedId) {
    const location = await tx.inventoryLocation.findUnique({
      where: { id: providedId },
    })
    if (!location) throw new NotFoundError('Location not found')
    return location.id
  }

  const defaultLocation = await tx.inventoryLocation.findFirst({
    where: { type: 'LOCAL', isDefault: true, isActive: true },
  })
  if (!defaultLocation) {
    throw new ValidationError('No default LOCAL location configured')
  }
  return defaultLocation.id
}

export async function createSale(
  data: CreateLocalSale,
  userId: string,
) {
  const db = getDatabase()

  return db.$transaction(async (tx: TxClient) => {
    const locationId = await resolveLocationId(tx, data.locationId)

    const insufficientStock: Array<{
      variantId: string
      sku: string
      requested: number
      available: number
    }> = []

    const variantData: Array<{
      variant: {
        id: string
        sku: string
        additionalPriceCents: number
        product: { basePriceCents: number; name: string }
      }
      locationStock: { id: string; quantity: number }
      quantity: number
    }> = []

    for (const item of data.items) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        include: {
          product: { select: { basePriceCents: true, name: true } },
        },
      })
      if (!variant) throw new NotFoundError(`Variant "${item.variantId}" not found`)

      const locStock = await tx.locationStock.findUnique({
        where: { variantId_locationId: { variantId: item.variantId, locationId } },
      })

      const available = locStock?.quantity ?? 0
      if (available < item.quantity) {
        insufficientStock.push({
          variantId: variant.id,
          sku: variant.sku,
          requested: item.quantity,
          available,
        })
      }

      if (locStock) {
        variantData.push({ variant, locationStock: locStock, quantity: item.quantity })
      } else {
        variantData.push({
          variant,
          locationStock: { id: '', quantity: 0 },
          quantity: item.quantity,
        })
      }
    }

    if (insufficientStock.length > 0) {
      throw new ValidationError('Insufficient stock for one or more items', insufficientStock)
    }

    let subtotalCents = 0
    for (const { variant, quantity } of variantData) {
      const unitPrice = variant.product.basePriceCents + variant.additionalPriceCents
      subtotalCents += unitPrice * quantity
    }

    const discountCents = data.discountCents ?? 0
    const totalCents = subtotalCents - discountCents

    const saleNumber = await generateSaleNumber(tx)

    const sale = await tx.localSale.create({
      data: {
        saleNumber,
        subtotalCents,
        discountCents,
        totalCents,
        paymentMethod: data.paymentMethod,
        customerId: data.customerId ?? null,
        soldById: userId,
        locationId,
        notes: data.notes,
      },
    })

    for (const { variant, quantity } of variantData) {
      const unitPrice = variant.product.basePriceCents + variant.additionalPriceCents

      await tx.localSaleItem.create({
        data: {
          saleId: sale.id,
          variantId: variant.id,
          quantity,
          unitPriceCents: unitPrice,
          totalPriceCents: unitPrice * quantity,
        },
      })

      await tx.locationStock.upsert({
        where: { variantId_locationId: { variantId: variant.id, locationId } },
        update: { quantity: { decrement: quantity } },
        create: { variantId: variant.id, locationId, quantity: -quantity },
      })

      await tx.stockMovement.create({
        data: {
          variantId: variant.id,
          locationId,
          type: 'SALE_LOCAL',
          quantity: -quantity,
          reason: `Local sale ${saleNumber}`,
          referenceType: 'ORDER',
          referenceId: sale.id,
          performedById: userId,
        },
      })

      await recalculateVariantStock(variant.id, tx)
    }

    return tx.localSale.findUnique({
      where: { id: sale.id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true, images: true } },
              },
            },
          },
        },
        soldBy: { select: { id: true, name: true } },
        customer: { select: { id: true, firstName: true, lastName: true } },
        location: { select: { id: true, name: true } },
      },
    })
  })
}

export async function listSales(filters: LocalSaleFilters) {
  const db = getDatabase()
  const { page, limit, ...rest } = filters
  const skip = (page - 1) * limit

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma where input
  const where: Record<string, unknown> = {}

  if (rest.soldById) where['soldById'] = rest.soldById
  if (rest.paymentMethod) where['paymentMethod'] = rest.paymentMethod

  if (rest.date) {
    const dayStart = new Date(rest.date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(rest.date)
    dayEnd.setHours(23, 59, 59, 999)
    where['createdAt'] = { gte: dayStart, lte: dayEnd }
  }

  const [sales, total] = await Promise.all([
    db.localSale.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            variant: {
              select: { id: true, sku: true, color: true, size: true },
            },
          },
        },
        soldBy: { select: { id: true, name: true } },
        customer: { select: { id: true, firstName: true, lastName: true } },
        location: { select: { id: true, name: true } },
      },
    }),
    db.localSale.count({ where }),
  ])

  return { data: sales, total, page, limit }
}

export async function getSale(id: string) {
  const db = getDatabase()

  const sale = await db.localSale.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: { id: true, name: true, images: true, basePriceCents: true },
              },
            },
          },
        },
      },
      soldBy: { select: { id: true, name: true } },
      customer: { select: { id: true, firstName: true, lastName: true, whatsappPhone: true } },
      location: { select: { id: true, name: true } },
    },
  })

  if (!sale) throw new NotFoundError('Local sale not found')
  return sale
}

export async function voidSale(
  id: string,
  reason: string,
  userId: string,
) {
  const db = getDatabase()

  return db.$transaction(async (tx: TxClient) => {
    const sale = await tx.localSale.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!sale) throw new NotFoundError('Local sale not found')
    if (sale.voided) throw new ConflictError('Sale is already voided')

    await tx.localSale.update({
      where: { id },
      data: {
        voided: true,
        voidReason: reason,
        voidedAt: new Date(),
      },
    })

    for (const item of sale.items) {
      await tx.locationStock.upsert({
        where: {
          variantId_locationId: {
            variantId: item.variantId,
            locationId: sale.locationId,
          },
        },
        update: { quantity: { increment: item.quantity } },
        create: {
          variantId: item.variantId,
          locationId: sale.locationId,
          quantity: item.quantity,
        },
      })

      await tx.stockMovement.create({
        data: {
          variantId: item.variantId,
          locationId: sale.locationId,
          type: 'RETURN',
          quantity: item.quantity,
          reason: `Void sale ${sale.saleNumber}: ${reason}`,
          referenceType: 'RETURN',
          referenceId: sale.id,
          performedById: userId,
        },
      })

      await recalculateVariantStock(item.variantId, tx)
    }

    return tx.localSale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true } },
              },
            },
          },
        },
        soldBy: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
      },
    })
  })
}

export async function getDailySummary(query: DailySummaryQuery) {
  const db = getDatabase()

  const date = query.date ?? new Date()
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  const sales = await db.localSale.findMany({
    where: {
      locationId: query.locationId,
      createdAt: { gte: dayStart, lte: dayEnd },
      voided: false,
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
  })

  const totalSales = sales.length
  const totalRevenueCents = sales.reduce((sum, s) => sum + s.totalCents, 0)

  let itemsSold = 0
  const byMethodMap = new Map<string, { count: number; totalCents: number }>()
  const productQtyMap = new Map<string, number>()

  for (const sale of sales) {
    const methodEntry = byMethodMap.get(sale.paymentMethod) ?? { count: 0, totalCents: 0 }
    methodEntry.count += 1
    methodEntry.totalCents += sale.totalCents
    byMethodMap.set(sale.paymentMethod, methodEntry)

    for (const item of sale.items) {
      itemsSold += item.quantity
      const productName = item.variant.product.name
      const current = productQtyMap.get(productName) ?? 0
      productQtyMap.set(productName, current + item.quantity)
    }
  }

  const byPaymentMethod = Array.from(byMethodMap.entries()).map(
    ([method, data]) => ({ method, count: data.count, totalCents: data.totalCents }),
  )

  const topProducts = Array.from(productQtyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([product, quantity]) => ({ product, quantity }))

  return { totalSales, totalRevenueCents, itemsSold, byPaymentMethod, topProducts }
}

function formatColones(cents: number): string {
  const whole = Math.abs(cents) / 100
  const formatted = whole.toLocaleString('es-CR')
  return cents < 0 ? `-₡${formatted}` : `₡${formatted}`
}

function padRight(text: string, width: number): string {
  return text.length >= width ? text : text + ' '.repeat(width - text.length)
}

function padLeft(text: string, width: number): string {
  return text.length >= width ? text : ' '.repeat(width - text.length) + text
}

const RECEIPT_WIDTH = 32
const SEPARATOR_DOUBLE = '═'.repeat(RECEIPT_WIDTH)
const SEPARATOR_SINGLE = '─'.repeat(RECEIPT_WIDTH)

function centerText(text: string): string {
  const padding = Math.max(0, Math.floor((RECEIPT_WIDTH - text.length) / 2))
  return ' '.repeat(padding) + text
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  SINPE: 'SINPE',
  TRANSFER: 'Transferencia',
  MIXED: 'Mixto',
}

export async function generateReceipt(saleId: string): Promise<string> {
  const db = getDatabase()

  const sale = await db.localSale.findUnique({
    where: { id: saleId },
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
      soldBy: { select: { name: true } },
    },
  })

  if (!sale) throw new NotFoundError('Local sale not found')

  const createdAt = sale.createdAt
  const dateStr = [
    String(createdAt.getDate()).padStart(2, '0'),
    String(createdAt.getMonth() + 1).padStart(2, '0'),
    createdAt.getFullYear(),
  ].join('/')
  const timeStr = [
    String(createdAt.getHours()).padStart(2, '0'),
    String(createdAt.getMinutes()).padStart(2, '0'),
  ].join(':')

  const lines: string[] = []
  lines.push(SEPARATOR_DOUBLE)
  lines.push(centerText('V ONE B - Tienda Local'))
  lines.push(SEPARATOR_DOUBLE)
  lines.push(`Venta: ${sale.saleNumber}`)
  lines.push(`Fecha: ${dateStr} ${timeStr}`)
  lines.push(`Vendedor: ${sale.soldBy.name}`)
  lines.push(SEPARATOR_SINGLE)

  for (const item of sale.items) {
    const name = item.variant.product.name
    const size = item.variant.size
    const color = item.variant.color
    const label = `${name} (${size}/${color})`
    const qtyLabel = `x${item.quantity}`
    const itemLine = padRight(label, RECEIPT_WIDTH - qtyLabel.length - 1) + ' ' + qtyLabel
    lines.push(itemLine)
    lines.push(padLeft(formatColones(item.totalPriceCents), RECEIPT_WIDTH))
  }

  lines.push(SEPARATOR_SINGLE)
  lines.push(`${padRight('Subtotal:', 20)}${padLeft(formatColones(sale.subtotalCents), RECEIPT_WIDTH - 20)}`)
  lines.push(`${padRight('Descuento:', 20)}${padLeft('-' + formatColones(sale.discountCents), RECEIPT_WIDTH - 20)}`)
  lines.push(`${padRight('TOTAL:', 20)}${padLeft(formatColones(sale.totalCents), RECEIPT_WIDTH - 20)}`)
  lines.push(`Método: ${PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}`)
  lines.push(SEPARATOR_DOUBLE)
  lines.push(centerText('¡Gracias por su compra!'))
  lines.push(SEPARATOR_DOUBLE)

  return lines.join('\n')
}
