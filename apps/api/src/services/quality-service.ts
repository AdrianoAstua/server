import { getDatabase, PrismaClient } from '@voneb/database'
import { NotFoundError, ValidationError } from '../lib/errors.js'
import type { PerformCheck, QCStatsQuery } from '../schemas/quality-schemas.js'

type TxClient = PrismaClient

export async function performCheck(data: PerformCheck) {
  const db = getDatabase()

  const line = await db.workOrderLine.findUnique({
    where: { id: data.workOrderLineId },
    include: {
      workOrder: { select: { id: true, workOrderNumber: true } },
    },
  })

  if (!line) throw new NotFoundError('Work order line not found')

  // Verify line is in a QC-eligible status
  const qcEligibleStatuses = ['EN_CONTROL_CALIDAD', 'QC_RECHAZADO', 'EN_REPROCESO']
  if (!qcEligibleStatuses.includes(line.status)) {
    throw new ValidationError(
      `Line is not eligible for QC. Current status: ${line.status}`,
      { currentStatus: line.status, eligibleStatuses: qcEligibleStatuses },
    )
  }

  // Validate inspector exists
  const inspector = await db.user.findUnique({ where: { id: data.inspectorId } })
  if (!inspector) throw new NotFoundError('Inspector not found')

  const result = await db.$transaction(async (tx: TxClient) => {
    let incidentId: string | null = null

    // If QC failed, auto-create an incident
    if (data.result === 'FAILED') {
      // Determine defect types from failed checklist items
      const failedItems = data.checklistData
        .filter((item) => !item.passed)
        .map((item) => item.item)

      const now = new Date()
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`

      // Generate incident number
      const count = await tx.incident.count({
        where: {
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
            lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          },
        },
      })
      const sequence = String(count + 1).padStart(4, '0')
      const incidentNumber = `INC-${yearMonth}-${sequence}`

      const incident = await tx.incident.create({
        data: {
          incidentNumber,
          workOrderId: line.workOrder.id,
          workOrderLineId: line.id,
          type: 'OTHER',
          severity: 'MEDIUM',
          responsibility: 'VONEB',
          description: `QC failed. Items: ${failedItems.join(', ')}. ${data.notes ?? ''}`.trim(),
          photos: data.photos,
          reportedById: data.inspectorId,
          status: 'OPEN',
        },
      })

      incidentId = incident.id
    }

    // Create the quality check record
    const qcCheck = await tx.qualityCheck.create({
      data: {
        workOrderLineId: data.workOrderLineId,
        inspectorId: data.inspectorId,
        result: data.result,
        checklistData: data.checklistData,
        photos: data.photos,
        notes: data.notes,
        incidentId,
      },
      include: {
        inspector: { select: { id: true, name: true } },
        workOrderLine: {
          select: { id: true, barcode: true, description: true },
        },
      },
    })

    // Update line status based on result
    const newStatus = data.result === 'FAILED' ? 'QC_RECHAZADO' : 'EMPACADO'
    await tx.workOrderLine.update({
      where: { id: data.workOrderLineId },
      data: {
        status: newStatus as 'QC_RECHAZADO' | 'EMPACADO',
        currentStation: null,
      },
    })

    return qcCheck
  })

  return result
}

export async function getQCHistory(workOrderLineId: string) {
  const db = getDatabase()

  const line = await db.workOrderLine.findUnique({ where: { id: workOrderLineId } })
  if (!line) throw new NotFoundError('Work order line not found')

  return db.qualityCheck.findMany({
    where: { workOrderLineId },
    orderBy: { createdAt: 'desc' },
    include: {
      inspector: { select: { id: true, name: true } },
    },
  })
}

export async function getQCStats(query?: QCStatsQuery) {
  const db = getDatabase()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma where input
  const where: Record<string, any> = {}

  if (query?.dateFrom || query?.dateTo) {
    const dateFilter: Record<string, Date> = {}
    if (query.dateFrom) dateFilter['gte'] = query.dateFrom
    if (query.dateTo) dateFilter['lte'] = query.dateTo
    where['createdAt'] = dateFilter
  }

  const [total, passed, failed, passedWithObs] = await Promise.all([
    db.qualityCheck.count({ where }),
    db.qualityCheck.count({ where: { ...where, result: 'PASSED' } }),
    db.qualityCheck.count({ where: { ...where, result: 'FAILED' } }),
    db.qualityCheck.count({ where: { ...where, result: 'PASSED_WITH_OBSERVATIONS' } }),
  ])

  // Top defect types from failed checks
  const failedChecks = await db.qualityCheck.findMany({
    where: { ...where, result: 'FAILED' },
    select: { checklistData: true },
  })

  // Aggregate failed checklist items
  const defectCounts: Record<string, number> = {}
  for (const check of failedChecks) {
    const items = check.checklistData as Array<{ item: string; passed: boolean; notes?: string }>
    if (!Array.isArray(items)) continue
    for (const item of items) {
      if (!item.passed) {
        defectCounts[item.item] = (defectCounts[item.item] ?? 0) + 1
      }
    }
  }

  const topDefects = Object.entries(defectCounts)
    .map(([item, count]) => ({ item, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    total,
    passed,
    failed,
    passedWithObservations: passedWithObs,
    passRate: total > 0 ? ((passed + passedWithObs) / total) * 100 : 0,
    failRate: total > 0 ? (failed / total) * 100 : 0,
    topDefects,
  }
}
