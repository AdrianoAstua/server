import { getDatabase } from '@voneb/database'
import { NotFoundError } from '../lib/errors.js'
import type { UpdateConfig } from '../schemas/config-schemas.js'

const CACHE_PREFIX = 'config:'
const CACHE_TTL = 300 // 5 minutes

// Simple in-memory cache (replaced by Redis when a shared client is available)
const memoryCache = new Map<string, { value: unknown; expiresAt: number }>()

function getCached(key: string): unknown | undefined {
  const entry = memoryCache.get(CACHE_PREFIX + key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(CACHE_PREFIX + key)
    return undefined
  }
  return entry.value
}

function setCache(key: string, value: unknown): void {
  memoryCache.set(CACHE_PREFIX + key, {
    value,
    expiresAt: Date.now() + CACHE_TTL * 1000,
  })
}

function invalidateCache(key: string): void {
  memoryCache.delete(CACHE_PREFIX + key)
}

export async function listConfigs() {
  const db = getDatabase()

  const configs = await db.systemConfig.findMany({
    orderBy: { key: 'asc' },
    include: {
      updatedBy: { select: { id: true, name: true, email: true } },
    },
  })

  return configs.map((c: typeof configs[number]) => ({
    id: c.id,
    key: c.key,
    value: c.value,
    description: c.description,
    updatedBy: c.updatedBy,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }))
}

export async function getConfig(key: string) {
  const cached = getCached(key)
  if (cached !== undefined) return cached

  const db = getDatabase()

  const config = await db.systemConfig.findUnique({ where: { key } })
  if (!config) throw new NotFoundError(`Config key "${key}" not found`)

  setCache(key, config.value)
  return config.value
}

export async function updateConfig(
  key: string,
  data: UpdateConfig,
  userId: string,
) {
  const db = getDatabase()

  const existing = await db.systemConfig.findUnique({ where: { key } })
  if (!existing) throw new NotFoundError(`Config key "${key}" not found`)

  const updated = await db.systemConfig.update({
    where: { key },
    data: {
      value: data.value as never,
      description: data.description ?? existing.description,
      updatedById: userId,
    },
    include: {
      updatedBy: { select: { id: true, name: true, email: true } },
    },
  })

  invalidateCache(key)

  return {
    id: updated.id,
    key: updated.key,
    value: updated.value,
    description: updated.description,
    updatedBy: updated.updatedBy,
    updatedAt: updated.updatedAt,
  }
}
