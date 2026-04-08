import { getDatabase, PrismaClient } from '@voneb/database'
import { NotFoundError, ConflictError } from '../lib/errors.js'
import type { ProductFilters, CreateProduct, UpdateProduct } from '../schemas/product-schemas.js'

// Transaction client type — uses PrismaClient shape for model access
type TxClient = PrismaClient

function generateSku(
  categoryName: string,
  productName: string,
  color: string,
  size: string,
): string {
  const cat = categoryName.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()
  const prod = productName.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()
  const col = color.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()
  const sz = size.toUpperCase()
  return `${cat}-${prod}-${col}-${sz}`
}

function evaluateVariantStatus(
  stockQuantity: number,
  minStockThreshold: number,
): 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' {
  if (stockQuantity <= 0) return 'OUT_OF_STOCK'
  if (stockQuantity <= minStockThreshold) return 'LOW_STOCK'
  return 'AVAILABLE'
}

export async function listProducts(filters: ProductFilters) {
  const db = getDatabase()
  const { page, limit, sortBy, sortOrder, ...rest } = filters
  const skip = (page - 1) * limit

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma where input
  const where: Record<string, any> = {}

  if (rest.search) {
    where['OR'] = [
      { name: { contains: rest.search, mode: 'insensitive' } },
      { descriptionShort: { contains: rest.search, mode: 'insensitive' } },
      { descriptionLong: { contains: rest.search, mode: 'insensitive' } },
    ]
  }
  if (rest.categoryId) where['categoryId'] = rest.categoryId
  if (rest.gender) where['gender'] = rest.gender
  if (rest.sport) where['sport'] = rest.sport
  if (rest.status) where['status'] = rest.status
  if (rest.season) where['season'] = rest.season
  if (rest.featured !== undefined) where['featured'] = rest.featured
  if (rest.newArrival !== undefined) where['newArrival'] = rest.newArrival

  if (rest.tags) {
    where['tags'] = { hasSome: rest.tags.split(',').map((t: string) => t.trim()) }
  }

  if (rest.priceMin !== undefined || rest.priceMax !== undefined) {
    const priceFilter: Record<string, number> = {}
    if (rest.priceMin !== undefined) priceFilter['gte'] = rest.priceMin
    if (rest.priceMax !== undefined) priceFilter['lte'] = rest.priceMax
    where['basePriceCents'] = priceFilter
  }

  if (rest.hasStock === true) {
    where['variants'] = { some: { stockQuantity: { gt: 0 } } }
  } else if (rest.hasStock === false) {
    where['variants'] = { every: { stockQuantity: { lte: 0 } } }
  }

  const orderByOptions: Record<string, Record<string, string>> = {
    name: { name: sortOrder },
    price: { basePriceCents: sortOrder },
    createdAt: { createdAt: sortOrder },
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: orderByOptions[sortBy] ?? { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          select: {
            id: true,
            stockQuantity: true,
            locationStocks: {
              include: {
                location: { select: { id: true, slug: true, name: true } },
              },
            },
          },
        },
      },
    }),
    db.product.count({ where }),
  ])

  const data = products.map((p: typeof products[number]) => ({
    ...p,
    variantCount: p.variants.length,
    totalStock: p.variants.reduce(
      (sum: number, v: { stockQuantity: number }) => sum + v.stockQuantity,
      0,
    ),
    variants: undefined,
  }))

  return { data, total, page, limit }
}

export async function getProductById(id: string) {
  const db = getDatabase()

  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: {
        orderBy: [{ color: 'asc' }, { sizeOrder: 'asc' }],
        include: {
          locationStocks: {
            include: {
              location: { select: { id: true, slug: true, name: true, type: true } },
            },
          },
        },
      },
    },
  })

  if (!product) throw new NotFoundError('Product not found')
  return product
}

export async function createProduct(data: CreateProduct) {
  const db = getDatabase()

  const category = await db.category.findUnique({ where: { id: data.categoryId } })
  if (!category) throw new NotFoundError('Category not found')

  const existingSlug = await db.product.findUnique({ where: { slug: data.slug } })
  if (existingSlug) throw new ConflictError('A product with this slug already exists')

  const { variants: variantInputs, ...productData } = data

  return db.$transaction(async (tx: TxClient) => {
    const product = await tx.product.create({
      data: productData,
    })

    // Resolve default local location for initial stock
    let defaultLocationId: string | null = null

    for (const v of variantInputs) {
      const sku = generateSku(category.name, data.name, v.color, v.size)

      const existingSku = await tx.productVariant.findUnique({ where: { sku } })
      if (existingSku) throw new ConflictError(`SKU "${sku}" already exists`)

      const status = evaluateVariantStatus(v.stockQuantity, v.minStockThreshold)

      const variant = await tx.productVariant.create({
        data: {
          productId: product.id,
          sku,
          color: v.color,
          colorHex: v.colorHex,
          size: v.size,
          sizeOrder: v.sizeOrder,
          stockQuantity: v.stockQuantity,
          minStockThreshold: v.minStockThreshold,
          additionalPriceCents: v.additionalPriceCents,
          weightGrams: v.weightGrams,
          barcode: v.barcode,
          status,
        },
      })

      if (v.stockQuantity > 0) {
        if (!defaultLocationId) {
          const loc = await tx.inventoryLocation.findFirst({ where: { type: 'LOCAL', isDefault: true } })
          if (!loc) throw new Error('No default local location configured')
          defaultLocationId = loc.id
        }

        await tx.stockMovement.create({
          data: {
            variantId: variant.id,
            type: 'ENTRY',
            quantity: v.stockQuantity,
            reason: 'Initial stock on product creation',
            referenceType: 'MANUAL',
            locationId: defaultLocationId,
          },
        })

        await tx.locationStock.create({
          data: {
            variantId: variant.id,
            locationId: defaultLocationId,
            quantity: v.stockQuantity,
          },
        })
      }
    }

    return tx.product.findUnique({
      where: { id: product.id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { orderBy: [{ color: 'asc' }, { sizeOrder: 'asc' }] },
      },
    })
  })
}

export async function updateProduct(id: string, data: UpdateProduct) {
  const db = getDatabase()

  const existing = await db.product.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Product not found')

  if (data.slug && data.slug !== existing.slug) {
    const slugTaken = await db.product.findUnique({ where: { slug: data.slug } })
    if (slugTaken) throw new ConflictError('A product with this slug already exists')
  }

  if (data.categoryId) {
    const cat = await db.category.findUnique({ where: { id: data.categoryId } })
    if (!cat) throw new NotFoundError('Category not found')
  }

  return db.product.update({
    where: { id },
    data,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: { orderBy: [{ color: 'asc' }, { sizeOrder: 'asc' }] },
    },
  })
}

export async function softDeleteProduct(id: string) {
  const db = getDatabase()

  const existing = await db.product.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Product not found')

  return db.product.update({
    where: { id },
    data: { status: 'DISCONTINUED' },
  })
}
