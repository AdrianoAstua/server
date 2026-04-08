import { getDatabase } from '@voneb/database'
import type { DashboardQuery, TopProductsQuery } from '../schemas/dashboard-schemas.js'

function getPeriodDates(period?: string): { start: Date; end: Date } {
  const now = new Date()
  const end = now

  switch (period) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return { start, end }
    }
    case 'week': {
      const start = new Date(now)
      start.setDate(now.getDate() - 7)
      return { start, end }
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start, end }
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1)
      return { start, end }
    }
    default: {
      // Default to current month
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start, end }
    }
  }
}

export async function getSummary(_query: DashboardQuery) {
  const db = getDatabase()
  const now = new Date()

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 7)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    ordersToday,
    ordersThisWeek,
    ordersThisMonth,
    ordersByStatus,
    revenueToday,
    revenueThisWeek,
    revenueThisMonth,
    totalProducts,
    totalVariants,
    lowStockCount,
    outOfStockCount,
    totalCustomers,
    newCustomersThisMonth,
    recentOrders,
    pendingConversations,
  ] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: todayStart } } }),
    db.order.count({ where: { createdAt: { gte: weekAgo } } }),
    db.order.count({ where: { createdAt: { gte: monthStart } } }),
    db.order.groupBy({ by: ['status'], _count: { id: true } }),
    db.order.aggregate({
      where: { createdAt: { gte: todayStart }, status: { not: 'CANCELLED' } },
      _sum: { totalCents: true },
    }),
    db.order.aggregate({
      where: { createdAt: { gte: weekAgo }, status: { not: 'CANCELLED' } },
      _sum: { totalCents: true },
    }),
    db.order.aggregate({
      where: { createdAt: { gte: monthStart }, status: { not: 'CANCELLED' } },
      _sum: { totalCents: true },
    }),
    db.product.count({ where: { status: { not: 'DISCONTINUED' } } }),
    db.productVariant.count({ where: { status: { not: 'DISCONTINUED' } } }),
    db.productVariant.count({ where: { status: 'LOW_STOCK' } }),
    db.productVariant.count({ where: { status: 'OUT_OF_STOCK' } }),
    db.customer.count(),
    db.customer.count({ where: { createdAt: { gte: monthStart } } }),
    db.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, whatsappPhone: true },
        },
      },
    }),
    db.conversation.count({ where: { status: 'WAITING_AGENT' } }),
  ])

  // Top 5 products by order item quantity
  const topItems = await db.orderItem.groupBy({
    by: ['variantId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5,
  })

  const topProductVariants = topItems.length > 0
    ? await db.productVariant.findMany({
        where: { id: { in: topItems.map((i: { variantId: string }) => i.variantId) } },
        include: { product: { select: { id: true, name: true, images: true } } },
      })
    : []

  const topProducts = topItems.map((item: { variantId: string; _sum: { quantity: number | null } }) => {
    const variant = topProductVariants.find((v: { id: string }) => v.id === item.variantId)
    return {
      variantId: item.variantId,
      productName: variant?.product.name ?? 'Unknown',
      productId: variant?.product.id ?? null,
      image: variant?.product.images[0] ?? null,
      sku: variant?.sku ?? null,
      totalSold: item._sum.quantity ?? 0,
    }
  })

  return {
    ordersToday,
    ordersThisWeek,
    ordersThisMonth,
    ordersByStatus: ordersByStatus.map((s: { status: string; _count: { id: number } }) => ({
      status: s.status,
      count: s._count.id,
    })),
    revenueToday: revenueToday._sum.totalCents ?? 0,
    revenueThisWeek: revenueThisWeek._sum.totalCents ?? 0,
    revenueThisMonth: revenueThisMonth._sum.totalCents ?? 0,
    totalProducts,
    totalVariants,
    lowStockCount,
    outOfStockCount,
    topProducts,
    totalCustomers,
    newCustomersThisMonth,
    recentOrders,
    pendingConversations,
  }
}

export async function getRevenueChart(startDate: Date, endDate: Date) {
  const db = getDatabase()

  const orders = await db.order.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: { not: 'CANCELLED' },
    },
    select: { totalCents: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  // Group by date
  const dailyRevenue: Record<string, number> = {}
  for (const order of orders) {
    const dateKey = order.createdAt.toISOString().split('T')[0]
    dailyRevenue[dateKey] = (dailyRevenue[dateKey] ?? 0) + order.totalCents
  }

  // Fill in missing dates with zero
  const result: Array<{ date: string; amount: number }> = []
  const current = new Date(startDate)

  while (current <= endDate) {
    const dateKey = current.toISOString().split('T')[0] as string
    result.push({ date: dateKey, amount: dailyRevenue[dateKey] ?? 0 })
    current.setDate(current.getDate() + 1)
  }

  return result
}

export async function getTopProducts(query: TopProductsQuery) {
  const db = getDatabase()
  const { limit } = query

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma where input
  const orderWhere: Record<string, any> = { status: { not: 'CANCELLED' } }

  if (query.period) {
    const { start } = getPeriodDates(query.period)
    orderWhere['order'] = { createdAt: { gte: start } }
  }

  const topItems = await db.orderItem.groupBy({
    by: ['variantId'],
    where: orderWhere,
    _sum: { quantity: true, totalPriceCents: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  })

  if (topItems.length === 0) return []

  const variants = await db.productVariant.findMany({
    where: { id: { in: topItems.map((i: { variantId: string }) => i.variantId) } },
    include: {
      product: {
        select: { id: true, name: true, images: true, basePriceCents: true },
      },
    },
  })

  return topItems.map((item: { variantId: string; _sum: { quantity: number | null; totalPriceCents: number | null } }) => {
    const variant = variants.find((v: { id: string }) => v.id === item.variantId)
    return {
      variantId: item.variantId,
      sku: variant?.sku ?? null,
      productId: variant?.product.id ?? null,
      productName: variant?.product.name ?? 'Unknown',
      color: variant?.color ?? null,
      size: variant?.size ?? null,
      image: variant?.product.images[0] ?? null,
      totalSold: item._sum.quantity ?? 0,
      totalRevenue: item._sum.totalPriceCents ?? 0,
    }
  })
}

export async function getActivityFeed(limit: number = 20) {
  const db = getDatabase()

  const [recentOrders, recentCustomers, recentStatusChanges] = await Promise.all([
    db.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        totalCents: true,
        createdAt: true,
        customer: { select: { firstName: true, lastName: true } },
      },
    }),
    db.customer.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        whatsappPhone: true,
        createdAt: true,
      },
    }),
    db.orderStatusHistory.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { orderNumber: true } },
        changedBy: { select: { name: true } },
      },
    }),
  ])

  // Combine and sort by date
  type ActivityItem = { type: string; id: string; description: string; timestamp: Date; meta: Record<string, unknown> }
  const feed: ActivityItem[] = []

  for (const order of recentOrders) {
    const name = [order.customer.firstName, order.customer.lastName].filter(Boolean).join(' ') || 'Unknown'
    feed.push({
      type: 'new_order',
      id: order.id,
      description: `New order ${order.orderNumber} from ${name}`,
      timestamp: order.createdAt,
      meta: { orderNumber: order.orderNumber, totalCents: order.totalCents },
    })
  }

  for (const cust of recentCustomers) {
    const name = [cust.firstName, cust.lastName].filter(Boolean).join(' ') || cust.whatsappPhone
    feed.push({
      type: 'new_customer',
      id: cust.id,
      description: `New customer: ${name}`,
      timestamp: cust.createdAt,
      meta: { phone: cust.whatsappPhone },
    })
  }

  for (const sh of recentStatusChanges) {
    const who = sh.changedBy?.name ?? 'System'
    feed.push({
      type: 'status_change',
      id: sh.id,
      description: `${who} changed order ${sh.order.orderNumber} from ${sh.fromStatus ?? 'NEW'} to ${sh.toStatus}`,
      timestamp: sh.createdAt,
      meta: { fromStatus: sh.fromStatus, toStatus: sh.toStatus },
    })
  }

  // Sort descending by timestamp and take limit
  feed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  return feed.slice(0, limit)
}
