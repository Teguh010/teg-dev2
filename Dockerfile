# syntax=docker/dockerfile:1.4

FROM node:24-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    NEXTJS_IGNORE_ESLINT=1

# ===========================================================
# 1️⃣ Dependencies layer — cached with npm cache mount
# ===========================================================
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    start_time=$(date +%s) && \
    echo "📦 Installing dependencies..." && \
    npm ci --legacy-peer-deps --loglevel=error --no-fund && \
    end_time=$(date +%s) && \
    duration=$((end_time - start_time)) && \
    echo "✅ Dependencies installed in $((duration / 60))m $((duration % 60))s"

# ===========================================================
# 2️⃣ Build layer — cached + build timer
# ===========================================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN --mount=type=cache,target=/root/.npm \
    start_time=$(date +%s) && \
    echo "🚀 Starting Next.js build at $(date)" && \
    npm run build || (echo "❌ Build failed!" && exit 1) && \
    end_time=$(date +%s) && \
    duration=$((end_time - start_time)) && \
    echo "✅ Build completed in $((duration / 60))m $((duration % 60))s"

# ===========================================================
# 3️⃣ Runtime layer — minimal, fast boot
# ===========================================================
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Add curl for Coolify healthchecks
RUN apk add --no-cache curl

# Install PM2 once
RUN npm install -g pm2@latest pm2-logrotate && pm2 update

# Copy only what’s needed
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/pm2.config.js ./pm2.config.js

# Add non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs

EXPOSE 3000
CMD ["pm2-runtime", "start", "pm2.config.js"]
