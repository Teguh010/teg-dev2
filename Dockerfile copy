# syntax=docker/dockerfile:labs

# ===========================================================
# Base image
# ===========================================================
FROM node:24-alpine AS base

WORKDIR /app

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXTJS_IGNORE_ESLINT=1 \
    NODE_ENV=production

# For native dependencies
RUN apk add --no-cache libc6-compat curl


# ===========================================================
# Dependencies layer (cached)
# ===========================================================
FROM base AS deps

# Copy only package files for caching
COPY package.json package-lock.json ./

# Use cache mount for npm
RUN --mount=type=cache,target=/root/.npm \
    echo "📦 Installing dependencies..." && \
    npm ci --legacy-peer-deps --loglevel=error --no-fund && \
    echo "✅ Dependencies installed."


# ===========================================================
# Build layer
# ===========================================================
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN --mount=type=cache,target=/root/.npm \
    echo "🚀 Building Next.js app..." && \
    npm run build && \
    echo "✅ Build completed."


# ===========================================================
# Runtime layer
# ===========================================================
FROM node:24-alpine AS runner
WORKDIR /app

# Environment
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# For Coolify healthchecks
RUN apk add --no-cache curl

# Install PM2 + logrotate
RUN npm install -g pm2 pm2-logrotate && pm2 update

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/pm2.config.js ./pm2.config.js

# Add non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs

# Expose port
EXPOSE 3000

# Start the app
CMD ["pm2-runtime", "start", "pm2.config.js"]
