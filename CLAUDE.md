# V ONE B — Sistema Integral

## Stack Tecnológico
- Runtime: Node.js 20+ con TypeScript 5.x (strict mode)
- Framework API: Fastify 5.x (NO Express — Fastify es más rápido y tipado)
- ORM: Prisma 6.x con PostgreSQL 16
- Validación: Zod en todos los endpoints y servicios
- Auth: JWT con refresh tokens, bcrypt para passwords
- WhatsApp: WhatsApp Cloud API (producción) + Baileys (desarrollo)
- CRM: Pipeline CRM REST API
- Queue: BullMQ con Redis para jobs async y notificaciones
- Testing: Vitest + Supertest
- Linting: Biome (reemplaza ESLint + Prettier, más rápido)
- Monorepo: Turborepo con pnpm workspaces
- Containers: Docker + docker-compose
- Logging: Pino (JSON structured logging)

## Convenciones de Código
- Nombres de archivos: kebab-case (user-service.ts, create-order.dto.ts)
- Clases/Interfaces: PascalCase
- Variables/funciones: camelCase
- Constantes: UPPER_SNAKE_CASE
- Schemas Zod: nombre + Schema suffix (CreateOrderSchema, UpdateProductSchema)
- Prisma models: PascalCase singular (Product, OrderItem)
- API routes: kebab-case plural (/api/products, /api/order-items)
- Errores: clases custom que extienden AppError base
- Siempre usar tipos explícitos, nunca 'any'
- Archivos máximo 300 líneas; si crece, dividir
- Un servicio por entidad de dominio
- Toda lógica de negocio en services/, nunca en routes/
- Handlers de ruta solo: validar → llamar servicio → responder
- Variables de entorno validadas con Zod al arrancar la app
- Precios siempre en centavos (integer) para evitar decimales: ₡30,000 = 3000000

## Estructura del Proyecto
```
voneb/
├── apps/
│   ├── api/           # Backend API principal (Fastify)
│   ├── chatbot/       # Servicio del bot de WhatsApp
│   └── admin/         # Panel de administración (React)
├── packages/
│   ├── database/      # Prisma schema, migraciones, seeds
│   ├── shared/        # Tipos, utilidades, constantes compartidas
│   ├── crm-client/    # Wrapper de Pipeline CRM API
│   └── notifications/ # Servicio de notificaciones multi-canal
├── docker/
├── scripts/
├── turbo.json
├── package.json
├── docker-compose.yml
└── .env.example
```

## Seguridad (CRITICO)
- NUNCA hardcodear secretos en código
- Validar TODA entrada de usuario con Zod
- Rate limiting en todos los endpoints públicos
- Sanitizar outputs para prevenir XSS
- Usar parameterized queries (Prisma lo hace por defecto)
- CORS estricto: solo dominios permitidos
- Helmet headers en todas las respuestas
- JWT con expiración corta (15min) + refresh token (7d)
- Passwords: bcrypt con salt rounds 12
- Logs: NUNCA loggear tokens, passwords, o datos sensibles
