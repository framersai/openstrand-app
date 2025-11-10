# Frontend Dockerfile
FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
USER root
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm install --ignore-scripts

# Development image
FROM base AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Production build
FROM base AS builder
WORKDIR /app
USER root
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Ensure public directory exists and has write permissions for sitemap generation
RUN mkdir -p public && chmod 755 public
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

USER root
RUN addgroup --system --gid 1001 nodejs || true
RUN adduser --system --uid 1001 nextjs || true

COPY --from=builder /app/public ./public
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/package*.json ./

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["npm", "run", "start"]
