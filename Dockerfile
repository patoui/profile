# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Native build tools required for bcrypt
RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Workspace manifests – copied first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma.config.ts ./
COPY prisma/ ./prisma/
COPY src/backend/package.json ./src/backend/
COPY src/frontend/package.json ./src/frontend/

RUN pnpm install --frozen-lockfile

# Source files
COPY src/ ./src/
COPY public/ ./public/

# Emit the Prisma contract for the linux/alpine target
RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/profile" pnpm run contract:emit

# Build frontend (→ public/dist/) and backend (tsc → src/backend/dist/)
RUN pnpm run build


# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:22-alpine AS production

# Native build tools required for bcrypt postinstall scripts
RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY src/backend/package.json ./src/backend/
COPY src/frontend/package.json ./src/frontend/

# Production deps only (pnpm recompiles native modules for the linux/alpine target)
RUN pnpm install --frozen-lockfile --prod

# Prisma schema + migrations (available for runtime migration runs)
COPY prisma/ ./prisma/

# Compiled backend JS
COPY --from=builder /app/src/backend/dist ./src/backend/dist

# EJS view templates (used at runtime, not compiled)
COPY --from=builder /app/src/backend/views ./src/backend/views

# Static assets: original images + compiled CSS/JS bundles
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/backend/dist/index.js"]
