import { getDatabase } from '@voneb/database'
import { ORDER_STATUS_TO_CRM_STAGE } from '@voneb/shared'
import pino from 'pino'
import type { ICRMProvider, CRMDeal, CRMPerson } from './interfaces.js'
import { CRMError } from './interfaces.js'
import { PipelineCRMProvider } from './pipeline-crm-provider.js'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface OrderForSync {
  id: string
  orderNumber: string
  totalCents: number
  currency: string
  status: string
  source: string
  crmDealId: string | null
  customer: {
    id: string
    firstName: string | null
    lastName: string | null
    whatsappPhone: string
    email: string | null
    crmContactId: string | null
  }
}

interface SyncLogRecord {
  id: string
  retryCount: number
}

const MAX_SYNC_RETRIES = 3

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

export class CRMSyncService {
  private readonly provider: ICRMProvider | null
  private readonly log: pino.Logger
  private stageMap: Map<string, string> | null = null

  constructor(config?: { apiKey?: string; logger?: pino.Logger }) {
    const apiKey = config?.apiKey ?? process.env['PIPELINE_CRM_API_KEY'] ?? ''
    this.log = (config?.logger ?? pino({ level: 'info' })).child({
      module: 'crm-sync',
    })

    if (!apiKey) {
      this.log.warn('PIPELINE_CRM_API_KEY not configured — CRM sync disabled')
      this.provider = null
    } else {
      this.provider = new PipelineCRMProvider({ apiKey, logger: this.log })
    }
  }

  /** Whether CRM integration is active */
  get isEnabled(): boolean {
    return this.provider !== null
  }

  // ── Sync order to CRM ──────────────────────

  async syncOrderToCRM(order: OrderForSync): Promise<void> {
    if (!this.provider) return

    const db = getDatabase()
    const syncLog = await db.cRMSyncLog.create({
      data: {
        entityType: 'DEAL',
        entityId: order.id,
        action: 'CREATE',
        direction: 'TO_CRM',
        status: 'PENDING',
        requestPayload: { orderNumber: order.orderNumber, totalCents: order.totalCents },
      },
    })

    try {
      // Ensure person exists in CRM
      const personId = await this.ensureCRMPerson(order.customer)

      // Resolve stage
      const stageId = await this.resolveStageId(order.status)

      // Create deal
      const deal: CRMDeal = await this.provider.createDeal({
        name: `${order.orderNumber} — V ONE B`,
        valueCents: order.totalCents,
        currency: order.currency,
        personId,
        stageId: stageId ?? undefined,
        source: order.source,
        customFields: {
          order_number: order.orderNumber,
          voneb_order_id: order.id,
        },
      })

      // Save crm_deal_id on order
      await db.order.update({
        where: { id: order.id },
        data: { crmDealId: deal.id, crmStage: deal.stageName },
      })

      // Mark sync log as success
      await db.cRMSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'SUCCESS',
          crmEntityId: deal.id,
          responsePayload: { dealId: deal.id, stageName: deal.stageName },
        },
      })

      this.log.info(
        { orderId: order.id, dealId: deal.id },
        'Order synced to CRM',
      )
    } catch (error) {
      await this.handleSyncError(error, syncLog)
    }
  }

  // ── Sync status change to CRM ──────────────

  async syncStatusToCRM(order: OrderForSync): Promise<void> {
    if (!this.provider) return
    if (!order.crmDealId) {
      this.log.warn(
        { orderId: order.id },
        'Order has no CRM deal — skipping status sync',
      )
      return
    }

    const db = getDatabase()
    const syncLog = await db.cRMSyncLog.create({
      data: {
        entityType: 'DEAL',
        entityId: order.id,
        crmEntityId: order.crmDealId,
        action: 'UPDATE',
        direction: 'TO_CRM',
        status: 'PENDING',
        requestPayload: { status: order.status },
      },
    })

    try {
      const stageId = await this.resolveStageId(order.status)
      if (!stageId) {
        this.log.warn(
          { orderId: order.id, status: order.status },
          'No CRM stage mapped for order status',
        )
        await db.cRMSyncLog.update({
          where: { id: syncLog.id },
          data: { status: 'SUCCESS', responsePayload: { skipped: true, reason: 'no stage mapping' } },
        })
        return
      }

      const deal = await this.provider.updateDealStage(order.crmDealId, stageId)

      await db.order.update({
        where: { id: order.id },
        data: { crmStage: deal.stageName },
      })

      await db.cRMSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'SUCCESS',
          responsePayload: { stageId, stageName: deal.stageName },
        },
      })

      this.log.info(
        { orderId: order.id, dealId: order.crmDealId, stage: deal.stageName },
        'Order status synced to CRM',
      )
    } catch (error) {
      await this.handleSyncError(error, syncLog)
    }
  }

  // ── Error handling ─────────────────────────

  async handleSyncError(
    error: unknown,
    syncLog: SyncLogRecord,
  ): Promise<void> {
    const db = getDatabase()
    const errorMessage =
      error instanceof Error ? error.message : String(error)

    const newRetryCount = syncLog.retryCount + 1

    if (newRetryCount < MAX_SYNC_RETRIES) {
      await db.cRMSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'RETRYING',
          errorMessage,
          retryCount: newRetryCount,
        },
      })

      this.log.warn(
        { syncLogId: syncLog.id, retryCount: newRetryCount, error: errorMessage },
        'CRM sync failed — will retry',
      )
      return
    }

    // Max retries exhausted — mark failed and create urgent notification
    await db.cRMSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'FAILED',
        errorMessage,
        retryCount: newRetryCount,
      },
    })

    await db.notification.create({
      data: {
        type: 'CRM_SYNC_ERROR',
        title: 'CRM Sync Failed',
        body: `CRM sync failed after ${MAX_SYNC_RETRIES} retries: ${errorMessage}`,
        channel: 'DASHBOARD',
        priority: 'URGENT',
        relatedEntityType: 'CRMSyncLog',
        relatedEntityId: syncLog.id,
        metadata: { errorMessage, retryCount: newRetryCount },
      },
    })

    this.log.error(
      { syncLogId: syncLog.id, error: errorMessage },
      'CRM sync failed permanently — urgent notification created',
    )
  }

  // ── Helpers ────────────────────────────────

  private async ensureCRMPerson(
    customer: OrderForSync['customer'],
  ): Promise<string | undefined> {
    if (!this.provider) return undefined

    // Already has a CRM contact
    if (customer.crmContactId) return customer.crmContactId

    // Try to find existing person by phone
    const existing = await this.provider.findPersonByPhone(customer.whatsappPhone)
    if (existing) {
      await this.saveCRMContactId(customer.id, existing.id)
      return existing.id
    }

    // Create new person
    const person: CRMPerson = await this.provider.createPerson({
      firstName: customer.firstName ?? 'Cliente',
      lastName: customer.lastName ?? undefined,
      phone: customer.whatsappPhone,
      email: customer.email ?? undefined,
    })

    await this.saveCRMContactId(customer.id, person.id)

    this.log.info(
      { customerId: customer.id, crmPersonId: person.id },
      'Created CRM person for customer',
    )

    return person.id
  }

  private async saveCRMContactId(
    customerId: string,
    crmContactId: string,
  ): Promise<void> {
    const db = getDatabase()
    await db.customer.update({
      where: { id: customerId },
      data: { crmContactId },
    })
  }

  private async resolveStageId(orderStatus: string): Promise<string | null> {
    if (!this.provider) return null

    const crmStageName = ORDER_STATUS_TO_CRM_STAGE[orderStatus]
    if (!crmStageName) return null

    // Build stage name -> id map if not cached
    if (!this.stageMap) {
      const stages = await this.provider.getStages()
      this.stageMap = new Map(stages.map((s) => [s.name, s.id]))
    }

    return this.stageMap.get(crmStageName) ?? null
  }

  /** Test CRM connection (for health check) */
  async testConnection(): Promise<boolean> {
    if (!this.provider) return false
    return this.provider.testConnection()
  }

  /** Clear cached stage map (useful after config changes) */
  clearStageCache(): void {
    this.stageMap = null
  }
}

// ─────────────────────────────────────────────
// Singleton
// ─────────────────────────────────────────────

let instance: CRMSyncService | null = null

export function getCRMSyncService(): CRMSyncService {
  if (!instance) {
    instance = new CRMSyncService()
  }
  return instance
}
