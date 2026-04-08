// @ts-ignore - PrismaClient may not be generated yet during build
export { PrismaClient } from '@prisma/client'

// @ts-ignore - PrismaClient may not be generated yet during build
import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient | undefined

export function getDatabase(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log:
        process.env['NODE_ENV'] === 'development'
          ? ['query', 'warn', 'error']
          : ['warn', 'error'],
    })
  }
  return prisma
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect()
    prisma = undefined
  }
}
