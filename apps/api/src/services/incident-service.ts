import { getDatabase } from '@voneb/database'
import { NotFoundError, ValidationError } from '../lib/errors.js'
import type {
  CreateIncident,
  ResolveIncident,
  IncidentFilters,
  IncidentStatsQuery,
} from '../schemas/incident-schemas.js'

async function generateIncidentNumber(): Promise<string> {
  const db = getDatabase()
  const now = new Date()
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`

  const count = await db.incident.count({
    where: {
      createdAt: {
        gte: new Date(now.getFullYear(), now.getMonth(), 1),
        lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      },
    },
  })

  const sequence = String(count + 1).padStart(4, '0')
  return `INC-${yearMonth}-${sequence}`
}

export async function createIncident(data: CreateIncident) {
  const db = getDatabase()

  // Validate work order exists
  const workOrder = await db.workOrder.findUnique({ where: { id: data.workOrderId } })
  if (!workOrder) throw new NotFoundError('Work order not found')

  // Validate work order line if provided
  if (data.workOrderLineId) {
    const line = await db.workOrderLine.findUnique({ where: { id: data.workOrderLineId } })
    if (!line) throw new NotFoundError('Work order line not found')
    if (line.workOrderId !== data.workOrderId) {
      throw new ValidationError('Work order line does not belong to the specified work order')
    }
  }

  // Validate reporter exists
  const reporter = await db.user.findUnique({ where: { id: data.reportedById } })
  if (!reporter) throw new NotFoundError('Reporter user not found')

  const incidentNumber = await generateIncidentNumber()

  const incident = await db.incident.create({
    data: {
      incidentNumber,
      workOrderId: data.workOrderId,
      workOrderLineId: data.workOrderLineId,
      type: data.type,
      severity: data.severity,
      responsibility: data.responsibility,
      description: data.description,
      photos: data.photos,
      costEstimatedCents: data.costEstimatedCents,
      reportedById: data.reportedById,
      status: 'OPEN',
    },
    include: {
      workOrder: {
        select: { id: true, workOrderNumber: true },
      },
      workOrderLine: {
        select: { id: true, barcode: true, description: true },
      },
      reportedBy: { select: { id: true, name: true } },
    },
  })

  return incident
}

export async function getIncidentById(id: string) {
  const db = getDatabase()

  const incident = await db.incident.findUnique({
    where: { id },
    include: {
      workOrder: {
        select: {
          id: true,
          workOrderNumber: true,
          status: true,
          customer: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
      workOrderLine: {
        select: { id: true, barcode: true, lineNumber: true, description: true, status: true },
      },
      reportedBy: { select: { id: true, name: true } },
      resolvedBy: { select: { id: true, name: true } },
    },
  })

  if (!incident) throw new NotFoundError('Incident not found')
  return incident
}

export async function listIncidents(filters: IncidentFilters) {
  const db = getDatabase()
  const { page, limit, ...rest } = filters
  const skip = (page - 1) * limit

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma where input
  const where: Record<string, any> = {}

  if (rest.type) where['type'] = rest.type
  if (rest.severity) where['severity'] = rest.severity
  if (rest.status) where['status'] = rest.status
  if (rest.workOrderId) where['workOrderId'] = rest.workOrderId
  if (rest.responsibility) where['responsibility'] = rest.responsibility

  if (rest.dateFrom || rest.dateTo) {
    const dateFilter: Record<string, Date> = {}
    if (rest.dateFrom) dateFilter['gte'] = rest.dateFrom
    if (rest.dateTo) dateFilter['lte'] = rest.dateTo
    where['createdAt'] = dateFilter
  }

  const [incidents, total] = await Promise.all([
    db.incident.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        workOrder: {
          select: { id: true, workOrderNumber: true },
        },
        workOrderLine: {
          select: { id: true, barcode: true, description: true },
        },
        reportedBy: { select: { id: true, name: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
    }),
    db.incident.count({ where }),
  ])

  return { data: incidents, total, page, limit }
}

export async function resolveIncident(id: string, data: ResolveIncident) {
  const db = getDatabase()

  const incident = await db.incident.findUnique({ where: { id } })
  if (!incident) throw new NotFoundError('Incident not found')

  if (incident.status === 'RESOLVED' || incident.status === 'CLOSED') {
    throw new ValidationError(
      `Incident is already ${incident.status.toLowerCase()}`,
      { currentStatus: incident.status },
    )
  }

  // Validate resolver exists
  const resolver = await db.user.findUnique({ where: { id: data.userId } })
  if (!resolver) throw new NotFoundError('Resolver user not found')

  const updated = await db.incident.update({
    where: { id },
    data: {
      resolution: data.resolution,
      costRealCents: data.costRealCents,
      resolvedById: data.userId,
      resolvedAt: new Date(),
      status: 'RESOLVED',
    },
    include: {
      workOrder: {
        select: { id: true, workOrderNumber: true },
      },
      workOrderLine: {
        select: { id: true, barcode: true, description: true },
      },
      reportedBy: { select: { id: true, name: true } },
      resolvedBy: { select: { id: true, name: true } },
    },
  })

  return updated
}

export async function getIncidentStats(query?: IncidentStatsQuery) {
  const db = getDatabase()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma where input
  const where: Record<string, any> = {}

  if (query?.dateFrom || query?.dateTo) {
    const dateFilter: Record<string, Date> = {}
    if (query.dateFrom) dateFilter['gte'] = query.dateFrom
    if (query.dateTo) dateFilter['lte'] = query.dateTo
    where['createdAt'] = dateFilter
  }

  // Count by type
  const byType = await db.incident.groupBy({
    by: ['type'],
    where,
    _count: true,
  })

  // Count by severity
  const bySeverity = await db.incident.groupBy({
    by: ['severity'],
    where,
    _count: true,
  })

  // Count by responsibility
  const byResponsibility = await db.incident.groupBy({
    by: ['responsibility'],
    where,
    _count: true,
  })

  // Count by status
  const byStatus = await db.incident.groupBy({
    by: ['status'],
    where,
    _count: true,
  })

  // Total cost
  const costAgg = await db.incident.aggregate({
    where,
    _sum: {
      costEstimatedCents: true,
      costRealCents: true,
    },
    _count: true,
  })

  return {
    total: costAgg._count,
    byType: byType.map((row: { type: string; _count: number }) => ({ type: row.type, count: row._count })),
    bySeverity: bySeverity.map((row: { severity: string; _count: number }) => ({ severity: row.severity, count: row._count })),
    byResponsibility: byResponsibility.map((row: { responsibility: string; _count: number }) => ({ responsibility: row.responsibility, count: row._count })),
    byStatus: byStatus.map((row: { status: string; _count: number }) => ({ status: row.status, count: row._count })),
    totalEstimatedCostCents: costAgg._sum.costEstimatedCents ?? 0,
    totalRealCostCents: costAgg._sum.costRealCents ?? 0,
  }
}
