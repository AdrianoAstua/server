import { Worker, type Job } from 'bullmq'
import pino from 'pino'
import { NotificationService } from './notification-service.js'
import type { CreateNotification } from './channels/types.js'

const logger = pino({ name: 'notification-worker' })

// ─────────────────────────────────────────────
// Notification grouping
// ─────────────────────────────────────────────

interface PendingGroup {
  notifications: CreateNotification[]
  timer: ReturnType<typeof setTimeout>
}

const GROUP_WINDOW_MS = 60_000 // 1 minute
const GROUP_THRESHOLD = 5 // Group if >= 5 of same type in window

const pendingGroups = new Map<string, PendingGroup>()

function getGroupKey(notification: CreateNotification): string | null {
  // Only group LOW_STOCK and STOCK_OUT notifications
  if (notification.type === 'LOW_STOCK' || notification.type === 'STOCK_OUT') {
    return notification.type
  }
  return null
}

function buildGroupedNotification(
  type: string,
  items: CreateNotification[],
): CreateNotification {
  const count = items.length
  const bodies = items.map((n) => n.body).join('\n---\n')

  if (type === 'LOW_STOCK') {
    return {
      type: 'LOW_STOCK',
      title: `Stock bajo (${count} productos)`,
      body: `⚠️ ${count} productos con stock bajo:\n\n${bodies}`,
      channel: 'ALL',
      priority: 'MEDIUM',
    }
  }

  return {
    type: 'STOCK_OUT',
    title: `Productos agotados (${count})`,
    body: `🔴 ${count} productos agotados:\n\n${bodies}`,
    channel: 'ALL',
    priority: 'URGENT',
  }
}

async function flushGroup(
  key: string,
  service: NotificationService,
): Promise<void> {
  const group = pendingGroups.get(key)
  if (!group) return

  pendingGroups.delete(key)

  if (group.notifications.length >= GROUP_THRESHOLD) {
    const grouped = buildGroupedNotification(key, group.notifications)
    await service.sendDirect(grouped)
    logger.info(
      { type: key, count: group.notifications.length },
      'Sent grouped notification',
    )
  } else {
    // Send individually
    for (const notification of group.notifications) {
      await service.sendDirect(notification)
    }
  }
}

async function processWithGrouping(
  notification: CreateNotification,
  service: NotificationService,
): Promise<void> {
  const groupKey = getGroupKey(notification)

  if (!groupKey) {
    // Not groupable — send immediately
    await service.sendDirect(notification)
    return
  }

  let group = pendingGroups.get(groupKey)

  if (!group) {
    group = {
      notifications: [],
      timer: setTimeout(() => {
        flushGroup(groupKey, service).catch((error) => {
          logger.error({ error, groupKey }, 'Error flushing notification group')
        })
      }, GROUP_WINDOW_MS),
    }
    pendingGroups.set(groupKey, group)
  }

  group.notifications.push(notification)

  // If we hit the threshold, flush immediately
  if (group.notifications.length >= GROUP_THRESHOLD) {
    clearTimeout(group.timer)
    await flushGroup(groupKey, service)
  }
}

// ─────────────────────────────────────────────
// Worker
// ─────────────────────────────────────────────

function getRedisConnection(): { host: string; port: number } {
  const url = process.env['REDIS_URL'] ?? 'redis://localhost:6379'
  try {
    const parsed = new URL(url)
    return {
      host: parsed.hostname || 'localhost',
      port: Number(parsed.port) || 6379,
    }
  } catch {
    return { host: 'localhost', port: 6379 }
  }
}

export function createNotificationWorker(): Worker {
  const service = new NotificationService()

  const worker = new Worker(
    'notifications',
    async (job: Job<CreateNotification>) => {
      logger.info(
        { jobId: job.id, type: job.data.type },
        'Processing notification job',
      )

      await processWithGrouping(job.data, service)
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
      limiter: {
        max: 30,
        duration: 60_000, // 30 per minute
      },
    },
  )

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Notification job completed')
  })

  worker.on('failed', (job, error) => {
    logger.error(
      { jobId: job?.id, error: error.message, attempts: job?.attemptsMade },
      'Notification job failed',
    )
  })

  worker.on('error', (error) => {
    logger.error({ error }, 'Notification worker error')
  })

  logger.info('Notification worker started')
  return worker
}
