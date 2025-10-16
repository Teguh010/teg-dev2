# syntax=docker/dockerfile:1

FROM node:24-alpine AS base

# No need to install npm separately - Node 24 comes with npm ~10.8.x

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm install --legacy-peer-deps --loglevel=error --no-fund; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects anonymous telemetry data about general usage.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXTJS_IGNORE_ESLINT=1

# Debug: List files to verify content
RUN ls -la

# Debug: Check next.config.js content
RUN if [ -f next.config.js ]; then cat next.config.js; fi

# Try to build with more verbose output
RUN \
  if [ -f package-lock.json ]; then NEXTJS_IGNORE_ESLINT=1 npm run build || (echo "Build failed" && NEXTJS_IGNORE_ESLINT=1 npm run build --verbose); \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# For Coolify health checks
RUN apk add --no-cache curl

# Setup PM2
RUN npm install -g pm2
RUN pm2 install pm2-logrotate
RUN pm2 update

# Copy necessary files for running the application
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy the built app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/pm2.config.js ./pm2.config.js

# Only set permissions for .next/cache
RUN mkdir -p .next/cache/images && chown -R nextjs:nodejs .next/cache

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the server
#CMD ["npm", "start"]
CMD sh -c "pm2 ping && pm2-runtime start pm2.config.js"
