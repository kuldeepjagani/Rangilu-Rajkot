#!/bin/sh
# =============================================================================
# Docker Entrypoint Script for Rangilu-Rajkot Backend
# =============================================================================
# This script runs before the main container command. It handles:
# - Database migrations
# - Prisma client generation
# - Health checks
# - Signal handling
# =============================================================================

set -e

echo "========================================"
echo "🚀 Rangilu-Rajkot Startup Script"
echo "========================================"

# =============================================================================
# Environment Validation
# =============================================================================
echo "📋 Validating environment..."

required_vars="DATABASE_URL JWT_ACCESS_SECRET JWT_REFRESH_SECRET"
missing_vars=""

for var in $required_vars; do
    if [ -z "$(eval echo \$$var)" ]; then
        missing_vars="$missing_vars $var"
    fi
done

if [ -n "$missing_vars" ]; then
    echo "❌ Missing required environment variables:$missing_vars"
    exit 1
fi

echo "✅ Environment validated"

# =============================================================================
# Wait for Database
# =============================================================================
echo "⏳ Waiting for database..."

max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if nc -z postgres 5432 2>/dev/null; then
        echo "✅ Database is ready"
        break
    fi
    attempt=$((attempt + 1))
    echo "   Attempt $attempt/$max_attempts..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Database connection timeout"
    exit 1
fi

# =============================================================================
# Database Migrations
# =============================================================================
echo "🔄 Running database migrations..."

if [ "$NODE_ENV" = "production" ]; then
    npx prisma migrate deploy
else
    npx prisma migrate dev --skip-generate
fi

echo "✅ Migrations complete"

# =============================================================================
# Seed Database (Development Only)
# =============================================================================
if [ "$NODE_ENV" = "development" ] && [ "$SEED_DATABASE" = "true" ]; then
    echo "🌱 Seeding database..."
    npx prisma db seed || echo "⚠️ Seeding failed or skipped"
fi

# =============================================================================
# Start Application
# =============================================================================
echo "========================================"
echo "🎯 Starting application..."
echo "========================================"

# Execute the main command (passed as arguments)
exec "$@"
