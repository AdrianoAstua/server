import { getDatabase } from '@voneb/database'
import { NotFoundError, ConflictError } from '../lib/errors.js'
import bwipjs from 'bwip-js'
import PDFDocument from 'pdfkit'

interface LabelSize {
  width: number
  height: number
  fontSize: number
  barcodeScale: number
}

const LABEL_SIZES: Record<string, LabelSize> = {
  small: { width: 85, height: 57, fontSize: 6, barcodeScale: 1.5 },
  medium: { width: 142, height: 85, fontSize: 8, barcodeScale: 2 },
  large: { width: 283, height: 142, fontSize: 10, barcodeScale: 3 },
}

function formatCRC(cents: number): string {
  const colones = cents / 100
  return `\u20A1${colones.toLocaleString('es-CR', { minimumFractionDigits: 0 })}`
}

export async function findByBarcode(barcode: string) {
  const db = getDatabase()

  const variant = await db.productVariant.findUnique({
    where: { barcode },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          basePriceCents: true,
          images: true,
          category: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!variant) throw new NotFoundError(`No variant found with barcode "${barcode}"`)

  return variant
}

export async function generateBarcode(variantId: string) {
  const db = getDatabase()

  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    select: { id: true, sku: true, barcode: true },
  })
  if (!variant) throw new NotFoundError('Variant not found')

  const barcodeText = variant.sku

  const svgBuffer = await bwipjs.toBuffer({
    bcid: 'code128',
    text: barcodeText,
    scale: 3,
    height: 10,
    includetext: true,
    textxalign: 'center',
  })

  const svg = svgBuffer.toString('base64')

  await db.productVariant.update({
    where: { id: variantId },
    data: { barcode: barcodeText, barcodeFormat: 'CODE128' },
  })

  return { barcode: barcodeText, svg: `data:image/png;base64,${svg}` }
}

export async function generateLabels(
  variantIds: string[],
  format: 'small' | 'medium' | 'large',
): Promise<Buffer> {
  const db = getDatabase()

  const variants = await db.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      product: {
        select: { name: true, basePriceCents: true },
      },
    },
  })

  if (variants.length === 0) {
    throw new NotFoundError('No variants found for the given IDs')
  }

  const labelSize = LABEL_SIZES[format]

  const doc = new PDFDocument({
    size: [labelSize.width, labelSize.height],
    margin: 4,
  })

  const chunks: Buffer[] = []

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const renderLabels = async () => {
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i]
        if (i > 0) doc.addPage()

        const barcodeText = variant.barcode ?? variant.sku
        const price = formatCRC(
          variant.product.basePriceCents + variant.additionalPriceCents,
        )

        doc.fontSize(labelSize.fontSize)
        doc.text(variant.product.name, 4, 4, {
          width: labelSize.width - 8,
          lineBreak: false,
        })

        doc.fontSize(labelSize.fontSize - 1)
        doc.text(`${variant.size} | ${variant.color}`, 4, 4 + labelSize.fontSize + 2, {
          width: labelSize.width - 8,
        })

        try {
          const barcodeBuffer = await bwipjs.toBuffer({
            bcid: 'code128',
            text: barcodeText,
            scale: labelSize.barcodeScale,
            height: 8,
            includetext: false,
          })

          const barcodeY = 4 + (labelSize.fontSize + 2) * 2 + 2
          doc.image(barcodeBuffer, 4, barcodeY, {
            width: labelSize.width - 8,
            height: labelSize.height * 0.35,
          })
        } catch {
          // If barcode generation fails, show text instead
          doc.text(barcodeText, 4, 4 + (labelSize.fontSize + 2) * 2 + 2)
        }

        const bottomY = labelSize.height - labelSize.fontSize - 6
        doc.fontSize(labelSize.fontSize - 1)
        doc.text(variant.sku, 4, bottomY)
        doc.text(price, 4, bottomY, {
          width: labelSize.width - 8,
          align: 'right',
        })
      }

      doc.end()
    }

    renderLabels().catch(reject)
  })
}

export async function assignBarcode(
  variantId: string,
  barcode: string,
  barcodeFormat?: string,
) {
  const db = getDatabase()

  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
  })
  if (!variant) throw new NotFoundError('Variant not found')

  const existingBarcode = await db.productVariant.findUnique({
    where: { barcode },
  })
  if (existingBarcode && existingBarcode.id !== variantId) {
    throw new ConflictError(`Barcode "${barcode}" is already assigned to another variant`)
  }

  return db.productVariant.update({
    where: { id: variantId },
    data: {
      barcode,
      barcodeFormat: barcodeFormat ?? 'CODE128',
    },
  })
}

export async function generateMissingBarcodes() {
  const db = getDatabase()

  const variants = await db.productVariant.findMany({
    where: { barcode: null },
    select: { id: true, sku: true },
  })

  const results: Array<{ variantId: string; sku: string; barcode: string }> = []

  for (const variant of variants) {
    await db.productVariant.update({
      where: { id: variant.id },
      data: { barcode: variant.sku, barcodeFormat: 'CODE128' },
    })

    results.push({
      variantId: variant.id,
      sku: variant.sku,
      barcode: variant.sku,
    })
  }

  return { generated: results.length, variants: results }
}
