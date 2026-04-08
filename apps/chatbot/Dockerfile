# ── Stage 1: Dependencies ──────────────────────
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/chatbot/package.json apps/chatbot/
COPY packages/database/package.json packages/database/
COPY packages/shared/package.json packages/shared/
COPY packages/crm-client/package.json packages/crm-client/
COPY packages/notifications/package.json packages/notifications/

RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ─────────────────────────────
FROM node:20-alpine AS build

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/chatbot/node_modules ./apps/chatbot/node_modules
COPY --from=deps /app/packages ./packages

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.json ./
COPY apps/chatbot/ apps/chatbot/
COPY packages/ packages/

RUN pnpm --filter @voneb/database prisma generate
RUN pnpm --filter @voneb/chatbot build

# ── Stage 3: Production ───────────────────────
FROM node:20-alpine AS production

RUN addgroup -g 1001 -S voneb && \
    adduser -S voneb -u 1001 -G voneb

WORKDIR /app

COPY --from=build --chown=voneb:voneb /app/apps/chatbot/dist ./dist
COPY --from=build --chown=voneb:voneb /app/apps/chatbot/package.json ./
COPY --from=build --chown=voneb:voneb /app/node_modules ./node_modules
COPY --from=build --chown=voneb:voneb /app/packages/database/prisma ./prisma
COPY --from=build --chown=voneb:voneb /app/packages/database/node_modules/.prisma ./node_modules/.prisma

ENV NODE_ENV=production

USER voneb

CMD ["node", "dist/index.js"]
