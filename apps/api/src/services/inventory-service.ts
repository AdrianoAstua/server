import { getDatabase, PrismaClient } from '@voneb/database'
import { NotFoundError } from '../lib/errors.js'
import type { MovementFilters, RegisterEntry, RegisterAdjustment } from '../schemas/inventory-schemas.js'

type TxClient = PrismaClient

async function getDefaultLocalLocation(tx: TxClient): Promise<string> {
  const loc = await tx.inventoryLocation.findFirst({ where: { type: 'LOCAL', isDefault: true } })
  if (!loc) throw new Error('No default local location configured')
  return loc.id
}

async function recalculateVariantStock(tx: TxClient, variantId: string): Promise<{ stockQuantity: number; status: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' }> {
  const variant = await tx.productVariant.findUnique({ where: { id: variantId }, select: { minStockThreshold: true } })
  if (!variant) throw new NotFoundError(`Variant "${variantId}" not found`)

  const locationStocks = await tx.locationStock.findMany({ where: { variantId } })
  const totalStock = locationStocks.reduce((sum: any, ls: any) => sum + ls.quantity, 0)
  const status = evaluateVariantStatus(totalStock, variant.minStockThreshold)

  await tx.productVariant.update({
    where: { id: variantId },
    data: { stockQuantity: totalStock, status },
  })

  return { stockQuantity: totalStock, status }
}

function evaluateVariantStatus(
  stockQuantity: number,
  minStockThreshold: number,
): 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' {
  if (stockQuantity <= 0) return 'OUT_OF_STOCK'
  if (stockQuantity <= minStockThreshold) return 'LOW_STOCK'
  return 'AVAILABLE'
}

export async function getMovements(filters: MovementFilters) {
  const db = getDatabase()
  const { page, limit, ...rest } = filters
  const skip = (page - 1) * limit

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma where input
  const where: Record<string, any> = {}

  if (rest.type) where['type'] = rest.type
  if (rest.variantId) where['variantId'] = rest.variantId
  if (rest.locationId) where['locationId'] = rest.locationId
  if (rest.performedById) where['performedById'] = rest.performedById
  if (rest.dateFrom || rest.dateTo) {
    const dateFilter: Record<string, Date> = {}
    if (rest.dateFrom) dateFilter['gte'] = rest.dateFrom
    if (rest.dateTo) dateFilter['lte'] = rest.dateTo
    where['createdAt'] = dateFilter
  }

  const [movements, total] = await Promise.all([
    db.stockMovement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        variant: {
          select: {
            id: true,
            sku: true,
            color: true,
            size: true,
            product: { select: { id: true, name: true } },
          },
        },
        performedBy: { select: { id: true, name: true } },
      },
    }),
    db.stockMovement.count({ where }),
  ])

  return { data: movements, total, page, limit }
}

export async function registerEntry(data: RegisterEntry, userId?: string) {
  const db = getDatabase()

  return db.$transaction(async (tx: TxClient) => {
    const results = []
    const locationId = data.locationId ?? await getDefaultLocalLocation(tx)

    for (const entry of data.entries) {
      const variant = await tx.productVariant.findUnique({
        where: { id: entry.variantId },
      })
      if (!variant) throw new NotFoundError(`Variant "${entry.variantId}" not found`)

      await tx.stockMovement.create({
        data: {
          variantId: entry.variantId,
          type: 'ENTRY',
          quantity: entry.quantity,
          reason: data.reason,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          performedById: userId ?? null,
          notes: entry.notes,
          locationId,
        },
      })

      await tx.locationStock.upsert({
        where: { variantId_locationId: { variantId: entry.variantId, locationId } },
        create: { variantId: entry.variantId, locationId, quantity: entry.quantity },
        update: { quantity: { increment: entry.quantity } },
      })

      const { stockQuantity, status } = await recalculateVariantStock(tx, entry.variantId)

      const updated = await tx.productVariant.findUnique({ where: { id: entry.variantId } })
      results.push(updated)
    }

    return results
  })
}

export async function registerAdjustment(
  data: RegisterAdjustment,
  userId?: string,
) {
  const db = getDatabase()

  return db.$transaction(async (tx: TxClient) => {
    const variant = await tx.productVariant.findUnique({
      where: { id: data.variantId },
    })
    if (!variant) throw new NotFoundError('Variant not found')

    const locationId = data.locationId ?? await getDefaultLocalLocation(tx)

    await tx.stockMovement.create({
      data: {
        variantId: data.variantId,
        type: 'ADJUSTMENT',
        quantity: data.quantity,
        reason: data.reason,
        referenceType: 'ADJUSTMENT',
        performedById: userId ?? null,
        notes: data.notes,
        locationId,
      },
    })

    const existingLocationStock = await tx.locationStock.findUnique({
      where: { variantId_locationId: { variantId: data.variantId, locationId } },
    })

    const currentLocationQty = existingLocationStock?.quantity ?? 0
    const newLocationQty = Math.max(currentLocationQty + data.quantity, 0)

    await tx.locationStock.upsert({
      where: { variantId_locationId: { variantId: data.variantId, locationId } },
      create: { variantId: data.variantId, locationId, quantity: Math.max(data.quantity, 0) },
      update: { quantity: newLocationQty },
    })

    await recalculateVariantStock(tx, data.variantId)

    return tx.productVariant.findUnique({ where: { id: data.variantId } })
  })
}

export async function getLowStockAlerts() {
  const db = getDatabase()

  return db.productVariant.findMany({
    where: { status: 'LOW_STOCK' },
    orderBy: { stockQuantity: 'asc' },
    include: {
      product: {
        select: { id: true, name: true, basePriceCents: true, images: true },
      },
    },
  })
}

export async function getOutOfStock() {
  const db = getDatabase()

  return db.productVariant.findMany({
    where: { status: 'OUT_OF_STOCK' },
    orderBy: { updatedAt: 'desc' },
    include: {
      product: {
        select: { id: true, name: true, basePriceCents: true, images: true },
      },
    },
  })
}

export async function getValuation() {
  const db = getDatabase()

  const [products, variants, lowStock, outOfStock] = await Promise.all([
    db.product.count({ where: { status: { not: 'DISCONTINUED' } } }),
    db.productVariant.findMany({
      where: { status: { not: 'DISCONTINUED' } },
      select: {
        stockQuantity: true,
        additionalPriceCents: true,
        product: {
          select: { basePriceCents: true, costPriceCents: true },
        },
      },
    }),
    db.productVariant.count({ where: { status: 'LOW_STOCK' } }),
    db.productVariant.count({ where: { status: 'OUT_OF_STOCK' } }),
  ])

  let totalUnits = 0
  let costValue = 0
  let retailValue = 0

  for (const v of variants) {
    totalUnits += v.stockQuantity
    const retail = v.product.basePriceCents + v.additionalPriceCents
    retailValue += retail * v.stockQuantity
    const cost = v.product.costPriceCents ?? 0
    costValue += cost * v.stockQuantity
  }

  return {
    totalProducts: products,
    totalVariants: variants.length,
    totalUnits,
    costValue,
    retailValue,
    lowStockCount: lowStock,
    outOfStockCount: outOfStock,
  }
}
