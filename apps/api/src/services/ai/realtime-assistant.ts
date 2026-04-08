import { getDatabase } from '@voneb/database'
import { memoryStore } from './memory-store.js'
import {
  INITIAL_METRICS,
  searchScenarios,
  getScenariosByCategory,
  type TrainingScenario,
} from './training-data.js'

// ─────────────────────────────────────────────────────────────────────────────
// Asistente en Tiempo Real para operadores
// Provee tips contextuales, advertencias y sugerencias basado en:
//   1. Escenarios de entrenamiento pre-cargados
//   2. Metricas en tiempo real del memory store
//   3. Estado actual de ordenes y produccion
// ─────────────────────────────────────────────────────────────────────────────

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface AssistantContext {
  panel: string // 'diseno', 'produccion', 'calidad', 'empaque'
  action: string // 'scanning', 'checking', 'uploading', 'packing'
  workOrderId?: string
  lineBarcode?: string
  userId?: string
}

export interface AssistantResponse {
  tips: string[]
  warnings: string[]
  relatedScenarios: TrainingScenario[]
  suggestedAction: string | null
}

export interface SuggestedAction {
  action: string
  reason: string
  workOrderNumber?: string
  priority: string
}

export interface StuckAlert {
  userId: string
  panel: string
  idleMinutes: number
  suggestion: string
}

// ── Mapeos de contexto ──────────────────────────────────────────────────────

const PANEL_TO_CATEGORIES: Record<string, string[]> = {
  diseno: ['design', 'client'],
  produccion: ['production', 'machine', 'material'],
  calidad: ['quality', 'production'],
  empaque: ['delivery', 'quality'],
}

const ACTION_KEYWORDS: Record<string, string[]> = {
  scanning: ['escaneo', 'barcode', 'scanner', 'scan'],
  checking: ['verificar', 'check', 'quality', 'calidad', 'inspeccion'],
  uploading: ['archivo', 'file', 'upload', 'diseno', 'image', 'resolution'],
  packing: ['empaque', 'pack', 'delivery', 'envio', 'etiqueta'],
  cutting: ['corte', 'cuchilla', 'blade', 'cutting', 'patron'],
  printing: ['impresion', 'print', 'sublimation', 'tinta', 'ink'],
  sewing: ['costura', 'sewing', 'thread', 'hilo', 'overlock'],
  pressing: ['prensa', 'press', 'temperatura', 'temperature', 'heat'],
}

// ── Clase principal ─────────────────────────────────────────────────────────

class RealtimeAssistant {
  /**
   * Obtiene ayuda contextual para la accion actual del operador.
   * Combina escenarios de entrenamiento + datos en tiempo real.
   */
  async getHelp(context: AssistantContext): Promise<AssistantResponse> {
    const tips: string[] = []
    const warnings: string[] = []
    let relatedScenarios: TrainingScenario[] = []
    let suggestedAction: string | null = null

    // 1. Obtener escenarios relevantes por panel
    const categories = PANEL_TO_CATEGORIES[context.panel] ?? ['production']
    for (const cat of categories) {
      const catScenarios = getScenariosByCategory(cat)
      relatedScenarios.push(...catScenarios)
    }

    // 2. Filtrar por accion (keywords)
    const actionKeywords = ACTION_KEYWORDS[context.action] ?? []
    if (actionKeywords.length > 0) {
      const filtered = relatedScenarios.filter((s) => {
        const text =
          `${s.trigger} ${s.condition} ${s.action} ${s.description_es}`.toLowerCase()
        return actionKeywords.some((kw) => text.includes(kw))
      })
      if (filtered.length > 0) {
        relatedScenarios = filtered
      }
    }

    // 3. Limitar a los mas relevantes (top 5 por confianza)
    relatedScenarios.sort((a, b) => b.confidence - a.confidence)
    relatedScenarios = relatedScenarios.slice(0, 5)

    // 4. Generar tips basados en panel + accion
    tips.push(...this.getContextualTips(context))

    // 5. Generar warnings basados en metricas en tiempo real
    const metricWarnings = await this.getMetricWarnings(context)
    warnings.push(...metricWarnings)

    // 6. Si hay orden especifica, obtener warnings de la orden
    if (context.workOrderId) {
      const orderWarnings = await this.getOrderWarnings(context.workOrderId)
      warnings.push(...orderWarnings)
    }

    // 7. Sugerir siguiente accion
    if (context.userId) {
      const suggestion = await this.getSuggestedNextAction(
        context.userId,
        this.panelToRole(context.panel),
      )
      if (suggestion) {
        suggestedAction = `${suggestion.action} — ${suggestion.reason}`
      }
    }

    return { tips, warnings, relatedScenarios, suggestedAction }
  }

  /**
   * Obtiene advertencias antes de ejecutar una accion especifica.
   */
  async getPreActionWarnings(context: {
    action: string
    workOrderId: string
  }): Promise<string[]> {
    const warnings: string[] = []
    const db = getDatabase()

    const order = await db.workOrder.findUnique({
      where: { id: context.workOrderId },
      select: {
        priority: true,
        workOrderNumber: true,
        status: true,
        lines: {
          select: {
            productType: true,
            currentStation: true,
            barcode: true,
          },
        },
        customer: {
          select: { firstName: true, lastName: true },
        },
      },
    })

    if (!order) return ['Orden no encontrada.']

    // Warning si es urgente
    if (order.priority === 'URGENTE' || order.priority === 'ALTA') {
      warnings.push(
        `PRIORIDAD ${order.priority}: Orden ${order.workOrderNumber} tiene prioridad alta. Atender primero.`,
      )
    }

    // Warning si la accion es escanear y la pieza ya paso por QC
    if (context.action === 'scan_out') {
      const qcChecks = await db.qualityCheck.findMany({
        where: {
          workOrderLine: {
            workOrderId: context.workOrderId,
          },
          result: 'FAILED',
        },
        take: 1,
      })
      if (qcChecks.length > 0) {
        warnings.push(
          'Esta orden tiene piezas rechazadas en QC anteriormente. Verificar con cuidado.',
        )
      }
    }

    // Warning si hay incidentes abiertos
    const openIncidents = await db.incident.count({
      where: {
        workOrderId: context.workOrderId,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    })
    if (openIncidents > 0) {
      warnings.push(
        `Hay ${openIncidents} incidente(s) abierto(s) en esta orden. Verificar antes de continuar.`,
      )
    }

    // Warnings por tipo de producto
    for (const line of order.lines) {
      if (line.productType?.toLowerCase().includes('jersey')) {
        warnings.push(
          'Producto tipo Jersey: verificar numeros, nombres y tallas coincidan con la lista del cliente.',
        )
        break
      }
    }

    // Buscar escenarios relevantes para la accion
    const relevant = searchScenarios(context.action, 3)
    for (const s of relevant) {
      if (s.severity === 'CRITICAL' || s.severity === 'WARNING') {
        warnings.push(s.description_es)
      }
    }

    return warnings
  }

  /**
   * Sugiere la siguiente accion optima para un operador basado en
   * su rol, cola de trabajo y prioridades.
   */
  async getSuggestedNextAction(
    userId: string,
    role: string,
  ): Promise<SuggestedAction | null> {
    const db = getDatabase()

    // Obtener la siguiente pieza prioritaria segun rol
    if (role === 'OPERARIO' || role === 'OPERARIO_PRODUCCION') {
      // Buscar lineas en cola de produccion, priorizando urgentes
      const nextLine = await db.workOrderLine.findFirst({
        where: {
          currentStation: { not: null },
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
        orderBy: [
          { workOrder: { priority: 'desc' } },
          { workOrder: { promisedDate: 'asc' } },
        ],
        select: {
          barcode: true,
          currentStation: true,
          workOrder: {
            select: {
              workOrderNumber: true,
              priority: true,
            },
          },
        },
      })

      if (nextLine) {
        return {
          action: `Escanear pieza ${nextLine.barcode} en estacion ${nextLine.currentStation}`,
          reason: `Orden ${nextLine.workOrder.workOrderNumber} (${nextLine.workOrder.priority}) esperando en cola`,
          workOrderNumber: nextLine.workOrder.workOrderNumber,
          priority: nextLine.workOrder.priority,
        }
      }

      return {
        action: 'No hay piezas en cola',
        reason: 'Todas las piezas estan en proceso o completadas. Verificar con supervisor.',
        priority: 'NORMAL',
      }
    }

    if (role === 'DISENADOR') {
      const nextDesign = await db.workOrder.findFirst({
        where: {
          assignedDesignerId: userId,
          status: { in: ['EN_COLA_DISENO', 'EN_DISENO'] },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        select: {
          workOrderNumber: true,
          priority: true,
          status: true,
          customer: { select: { firstName: true } },
        },
      })

      if (nextDesign) {
        const action =
          nextDesign.status === 'EN_COLA_DISENO'
            ? `Iniciar diseno de orden ${nextDesign.workOrderNumber}`
            : `Continuar diseno de orden ${nextDesign.workOrderNumber}`
        return {
          action,
          reason: `Cliente: ${nextDesign.customer?.firstName ?? 'N/A'}, Prioridad: ${nextDesign.priority}`,
          workOrderNumber: nextDesign.workOrderNumber,
          priority: nextDesign.priority,
        }
      }

      return {
        action: 'Sin ordenes de diseno pendientes',
        reason: 'Cola de diseno vacia. Revisar ordenes en espera de aprobacion.',
        priority: 'NORMAL',
      }
    }

    if (role === 'INSPECTOR_CALIDAD') {
      const nextQC = await db.workOrderLine.findFirst({
        where: {
          currentStation: 'CONTROL_CALIDAD',
          status: 'IN_PROGRESS',
        },
        orderBy: [
          { workOrder: { priority: 'desc' } },
          { updatedAt: 'asc' },
        ],
        select: {
          barcode: true,
          productType: true,
          workOrder: {
            select: { workOrderNumber: true, priority: true },
          },
        },
      })

      if (nextQC) {
        return {
          action: `Inspeccionar pieza ${nextQC.barcode} (${nextQC.productType ?? 'producto'})`,
          reason: `Orden ${nextQC.workOrder.workOrderNumber} (${nextQC.workOrder.priority})`,
          workOrderNumber: nextQC.workOrder.workOrderNumber,
          priority: nextQC.workOrder.priority,
        }
      }

      return {
        action: 'Sin piezas en cola de QC',
        reason: 'No hay piezas esperando inspeccion de calidad.',
        priority: 'NORMAL',
      }
    }

    return null
  }

  /**
   * Detecta si un operador esta "stuck" (sin actividad por mucho tiempo).
   * Verifica el ultimo evento de produccion del operador.
   */
  async checkOperatorStuck(userId: string): Promise<StuckAlert | null> {
    const db = getDatabase()

    // Buscar ultimo log de produccion del operador
    const lastLog = await db.productionLog.findFirst({
      where: { operatorId: userId },
      orderBy: { scannedInAt: 'desc' },
      select: {
        station: true,
        scannedInAt: true,
        scannedOutAt: true,
      },
    })

    if (!lastLog) return null

    const lastActivity = lastLog.scannedOutAt ?? lastLog.scannedInAt
    const idleMs = Date.now() - lastActivity.getTime()
    const idleMinutes = Math.round(idleMs / 60000)

    // Umbrales de inactividad por estacion
    const thresholds: Record<string, number> = {
      IMPRESION: 30,
      CORTE: 20,
      ARMADO: 45,
      EMPAQUE: 15,
      CONTROL_CALIDAD: 20,
    }

    const threshold = thresholds[lastLog.station] ?? 30

    if (idleMinutes < threshold) return null

    // Buscar siguiente pieza en cola
    const nextInQueue = await db.workOrderLine.findFirst({
      where: {
        currentStation: lastLog.station as 'IMPRESION' | 'CORTE' | 'ARMADO' | 'EMPAQUE',
        status: 'PENDING',
      },
      orderBy: { workOrder: { priority: 'desc' } },
      select: {
        barcode: true,
        workOrder: {
          select: { workOrderNumber: true, priority: true },
        },
      },
    })

    const suggestion = nextInQueue
      ? `Necesita ayuda? La siguiente pieza en cola es ${nextInQueue.barcode} de orden ${nextInQueue.workOrder.workOrderNumber} (${nextInQueue.workOrder.priority}).`
      : `Lleva ${idleMinutes} minutos sin actividad en ${lastLog.station}. Necesita ayuda?`

    // Determinar panel basado en estacion
    const stationToPanel: Record<string, string> = {
      IMPRESION: 'produccion',
      CORTE: 'produccion',
      ARMADO: 'produccion',
      EMPAQUE: 'empaque',
      CONTROL_CALIDAD: 'calidad',
    }

    return {
      userId,
      panel: stationToPanel[lastLog.station] ?? 'produccion',
      idleMinutes,
      suggestion,
    }
  }

  // ── Metodos internos ────────────────────────────────────────────────────

  /**
   * Genera tips contextuales basados en panel y accion.
   */
  private getContextualTips(context: AssistantContext): string[] {
    const tips: string[] = []

    switch (context.panel) {
      case 'diseno':
        tips.push('Verificar resolucion minima: 300 DPI para sublimacion full-print, 150 DPI para logos.')
        if (context.action === 'uploading') {
          tips.push('Formatos ideales: AI, EPS, SVG, PDF vectorial. PNG/JPG solo si alta resolucion.')
          tips.push('Convertir fuentes a curvas/outlines antes de enviar a produccion.')
        }
        break

      case 'produccion':
        tips.push('Verificar que la pieza corresponda a la orden correcta antes de procesar.')
        if (context.action === 'scanning') {
          tips.push('Escanear codigo de barras con laser perpendicular al codigo para mejor lectura.')
        }
        if (context.action === 'pressing') {
          tips.push('Verificar temperatura y tiempo antes de prensar. Cada material es diferente.')
          tips.push('Usar hoja protectora de teflon entre prensa y tela.')
        }
        if (context.action === 'cutting') {
          tips.push('Verificar que la plantilla de talla sea la correcta ANTES de cortar.')
          tips.push('Revisar filo de cuchilla cada 500 cortes.')
        }
        break

      case 'calidad':
        tips.push('Verificar: colores, alineacion, costuras, medidas, etiquetas.')
        if (context.action === 'checking') {
          tips.push('Comparar colores contra muestra fisica, NO contra pantalla.')
          tips.push('Medir todas las dimensiones criticas: largo, ancho, mangas, cuello.')
          tips.push('Verificar etiqueta de talla, cuidado y marca.')
        }
        break

      case 'empaque':
        tips.push('Verificar que el contenido coincida con la orden antes de cerrar.')
        if (context.action === 'packing') {
          tips.push('Incluir factura o nota de entrega dentro del paquete.')
          tips.push('Productos fragiles: agregar burbuja y carton de proteccion.')
          tips.push('Doblar jersey mostrando numero y nombre si aplica.')
        }
        break
    }

    return tips
  }

  /**
   * Genera warnings basados en metricas en tiempo real del memory store.
   */
  private async getMetricWarnings(context: AssistantContext): Promise<string[]> {
    const warnings: string[] = []

    try {
      // Verificar tasa de QC si estamos en calidad
      if (context.panel === 'calidad') {
        const qcRate = await memoryStore.getMetric('qc_pass_rate_hourly')
        if (qcRate && qcRate.value < 0.75) {
          warnings.push(
            `Alerta: tasa de aprobacion QC baja (${Math.round(qcRate.value * 100)}%). Revisar calidad de produccion.`,
          )
        }
      }

      // Verificar colas si estamos en produccion
      if (context.panel === 'produccion') {
        const stations = ['IMPRESION', 'CORTE', 'ARMADO'] as const
        for (const station of stations) {
          const queueMetric = await memoryStore.getMetric(`queue_depth_${station}`)
          if (queueMetric && queueMetric.value > 8) {
            warnings.push(
              `Cola alta en ${station}: ~${Math.round(queueMetric.value)} piezas esperando.`,
            )
          }
        }
      }

      // Verificar errores recientes
      const errorRate = await memoryStore.getMetric('error_rate_QC_FAILURE')
      if (errorRate && errorRate.trend === 'SUBIENDO') {
        warnings.push(
          'Tendencia: errores de calidad en aumento. Extremar precauciones.',
        )
      }
    } catch {
      // Silenciar si las metricas no estan disponibles
    }

    return warnings
  }

  /**
   * Genera warnings especificos para una orden de trabajo.
   */
  private async getOrderWarnings(workOrderId: string): Promise<string[]> {
    const warnings: string[] = []
    const db = getDatabase()

    try {
      const order = await db.workOrder.findUnique({
        where: { id: workOrderId },
        select: {
          promisedDate: true,
          priority: true,
          workOrderNumber: true,
          status: true,
          updatedAt: true,
        },
      })

      if (!order) return warnings

      // Warning si la fecha prometida esta cerca o paso
      if (order.promisedDate) {
        const daysUntilPromised = Math.ceil(
          (order.promisedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        )
        if (daysUntilPromised < 0) {
          warnings.push(
            `ATRASADA: Orden ${order.workOrderNumber} tiene ${Math.abs(daysUntilPromised)} dia(s) de atraso.`,
          )
        } else if (daysUntilPromised <= 1) {
          warnings.push(
            `URGENTE: Orden ${order.workOrderNumber} debe entregarse HOY o manana.`,
          )
        } else if (daysUntilPromised <= 2) {
          warnings.push(
            `Pronto: Orden ${order.workOrderNumber} debe entregarse en ${daysUntilPromised} dias.`,
          )
        }
      }

      // Warning si la orden esta estancada
      const hoursInState = (Date.now() - order.updatedAt.getTime()) / (1000 * 60 * 60)
      const staleThreshold =
        INITIAL_METRICS[`stale_threshold_hours_${order.status === 'EN_DISENO' ? 'design' : 'production'}`] ?? 24

      if (hoursInState > staleThreshold) {
        warnings.push(
          `Orden ${order.workOrderNumber} lleva ${Math.round(hoursInState)}h en estado ${order.status}. Verificar.`,
        )
      }
    } catch {
      // Silenciar
    }

    return warnings
  }

  /**
   * Mapea panel a rol del sistema.
   */
  private panelToRole(panel: string): string {
    const map: Record<string, string> = {
      diseno: 'DISENADOR',
      produccion: 'OPERARIO',
      calidad: 'INSPECTOR_CALIDAD',
      empaque: 'OPERARIO',
    }
    return map[panel] ?? 'OPERARIO'
  }
}

/** Singleton del asistente en tiempo real */
export const realtimeAssistant = new RealtimeAssistant()
