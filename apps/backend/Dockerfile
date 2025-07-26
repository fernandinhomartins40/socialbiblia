# Multi-stage Dockerfile for SocialBiblia Backend

# ==========================================
# Base stage - Common dependencies
# ==========================================
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    curl \
    tini

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs --ingroup nodejs

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# ==========================================
# Dependencies stage - Install all deps
# ==========================================
FROM base AS deps

# Install dependencies
RUN npm ci --only=production --silent && \
    npm cache clean --force

# ==========================================
# Development stage
# ==========================================
FROM base AS development

# Install all dependencies (including dev)
RUN npm ci --silent

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create uploads directory
RUN mkdir -p uploads && chown -R nextjs:nodejs uploads

# Expose port
EXPOSE 3001

# Use tini as init system
ENTRYPOINT ["/sbin/tini", "--"]

# Development command
CMD ["npm", "run", "dev"]

# ==========================================
# Build stage - Compile TypeScript
# ==========================================
FROM base AS builder

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# ==========================================
# Production stage - Final optimized image
# ==========================================
FROM base AS production

# Set production environment
ENV NODE_ENV=production

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Copy additional runtime files
COPY --from=builder /app/public ./public

# Create necessary directories
RUN mkdir -p uploads logs && \
    chown -R nextjs:nodejs uploads logs

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Expose port
EXPOSE 3001

# Use tini as init system
ENTRYPOINT ["/sbin/tini", "--"]

# Production command
CMD ["npm", "run", "start:prod"]

# ==========================================
# Migration stage - For database migrations
# ==========================================
FROM base AS migration

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy Prisma files
COPY prisma ./prisma/
COPY package*.json ./

# Generate Prisma client
RUN npx prisma generate

# Switch to non-root user
USER nextjs

# Migration command
CMD ["npx", "prisma", "migrate", "deploy"]
