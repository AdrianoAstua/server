import { getDatabase, PrismaClient } from '@voneb/database'
import { NotFoundError, ValidationError } from '../lib/errors.js'
import {
  VALID_WORK_ORDER_TRANSITIONS,
  WORK_ORDER_NUMBER_PREFIX,
  PRODUCTION_STATES,
} from '@voneb/shared'
import type {
  CreateWorkOrder,
  UpdateWorkOrderStatus,
  ListWorkOrdersFilters,
} from '../schemas/work-order-schemas.js'

type TxClient = PrismaClient

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Full include clause for work order queries */
const fullWorkOrderInclude = {
  customer: {
    select: {
      id: true, firstName: true, lastName: true,
      whatsappPhone: true, email: true,
    },
  },
  lines: {
    orderBy: { lineNumber: 'asc' as const },
  },
  designFiles: {
    orderBy: { createdAt: 'desc' as const },
  },
  designApprovals: {
    orderBy: { createdAt: 'desc' as const },
  },
  statusHistory: {
    orderBy: { createdAt: 'desc' as const },
    include: { changedBy: { select: { id: true, name: true } } },
  },
  incidents: {
    orderBy: { createdAt: 'desc' as const },
  },
  delivery: true,
  assignedDesigner: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
} as const

/**
 * Generate work order number: VB-YYYYMM-XXXX
 * Uses count of work orders in the current month + 1.
 */
async function generateWorkOrderNumber(tx: TxClient): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-indexed
  const startOfMonth = new Date(year, month, 1)
  const endOfMonth = new Date(year, month + 1, 1)

  const count = await tx.workOrder.count({
    where: {
      createdAt: { gte: startOfMonth, lt: endOfMonth },
    },
  })

  const yearMonth = `${year}${String(month + 1).padStart(2, '0')}`
  const sequence = String(count + 1).padStart(4, '0')
  return `${WORK_ORDER_NUMBER_PREFIX}-${yearMonth}-${sequence}`
}

// ─────────────────────────────────────────────
// createWorkOrder
// ─────────────────────────────────────────────

export async function createWorkOrder(data: CreateWorkOrder, userId: string) {
  const db = getDatabase()

  return db.$transaction(async (tx: TxClient) => {
    // Validate customer exists
    const customer = await tx.customer.findUnique({ where: { id: data.customerId } })
    if (!customer) throw new NotFoundError('Customer not found')

    // Generate work order number — doubles as barcode value
    const workOrderNumber = await generateWorkOrderNumber(tx)

    // Calculate totals
    let subtotalCents = 0
    for (const line of data.lines) {
      subtotalCents += line.unitPriceCents * line.quantity
    }
    const taxCents = Math.round(subtotalCents * 0.13) // IVA 13%
    const totalCents = subtotalCents + taxCents

    // Create work order
    const workOrder = await tx.workOrder.create({
      data: {
        workOrderNumber,
        barcode: workOrderNumber, // Code128 barcode value = the number itself
        customerId: data.customerId,
        status: 'BORRADOR',
        priority: data.priority,
        source: data.source,
        deliveryType: data.deliveryType,
        subtotalCents,
        taxCents,
        totalCents,
        customerNotes: data.customerNotes,
        internalNotes: data.internalNotes,
        createdById: userId,
      },
    })

    // Create lines with individual barcodes
    for (let i = 0; i < data.lines.length; i++) {
      const line = data.lines[i]!
      const lineNumber = i + 1
      const lineBarcode = `${workOrderNumber}-L${String(lineNumber).padStart(2, '0')}`

      await tx.workOrderLine.create({
        data: {
          workOrderId: workOrder.id,
          lineNumber,
          barcode: lineBarcode,
          productType: line.productType,
          description: line.description,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
          specifications: line.specifications ?? undefined,
          status: 'BORRADOR',
        },
      })
    }

    // Create initial status history entry
    await tx.workOrderStatusHistory.create({
      data: {
        workOrderId: workOrder.id,
        fromStatus: null,
        toStatus: 'BORRADOR',
        changedById: userId,
        notes: 'Work order created',
      },
    })

    // Return complete work order
    return tx.workOrder.findUnique({
      where: { id: workOrder.id },
      include: fullWorkOrderInclude,
    })
  })
}

// ─────────────────────────────────────────────
// getWorkOrderById
// ─────────────────────────────────────────────

export async function getWorkOrderById(id: string) {
  const db = getDatabase()

  const workOrder = await db.workOrder.findUnique({
    where: { id },
    include: fullWorkOrderInclude,
  })

  if (!workOrder) throw new NotFoundError('Work order not found')
  return workOrder
}

// ─────────────────────────────────────────────
// getWorkOrderByBarcode
// ─────────────────────────────────────────────

export async function getWorkOrderByBarcode(barcode: string) {
  const db = getDatabase()

  const workOrder = await db.workOrder.findUnique({
    where: { barcode },
    include: fullWorkOrderInclude,
  })

  if (!workOrder) throw new NotFoundError('Work order not found for barcode')
  return workOrder
}

// ─────────────────────────────────────────────
// listWorkOrders
// ─────────────────────────────────────────────

export async function listWorkOrders(filters: ListWorkOrdersFilters) {
  const db = getDatabase()
  const { page, limit, sortBy, sortOrder, ...rest } = filters
  const skip = (page - 1) * limit

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma where input
  const where: Record<string, any> = {}

  if (rest.status) where['status'] = rest.status
  if (rest.priority) where['priority'] = rest.priority
  if (rest.customerId) where['customerId'] = rest.customerId
  if (rest.assignedDesignerId) where['assignedDesignerId'] = rest.assignedDesignerId

  if (rest.dateFrom || rest.dateTo) {
    const dateFilter: Record<string, Date> = {}
    if (rest.dateFrom) dateFilter['gte'] = rest.dateFrom
    if (rest.dateTo) dateFilter['lte'] = rest.dateTo
    where['createdAt'] = dateFilter
  }

  if (rest.search) {
    where['OR'] = [
      { workOrderNumber: { contains: rest.search, mode: 'insensitive' } },
      { barcode: { contains: rest.search, mode: 'insensitive' } },
      { customer: { firstName: { contains: rest.search, mode: 'insensitive' } } },
      { customer: { lastName: { contains: rest.search, mode: 'insensitive' } } },
      { customer: { whatsappPhone: { contains: rest.search, mode: 'insensitive' } } },
    ]
  }

  const [workOrders, total] = await Promise.all([
    db.workOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, whatsappPhone: true },
        },
        lines: { select: { id: true, quantity: true, unitPriceCents: true, productType: true } },
        assignedDesigner: { select: { id: true, name: true } },
      },
    }),
    db.workOrder.count({ where }),
  ])

  return { data: workOrders, total, page, limit }
}

// ─────────────────────────────────────────────
// updateWorkOrderStatus
// ─────────────────────────────────────────────

export async function updateWorkOrderStatus(
  id: string,
  data: UpdateWorkOrderStatus,
  userId?: string,
) {
  const db = getDatabase()

  return db.$transaction(async (tx: TxClient) => {
    const workOrder = await tx.workOrder.findUnique({
      where: { id },
      include: {
        designApprovals: true,
        incidents: true,
      },
    })

    if (!workOrder) throw new NotFoundError('Work order not found')

    // Validate transition against state machine
    const allowedTransitions = VALID_WORK_ORDER_TRANSITIONS[workOrder.status] ?? []
    if (!allowedTransitions.includes(data.status)) {
      throw new ValidationError(
        `Cannot transition from ${workOrder.status} to ${data.status}`,
        { currentStatus: workOrder.status, requestedStatus: data.status, allowed: allowedTransitions },
      )
    }

    // ── Business rules ──

    // Can't move to APROBADO_PARA_PRODUCCION without at least one approved DesignApproval
    if (data.status === 'APROBADO_PARA_PRODUCCION') {
      const hasApproved = workOrder.designApprovals.some(
        (a) => a.status === 'APPROVED',
      )
      if (!hasApproved) {
        throw new ValidationError(
          'Cannot approve for production without at least one approved design',
          { reason: 'NO_APPROVED_DESIGN' },
        )
      }
    }

    // Can't move to CERRADO if any Incident has status OPEN or INVESTIGATING
    if (data.status === 'CERRADO') {
      const openIncidents = workOrder.incidents.filter(
        (i) => i.status === 'OPEN' || i.status === 'INVESTIGATING',
      )
      if (openIncidents.length > 0) {
        throw new ValidationError(
          'Cannot close work order with open or investigating incidents',
          { openIncidentCount: openIncidents.length },
        )
      }
    }

    // CANCELADO from production states requires a specific note
    if (data.status === 'CANCELADO' && PRODUCTION_STATES.includes(workOrder.status)) {
      if (!data.notes || data.notes.trim().length === 0) {
        throw new ValidationError(
          'Cancellation from a production state requires a note explaining the reason',
          { currentStatus: workOrder.status },
        )
      }
    }

    // Update status
    const updated = await tx.workOrder.update({
      where: { id },
      data: { status: data.status },
      include: fullWorkOrderInclude,
    })

    // Create status history entry
    await tx.workOrderStatusHistory.create({
      data: {
        workOrderId: id,
        fromStatus: workOrder.status,
        toStatus: data.status,
        changedById: userId ?? null,
        notes: data.notes,
      },
    })

    return updated
  })
}

// ─────────────────────────────────────────────
// assignDesigner
// ─────────────────────────────────────────────

export async function assignDesigner(
  workOrderId: string,
  designerId: string,
  userId?: string,
) {
  const db = getDatabase()

  return db.$transaction(async (tx: TxClient) => {
    const workOrder = await tx.workOrder.findUnique({ where: { id: workOrderId } })
    if (!workOrder) throw new NotFoundError('Work order not found')

    // Validate designer exists
    const designer = await tx.user.findUnique({ where: { id: designerId } })
    if (!designer) throw new NotFoundError('Designer not found')

    // Assign designer
    const updateData: Record<string, unknown> = {
      assignedDesignerId: designerId,
    }

    // Auto-transition to EN_COLA_DISENO if currently in ORDEN_CONFIRMADA
    const shouldTransition = workOrder.status === 'ORDEN_CONFIRMADA'
    if (shouldTransition) {
      updateData['status'] = 'EN_COLA_DISENO'
    }

    const updated = await tx.workOrder.update({
      where: { id: workOrderId },
      data: updateData,
      include: fullWorkOrderInclude,
    })

    // If we auto-transitioned, create status history entry
    if (shouldTransition) {
      await tx.workOrderStatusHistory.create({
        data: {
          workOrderId,
          fromStatus: workOrder.status,
          toStatus: 'EN_COLA_DISENO',
          changedById: userId ?? null,
          notes: `Designer assigned: ${designer.name}`,
          automatic: true,
        },
      })
    }

    return updated
  })
}

// ─────────────────────────────────────────────
// cancelWorkOrder
// ─────────────────────────────────────────────

export async function cancelWorkOrder(id: string, reason: string, userId?: string) {
  return updateWorkOrderStatus(id, { status: 'CANCELADO', notes: reason }, userId)
}

// ─────────────────────────────────────────────
// getWorkOrderStats
// ─────────────────────────────────────────────

export async function getWorkOrderStats() {
  const db = getDatabase()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [byStatus, totalActive, totalToday] = await Promise.all([
    db.workOrder.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    db.workOrder.count({
      where: {
        status: {
          notIn: ['CERRADO', 'CANCELADO'],
        },
      },
    }),
    db.workOrder.count({
      where: {
        createdAt: { gte: todayStart },
      },
    }),
  ])

  const statusCounts: Record<string, number> = {}
  for (const row of byStatus) {
    statusCounts[row.status] = row._count.id
  }

  return {
    byStatus: statusCounts,
    totalActive,
    totalToday,
  }
}
