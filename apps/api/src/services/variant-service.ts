import { getDatabase, PrismaClient } from '@voneb/database'
import { NotFoundError, ConflictError } from '../lib/errors.js'
import type { AddVariant, UpdateVariant, BulkUpdateStock } from '../schemas/variant-schemas.js'

type TxClient = PrismaClient

function evaluateVariantStatus(
  stockQuantity: number,
  minStockThreshold: number,
): 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' {
  if (stockQuantity <= 0) return 'OUT_OF_STOCK'
  if (stockQuantity <= minStockThreshold) return 'LOW_STOCK'
  return 'AVAILABLE'
}

function generateSku(
  categoryName: string,
  productName: string,
  color: string,
  size: string,
): string {
  const cat = categoryName.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()
  const prod = productName.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()
  const col = color.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()
  const sz = size.toUpperCase()
  return `${cat}-${prod}-${col}-${sz}`
}

export async function addVariant(productId: string, data: AddVariant) {
  const db = getDatabase()

  const product = await db.product.findUnique({
    where: { id: productId },
    include: { category: { select: { name: true } } },
  })
  if (!product) throw new NotFoundError('Product not found')

  const sku = generateSku(product.category.name, product.name, data.color, data.size)

  const existingSku = await db.productVariant.findUnique({ where: { sku } })
  if (existingSku) throw new ConflictError(`SKU "${sku}" already exists`)

  const status = evaluateVariantStatus(data.stockQuantity, data.minStockThreshold)

  return db.$transaction(async (tx: TxClient) => {
    const variant = await tx.productVariant.create({
      data: {
        productId,
        sku,
        color: data.color,
        colorHex: data.colorHex,
        size: data.size,
        sizeOrder: data.sizeOrder,
        stockQuantity: data.stockQuantity,
        minStockThreshold: data.minStockThreshold,
        additionalPriceCents: data.additionalPriceCents,
        weightGrams: data.weightGrams,
        barcode: data.barcode,
        status,
      },
    })

    if (data.stockQuantity > 0) {
      await tx.stockMovement.create({
        data: {
          variantId: variant.id,
          type: 'ENTRY',
          quantity: data.stockQuantity,
          reason: 'Initial stock on variant creation',
          referenceType: 'MANUAL',
        },
      })
    }

    return variant
  })
}

export async function updateVariant(id: string, data: UpdateVariant) {
  const db = getDatabase()

  const existing = await db.productVariant.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Variant not found')

  return db.productVariant.update({ where: { id }, data })
}

export async function updateStock(
  id: string,
  quantity: number,
  reason: string,
  userId?: string,
) {
  const db = getDatabase()

  return db.$transaction(async (tx: TxClient) => {
    const variant = await tx.productVariant.findUnique({ where: { id } })
    if (!variant) throw new NotFoundError('Variant not found')

    const newQuantity = variant.stockQuantity + quantity
    const finalQuantity = Math.max(newQuantity, 0)
    const status = evaluateVariantStatus(finalQuantity, variant.minStockThreshold)

    const movementType = quantity > 0 ? 'ENTRY' : quantity < 0 ? 'EXIT' : 'ADJUSTMENT'

    await tx.stockMovement.create({
      data: {
        variantId: id,
        type: movementType,
        quantity,
        reason,
        referenceType: 'MANUAL',
        performedById: userId ?? null,
      },
    })

    return tx.productVariant.update({
      where: { id },
      data: { stockQuantity: finalQuantity, status },
    })
  })
}

export async function bulkUpdateStock(
  updates: BulkUpdateStock['updates'],
  userId?: string,
) {
  const db = getDatabase()

  return db.$transaction(async (tx: TxClient) => {
    const results = []

    for (const update of updates) {
      const variant = await tx.productVariant.findUnique({
        where: { id: update.variantId },
      })
      if (!variant) throw new NotFoundError(`Variant "${update.variantId}" not found`)

      const newQuantity = Math.max(variant.stockQuantity + update.quantity, 0)
      const status = evaluateVariantStatus(newQuantity, variant.minStockThreshold)
      const movementType =
        update.quantity > 0 ? 'ENTRY' : update.quantity < 0 ? 'EXIT' : 'ADJUSTMENT'

      await tx.stockMovement.create({
        data: {
          variantId: update.variantId,
          type: movementType,
          quantity: update.quantity,
          reason: update.reason,
          referenceType: 'MANUAL',
          performedById: userId ?? null,
        },
      })

      const updated = await tx.productVariant.update({
        where: { id: update.variantId },
        data: { stockQuantity: newQuantity, status },
      })

      results.push(updated)
    }

    return results
  })
}

export async function getBySkuOrSearch(query: string, limit: number) {
  const db = getDatabase()

  return db.productVariant.findMany({
    where: {
      OR: [
        { sku: { contains: query, mode: 'insensitive' } },
        { product: { name: { contains: query, mode: 'insensitive' } } },
        { product: { category: { name: { contains: query, mode: 'insensitive' } } } },
      ],
    },
    take: limit,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          basePriceCents: true,
          images: true,
          category: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { sku: 'asc' },
  })
}
