import { getDatabase, PrismaClient } from '@voneb/database'
import { NotFoundError, ConflictError } from '../lib/errors.js'
import type { PhysicalCountFilters, CountItem } from '../schemas/physical-count-schemas.js'

type TxClient = PrismaClient

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
  const total = stocks.reduce((sum: any, s: any) => sum + s.quantity, 0)
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

export async function startCount(
  locationId: string,
  userId: string,
  categoryId?: string,
  notes?: string,
) {
  const db = getDatabase()

  const location = await db.inventoryLocation.findUnique({
    where: { id: locationId },
  })
  if (!location) throw new NotFoundError('Location not found')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma where input
  const stockWhere: Record<string, unknown> = { locationId }
  if (categoryId) {
    stockWhere['variant'] = {
      product: { categoryId },
    }
  }

  const stockLevels = await db.locationStock.findMany({
    where: stockWhere,
    include: {
      variant: {
        select: { id: true, sku: true, color: true, size: true },
      },
    },
  })

  const count = await db.physicalCount.create({
    data: {
      locationId,
      performedById: userId,
      notes,
      items: {
        create: stockLevels.map((stock: any) => ({
          variantId: stock.variantId,
          expectedQty: stock.quantity,
        })),
      },
    },
    include: {
      items: {
        include: {
          variant: {
            select: {
              id: true, sku: true, color: true, size: true,
              product: { select: { id: true, name: true } },
            },
          },
        },
      },
      location: { select: { id: true, name: true } },
      performedBy: { select: { id: true, name: true } },
    },
  })

  return count
}

export async function countItem(
  countId: string,
  data: CountItem,
) {
  const db = getDatabase()

  const count = await db.physicalCount.findUnique({ where: { id: countId } })
  if (!count) throw new NotFoundError('Physical count not found')
  if (count.status !== 'IN_PROGRESS') {
    throw new ConflictError('Count is not in progress')
  }

  const item = await db.physicalCountItem.findFirst({
    where: { countId, variantId: data.variantId },
  })
  if (!item) throw new NotFoundError('Count item not found for this variant')

  const difference = data.actualQty - item.expectedQty

  return db.physicalCountItem.update({
    where: { id: item.id },
    data: { actualQty: data.actualQty, difference },
    include: {
      variant: {
        select: {
          id: true, sku: true, color: true, size: true,
          product: { select: { id: true, name: true } },
        },
      },
    },
  })
}

export async function completeCount(countId: string, userId: string) {
  const db = getDatabase()

  return db.$transaction(async (tx: TxClient) => {
    const count = await tx.physicalCount.findUnique({
      where: { id: countId },
      include: { items: true },
    })

    if (!count) throw new NotFoundError('Physical count not found')
    if (count.status !== 'IN_PROGRESS') {
      throw new ConflictError('Count is not in progress')
    }

    let itemsCounted = 0
    let discrepancies = 0
    let adjustmentsApplied = 0

    for (const item of count.items) {
      if (item.actualQty === null) continue
      itemsCounted += 1

      const diff = item.actualQty - item.expectedQty
      if (diff === 0) continue

      discrepancies += 1

      await tx.locationStock.update({
        where: {
          variantId_locationId: {
            variantId: item.variantId,
            locationId: count.locationId,
          },
        },
        data: { quantity: item.actualQty },
      })

      await tx.stockMovement.create({
        data: {
          variantId: item.variantId,
          locationId: count.locationId,
          type: 'PHYSICAL_COUNT',
          quantity: diff,
          reason: `Physical count adjustment`,
          referenceType: 'ADJUSTMENT',
          referenceId: count.id,
          performedById: userId,
        },
      })

      await recalculateVariantStock(item.variantId, tx)
      adjustmentsApplied += 1
    }

    await tx.physicalCount.update({
      where: { id: countId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })

    return { itemsCounted, discrepancies, adjustmentsApplied }
  })
}

export async function cancelCount(countId: string) {
  const db = getDatabase()

  const count = await db.physicalCount.findUnique({ where: { id: countId } })
  if (!count) throw new NotFoundError('Physical count not found')
  if (count.status !== 'IN_PROGRESS') {
    throw new ConflictError('Only in-progress counts can be cancelled')
  }

  return db.physicalCount.update({
    where: { id: countId },
    data: { status: 'CANCELLED' },
    include: {
      location: { select: { id: true, name: true } },
      performedBy: { select: { id: true, name: true } },
    },
  })
}

export async function listCounts(filters: PhysicalCountFilters) {
  const db = getDatabase()
  const { page, limit, ...rest } = filters
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (rest.locationId) where['locationId'] = rest.locationId
  if (rest.status) where['status'] = rest.status

  const [counts, total] = await Promise.all([
    db.physicalCount.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        location: { select: { id: true, name: true } },
        performedBy: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    }),
    db.physicalCount.count({ where }),
  ])

  return { data: counts, total, page, limit }
}

export async function getCount(id: string) {
  const db = getDatabase()

  const count = await db.physicalCount.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          variant: {
            select: {
              id: true, sku: true, color: true, size: true,
              product: { select: { id: true, name: true } },
            },
          },
        },
      },
      location: { select: { id: true, name: true } },
      performedBy: { select: { id: true, name: true } },
    },
  })

  if (!count) throw new NotFoundError('Physical count not found')
  return count
}
