import { getDatabase } from '@voneb/database'

// ─────────────────────────────────────────────
// Ejecutor de acciones del cerebro AI
// Ejecuta acciones autonomas o aprobadas por humanos.
// Todas las acciones se registran en AIActionLog.
// ─────────────────────────────────────────────

interface AutonomousAction {
  type: string
  title: string
  description: string
  triggeredBy: string
  severity?: string
  targetId?: string
  targetType?: string
  metadata?: Record<string, unknown>
}

class ActionExecutor {
  /**
   * Ejecuta una accion autonoma (sin aprobacion) y la registra.
   */
  async executeAutonomous(action: AutonomousAction): Promise<void> {
    const db = getDatabase()

    await db.aIActionLog.create({
      data: {
        actionType: action.type,
        severity: action.severity ?? 'INFO',
        title: action.title,
        description: action.description,
        triggeredBy: action.triggeredBy,
        targetId: action.targetId,
        targetType: action.targetType,
        result: 'EXECUTED',
        metadata: action.metadata ?? {},
      },
    })
  }

  /**
   * Ejecuta una accion despues de que una consulta fue aprobada.
   */
  async executeApproved(
    consultationId: string,
    action: string,
  ): Promise<void> {
    const db = getDatabase()

    const consultation = await db.aIConsultation.findUnique({
      where: { id: consultationId },
    })

    if (!consultation) return

    await db.aIActionLog.create({
      data: {
        actionType: action,
        severity: 'INFO',
        title: `Accion aprobada: ${consultation.title}`,
        description: `${consultation.description} — Respuesta: ${consultation.response ?? 'aprobado'}`,
        triggeredBy: 'consultation_approval',
        targetId: consultation.workOrderId,
        targetType: consultation.workOrderId ? 'WorkOrder' : undefined,
        result: 'EXECUTED',
        approvedBy: consultation.respondedBy,
        metadata: {
          consultationId,
          action,
          originalRecommendation: consultation.recommendation,
        },
      },
    })
  }

  /**
   * Auto-asigna un disenador a una orden basandose en carga de trabajo.
   * Retorna el nombre del disenador asignado.
   */
  async autoAssignDesigner(workOrderId: string): Promise<string> {
    const db = getDatabase()

    // Buscar disenadores (DISENADOR role)
    const designers = await db.user.findMany({
      where: {
        role: { in: ['DISENADOR', 'ADMIN'] },
        active: true,
      },
      select: { id: true, name: true },
    })

    if (designers.length === 0) return 'Sin disenadores disponibles'

    // Contar carga actual de cada disenador
    const loads = await Promise.all(
      designers.map(async (d: { id: string; name: string }) => {
        const count = await db.workOrder.count({
          where: {
            assignedDesignerId: d.id,
            status: { in: ['EN_COLA_DISENO', 'EN_DISENO', 'DISENO_EN_REVISION'] },
          },
        })
        return { ...d, load: count }
      }),
    )

    // Asignar al disenador con menor carga
    loads.sort((a: { load: number }, b: { load: number }) => a.load - b.load)
    const selected = loads[0]!

    // Actualizar la orden
    await db.workOrder.update({
      where: { id: workOrderId },
      data: { assignedDesignerId: selected.id },
    })

    // Log la accion
    await this.executeAutonomous({
      type: 'AUTO_ASSIGN_DESIGNER',
      title: `Disenador auto-asignado: ${selected.name}`,
      description: `Orden asignada a ${selected.name} (carga actual: ${selected.load} ordenes). Seleccionado por menor carga de trabajo.`,
      triggeredBy: 'decision_engine',
      targetId: workOrderId,
      targetType: 'WorkOrder',
      metadata: { designerId: selected.id, designerLoad: selected.load },
    })

    return selected.name
  }

  /**
   * Auto-notifica al cliente (registra la intencion — la integracion
   * real con WhatsApp se maneja en el servicio de notificaciones).
   */
  async autoNotifyClient(
    workOrderId: string,
    messageType: string,
  ): Promise<void> {
    const db = getDatabase()

    const workOrder = await db.workOrder.findUnique({
      where: { id: workOrderId },
      select: {
        workOrderNumber: true,
        customer: {
          select: { firstName: true, whatsappPhone: true },
        },
      },
    })

    if (!workOrder) return

    const messages: Record<string, string> = {
      DESIGN_READY: `Diseno listo para revision — ${workOrder.customer.firstName}`,
      PRODUCTION_STARTED: `Orden ${workOrder.workOrderNumber} entro a produccion`,
      READY_PICKUP: `Orden ${workOrder.workOrderNumber} lista para recoger`,
      DELIVERED: `Orden ${workOrder.workOrderNumber} entregada`,
    }

    await this.executeAutonomous({
      type: 'AUTO_NOTIFY_CLIENT',
      title: messages[messageType] ?? `Notificacion: ${messageType}`,
      description: `Notificacion automatica a ${workOrder.customer.firstName} (${workOrder.customer.whatsappPhone ?? 'sin telefono'}) — tipo: ${messageType}`,
      triggeredBy: 'decision_engine',
      targetId: workOrderId,
      targetType: 'WorkOrder',
      metadata: { messageType, phone: workOrder.customer.whatsappPhone },
    })
  }

  /**
   * Auto-escala un incidente (cambia severity o notifica supervisor).
   */
  async autoEscalateIncident(incidentId: string): Promise<void> {
    const db = getDatabase()

    const incident = await db.incident.findUnique({
      where: { id: incidentId },
      select: {
        incidentNumber: true,
        type: true,
        severity: true,
        workOrder: { select: { workOrderNumber: true } },
      },
    })

    if (!incident) return

    await this.executeAutonomous({
      type: 'AUTO_ESCALATE_INCIDENT',
      severity: 'WARNING',
      title: `Incidente escalado: ${incident.incidentNumber}`,
      description: `Incidente ${incident.incidentNumber} (${incident.type}, severidad: ${incident.severity}) de orden ${incident.workOrder.workOrderNumber} escalado automaticamente al supervisor.`,
      triggeredBy: 'decision_engine',
      targetId: incidentId,
      targetType: 'Incident',
      metadata: { incidentType: incident.type, severity: incident.severity },
    })
  }

  /**
   * Auto-cierra una orden que ya fue entregada y no tiene incidentes abiertos.
   */
  async autoCloseOrder(workOrderId: string): Promise<void> {
    const db = getDatabase()

    const workOrder = await db.workOrder.findUnique({
      where: { id: workOrderId },
      select: {
        workOrderNumber: true,
        status: true,
        incidents: {
          where: { status: { in: ['OPEN', 'INVESTIGATING'] } },
          select: { id: true },
        },
      },
    })

    if (!workOrder) return
    if (workOrder.status !== 'ENTREGADO') return
    if (workOrder.incidents.length > 0) return

    await db.workOrder.update({
      where: { id: workOrderId },
      data: { status: 'CERRADO' },
    })

    await db.workOrderStatusHistory.create({
      data: {
        workOrderId,
        fromStatus: 'ENTREGADO',
        toStatus: 'CERRADO',
        notes: 'Auto-cerrado por el cerebro AI (entregado sin incidentes abiertos)',
        automatic: true,
      },
    })

    await this.executeAutonomous({
      type: 'AUTO_CLOSE_ORDER',
      title: `Orden auto-cerrada: ${workOrder.workOrderNumber}`,
      description: `Orden ${workOrder.workOrderNumber} cerrada automaticamente: entregada sin incidentes pendientes.`,
      triggeredBy: 'decision_engine',
      targetId: workOrderId,
      targetType: 'WorkOrder',
    })
  }

  /**
   * Re-ordena la cola de una estacion por prioridad.
   * (Log informativo — el reordenamiento real es por query ORDER BY prioridad)
   */
  async autoReorderQueue(station: string): Promise<void> {
    await this.executeAutonomous({
      type: 'AUTO_REORDER_QUEUE',
      title: `Cola reordenada: ${station}`,
      description: `Cola de estacion ${station} reordenada por prioridad (URGENTE > ALTA > NORMAL > BAJA).`,
      triggeredBy: 'decision_engine',
      targetType: 'Station',
      metadata: { station },
    })
  }

  /**
   * Genera una alerta en el dashboard.
   */
  async autoAlertDashboard(
    title: string,
    description: string,
    severity: string,
  ): Promise<void> {
    await this.executeAutonomous({
      type: 'DASHBOARD_ALERT',
      severity,
      title,
      description,
      triggeredBy: 'decision_engine',
    })
  }
}

/** Singleton del ejecutor de acciones */
export const actionExecutor = new ActionExecutor()
