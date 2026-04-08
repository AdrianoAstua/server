import { getDatabase, PrismaClient } from '@voneb/database'
import { NotFoundError, ValidationError } from '../lib/errors.js'
import { PRODUCTION_STATIONS_ORDER } from '@voneb/shared'
import type { ScanIn, ScanOut } from '../schemas/production-schemas.js'

type TxClient = PrismaClient

/**
 * Maps a production station to the WorkOrderStatus that a line should have
 * when it enters that station.
 */
const STATION_TO_STATUS: Record<string, string> = {
  IMPRESION: 'EN_IMPRESION',
  CORTE: 'EN_CORTE',
  ARMADO: 'EN_ARMADO',
  EMPAQUE: 'EMPACADO',
}

/**
 * The status a line must have BEFORE it can enter a given station.
 * IMPRESION is the first station so it requires APROBADO_PARA_PRODUCCION.
 */
const REQUIRED_PREVIOUS_STATUS: Record<string, string> = {
  IMPRESION: 'APROBADO_PARA_PRODUCCION',
  CORTE: 'EN_IMPRESION',
  ARMADO: 'EN_CORTE',
  EMPAQUE: 'EN_ARMADO',
}

/**
 * After scanning out of a station, the line advances to the status
 * that represents having completed that station (i.e. ready for the next one).
 * The last station (EMPAQUE) results in EMPACADO.
 */
function getNextStatusAfterScanOut(station: string): string {
  const idx = PRODUCTION_STATIONS_ORDER.indexOf(station as typeof PRODUCTION_STATIONS_ORDER[number])
  if (idx < 0) throw new ValidationError(`Unknown station: ${station}`)

  if (idx === PRODUCTION_STATIONS_ORDER.length - 1) {
    // Last station — line is fully done
    return 'EMPACADO'
  }

  // Advance to the status of the next station
  const nextStation = PRODUCTION_STATIONS_ORDER[idx + 1] as string | undefined
  if (!nextStation) return 'EMPACADO'
  return STATION_TO_STATUS[nextStation] ?? 'EMPACADO'
}

export async function scanIn(data: ScanIn) {
  const db = getDatabase()

  const line = await db.workOrderLine.findUnique({
    where: { barcode: data.lineBarcode },
    include: {
      workOrder: { select: { id: true, workOrderNumber: true, status: true } },
      productionLogs: {
        where: { scannedOutAt: null },
        take: 1,
      },
    },
  })

  if (!line) throw new NotFoundError('Work order line not found for barcode')

  // Check there is no active (un-scanned-out) log for this line
  if (line.productionLogs.length > 0) {
    throw new ValidationError(
      'Line is already scanned into a station. Scan out first.',
      { activeStation: line.productionLogs[0]!.station },
    )
  }

  // Sequential enforcement: verify the line has completed the previous station
  const requiredStatus = REQUIRED_PREVIOUS_STATUS[data.station]
  if (!requiredStatus) {
    throw new ValidationError(`Unknown station: ${data.station}`)
  }

  // For scan-in, the line status should match the required previous status
  // OR the station status itself (in case of re-entry / rework)
  const stationStatus = STATION_TO_STATUS[data.station]
  const allowedStatuses = [requiredStatus]
  // Also allow EN_REPROCESO for rework scenarios
  allowedStatuses.push('EN_REPROCESO')

  if (!allowedStatuses.includes(line.status)) {
    throw new ValidationError(
      `Cannot scan into ${data.station}. Line status is ${line.status}, expected ${requiredStatus}.`,
      { currentStatus: line.status, requiredStatus, station: data.station },
    )
  }

  // Validate operator exists
  const operator = await db.user.findUnique({ where: { id: data.operatorId } })
  if (!operator) throw new NotFoundError('Operator not found')

  const now = new Date()

  // Create production log and update line in a transaction
  const productionLog = await db.$transaction(async (tx: TxClient) => {
    const log = await tx.productionLog.create({
      data: {
        workOrderLineId: line.id,
        station: data.station as 'IMPRESION' | 'CORTE' | 'ARMADO' | 'EMPAQUE',
        operatorId: data.operatorId,
        scannedInAt: now,
      },
      include: {
        operator: { select: { id: true, name: true } },
        workOrderLine: {
          select: { id: true, barcode: true, description: true },
        },
      },
    })

    // Update line current station and status
    await tx.workOrderLine.update({
      where: { id: line.id },
      data: {
        currentStation: data.station as 'IMPRESION' | 'CORTE' | 'ARMADO' | 'EMPAQUE',
        status: stationStatus as 'EN_IMPRESION' | 'EN_CORTE' | 'EN_ARMADO' | 'EMPACADO',
      },
    })

    return log
  })

  return productionLog
}

export async function scanOut(data: ScanOut) {
  const db = getDatabase()

  const line = await db.workOrderLine.findUnique({
    where: { barcode: data.lineBarcode },
    include: {
      productionLogs: {
        where: {
          station: data.station as 'IMPRESION' | 'CORTE' | 'ARMADO' | 'EMPAQUE',
          scannedOutAt: null,
        },
        take: 1,
      },
    },
  })

  if (!line) throw new NotFoundError('Work order line not found for barcode')

  const activeLog = line.productionLogs[0]
  if (!activeLog) {
    throw new ValidationError(
      `No active scan-in found for station ${data.station}`,
      { station: data.station, barcode: data.lineBarcode },
    )
  }

  const now = new Date()
  const durationSeconds = Math.round((now.getTime() - activeLog.scannedInAt.getTime()) / 1000)
  const nextStatus = getNextStatusAfterScanOut(data.station)

  const updatedLog = await db.$transaction(async (tx: TxClient) => {
    const log = await tx.productionLog.update({
      where: { id: activeLog.id },
      data: {
        scannedOutAt: now,
        durationSeconds,
        notes: data.notes,
      },
      include: {
        operator: { select: { id: true, name: true } },
        workOrderLine: {
          select: { id: true, barcode: true, description: true },
        },
      },
    })

    // Advance line status
    // If last station (EMPAQUE), also set to EN_CONTROL_CALIDAD for QC
    const advancedStatus = data.station === 'EMPAQUE' ? 'EN_CONTROL_CALIDAD' : nextStatus
    await tx.workOrderLine.update({
      where: { id: line.id },
      data: {
        status: advancedStatus as 'EN_IMPRESION' | 'EN_CORTE' | 'EN_ARMADO' | 'EN_CONTROL_CALIDAD' | 'EMPACADO',
      },
    })

    return log
  })

  return updatedLog
}

export async function getStationQueue(station: string) {
  const db = getDatabase()

  const stationStatus = STATION_TO_STATUS[station]
  if (!stationStatus) throw new ValidationError(`Unknown station: ${station}`)

  // Lines currently at this station OR whose status indicates they should be here
  const requiredPreviousStatus = REQUIRED_PREVIOUS_STATUS[station]

  const lines = await db.workOrderLine.findMany({
    where: {
      OR: [
        { currentStation: station as 'IMPRESION' | 'CORTE' | 'ARMADO' | 'EMPAQUE' },
        { status: stationStatus as 'EN_IMPRESION' | 'EN_CORTE' | 'EN_ARMADO' | 'EMPACADO' },
        // Lines ready to enter this station
        ...(requiredPreviousStatus
          ? [{ status: requiredPreviousStatus as 'APROBADO_PARA_PRODUCCION' | 'EN_IMPRESION' | 'EN_CORTE' | 'EN_ARMADO' }]
          : []),
      ],
    },
    include: {
      workOrder: {
        select: {
          id: true,
          workOrderNumber: true,
          priority: true,
          customer: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
      productionLogs: {
        where: {
          station: station as 'IMPRESION' | 'CORTE' | 'ARMADO' | 'EMPAQUE',
          scannedOutAt: null,
        },
        take: 1,
        include: {
          operator: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [
      { workOrder: { priority: 'desc' } },
      { createdAt: 'asc' },
    ],
  })

  return lines
}

export async function getWIPDashboard() {
  const db = getDatabase()

  const stations = PRODUCTION_STATIONS_ORDER as readonly string[]

  // Count lines at each station
  const stationCounts = await Promise.all(
    stations.map(async (station) => {
      const count = await db.workOrderLine.count({
        where: { currentStation: station as 'IMPRESION' | 'CORTE' | 'ARMADO' | 'EMPAQUE' },
      })
      return { station, count }
    }),
  )

  // Average duration per station (from completed logs)
  const stationDurations = await Promise.all(
    stations.map(async (station) => {
      const result = await db.productionLog.aggregate({
        where: {
          station: station as 'IMPRESION' | 'CORTE' | 'ARMADO' | 'EMPAQUE',
          durationSeconds: { not: null },
        },
        _avg: { durationSeconds: true },
        _count: true,
      })
      return {
        station,
        avgDurationSeconds: result._avg.durationSeconds ?? 0,
        completedCount: result._count,
      }
    }),
  )

  // Total active work orders (those with lines in production)
  const activeOrders = await db.workOrder.count({
    where: {
      status: {
        in: [
          'APROBADO_PARA_PRODUCCION', 'EN_IMPRESION', 'EN_CORTE',
          'EN_ARMADO', 'EN_CONTROL_CALIDAD', 'EN_REPROCESO',
        ],
      },
    },
  })

  return {
    stationCounts,
    stationDurations,
    activeOrders,
  }
}

export async function getProductionTimeline(workOrderId: string) {
  const db = getDatabase()

  const workOrder = await db.workOrder.findUnique({ where: { id: workOrderId } })
  if (!workOrder) throw new NotFoundError('Work order not found')

  const logs = await db.productionLog.findMany({
    where: {
      workOrderLine: { workOrderId },
    },
    orderBy: { scannedInAt: 'asc' },
    include: {
      operator: { select: { id: true, name: true } },
      workOrderLine: {
        select: { id: true, barcode: true, lineNumber: true, description: true },
      },
    },
  })

  return logs
}
