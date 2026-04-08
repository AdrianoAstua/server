import { getDatabase } from '@voneb/database'
import { getCRMSyncService } from '@voneb/crm-client'
import type { SyncLogsQuery } from '../schemas/crm-schemas.js'

// ─────────────────────────────────────────────
// CRM Status
// ─────────────────────────────────────────────

interface CRMStatusResult {
  enabled: boolean
  connected: boolean
  stats: {
    totalSyncs: number
    successCount: number
    failedCount: number
    pendingCount: number
    retryingCount: number
  }
}

export async function getCRMStatus(): Promise<CRMStatusResult> {
  const db = getDatabase()
  const syncService = getCRMSyncService()

  const enabled = syncService.isEnabled
  let connected = false

  if (enabled) {
    try {
      connected = await syncService.testConnection()
    } catch {
      connected = false
    }
  }

  const [totalSyncs, successCount, failedCount, pendingCount, retryingCount] =
    await Promise.all([
      db.cRMSyncLog.count(),
      db.cRMSyncLog.count({ where: { status: 'SUCCESS' } }),
      db.cRMSyncLog.count({ where: { status: 'FAILED' } }),
      db.cRMSyncLog.count({ where: { status: 'PENDING' } }),
      db.cRMSyncLog.count({ where: { status: 'RETRYING' } }),
    ])

  return {
    enabled,
    connected,
    stats: { totalSyncs, successCount, failedCount, pendingCount, retryingCount },
  }
}

// ─────────────────────────────────────────────
// Force full sync
// ─────────────────────────────────────────────

interface SyncAllResult {
  total: number
  synced: number
  failed: number
  skipped: number
}

export async function syncAllOrders(): Promise<SyncAllResult> {
  const db = getDatabase()
  const syncService = getCRMSyncService()

  if (!syncService.isEnabled) {
    return { total: 0, synced: 0, failed: 0, skipped: 0 }
  }

  const orders = await db.order.findMany({
    where: { crmDealId: null, status: { not: 'CANCELLED' } },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          whatsappPhone: true,
          email: true,
          crmContactId: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  let synced = 0
  let failed = 0
  let skipped = 0

  for (const order of orders) {
    try {
      await syncService.syncOrderToCRM({
        id: order.id,
        orderNumber: order.orderNumber,
        totalCents: order.totalCents,
        currency: order.currency,
        status: order.status,
        source: order.source,
        crmDealId: order.crmDealId,
        customer: order.customer,
      })
      synced++
    } catch {
      failed++
    }
  }

  return { total: orders.length, synced, failed, skipped }
}

// ─────────────────────────────────────────────
// Sync logs
// ─────────────────────────────────────────────

export async function listSyncLogs(query: SyncLogsQuery) {
  const db = getDatabase()
  const { page, limit, ...rest } = query
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (rest.status) where['status'] = rest.status
  if (rest.entityType) where['entityType'] = rest.entityType

  if (rest.dateFrom || rest.dateTo) {
    const dateFilter: Record<string, Date> = {}
    if (rest.dateFrom) dateFilter['gte'] = rest.dateFrom
    if (rest.dateTo) dateFilter['lte'] = rest.dateTo
    where['createdAt'] = dateFilter
  }

  const [data, total] = await Promise.all([
    db.cRMSyncLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.cRMSyncLog.count({ where }),
  ])

  return { data, total, page, limit }
}
