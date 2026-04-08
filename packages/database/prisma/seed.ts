import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  console.log('Seeding V ONE B database...')

  // ─── Admin User ───
  const admin = await prisma.user.upsert({
    where: { email: 'admin@v-one-b.com' },
    update: {},
    create: {
      email: 'admin@v-one-b.com',
      passwordHash: '$2b$12$placeholder.hash.will.be.replaced.on.first.login',
      name: 'Admin V ONE B',
      role: 'ADMIN',
      whatsappPhone: '+50600000000',
      active: true,
    },
  })

  console.log(`  Admin user created: ${admin.email}`)

  // ─── Categories ───
  const ciclismo = await prisma.category.upsert({
    where: { slug: 'ciclismo' },
    update: {},
    create: { name: 'Ciclismo', slug: 'ciclismo', sortOrder: 1 },
  })

  const running = await prisma.category.upsert({
    where: { slug: 'running' },
    update: {},
    create: { name: 'Running', slug: 'running', sortOrder: 2 },
  })

  const tops = await prisma.category.upsert({
    where: { slug: 'tops' },
    update: {},
    create: { name: 'Tops', slug: 'tops', sortOrder: 3 },
  })

  const natacion = await prisma.category.upsert({
    where: { slug: 'natacion' },
    update: {},
    create: { name: 'Natacion', slug: 'natacion', sortOrder: 4 },
  })

  const accesorios = await prisma.category.upsert({
    where: { slug: 'accesorios' },
    update: {},
    create: { name: 'Accesorios', slug: 'accesorios', sortOrder: 5 },
  })

  const triatlon = await prisma.category.upsert({
    where: { slug: 'triatlon' },
    update: {},
    create: { name: 'Triatlon', slug: 'triatlon', sortOrder: 6 },
  })

  // ─── Subcategories ───
  const jerseys = await prisma.category.upsert({
    where: { slug: 'ciclismo-jerseys' },
    update: {},
    create: { name: 'Jerseys', slug: 'ciclismo-jerseys', parentId: ciclismo.id, sortOrder: 1 },
  })

  const licrasCic = await prisma.category.upsert({
    where: { slug: 'ciclismo-licras' },
    update: {},
    create: { name: 'Licras', slug: 'ciclismo-licras', parentId: ciclismo.id, sortOrder: 2 },
  })

  const enterizos = await prisma.category.upsert({
    where: { slug: 'ciclismo-enterizos' },
    update: {},
    create: { name: 'Enterizos', slug: 'ciclismo-enterizos', parentId: ciclismo.id, sortOrder: 3 },
  })

  const chalecos = await prisma.category.upsert({
    where: { slug: 'ciclismo-chalecos' },
    update: {},
    create: { name: 'Chalecos', slug: 'ciclismo-chalecos', parentId: ciclismo.id, sortOrder: 4 },
  })

  console.log('  Categories created')

  // ─── SIZE ORDER MAP ───
  const SIZE_ORDER: Record<string, number> = {
    XS: 1, S: 2, M: 3, L: 4, XL: 5, XXL: 6,
  }

  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  const COLORS = [
    { name: 'Negro', hex: '#000000' },
    { name: 'Rojo', hex: '#DC2626' },
    { name: 'Azul', hex: '#2563EB' },
  ]

  // ─── Helper to create product with variants ───
  async function createProduct(data: {
    name: string
    slug: string
    categoryId: string
    priceCents: number
    costCents: number
    sport: 'CYCLING' | 'RUNNING' | 'TRIATHLON' | 'SWIMMING' | 'GENERAL'
    gender: 'MALE' | 'FEMALE' | 'UNISEX'
    skuPrefix: string
    material?: string
    sizes?: string[]
    colors?: Array<{ name: string; hex: string }>
  }): Promise<void> {
    const sizes = data.sizes ?? SIZES
    const colors = data.colors ?? COLORS

    const product = await prisma.product.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
        name: data.name,
        slug: data.slug,
        categoryId: data.categoryId,
        basePriceCents: data.priceCents,
        costPriceCents: data.costCents,
        sport: data.sport,
        gender: data.gender,
        materialInfo: data.material ?? 'Textil importado, proteccion UV, rapido secado',
        status: 'ACTIVE',
        featured: data.priceCents >= 3000000,
      },
    })

    for (const color of colors) {
      for (const size of sizes) {
        const sku = `${data.skuPrefix}-${color.name.substring(0, 3).toUpperCase()}-${size}`
        const stock = Math.floor(Math.random() * 8) + 2 // 2-9 units

        await prisma.productVariant.upsert({
          where: { sku },
          update: {},
          create: {
            productId: product.id,
            sku,
            color: color.name,
            colorHex: color.hex,
            size,
            sizeOrder: SIZE_ORDER[size] ?? 0,
            stockQuantity: stock,
            status: stock <= 3 ? 'LOW_STOCK' : 'AVAILABLE',
          },
        })
      }
    }
  }

  // ─── CICLISMO ───
  await createProduct({
    name: 'Jersey Giro PRO-01',
    slug: 'jersey-giro-pro-01',
    categoryId: jerseys.id,
    priceCents: 3000000, // ₡30,000
    costCents: 1500000,
    sport: 'CYCLING',
    gender: 'UNISEX',
    skuPrefix: 'CIC-JGP',
  })

  await createProduct({
    name: 'Licra Ciclismo Clasica',
    slug: 'licra-ciclismo-clasica',
    categoryId: licrasCic.id,
    priceCents: 2000000, // ₡20,000
    costCents: 1000000,
    sport: 'CYCLING',
    gender: 'UNISEX',
    skuPrefix: 'CIC-LCC',
  })

  await createProduct({
    name: 'Licra Ciclismo Premium',
    slug: 'licra-ciclismo-premium',
    categoryId: licrasCic.id,
    priceCents: 3000000, // ₡30,000
    costCents: 1500000,
    sport: 'CYCLING',
    gender: 'UNISEX',
    skuPrefix: 'CIC-LCP',
  })

  await createProduct({
    name: 'Enterizo Ciclismo Sprint',
    slug: 'enterizo-ciclismo-sprint',
    categoryId: enterizos.id,
    priceCents: 4200000, // ₡42,000
    costCents: 2100000,
    sport: 'CYCLING',
    gender: 'UNISEX',
    skuPrefix: 'CIC-ECS',
  })

  await createProduct({
    name: 'Enterizo Ciclismo Elite',
    slug: 'enterizo-ciclismo-elite',
    categoryId: enterizos.id,
    priceCents: 4800000, // ₡48,000
    costCents: 2400000,
    sport: 'CYCLING',
    gender: 'UNISEX',
    skuPrefix: 'CIC-ECE',
  })

  await createProduct({
    name: 'Chaleco Ciclismo Windbreaker',
    slug: 'chaleco-ciclismo-windbreaker',
    categoryId: chalecos.id,
    priceCents: 1800000, // ₡18,000
    costCents: 900000,
    sport: 'CYCLING',
    gender: 'UNISEX',
    skuPrefix: 'CIC-CHW',
  })

  // ─── RUNNING ───
  await createProduct({
    name: 'Camisa Running Dri-Fit',
    slug: 'camisa-running-dri-fit',
    categoryId: running.id,
    priceCents: 1200000, // ₡12,000
    costCents: 600000,
    sport: 'RUNNING',
    gender: 'UNISEX',
    skuPrefix: 'RUN-CDF',
  })

  await createProduct({
    name: 'Camisa Running Pro',
    slug: 'camisa-running-pro',
    categoryId: running.id,
    priceCents: 1300000, // ₡13,000
    costCents: 650000,
    sport: 'RUNNING',
    gender: 'UNISEX',
    skuPrefix: 'RUN-CRP',
  })

  await createProduct({
    name: 'Licra Flare Running',
    slug: 'licra-flare-running',
    categoryId: running.id,
    priceCents: 2300000, // ₡23,000
    costCents: 1150000,
    sport: 'RUNNING',
    gender: 'FEMALE',
    skuPrefix: 'RUN-LFR',
  })

  await createProduct({
    name: 'Pantaloneta Running',
    slug: 'pantaloneta-running',
    categoryId: running.id,
    priceCents: 1500000, // ₡15,000
    costCents: 750000,
    sport: 'RUNNING',
    gender: 'UNISEX',
    skuPrefix: 'RUN-PNR',
  })

  // ─── TOPS ───
  await createProduct({
    name: 'Crop Top Deportivo',
    slug: 'crop-top-deportivo',
    categoryId: tops.id,
    priceCents: 900000, // ₡9,000
    costCents: 450000,
    sport: 'GENERAL',
    gender: 'FEMALE',
    skuPrefix: 'TOP-CTD',
  })

  await createProduct({
    name: 'Blusa Deportiva',
    slug: 'blusa-deportiva',
    categoryId: tops.id,
    priceCents: 1200000, // ₡12,000
    costCents: 600000,
    sport: 'GENERAL',
    gender: 'FEMALE',
    skuPrefix: 'TOP-BLD',
  })

  await createProduct({
    name: 'Chaqueta Deportiva',
    slug: 'chaqueta-deportiva',
    categoryId: tops.id,
    priceCents: 1500000, // ₡15,000
    costCents: 750000,
    sport: 'GENERAL',
    gender: 'UNISEX',
    skuPrefix: 'TOP-CHD',
  })

  // ─── NATACION ───
  await createProduct({
    name: 'Vestido de Bano',
    slug: 'vestido-de-bano',
    categoryId: natacion.id,
    priceCents: 2800000, // ₡28,000
    costCents: 1400000,
    sport: 'SWIMMING',
    gender: 'FEMALE',
    skuPrefix: 'NAT-VDB',
  })

  await createProduct({
    name: 'Pantaloneta Natacion',
    slug: 'pantaloneta-natacion',
    categoryId: natacion.id,
    priceCents: 1800000, // ₡18,000
    costCents: 900000,
    sport: 'SWIMMING',
    gender: 'MALE',
    skuPrefix: 'NAT-PNT',
  })

  // ─── ACCESORIOS ───
  const accColors = [
    { name: 'Negro', hex: '#000000' },
    { name: 'Blanco', hex: '#FFFFFF' },
  ]

  await createProduct({
    name: 'Gorra V ONE B',
    slug: 'gorra-voneb',
    categoryId: accesorios.id,
    priceCents: 600000, // ₡6,000
    costCents: 300000,
    sport: 'GENERAL',
    gender: 'UNISEX',
    skuPrefix: 'ACC-GOR',
    sizes: ['S', 'M', 'L'],
    colors: accColors,
  })

  await createProduct({
    name: 'Guantes Ciclismo',
    slug: 'guantes-ciclismo',
    categoryId: accesorios.id,
    priceCents: 800000, // ₡8,000
    costCents: 400000,
    sport: 'CYCLING',
    gender: 'UNISEX',
    skuPrefix: 'ACC-GUA',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: accColors,
  })

  await createProduct({
    name: 'Medias Deportivas',
    slug: 'medias-deportivas',
    categoryId: accesorios.id,
    priceCents: 500000, // ₡5,000
    costCents: 250000,
    sport: 'GENERAL',
    gender: 'UNISEX',
    skuPrefix: 'ACC-MED',
    sizes: ['S', 'M', 'L'],
    colors: accColors,
  })

  await createProduct({
    name: 'Mangas UV',
    slug: 'mangas-uv',
    categoryId: accesorios.id,
    priceCents: 700000, // ₡7,000
    costCents: 350000,
    sport: 'CYCLING',
    gender: 'UNISEX',
    skuPrefix: 'ACC-MAN',
    sizes: ['S', 'M', 'L'],
    colors: accColors,
  })

  await createProduct({
    name: 'Sombrero Outdoor',
    slug: 'sombrero-outdoor',
    categoryId: accesorios.id,
    priceCents: 800000, // ₡8,000
    costCents: 400000,
    sport: 'GENERAL',
    gender: 'UNISEX',
    skuPrefix: 'ACC-SOM',
    sizes: ['S', 'M', 'L'],
    colors: accColors,
  })

  // ─── TRIATLON ───
  await createProduct({
    name: 'Enterizo Triatlon Pro',
    slug: 'enterizo-triatlon-pro',
    categoryId: triatlon.id,
    priceCents: 4500000, // ₡45,000
    costCents: 2250000,
    sport: 'TRIATHLON',
    gender: 'UNISEX',
    skuPrefix: 'TRI-ETP',
  })

  await createProduct({
    name: 'Enterizo Triatlon Elite',
    slug: 'enterizo-triatlon-elite',
    categoryId: triatlon.id,
    priceCents: 4800000, // ₡48,000
    costCents: 2400000,
    sport: 'TRIATHLON',
    gender: 'UNISEX',
    skuPrefix: 'TRI-ETE',
  })

  console.log('  Products and variants created')

  // ─── System Config ───
  const configs = [
    { key: 'store.name', value: 'V ONE B', description: 'Nombre de la tienda' },
    { key: 'store.phone', value: '+50600000000', description: 'Telefono WhatsApp Business' },
    { key: 'store.email', value: 'info@v-one-b.com', description: 'Email de contacto' },
    { key: 'shipping.correos_cr_price_cents', value: 250000, description: 'Costo envio Correos de CR en centavos (C2,500)' },
    { key: 'shipping.days_lunes_miercoles', value: true, description: 'Envios solo lunes y miercoles' },
    { key: 'shipping.estimated_days', value: '1-3', description: 'Dias habiles estimados de entrega' },
    { key: 'business.hours_start', value: '08:00', description: 'Hora de inicio de atencion' },
    { key: 'business.hours_end', value: '18:00', description: 'Hora de fin de atencion' },
    { key: 'business.timezone', value: 'America/Costa_Rica', description: 'Zona horaria' },
    { key: 'chatbot.welcome_message', value: 'Hola! Bienvenido/a a V ONE B, tu tienda de ropa deportiva.', description: 'Mensaje de bienvenida del chatbot' },
    { key: 'chatbot.outside_hours_message', value: 'Gracias por escribirnos. Nuestro horario de atencion es de 8am a 6pm. Te responderemos lo antes posible!', description: 'Mensaje fuera de horario' },
  ]

  for (const cfg of configs) {
    await prisma.systemConfig.upsert({
      where: { key: cfg.key },
      update: {},
      create: {
        key: cfg.key,
        value: cfg.value,
        description: cfg.description,
        updatedById: admin.id,
      },
    })
  }

  console.log('  System config created')

  // ─── Inventory Locations ───
  const localLocation = await prisma.inventoryLocation.upsert({
    where: { slug: 'local' },
    update: {},
    create: {
      name: 'Tienda Local V ONE B',
      slug: 'local',
      type: 'LOCAL',
      address: 'San Jose, Costa Rica',
      isDefault: true,
      isActive: true,
    },
  })

  const shopifyLocation = await prisma.inventoryLocation.upsert({
    where: { slug: 'shopify' },
    update: {},
    create: {
      name: 'Shopify Online',
      slug: 'shopify',
      type: 'SHOPIFY',
      isDefault: false,
      isActive: true,
    },
  })

  console.log(`  Locations created: ${localLocation.slug}, ${shopifyLocation.slug}`)

  // ─── Migrate existing stock to LocationStock (local) ───
  const allVariants = await prisma.productVariant.findMany({
    where: { stockQuantity: { gt: 0 } },
    select: { id: true, stockQuantity: true, minStockThreshold: true },
  })

  for (const variant of allVariants) {
    await prisma.locationStock.upsert({
      where: {
        variantId_locationId: {
          variantId: variant.id,
          locationId: localLocation.id,
        },
      },
      update: {},
      create: {
        variantId: variant.id,
        locationId: localLocation.id,
        quantity: variant.stockQuantity,
        minThreshold: variant.minStockThreshold,
      },
    })
  }

  console.log(`  Migrated ${allVariants.length} variant stocks to local location`)
  console.log('Seeding complete!')
}

main()
  .catch((e: unknown) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
