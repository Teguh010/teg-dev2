# syntax=docker/dockerfile:1.7

# ===========================================================
# Base image
# ===========================================================
FROM node:24-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    NEXTJS_IGNORE_ESLINT=1

# ===========================================================
# Dependencies (cached)
# ===========================================================
FROM base AS deps
RUN apk add --no-cache libc6-compat

COPY package*.json ./

# 🧠 Cache npm folder agar install jauh lebih cepat
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then \
        echo "📦 Installing dependencies with cache..." && \
        npm ci --legacy-peer-deps --loglevel=error --no-fund; \
    else \
        echo "❌ Lockfile not found." && exit 1; \
    fi

# ===========================================================
# Build (cached)
# ===========================================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Debug opsional (bisa dihapus nanti)
RUN ls -la && if [ -f next.config.js ]; then cat next.config.js; fi

# 🧱 Build step with cache
RUN --mount=type=cache,target=/root/.npm \
    echo "🚀 Building Next.js..." && \
    npm run build || (echo "❌ Build failed!" && npm run build --verbose)

# ===========================================================
# Runtime (minimal + PM2)
# ===========================================================
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN apk add --no-cache curl

# PM2 setup
RUN npm install -g pm2@latest pm2-logrotate && pm2 update

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/pm2.config.js ./pm2.config.js

# Add non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs

# Healthcheck & ports
EXPOSE 3000
CMD ["pm2-runtime", "start", "pm2.config.js"]
