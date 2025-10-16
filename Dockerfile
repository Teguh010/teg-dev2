# syntax=docker/dockerfile:labs

# ===========================================================
# Base image
# ===========================================================
FROM node:24-alpine AS base

WORKDIR /app

# Disable telemetry & optimize env
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXTJS_IGNORE_ESLINT=1 \
    NODE_ENV=production

# For native dependencies and curl (used by Coolify)
RUN apk add --no-cache libc6-compat curl


# ===========================================================
# Dependencies layer (cached)
# ===========================================================
FROM base AS deps

# Copy only package files for better caching
COPY package.json package-lock.json ./

# Use cache mount for npm install
RUN --mount=type=cache,target=/root/.npm \
    start_time=$(date +%s) && \
    echo "📦 Installing dependencies..." && \
    npm ci --legacy-peer-deps --loglevel=error --no-fund && \
    end_time=$(date +%s) && \
    duration=$((end_time - start_time)) && \
    echo "✅ Dependencies installed in $((duration / 60))m $((duration % 60))s."


# ===========================================================
# Build layer
# ===========================================================
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps (cached)
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Cache both npm and .next/cache for faster rebuilds
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=.next/cache \
    start_time=$(date +%s) && \
    echo "🚀 Starting Next.js build at $(date)" && \
    npm run build --no-lint || (echo "❌ Build failed!" && exit 1) && \
    end_time=$(date +%s) && \
    duration=$((end_time - start_time)) && \
    echo "✅ Build completed in $((duration / 60))m $((duration % 60))s."


# ===========================================================
# Runtime layer (production only)
# ===========================================================
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# For Coolify healthchecks
RUN apk add --no-cache curl

# Install PM2 + logrotate
RUN npm install -g pm2 pm2-logrotate && pm2 update

# Copy necessary build files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/pm2.config.js ./pm2.config.js

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs

# Expose port
EXPOSE 3000

# Start app
CMD ["pm2-runtime", "start", "pm2.config.js"]
