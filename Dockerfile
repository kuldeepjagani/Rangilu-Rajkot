# =============================================================================
# Production-grade Multi-stage Dockerfile for Rangilu-Rajkot Backend
# =============================================================================
# Stage 1: Dependencies - Install dependencies (cached layer)
# =============================================================================
FROM node:20-alpine AS dependencies

# Install security updates and required packages (libssl3 and openssl needed for Prisma)
RUN apk update && \
    apk add --no-cache dumb-init libssl3 openssl && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
# Note: Using npm install instead of npm ci because package-lock.json doesn't exist
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# =============================================================================
# Stage 2: Builder - Compile TypeScript
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package*.json ./
COPY --from=dependencies /app/prisma ./prisma

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# =============================================================================
# Stage 3: Production - Final optimized image
# =============================================================================
FROM node:20-alpine AS production

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Install security updates (libssl3 and openssl needed for Prisma)
RUN apk update && \
    apk add --no-cache dumb-init libssl3 openssl && \
    rm -rf /var/cache/apk/*

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs --from=dependencies /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs --from=builder /app/dist ./dist
COPY --chown=nodejs:nodejs --from=builder /app/prisma ./prisma

# Clean cache to reduce image size
RUN npm cache clean --force && \
    rm -rf /tmp/* /var/cache/apk/*

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"]

# =============================================================================
# Stage 4: Development - For local development with hot-reload
# =============================================================================
FROM dependencies AS development

WORKDIR /app

# Copy all source code (mounted as volume in docker-compose)
COPY . .

# Expose port for development
EXPOSE 5000

# Use ts-node-dev for hot-reload
CMD ["npm", "run", "dev"]
