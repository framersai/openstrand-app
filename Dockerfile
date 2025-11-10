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

# Accept build args for environment variables
ARG NEXT_PUBLIC_API_URL=https://api.openstrand.ai/api/v1
ARG NEXT_PUBLIC_APP_VARIANT=teams
ARG NEXT_PUBLIC_OFFLINE_MODE=false
ARG NEXT_PUBLIC_API_DOCS_URL
ARG NEXT_PUBLIC_SDK_DOCS_URL

# Set environment variables for the build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_VARIANT=$NEXT_PUBLIC_APP_VARIANT
ENV NEXT_PUBLIC_OFFLINE_MODE=$NEXT_PUBLIC_OFFLINE_MODE
ENV NEXT_PUBLIC_API_DOCS_URL=$NEXT_PUBLIC_API_DOCS_URL
ENV NEXT_PUBLIC_SDK_DOCS_URL=$NEXT_PUBLIC_SDK_DOCS_URL

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
