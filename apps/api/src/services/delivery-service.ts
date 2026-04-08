import { getDatabase, PrismaClient } from '@voneb/database'
import { NotFoundError, ValidationError } from '../lib/errors.js'
import { VALID_WORK_ORDER_TRANSITIONS } from '@voneb/shared'
import type {
  CreateDelivery,
  UpdateDelivery,
  ShipDelivery,
  ConfirmDelivery,
  ListDeliveriesFilters,
} from '../schemas/delivery-schemas.js'

type TxClient = PrismaClient

// ─────────────────────────────────────────────
// Create delivery record
// ─────────────────────────────────────────────

export async function createDeliveryRecord(
  workOrderId: string,
  deliveryType: 'ENVIO' | 'RETIRO_SUCURSAL' | 'TIENDA',
  scheduledDate?: Date,
  notes?: string,
) {
  const db = getDatabase()

  const workOrder = await db.workOrder.findUnique({ where: { id: workOrderId } })
  if (!workOrder) throw new NotFoundError('Work order not found')

  // Check if delivery record already exists
  const existing = await db.deliveryRecord.findUnique({ where: { workOrderId } })
  if (existing) {
    throw new ValidationError('A delivery record already exists for this work order')
  }

  return db.deliveryRecord.create({
    data: {
      workOrderId,
      deliveryType,
      status: 'PENDING',
      scheduledDate: scheduledDate ?? null,
      notes: notes ?? null,
    },
    include: {
      workOrder: {
        select: {
          id: true,
          workOrderNumber: true,
          status: true,
          customer: { select: { firstName: true, lastName: true, whatsappPhone: true } },
        },
      },
    },
  })
}

// ─────────────────────────────────────────────
// Update delivery
// ─────────────────────────────────────────────

export async function updateDelivery(id: string, data: UpdateDelivery) {
  const db = getDatabase()

  const delivery = await db.deliveryRecord.findUnique({ where: { id } })
  if (!delivery) throw new NotFoundError('Delivery record not found')

  if (delivery.status === 'DELIVERED') {
    throw new ValidationError('Cannot update a delivered record')
  }

  return db.deliveryRecord.update({
    where: { id },
    data: {
      carrierName: data.carrierName ?? undefined,
      trackingNumber: data.trackingNumber ?? undefined,
      scheduledDate: data.scheduledDate ?? undefined,
      notes: data.notes ?? undefined,
    },
    include: {
      workOrder: {
        select: {
          id: true,
          workOrderNumber: true,
          status: true,
          customer: { select: { firstName: true, lastName: true } },
        },
      },
    },
  })
}

// ─────────────────────────────────────────────
// Ship delivery
// ─────────────────────────────────────────────

export async function shipDelivery(
  id: string,
  carrierName: string,
  trackingNumber: string,
  userId?: string,
) {
  const db = getDatabase()

  return db.$transaction(async (tx: TxClient) => {
    const delivery = await tx.deliveryRecord.findUnique({
      where: { id },
      include: { workOrder: { select: { id: true, status: true } } },
    })

    if (!delivery) throw new NotFoundError('Delivery record not found')

    if (delivery.status !== 'PENDING') {
      throw new ValidationError(
        `Cannot ship a delivery with status "${delivery.status}". Must be PENDING.`,
      )
    }

    // Update delivery record
    const updated = await tx.deliveryRecord.update({
      where: { id },
      data: {
        status: 'IN_TRANSIT',
        carrierName,
        trackingNumber,
        shippedAt: new Date(),
      },
      include: {
        workOrder: {
          select: {
            id: true,
            workOrderNumber: true,
            status: true,
            customer: { select: { firstName: true, lastName: true, whatsappPhone: true } },
          },
        },
      },
    })

    // Update work order status to EN_TRANSITO if valid transition
    const currentStatus = delivery.workOrder.status
    const allowedTransitions = VALID_WORK_ORDER_TRANSITIONS[currentStatus] ?? []
    if (allowedTransitions.includes('EN_TRANSITO')) {
      await tx.workOrder.update({
        where: { id: delivery.workOrder.id },
        data: { status: 'EN_TRANSITO' },
      })

      await tx.workOrderStatusHistory.create({
        data: {
          workOrderId: delivery.workOrder.id,
          fromStatus: currentStatus,
          toStatus: 'EN_TRANSITO',
          changedById: userId ?? null,
          notes: `Enviado via ${carrierName} — tracking: ${trackingNumber}`,
          automatic: true,
        },
      })
    }

    return updated
  })
}

// ─────────────────────────────────────────────
// Confirm delivery
// ─────────────────────────────────────────────

export async function confirmDelivery(
  id: string,
  receivedByName: string,
  signatureUrl?: string,
  photoUrl?: string,
  userId?: string,
) {
  const db = getDatabase()

  return db.$transaction(async (tx: TxClient) => {
    const delivery = await tx.deliveryRecord.findUnique({
      where: { id },
      include: { workOrder: { select: { id: true, status: true } } },
    })

    if (!delivery) throw new NotFoundError('Delivery record not found')

    if (delivery.status === 'DELIVERED') {
      throw new ValidationError('This delivery has already been confirmed')
    }

    // Update delivery record
    const updated = await tx.deliveryRecord.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        receivedByName,
        signatureUrl: signatureUrl ?? null,
        photoUrl: photoUrl ?? null,
        confirmedById: userId ?? null,
      },
      include: {
        workOrder: {
          select: {
            id: true,
            workOrderNumber: true,
            status: true,
            customer: { select: { firstName: true, lastName: true, whatsappPhone: true } },
          },
        },
      },
    })

    // Update work order status to ENTREGADO if valid transition
    const currentStatus = delivery.workOrder.status
    const allowedTransitions = VALID_WORK_ORDER_TRANSITIONS[currentStatus] ?? []
    if (allowedTransitions.includes('ENTREGADO')) {
      await tx.workOrder.update({
        where: { id: delivery.workOrder.id },
        data: {
          status: 'ENTREGADO',
          actualCompletionDate: new Date(),
        },
      })

      await tx.workOrderStatusHistory.create({
        data: {
          workOrderId: delivery.workOrder.id,
          fromStatus: currentStatus,
          toStatus: 'ENTREGADO',
          changedById: userId ?? null,
          notes: `Entregado a ${receivedByName}`,
          automatic: true,
        },
      })
    }

    return updated
  })
}

// ─────────────────────────────────────────────
// Get delivery by work order
// ─────────────────────────────────────────────

export async function getDeliveryByWorkOrder(workOrderId: string) {
  const db = getDatabase()

  const delivery = await db.deliveryRecord.findUnique({
    where: { workOrderId },
    include: {
      workOrder: {
        select: {
          id: true,
          workOrderNumber: true,
          status: true,
          customer: { select: { firstName: true, lastName: true, whatsappPhone: true } },
        },
      },
      confirmedBy: { select: { id: true, name: true } },
    },
  })

  if (!delivery) throw new NotFoundError('No delivery record found for this work order')

  return delivery
}

// ─────────────────────────────────────────────
// List deliveries (paginated)
// ─────────────────────────────────────────────

export async function listDeliveries(filters: ListDeliveriesFilters) {
  const db = getDatabase()
  const { page, limit, ...rest } = filters
  const skip = (page - 1) * limit

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma where input
  const where: Record<string, any> = {}

  if (rest.status) where['status'] = rest.status
  if (rest.deliveryType) where['deliveryType'] = rest.deliveryType

  if (rest.dateFrom || rest.dateTo) {
    const dateFilter: Record<string, Date> = {}
    if (rest.dateFrom) dateFilter['gte'] = rest.dateFrom
    if (rest.dateTo) dateFilter['lte'] = rest.dateTo
    where['createdAt'] = dateFilter
  }

  if (rest.search) {
    where['OR'] = [
      { workOrder: { workOrderNumber: { contains: rest.search, mode: 'insensitive' } } },
      { carrierName: { contains: rest.search, mode: 'insensitive' } },
      { trackingNumber: { contains: rest.search, mode: 'insensitive' } },
      { workOrder: { customer: { firstName: { contains: rest.search, mode: 'insensitive' } } } },
    ]
  }

  const [deliveries, total] = await Promise.all([
    db.deliveryRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        workOrder: {
          select: {
            id: true,
            workOrderNumber: true,
            status: true,
            customer: { select: { firstName: true, lastName: true, whatsappPhone: true } },
          },
        },
        confirmedBy: { select: { id: true, name: true } },
      },
    }),
    db.deliveryRecord.count({ where }),
  ])

  return { data: deliveries, total, page, limit }
}
