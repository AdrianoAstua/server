import { getDatabase } from '@voneb/database'
import { NotFoundError } from '../lib/errors.js'
import type { NotificationFilters } from '../schemas/notification-schemas.js'

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

export async function listNotifications(
  userId: string,
  filters: NotificationFilters,
): Promise<{
  data: Array<Record<string, unknown>>
  page: number
  limit: number
  total: number
}> {
  const db = getDatabase()
  const page = filters.page
  const limit = filters.limit
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {
    targetUserId: userId,
  }

  if (filters.type) where['type'] = filters.type
  if (filters.read !== undefined) where['read'] = filters.read
  if (filters.priority) where['priority'] = filters.priority

  const [data, total] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.notification.count({ where }),
  ])

  return { data, page, limit, total }
}

export async function getUnreadCount(userId: string): Promise<number> {
  const db = getDatabase()
  return db.notification.count({
    where: { targetUserId: userId, read: false },
  })
}

// ─────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────

export async function markAsRead(
  id: string,
  userId: string,
): Promise<Record<string, unknown>> {
  const db = getDatabase()

  const notification = await db.notification.findFirst({
    where: { id, targetUserId: userId },
  })

  if (!notification) {
    throw new NotFoundError('Notificacion no encontrada')
  }

  const updated = await db.notification.update({
    where: { id },
    data: { read: true, readAt: new Date() },
  })

  return updated
}

export async function markAllAsRead(userId: string): Promise<number> {
  const db = getDatabase()

  const result = await db.notification.updateMany({
    where: { targetUserId: userId, read: false },
    data: { read: true, readAt: new Date() },
  })

  return result.count
}
