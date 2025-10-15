# syntax=docker/dockerfile:1

FROM node:24-alpine AS base

# No need to install npm separately - Node 24 comes with npm ~10.8.x

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
# Using BuildKit cache mount for npm cache to speed up installs
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
  if [ -f package-lock.json ]; then \
    npm ci --legacy-peer-deps --loglevel=error --no-fund --prefer-offline; \
  else \
    echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy only necessary files for build (package.json first for better caching)
COPY package.json package-lock.json* ./
COPY next.config.js ./
COPY tsconfig.json ./
COPY jsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Copy source files
COPY app ./app
COPY components ./components
COPY config ./config
COPY context ./context
COPY hooks ./hooks
COPY lib ./lib
COPY middleware ./middleware
COPY middleware.ts ./
COPY models ./models
COPY pages ./pages
COPY provider ./provider
COPY public ./public
COPY redux ./redux
COPY store ./store
COPY types ./types
COPY locales ./locales
COPY global.d.ts ./
COPY next-env.d.ts ./
COPY pm2.config.js ./
COPY leaflet-routing-machine.d.ts ./

# Environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXTJS_IGNORE_ESLINT=1
ENV NODE_ENV=production

# Debug: List files to verify content
RUN ls -la

# Debug: Check next.config.js content
RUN if [ -f next.config.js ]; then cat next.config.js; fi

# Build Next.js application with cache mount for faster rebuilds
RUN --mount=type=cache,target=/app/.next/cache \
  npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create user and group for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Install runtime dependencies
RUN apk add --no-cache curl && \
    npm install -g pm2 && \
    pm2 install pm2-logrotate && \
    pm2 update

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/pm2.config.js ./pm2.config.js

# Setup cache directory with proper permissions
RUN mkdir -p .next/cache/images && \
    chown -R nextjs:nodejs .next/cache

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application with PM2
CMD ["sh", "-c", "pm2 ping && pm2-runtime start pm2.config.js"]
