# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat curl

# ===========================================================
# Dependencies (cached layer)
# ===========================================================
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --loglevel=error --no-fund

# ===========================================================
# Build layer
# ===========================================================
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ===========================================================
# Runtime
# ===========================================================
FROM base AS runner
WORKDIR /app

RUN npm install -g pm2 pm2-logrotate && pm2 update
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/pm2.config.js ./pm2.config.js

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
CMD ["pm2-runtime", "start", "pm2.config.js"]
