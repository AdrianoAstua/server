import { getDatabase } from '@voneb/database'
import { NotFoundError, ConflictError } from '../lib/errors.js'
import type { CreateCategory, UpdateCategory } from '../schemas/category-schemas.js'

interface CategoryTreeNode {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  sortOrder: number
  active: boolean
  parentId: string | null
  children: CategoryTreeNode[]
}

export async function listCategories() {
  const db = getDatabase()

  const categories = await db.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { products: true } },
    },
  })

  return categories.map((c: typeof categories[number]) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl,
    sortOrder: c.sortOrder,
    active: c.active,
    parentId: c.parentId,
    productCount: c._count.products,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }))
}

export async function createCategory(data: CreateCategory) {
  const db = getDatabase()

  const existingSlug = await db.category.findUnique({ where: { slug: data.slug } })
  if (existingSlug) throw new ConflictError('A category with this slug already exists')

  if (data.parentId) {
    const parent = await db.category.findUnique({ where: { id: data.parentId } })
    if (!parent) throw new NotFoundError('Parent category not found')
  }

  return db.category.create({ data })
}

export async function updateCategory(id: string, data: UpdateCategory) {
  const db = getDatabase()

  const existing = await db.category.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Category not found')

  if (data.slug && data.slug !== existing.slug) {
    const slugTaken = await db.category.findUnique({ where: { slug: data.slug } })
    if (slugTaken) throw new ConflictError('A category with this slug already exists')
  }

  if (data.parentId) {
    if (data.parentId === id) throw new ConflictError('Category cannot be its own parent')
    const parent = await db.category.findUnique({ where: { id: data.parentId } })
    if (!parent) throw new NotFoundError('Parent category not found')
  }

  return db.category.update({ where: { id }, data })
}

export async function deleteCategory(id: string) {
  const db = getDatabase()

  const existing = await db.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true, children: true } } },
  })
  if (!existing) throw new NotFoundError('Category not found')

  if (existing._count.products > 0) {
    throw new ConflictError('Cannot delete category with associated products')
  }
  if (existing._count.children > 0) {
    throw new ConflictError('Cannot delete category with subcategories')
  }

  await db.category.delete({ where: { id } })
}

export async function getCategoryTree() {
  const db = getDatabase()

  const categories = await db.category.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  const map = new Map<string, CategoryTreeNode>()
  const roots: CategoryTreeNode[] = []

  for (const c of categories) {
    map.set(c.id, {
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl,
      sortOrder: c.sortOrder,
      active: c.active,
      parentId: c.parentId,
      children: [],
    })
  }

  for (const c of categories) {
    const node = map.get(c.id)!
    if (c.parentId) {
      const parent = map.get(c.parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    } else {
      roots.push(node)
    }
  }

  return roots
}
