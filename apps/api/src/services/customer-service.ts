import { getDatabase } from '@voneb/database'
import { NotFoundError } from '../lib/errors.js'
import type { CustomerFilters, CreateCustomer, UpdateCustomer } from '../schemas/customer-schemas.js'

export async function listCustomers(filters: CustomerFilters) {
  const db = getDatabase()
  const { page, limit, ...rest } = filters
  const skip = (page - 1) * limit

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma where input
  const where: Record<string, any> = {}

  if (rest.search) {
    where['OR'] = [
      { firstName: { contains: rest.search, mode: 'insensitive' } },
      { lastName: { contains: rest.search, mode: 'insensitive' } },
      { whatsappPhone: { contains: rest.search, mode: 'insensitive' } },
      { email: { contains: rest.search, mode: 'insensitive' } },
    ]
  }

  if (rest.preferredSport) where['preferredSport'] = rest.preferredSport

  const [customers, total] = await Promise.all([
    db.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.customer.count({ where }),
  ])

  return { data: customers, total, page, limit }
}

export async function getCustomerById(id: string) {
  const db = getDatabase()

  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      orders: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalCents: true,
          createdAt: true,
        },
      },
    },
  })

  if (!customer) throw new NotFoundError('Customer not found')
  return customer
}

export async function findByPhone(phone: string) {
  const db = getDatabase()

  const customer = await db.customer.findUnique({
    where: { whatsappPhone: phone },
    include: {
      orders: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalCents: true,
          createdAt: true,
        },
      },
    },
  })

  if (!customer) throw new NotFoundError('Customer not found')
  return customer
}

export async function createOrUpdate(phone: string, data: CreateCustomer | UpdateCustomer) {
  const db = getDatabase()

  const { ...customerData } = data
  // Remove whatsappPhone from update data if present (it is the unique key)
  const updatePayload = { ...customerData } as Record<string, unknown>
  delete updatePayload['whatsappPhone']

  return db.customer.upsert({
    where: { whatsappPhone: phone },
    create: {
      whatsappPhone: phone,
      ...updatePayload,
    },
    update: {
      ...updatePayload,
      lastInteractionAt: new Date(),
    },
  })
}

export async function markDataComplete(id: string) {
  const db = getDatabase()

  const existing = await db.customer.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Customer not found')

  return db.customer.update({
    where: { id },
    data: { dataCollectionComplete: true },
  })
}

export async function getCustomerStats(id: string) {
  const db = getDatabase()

  const customer = await db.customer.findUnique({ where: { id } })
  if (!customer) throw new NotFoundError('Customer not found')

  const orders = await db.order.findMany({
    where: { customerId: id, status: { not: 'CANCELLED' } },
    select: {
      totalCents: true,
      createdAt: true,
      items: {
        select: {
          variant: {
            select: {
              product: {
                select: { categoryId: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalOrders = orders.length
  const totalSpent = orders.reduce((sum: number, o: { totalCents: number }) => sum + o.totalCents, 0)
  const lastOrderDate = orders.length > 0 ? orders[0].createdAt : null

  // Find most common category
  const categoryCounts: Record<string, number> = {}
  for (const order of orders) {
    for (const item of order.items) {
      const catId = item.variant.product.categoryId
      categoryCounts[catId] = (categoryCounts[catId] ?? 0) + 1
    }
  }

  let favoriteCategory: string | null = null
  let maxCount = 0
  for (const [catId, count] of Object.entries(categoryCounts)) {
    if (count > maxCount) {
      maxCount = count
      favoriteCategory = catId
    }
  }

  return { totalOrders, totalSpent, lastOrderDate, favoriteCategory }
}
