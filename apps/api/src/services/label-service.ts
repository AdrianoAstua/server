import { getDatabase } from '@voneb/database'
import { NotFoundError } from '../lib/errors.js'
import bwipjs from 'bwip-js'
import PDFDocument from 'pdfkit'
import { LABEL_SIZES } from '@voneb/shared'

const PUBLIC_BASE_URL = 'https://voneb.autovoid.tech'

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function ptFromMm(mm: number): number {
  return mm * 2.835 // 1mm = 2.835pt
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-CR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ─────────────────────────────────────────────
// Generate work order label (50x35mm product label)
// ─────────────────────────────────────────────

export async function generateWorkOrderLabel(workOrderId: string): Promise<Buffer> {
  const db = getDatabase()

  const workOrder = await db.workOrder.findUnique({
    where: { id: workOrderId },
    include: {
      lines: {
        orderBy: { lineNumber: 'asc' },
        take: 1,
        select: { productType: true, description: true },
      },
      customer: { select: { firstName: true, lastName: true } },
    },
  })

  if (!workOrder) throw new NotFoundError('Work order not found')

  const labelW = ptFromMm(LABEL_SIZES.PRODUCT.width)
  const labelH = ptFromMm(LABEL_SIZES.PRODUCT.height)

  const doc = new PDFDocument({ size: [labelW, labelH], margin: 4 })
  const chunks: Buffer[] = []

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const render = async () => {
      const margin = 4
      const contentW = labelW - margin * 2

      // VOneB header
      doc.fontSize(7).font('Helvetica-Bold')
      doc.text('VOneB', margin, margin, { width: contentW, align: 'center' })

      // Product description
      const firstLine = workOrder.lines[0]
      const desc = firstLine ? firstLine.description : workOrder.workOrderNumber
      doc.fontSize(5).font('Helvetica')
      doc.text(desc, margin, margin + 10, { width: contentW, lineBreak: false })

      // Barcode (Code128)
      try {
        const barcodeBuffer = await bwipjs.toBuffer({
          bcid: 'code128',
          text: workOrder.workOrderNumber,
          scale: 2,
          height: 8,
          includetext: true,
          textxalign: 'center',
          textsize: 6,
        })

        doc.image(barcodeBuffer, margin, margin + 18, {
          width: contentW,
          height: labelH * 0.45,
        })
      } catch {
        doc.fontSize(6).text(workOrder.workOrderNumber, margin, margin + 22)
      }

      // Order number at bottom
      const bottomY = labelH - 10
      doc.fontSize(4).font('Helvetica')
      doc.text(workOrder.workOrderNumber, margin, bottomY, {
        width: contentW,
        align: 'center',
      })

      doc.end()
    }

    render().catch(reject)
  })
}

// ─────────────────────────────────────────────
// Generate line label (individual piece)
// ─────────────────────────────────────────────

export async function generateLineLabel(workOrderLineId: string): Promise<Buffer> {
  const db = getDatabase()

  const line = await db.workOrderLine.findUnique({
    where: { id: workOrderLineId },
    include: {
      workOrder: {
        select: { workOrderNumber: true },
      },
    },
  })

  if (!line) throw new NotFoundError('Work order line not found')

  const labelW = ptFromMm(LABEL_SIZES.PRODUCT.width)
  const labelH = ptFromMm(LABEL_SIZES.PRODUCT.height)

  const doc = new PDFDocument({ size: [labelW, labelH], margin: 4 })
  const chunks: Buffer[] = []

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const render = async () => {
      const margin = 4
      const contentW = labelW - margin * 2

      // VOneB header
      doc.fontSize(7).font('Helvetica-Bold')
      doc.text('VOneB', margin, margin, { width: contentW, align: 'center' })

      // Description
      doc.fontSize(5).font('Helvetica')
      doc.text(line.description, margin, margin + 10, { width: contentW, lineBreak: false })

      // Product type
      doc.fontSize(4)
      doc.text(line.productType, margin, margin + 16, { width: contentW })

      // Barcode with line barcode
      try {
        const barcodeBuffer = await bwipjs.toBuffer({
          bcid: 'code128',
          text: line.barcode,
          scale: 2,
          height: 8,
          includetext: true,
          textxalign: 'center',
          textsize: 6,
        })

        doc.image(barcodeBuffer, margin, margin + 22, {
          width: contentW,
          height: labelH * 0.40,
        })
      } catch {
        doc.fontSize(6).text(line.barcode, margin, margin + 24)
      }

      // Order reference at bottom
      const bottomY = labelH - 10
      doc.fontSize(4).font('Helvetica')
      doc.text(line.workOrder.workOrderNumber, margin, bottomY, {
        width: contentW,
        align: 'center',
      })

      doc.end()
    }

    render().catch(reject)
  })
}

// ─────────────────────────────────────────────
// Generate package label (100x70mm)
// ─────────────────────────────────────────────

export async function generatePackageLabel(workOrderId: string): Promise<Buffer> {
  const db = getDatabase()

  const workOrder = await db.workOrder.findUnique({
    where: { id: workOrderId },
    include: {
      customer: { select: { firstName: true, lastName: true } },
      lines: { select: { id: true, quantity: true } },
    },
  })

  if (!workOrder) throw new NotFoundError('Work order not found')

  const pieceCount = workOrder.lines.reduce((sum, l) => sum + l.quantity, 0)
  const clientName = `${workOrder.customer.firstName} ${workOrder.customer.lastName}`
  const trackingUrl = `${PUBLIC_BASE_URL}/tracking/${workOrder.workOrderNumber}`

  const labelW = ptFromMm(LABEL_SIZES.PACKAGE.width)
  const labelH = ptFromMm(LABEL_SIZES.PACKAGE.height)

  const doc = new PDFDocument({ size: [labelW, labelH], margin: 6 })
  const chunks: Buffer[] = []

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const render = async () => {
      const margin = 6
      const contentW = labelW - margin * 2

      // VOneB header
      doc.fontSize(12).font('Helvetica-Bold')
      doc.text('VOneB', margin, margin, { width: contentW, align: 'center' })

      // Order number (large)
      doc.fontSize(10).font('Helvetica-Bold')
      doc.text(workOrder.workOrderNumber, margin, margin + 16, { width: contentW, align: 'center' })

      // Client name
      doc.fontSize(8).font('Helvetica')
      doc.text(clientName, margin, margin + 30, { width: contentW })

      // Piece count & delivery type
      doc.fontSize(7)
      doc.text(`Piezas: ${pieceCount}`, margin, margin + 42)
      doc.text(`Entrega: ${workOrder.deliveryType}`, margin, margin + 52)

      // Date
      doc.fontSize(6)
      doc.text(formatDate(new Date()), margin, margin + 62)

      // QR Code (right side)
      try {
        const qrBuffer = await bwipjs.toBuffer({
          bcid: 'qrcode',
          text: trackingUrl,
          scale: 3,
          height: 25,
          width: 25,
        })

        doc.image(qrBuffer, contentW - 55, margin + 30, {
          width: 60,
          height: 60,
        })
      } catch {
        doc.fontSize(5).text('QR Error', contentW - 55, margin + 50)
      }

      // Code128 barcode at bottom
      try {
        const barcodeBuffer = await bwipjs.toBuffer({
          bcid: 'code128',
          text: workOrder.workOrderNumber,
          scale: 2,
          height: 10,
          includetext: true,
          textxalign: 'center',
          textsize: 7,
        })

        doc.image(barcodeBuffer, margin, labelH - 40, {
          width: contentW * 0.6,
          height: 30,
        })
      } catch {
        doc.fontSize(7).text(workOrder.workOrderNumber, margin, labelH - 30)
      }

      doc.end()

      // Save label record in database
      const existingLabels = await db.packageLabel.count({ where: { workOrderId } })

      await db.packageLabel.create({
        data: {
          workOrderId,
          labelNumber: existingLabels + 1,
          qrData: trackingUrl,
          code128Data: workOrder.workOrderNumber,
          pieceCount,
          clientName,
          deliveryType: workOrder.deliveryType,
          generatedById: workOrder.createdById, // fallback, overridden by route
        },
      })
    }

    render().catch(reject)
  })
}

// ─────────────────────────────────────────────
// Generate tracking QR as data URL
// ─────────────────────────────────────────────

export async function generateTrackingQR(workOrderId: string): Promise<string> {
  const db = getDatabase()

  const workOrder = await db.workOrder.findUnique({
    where: { id: workOrderId },
    select: { workOrderNumber: true },
  })

  if (!workOrder) throw new NotFoundError('Work order not found')

  const trackingUrl = `${PUBLIC_BASE_URL}/tracking/${workOrder.workOrderNumber}`

  const qrBuffer = await bwipjs.toBuffer({
    bcid: 'qrcode',
    text: trackingUrl,
    scale: 5,
    height: 40,
    width: 40,
  })

  return `data:image/png;base64,${qrBuffer.toString('base64')}`
}

// ─────────────────────────────────────────────
// Mark label as printed
// ─────────────────────────────────────────────

export async function markLabelPrinted(labelId: string) {
  const db = getDatabase()

  const label = await db.packageLabel.findUnique({ where: { id: labelId } })
  if (!label) throw new NotFoundError('Package label not found')

  return db.packageLabel.update({
    where: { id: labelId },
    data: { printedAt: new Date() },
  })
}
