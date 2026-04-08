import { EventEmitter } from 'events'

// ─────────────────────────────────────────────
// Capa 1 — Sensores: Bus de eventos del cerebro AI
// ─────────────────────────────────────────────

export type AIEventType =
  | 'work_order.created'
  | 'work_order.status_changed'
  | 'production.scanned_in'
  | 'production.scanned_out'
  | 'quality.checked'
  | 'incident.created'
  | 'incident.resolved'
  | 'design.uploaded'
  | 'design.approved'
  | 'design.rejected'
  | 'delivery.shipped'
  | 'delivery.confirmed'
  | 'whatsapp.message_received'
  | 'shopify.order_created'
  | 'timer.periodic'
  | 'timer.hourly'
  | 'timer.daily'

export interface AIEvent {
  type: AIEventType
  data: Record<string, unknown>
  timestamp: string
  source: string
}

const MAX_BUFFER_SIZE = 1000

class AIEventBus extends EventEmitter {
  private eventBuffer: AIEvent[] = []
  private bufferIndex = 0
  private bufferFull = false

  constructor() {
    super()
    this.setMaxListeners(50)
  }

  /**
   * Emite un evento al cerebro AI y lo almacena en el buffer circular.
   */
  emitEvent(type: AIEventType, data: Record<string, unknown>, source: string): boolean {
    const event: AIEvent = {
      type,
      data,
      timestamp: new Date().toISOString(),
      source,
    }

    // Buffer circular: sobreescribir los mas viejos
    if (this.bufferFull) {
      this.eventBuffer[this.bufferIndex] = event
    } else {
      this.eventBuffer.push(event)
    }

    this.bufferIndex = (this.bufferIndex + 1) % MAX_BUFFER_SIZE
    if (this.bufferIndex === 0 && this.eventBuffer.length >= MAX_BUFFER_SIZE) {
      this.bufferFull = true
    }

    return super.emit(type, event)
  }

  /**
   * Suscribe un handler async a un tipo de evento.
   */
  subscribe(type: AIEventType, handler: (event: AIEvent) => Promise<void>): void {
    this.on(type, (event: AIEvent) => {
      handler(event).catch((err) => {
        // Log silenciosamente para no romper el flujo
        console.error(`[AI Brain] Error procesando evento ${type}:`, err)
      })
    })
  }

  /**
   * Retorna los ultimos N eventos del buffer circular para debugging.
   */
  getRecentEvents(limit = 50): AIEvent[] {
    const total = this.eventBuffer.length
    if (total === 0) return []

    const count = Math.min(limit, total)

    if (!this.bufferFull) {
      // Buffer no lleno: los eventos estan en orden
      return this.eventBuffer.slice(-count)
    }

    // Buffer lleno: reconstruir orden cronologico
    const ordered: AIEvent[] = []
    const startIndex = this.bufferIndex // El mas viejo es el proximo a sobreescribir
    for (let i = 0; i < total; i++) {
      ordered.push(this.eventBuffer[(startIndex + i) % MAX_BUFFER_SIZE]!)
    }
    return ordered.slice(-count)
  }

  /**
   * Cuenta total de eventos procesados (para metricas).
   */
  getBufferStats(): { total: number; bufferSize: number; isFull: boolean } {
    return {
      total: this.eventBuffer.length,
      bufferSize: MAX_BUFFER_SIZE,
      isFull: this.bufferFull,
    }
  }
}

/** Singleton del bus de eventos AI */
export const aiBus = new AIEventBus()
