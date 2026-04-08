import { getDatabase } from '@voneb/database'

// ─────────────────────────────────────────────
// Gestor de consultas AI → Humano
// Cuando el cerebro necesita aprobacion humana,
// crea una consulta con opciones y espera respuesta.
// ─────────────────────────────────────────────

interface CreateConsultationData {
  targetUserId: string
  targetRole: string
  title: string
  description: string
  recommendation: string
  options: Array<{ label: string; action: string }>
  workOrderId?: string
  expiresInHours?: number
}

class ConsultationManager {
  /**
   * Crea una consulta (pregunta para un humano).
   * Retorna el ID de la consulta creada.
   */
  async createConsultation(data: CreateConsultationData): Promise<string> {
    const db = getDatabase()

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + (data.expiresInHours ?? 24))

    const consultation = await db.aIConsultation.create({
      data: {
        targetUserId: data.targetUserId,
        targetRole: data.targetRole,
        title: data.title,
        description: data.description,
        recommendation: data.recommendation,
        options: data.options,
        workOrderId: data.workOrderId,
        status: 'PENDING',
        expiresAt,
      },
    })

    return consultation.id
  }

  /**
   * Obtiene consultas pendientes para un usuario especifico.
   */
  async getPendingForUser(userId: string) {
    const db = getDatabase()

    return db.aIConsultation.findMany({
      where: {
        targetUserId: userId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        workOrder: {
          select: { id: true, workOrderNumber: true, status: true },
        },
      },
    })
  }

  /**
   * Obtiene consultas pendientes para un rol especifico.
   */
  async getPendingForRole(role: string) {
    const db = getDatabase()

    return db.aIConsultation.findMany({
      where: {
        targetRole: role,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        workOrder: {
          select: { id: true, workOrderNumber: true, status: true },
        },
      },
    })
  }

  /**
   * Responde a una consulta pendiente.
   * Retorna la consulta actualizada.
   */
  async respond(
    consultationId: string,
    response: string,
    respondedBy: string,
  ) {
    const db = getDatabase()

    const consultation = await db.aIConsultation.findUnique({
      where: { id: consultationId },
    })

    if (!consultation) {
      throw new Error('Consulta no encontrada')
    }

    if (consultation.status !== 'PENDING') {
      throw new Error(`Consulta ya fue ${consultation.status.toLowerCase()}`)
    }

    // Determinar nuevo status basado en la respuesta
    const isApproved = response.toLowerCase().includes('aprobar')
      || response.toLowerCase().includes('si')
      || response.toLowerCase().includes('aceptar')

    const newStatus = isApproved ? 'APPROVED' : 'REJECTED'

    return db.aIConsultation.update({
      where: { id: consultationId },
      data: {
        status: newStatus,
        response,
        respondedBy,
        respondedAt: new Date(),
      },
      include: {
        workOrder: {
          select: { id: true, workOrderNumber: true },
        },
      },
    })
  }

  /**
   * Expira consultas antiguas que no fueron respondidas.
   * Retorna la cantidad de consultas expiradas.
   */
  async expireStale(): Promise<number> {
    const db = getDatabase()

    const result = await db.aIConsultation.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lte: new Date() },
      },
      data: {
        status: 'EXPIRED',
      },
    })

    return result.count
  }

  /**
   * Obtiene una consulta por su ID con relaciones.
   */
  async getById(id: string) {
    const db = getDatabase()

    return db.aIConsultation.findUnique({
      where: { id },
      include: {
        workOrder: {
          select: { id: true, workOrderNumber: true, status: true },
        },
        targetUser: {
          select: { id: true, name: true },
        },
      },
    })
  }

  /**
   * Estadisticas de consultas.
   */
  async getStats(): Promise<{
    pending: number
    approved: number
    rejected: number
    expired: number
  }> {
    const db = getDatabase()

    const byStatus = await db.aIConsultation.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    const counts: Record<string, number> = {}
    for (const row of byStatus) {
      counts[row.status] = row._count.id
    }

    return {
      pending: counts['PENDING'] ?? 0,
      approved: counts['APPROVED'] ?? 0,
      rejected: counts['REJECTED'] ?? 0,
      expired: counts['EXPIRED'] ?? 0,
    }
  }
}

/** Singleton del gestor de consultas */
export const consultationManager = new ConsultationManager()
