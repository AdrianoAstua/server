import { getDatabase, PrismaClient } from '@voneb/database'
import { NotFoundError, ConflictError } from '../lib/errors.js'
import type {
  CreateLocation,
  UpdateLocation,
  TransferStock,
} from '../schemas/location-schemas.js'

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
  tx?: TxClient,
): Promise<void> {
  const client = tx ?? getDatabase()

  const result = await client.locationStock.aggregate({
    where: { variantId },
    _sum: { quantity: true },
  })

  const totalStock = result._sum.quantity ?? 0

  const variant = await client.productVariant.findUnique({
    where: { id: variantId },
    select: { minStockThreshold: true },
  })
  if (!variant) throw new NotFoundError('Variant not found')

  const status = evaluateVariantStatus(totalStock, variant.minStockThreshold)

  await client.productVariant.update({
    where: { id: variantId },
    data: { stockQuantity: totalStock, status },
  })
}

export async function listLocations() {
  const db = getDatabase()

  return db.inventoryLocation.findMany({
    where: { isActive: true },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  })
}

export async function createLocation(data: CreateLocation) {
  const db = getDatabase()

  const existing = await db.inventoryLocation.findUnique({
    where: { slug: data.slug },
  })
  if (existing) throw new ConflictError(`Location with slug "${data.slug}" already exists`)

  if (data.isDefault) {
    await db.inventoryLocation.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    })
  }

  return db.inventoryLocation.create({
    data: {
      name: data.name,
      slug: data.slug,
      type: data.type,
      address: data.address,
      isDefault: data.isDefault ?? false,
      shopifyLocationId: data.shopifyLocationId,
    },
  })
}

export async function updateLocation(id: string, data: UpdateLocation) {
  const db = getDatabase()

  const existing = await db.inventoryLocation.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Location not found')

  if (data.slug && data.slug !== existing.slug) {
    const slugConflict = await db.inventoryLocation.findUnique({
      where: { slug: data.slug },
    })
    if (slugConflict) throw new ConflictError(`Slug "${data.slug}" already in use`)
  }

  if (data.isDefault) {
    await db.inventoryLocation.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false },
    })
  }

  return db.inventoryLocation.update({ where: { id }, data })
}

export async function getStockByLocation(variantId: string) {
  const db = getDatabase()

  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
  })
  if (!variant) throw new NotFoundError('Variant not found')

  return db.locationStock.findMany({
    where: { variantId },
    include: {
      location: {
        select: { id: true, name: true, slug: true, type: true },
      },
    },
    orderBy: { location: { name: 'asc' } },
  })
}

export async function getStockMatrix(productId: string) {
  const db = getDatabase()

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true },
  })
  if (!product) throw new NotFoundError('Product not found')

  const variants = await db.productVariant.findMany({
    where: { productId },
    orderBy: [{ color: 'asc' }, { sizeOrder: 'asc' }],
    include: {
      locationStocks: {
        include: {
          location: {
            select: { id: true, name: true, slug: true, type: true },
          },
        },
      },
    },
  })

  return variants.map((variant: any) => ({
    id: variant.id,
    sku: variant.sku,
    color: variant.color,
    size: variant.size,
    status: variant.status,
    totalStock: variant.stockQuantity,
    locations: variant.locationStocks.map((ls: any) => ({
      location: ls.location,
      quantity: ls.quantity,
      minThreshold: ls.minThreshold,
      status: evaluateVariantStatus(ls.quantity, ls.minThreshold),
    })),
  }))
}

export async function updateStock(
  variantId: string,
  locationId: string,
  delta: number,
  reason: string,
  userId: string,
) {
  const db = getDatabase()

  return db.$transaction(async (tx: TxClient) => {
    const variant = await tx.productVariant.findUnique({
      where: { id: variantId },
    })
    if (!variant) throw new NotFoundError('Variant not found')

    const location = await tx.inventoryLocation.findUnique({
      where: { id: locationId },
    })
    if (!location) throw new NotFoundError('Location not found')

    const locationStock = await tx.locationStock.upsert({
      where: {
        variantId_locationId: { variantId, locationId },
      },
      create: {
        variantId,
        locationId,
        quantity: Math.max(delta, 0),
      },
      update: {},
    })

    const newQuantity = Math.max(locationStock.quantity + delta, 0)

    await tx.locationStock.update({
      where: { id: locationStock.id },
      data: { quantity: newQuantity },
    })

    const movementType = delta > 0 ? 'ENTRY' : delta < 0 ? 'EXIT' : 'ADJUSTMENT'

    await tx.stockMovement.create({
      data: {
        variantId,
        locationId,
        type: movementType,
        quantity: delta,
        reason,
        referenceType: 'MANUAL',
        performedById: userId,
      },
    })

    await recalculateVariantStock(variantId, tx)

    return tx.locationStock.findUnique({
      where: { variantId_locationId: { variantId, locationId } },
      include: {
        location: {
          select: { id: true, name: true, slug: true, type: true },
        },
      },
    })
  })
}

export async function transferStock(
  data: TransferStock,
  userId: string,
) {
  const db = getDatabase()

  if (data.fromLocationId === data.toLocationId) {
    throw new ConflictError('Source and destination locations must be different')
  }

  return db.$transaction(async (tx: TxClient) => {
    const variant = await tx.productVariant.findUnique({
      where: { id: data.variantId },
    })
    if (!variant) throw new NotFoundError('Variant not found')

    const [fromLocation, toLocation] = await Promise.all([
      tx.inventoryLocation.findUnique({ where: { id: data.fromLocationId } }),
      tx.inventoryLocation.findUnique({ where: { id: data.toLocationId } }),
    ])
    if (!fromLocation) throw new NotFoundError('Source location not found')
    if (!toLocation) throw new NotFoundError('Destination location not found')

    const fromStock = await tx.locationStock.findUnique({
      where: {
        variantId_locationId: {
          variantId: data.variantId,
          locationId: data.fromLocationId,
        },
      },
    })

    if (!fromStock || fromStock.quantity < data.quantity) {
      throw new ConflictError(
        `Insufficient stock at "${fromLocation.name}". Available: ${fromStock?.quantity ?? 0}, requested: ${data.quantity}`,
      )
    }

    await tx.locationStock.update({
      where: { id: fromStock.id },
      data: { quantity: fromStock.quantity - data.quantity },
    })

    await tx.locationStock.upsert({
      where: {
        variantId_locationId: {
          variantId: data.variantId,
          locationId: data.toLocationId,
        },
      },
      create: {
        variantId: data.variantId,
        locationId: data.toLocationId,
        quantity: data.quantity,
      },
      update: {
        quantity: { increment: data.quantity },
      },
    })

    await tx.stockMovement.create({
      data: {
        variantId: data.variantId,
        locationId: data.fromLocationId,
        type: 'TRANSFER_OUT',
        quantity: -data.quantity,
        reason: data.reason,
        referenceType: 'MANUAL',
        performedById: userId,
      },
    })

    await tx.stockMovement.create({
      data: {
        variantId: data.variantId,
        locationId: data.toLocationId,
        type: 'TRANSFER_IN',
        quantity: data.quantity,
        reason: data.reason,
        referenceType: 'MANUAL',
        performedById: userId,
      },
    })

    await recalculateVariantStock(data.variantId, tx)

    return {
      variantId: data.variantId,
      from: { locationId: data.fromLocationId, name: fromLocation.name },
      to: { locationId: data.toLocationId, name: toLocation.name },
      quantity: data.quantity,
      reason: data.reason,
    }
  })
}

export async function getTotalStock(variantId: string): Promise<number> {
  const db = getDatabase()

  const result = await db.locationStock.aggregate({
    where: { variantId },
    _sum: { quantity: true },
  })

  return result._sum.quantity ?? 0
}

export async function getLowStockByLocation(locationId: string) {
  const db = getDatabase()

  const location = await db.inventoryLocation.findUnique({
    where: { id: locationId },
  })
  if (!location) throw new NotFoundError('Location not found')

  const allStocks = await db.locationStock.findMany({
    where: { locationId, quantity: { gt: 0 } },
    include: {
      variant: {
        select: {
          id: true,
          sku: true,
          color: true,
          size: true,
          product: { select: { id: true, name: true, basePriceCents: true } },
        },
      },
    },
  })

  return allStocks.filter((stock: any) => stock.quantity <= stock.minThreshold)
}

export async function getOutOfStockByLocation(locationId: string) {
  const db = getDatabase()

  const location = await db.inventoryLocation.findUnique({
    where: { id: locationId },
  })
  if (!location) throw new NotFoundError('Location not found')

  return db.locationStock.findMany({
    where: { locationId, quantity: 0 },
    include: {
      variant: {
        select: {
          id: true,
          sku: true,
          color: true,
          size: true,
          product: { select: { id: true, name: true, basePriceCents: true } },
        },
      },
    },
  })
}
