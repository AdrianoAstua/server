import { getDatabase, PrismaClient } from '@voneb/database'
import { NotFoundError, ValidationError } from '../lib/errors.js'
import { VALID_ORDER_TRANSITIONS, ORDER_NUMBER_PREFIX, SHIPPING_CORREOS_CR_CENTS } from '@voneb/shared'
import type { OrderFilters, CreateOrder, UpdateOrderStatus } from '../schemas/order-schemas.js'

type TxClient = PrismaClient

function evaluateVariantStatus(
  stockQuantity: number,
  minStockThreshold: number,
): 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' {
  if (stockQuantity <= 0) return 'OUT_OF_STOCK'
  if (stockQuantity <= minStockThreshold) return 'LOW_STOCK'
  return 'AVAILABLE'
}

async function generateOrderNumber(tx: TxClient): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const endOfYear = new Date(year + 1, 0, 1)

  const count = await tx.order.count({
    where: {
      createdAt: { gte: startOfYear, lt: endOfYear },
    },
  })

  const sequence = String(count + 1).padStart(4, '0')
  return `${ORDER_NUMBER_PREFIX}-${year}-${sequence}`
}

export async function listOrders(filters: OrderFilters) {
  const db = getDatabase()
  const { page, limit, ...rest } = filters
  const skip = (page - 1) * limit

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma where input
  const where: Record<string, any> = {}

  if (rest.status) where['status'] = rest.status
  if (rest.customerId) where['customerId'] = rest.customerId
  if (rest.source) where['source'] = rest.source
  if (rest.assignedToId) where['assignedToId'] = rest.assignedToId

  if (rest.dateFrom || rest.dateTo) {
    const dateFilter: Record<string, Date> = {}
    if (rest.dateFrom) dateFilter['gte'] = rest.dateFrom
    if (rest.dateTo) dateFilter['lte'] = rest.dateTo
    where['createdAt'] = dateFilter
  }

  if (rest.search) {
    where['OR'] = [
      { orderNumber: { contains: rest.search, mode: 'insensitive' } },
      { customer: { firstName: { contains: rest.search, mode: 'insensitive' } } },
      { customer: { lastName: { contains: rest.search, mode: 'insensitive' } } },
      { customer: { whatsappPhone: { contains: rest.search, mode: 'insensitive' } } },
    ]
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, whatsappPhone: true },
        },
        items: { select: { id: true, quantity: true, totalPriceCents: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
    db.order.count({ where }),
  ])

  return { data: orders, total, page, limit }
}

export async function getOrderById(id: string) {
  const db = getDatabase()

  const order = await db.order.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true, firstName: true, lastName: true,
          whatsappPhone: true, email: true,
        },
      },
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
      assignedTo: { select: { id: true, name: true } },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        include: { changedBy: { select: { id: true, name: true } } },
      },
    },
  })

  if (!order) throw new NotFoundError('Order not found')
  return order
}

export async function createOrder(data: CreateOrder) {
  const db = getDatabase()

  return db.$transaction(async (tx: TxClient) => {
    // Validate customer exists
    const customer = await tx.customer.findUnique({ where: { id: data.customerId } })
    if (!customer) throw new NotFoundError('Customer not found')

    // Validate stock for each item and collect variant data
    const insufficientStock: Array<{ variantId: string; sku: string; requested: number; available: number }> = []
    const variantData: Array<{
      variant: { id: string; sku: string; stockQuantity: number; minStockThreshold: number; additionalPriceCents: number; product: { basePriceCents: number } }
      quantity: number
      notes?: string
    }> = []

    for (const item of data.items) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: { select: { basePriceCents: true } } },
      })

      if (!variant) throw new NotFoundError(`Variant "${item.variantId}" not found`)

      if (variant.stockQuantity < item.quantity) {
        insufficientStock.push({
          variantId: variant.id,
          sku: variant.sku,
          requested: item.quantity,
          available: variant.stockQuantity,
        })
      }

      variantData.push({ variant, quantity: item.quantity, notes: item.notes })
    }

    if (insufficientStock.length > 0) {
      throw new ValidationError('Insufficient stock for one or more items', insufficientStock)
    }

    // Calculate totals
    let subtotalCents = 0
    for (const { variant, quantity } of variantData) {
      const unitPrice = variant.product.basePriceCents + variant.additionalPriceCents
      subtotalCents += unitPrice * quantity
    }

    const shippingCents = data.deliveryMethod === 'CORREOS_CR' ? SHIPPING_CORREOS_CR_CENTS : 0
    const totalCents = subtotalCents + shippingCents

    // Generate order number
    const orderNumber = await generateOrderNumber(tx)

    // Create order
    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId: data.customerId,
        status: 'PENDING',
        subtotalCents,
        shippingCents,
        totalCents,
        deliveryMethod: data.deliveryMethod,
        deliveryAddress: data.deliveryAddress ?? undefined,
        customerNotes: data.customerNotes,
        source: data.source,
      },
    })

    // Create order items and deduct stock
    for (const { variant, quantity, notes } of variantData) {
      const unitPrice = variant.product.basePriceCents + variant.additionalPriceCents

      await tx.orderItem.create({
        data: {
          orderId: order.id,
          variantId: variant.id,
          quantity,
          unitPriceCents: unitPrice,
          totalPriceCents: unitPrice * quantity,
          notes,
        },
      })

      // Deduct stock
      const newQuantity = variant.stockQuantity - quantity
      const status = evaluateVariantStatus(newQuantity, variant.minStockThreshold)

      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stockQuantity: newQuantity, status },
      })

      await tx.stockMovement.create({
        data: {
          variantId: variant.id,
          type: 'EXIT',
          quantity: -quantity,
          reason: `Order ${orderNumber}`,
          referenceType: 'ORDER',
          referenceId: order.id,
        },
      })
    }

    // Create initial status history entry
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: null,
        toStatus: 'PENDING',
        notes: 'Order created',
      },
    })

    // Update customer stats
    await tx.customer.update({
      where: { id: data.customerId },
      data: {
        totalOrders: { increment: 1 },
        totalSpent: { increment: totalCents },
        lastInteractionAt: new Date(),
      },
    })

    // Return complete order
    return tx.order.findUnique({
      where: { id: order.id },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, whatsappPhone: true },
        },
        items: {
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true, images: true } },
              },
            },
          },
        },
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    })
  })
}

export async function updateOrderStatus(id: string, data: UpdateOrderStatus, userId?: string) {
  const db = getDatabase()

  return db.$transaction(async (tx: TxClient) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { items: { include: { variant: true } } },
    })

    if (!order) throw new NotFoundError('Order not found')

    // Validate transition
    const allowedTransitions = VALID_ORDER_TRANSITIONS[order.status] ?? []
    if (!allowedTransitions.includes(data.status)) {
      throw new ValidationError(
        `Cannot transition from ${order.status} to ${data.status}`,
        { currentStatus: order.status, requestedStatus: data.status, allowed: allowedTransitions },
      )
    }

    // If cancelling, return stock
    if (data.status === 'CANCELLED') {
      await returnOrderStock(tx, order)
    }

    // Update order status
    const updated = await tx.order.update({
      where: { id },
      data: { status: data.status },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, whatsappPhone: true },
        },
        items: {
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true, images: true } },
              },
            },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: { changedBy: { select: { id: true, name: true } } },
        },
      },
    })

    // Create status history entry
    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        fromStatus: order.status,
        toStatus: data.status,
        changedById: userId ?? null,
        notes: data.notes,
      },
    })

    return updated
  })
}

async function returnOrderStock(
  tx: TxClient,
  order: { id: string; orderNumber: string; items: Array<{ variantId: string; quantity: number; variant: { id: string; stockQuantity: number; minStockThreshold: number } }> },
): Promise<void> {
  for (const item of order.items) {
    const newQuantity = item.variant.stockQuantity + item.quantity
    const status = evaluateVariantStatus(newQuantity, item.variant.minStockThreshold)

    await tx.productVariant.update({
      where: { id: item.variantId },
      data: { stockQuantity: newQuantity, status },
    })

    await tx.stockMovement.create({
      data: {
        variantId: item.variantId,
        type: 'RETURN',
        quantity: item.quantity,
        reason: `Order ${order.orderNumber} cancelled`,
        referenceType: 'ORDER',
        referenceId: order.id,
      },
    })
  }
}

export async function cancelOrder(id: string, reason: string, userId?: string) {
  return updateOrderStatus(id, { status: 'CANCELLED', notes: reason }, userId)
}

export async function getOrderTimeline(id: string) {
  const db = getDatabase()

  const order = await db.order.findUnique({ where: { id } })
  if (!order) throw new NotFoundError('Order not found')

  return db.orderStatusHistory.findMany({
    where: { orderId: id },
    orderBy: { createdAt: 'asc' },
    include: {
      changedBy: { select: { id: true, name: true } },
    },
  })
}
