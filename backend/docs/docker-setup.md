# Docker Setup Guide for Rangilu-Rajkot

> **Production-grade Docker configuration** for seamless local development and scalable production deployment.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Project Structure](#project-structure)
4. [Environment Configuration](#environment-configuration)
5. [Development Workflow](#development-workflow)
6. [Production Deployment](#production-deployment)
7. [Service Architecture](#service-architecture)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Prerequisites

Before starting, ensure you have the following installed:

| Tool | Minimum Version | Installation |
|------|-----------------|--------------|
| **Docker** | 20.10+ | [Install Docker](https://docs.docker.com/get-docker/) |
| **Docker Compose** | 2.0+ | Included with Docker Desktop |
| **Git** | 2.30+ | [Install Git](https://git-scm.com/downloads) |

### Verify Installation

```bash
# Check Docker version
docker --version
# Expected: Docker version 20.10.x or higher

# Check Docker Compose version
docker compose version
# Expected: Docker Compose version v2.x.x

# Check Docker is running
docker info
```

---

## Quick Start

Get the entire stack running with **one command**:

```bash
# Clone the repository
git clone <repository-url>
cd Rangilu-Rajkot/backend

# Copy environment file
cp .env.docker .env

# Edit .env with your configuration (see Environment Configuration below)
nano .env  # or use your preferred editor

# Start all services (builds images automatically)
docker-compose up --build

# The application will be available at:
# - API: http://localhost:5000
# - Database: localhost:5432
```

### Verify Everything is Running

```bash
# Check running containers
docker ps

# View logs
docker-compose logs -f

# Test the API
curl http://localhost:5000/health
```

---

## Project Structure

```
Rangilu-Rajkot/
└── backend/                    # All Docker files are in backend folder
    ├── docker-compose.yml      # Main orchestration file
    ├── docker-compose.override.yml  # Development overrides
    ├── Dockerfile              # Multi-stage Docker build
    ├── .dockerignore           # Excludes files from Docker context
    ├── .env.docker             # Environment template
    ├── docs/
    │   └── docker-setup.md     # This documentation
    ├── src/
    ├── prisma/
    └── ...
```

> **Note:** All Docker-related files and commands should be run from the `backend/` directory.

---

## Environment Configuration

### Step 1: Create Environment File

```bash
cp .env.docker .env
```

### Step 2: Configure Required Variables

Edit `.env` and update the following values:

```bash
# ============================================
# CRITICAL: Database Security
# ============================================
DB_PASSWORD=your_secure_password_here

# ============================================
# CRITICAL: JWT Secrets (Generate strong secrets)
# ============================================
JWT_ACCESS_SECRET=your_random_32_char_secret_here
JWT_REFRESH_SECRET=another_random_32_char_secret_here

# ============================================
# CRITICAL: AWS S3 (Required for image uploads)
# ============================================
AWS_BUCKET_NAME=your_actual_bucket_name
AWS_ACCESS_KEY_ID=your_actual_access_key
AWS_SECRET_ACCESS_KEY=your_actual_secret_key
```

### Generating Secure JWT Secrets

```bash
# Generate secure random secrets
openssl rand -base64 32
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Development Workflow

### Start Development Environment

```bash
# Start with hot-reload (development target)
docker-compose up --build

# Run in detached mode (background)
docker-compose up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Hot Reload

The development configuration includes automatic hot-reload:
- Changes to `.ts` files trigger automatic restart
- Prisma schema changes require container restart
- Upload files persist in named volume

### Common Development Commands

```bash
# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Open Prisma Studio (database GUI)
docker-compose exec backend npx prisma studio

# Seed the database
docker-compose exec backend npx prisma db seed

# Access PostgreSQL CLI
docker-compose exec postgres psql -U postgres -d rangilu_rajkot

# Execute arbitrary commands
docker-compose exec backend npm run build
docker-compose exec backend node -e "console.log('Hello')"
```

### Stop and Clean Up

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ DELETES ALL DATA)
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Complete cleanup (images + volumes + orphaned containers)
docker-compose down -v --rmi all --remove-orphans
```

---

## Production Deployment

### Building Production Image

```bash
# Build production target explicitly
docker-compose -f docker-compose.yml build --no-cache

# Or build with docker
docker build --target production -t rangilu-backend:latest ./backend
```

### Production Environment Variables

```bash
# Set production mode
export NODE_ENV=production
export DOCKER_TARGET=production

# Copy and configure production env
cp .env.docker .env.production
# Edit .env.production with production values
```

### Running in Production

```bash
# Use production compose only (no override)
docker-compose -f docker-compose.yml up -d

# With explicit env file
docker-compose --env-file .env.production -f docker-compose.yml up -d
```

### Production Checklist

- [ ] Use strong, unique database password
- [ ] Generate cryptographically secure JWT secrets
- [ ] Configure AWS S3 credentials
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL at reverse proxy
- [ ] Configure log aggregation (e.g., CloudWatch, Datadog)
- [ ] Set up monitoring and alerts
- [ ] Use external database for production (RDS, Cloud SQL)

---

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Network                          │
│                    (rangilu-network)                       │
│                                                             │
│  ┌─────────────────────┐      ┌──────────────────────┐   │
│  │   Backend (Node.js) │      │   PostgreSQL         │   │
│  │   - Port: 5000      │◄────►│   - Port: 5432       │   │
│  │   - Hot reload      │      │   - Persistent data  │   │
│  │   - Health checks   │      │   - Health checks    │   │
│  └─────────────────────┘      └──────────────────────┘   │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────────┐                                   │
│  │   Named Volumes     │                                   │
│  │   - postgres_data   │                                   │
│  │   - uploads_data    │                                   │
│  └─────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
```

### Service Details

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `backend` | Node.js 20 Alpine | 5000 | API server with hot-reload |
| `postgres` | PostgreSQL 16 Alpine | 5432 | Primary database |

---

## Troubleshooting

### Container Won't Start

```bash
# Check container status
docker ps -a
docker-compose ps

# View detailed logs
docker-compose logs --tail=100 backend

# Check for port conflicts
netstat -tuln | grep 5000
lsof -i :5000
```

### Database Connection Issues

```bash
# Test database connectivity
docker-compose exec backend sh -c "nc -z postgres 5432 && echo 'Connected' || echo 'Failed'"

# Check database logs
docker-compose logs postgres

# Reset database (⚠️ DELETES ALL DATA)
docker-compose down -v
docker-compose up --build
```

### Hot Reload Not Working

```bash
# Ensure development target is used
docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build

# Check file permissions
ls -la backend/src/

# Restart with verbose logging
docker-compose up --build --verbose
```

### Permission Denied Errors

```bash
# Fix volume permissions (Linux/Mac)
sudo chown -R $USER:$USER backend/uploads

# Or reset volumes
docker-compose down -v
docker-compose up --build
```

### Build Cache Issues

```bash
# Build without cache
docker-compose build --no-cache

# Clean all Docker cache
docker system prune -a --volumes

# Remove specific images
docker rmi rangilu-rajkot-backend
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `EACCES: permission denied` | Volume permissions | `docker-compose down -v` and rebuild |
| `ECONNREFUSED` on DB | PostgreSQL not ready | Wait for healthcheck, check logs |
| `Cannot find module` | node_modules issue | Rebuild: `docker-compose build --no-cache` |
| `Port already in use` | Port conflict | Change `PORT` in .env or kill process |
| `JWT_SECRET not set` | Missing env vars | Check .env file exists and is populated |

---

## Best Practices

### Security

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use strong passwords** - Minimum 16 characters for DB
3. **Rotate secrets regularly** - Especially JWT and AWS keys
4. **Run containers as non-root** - Already configured in Dockerfile
5. **Use secrets management** - For production, use Docker Swarm secrets or external vault

### Performance

1. **Layer caching** - Dependencies copied before source code
2. **Multi-stage builds** - Smaller production images
3. **Alpine base images** - Reduced attack surface and size
4. **Health checks** - Automatic container recovery
5. **Named volumes** - Data persists across container restarts

### Maintenance

```bash
# Update images regularly
docker-compose pull
docker-compose up -d

# Monitor disk usage
docker system df -v

# Clean up unused resources
docker system prune

# Backup database
docker-compose exec postgres pg_dump -U postgres rangilu_rajkot > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres -d rangilu_rajkot < backup.sql
```

---

## Advanced Configuration

### Custom Ports

Edit `.env`:
```bash
PORT=8080          # Change backend port
DB_PORT=5433       # Change database port (external)
```

### Multiple Environments

```bash
# Development
docker-compose up --build

# Staging
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d

# Production
docker-compose -f docker-compose.yml up -d
```

### Debugging

```bash
# Attach debugger (VS Code)
# 1. Ensure port 9229 is mapped in docker-compose.override.yml
# 2. Use VS Code "Attach to Node.js" configuration

# Interactive shell in container
docker-compose exec backend sh

# Run Node.js REPL
docker-compose exec backend node
```

---

## Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) section
2. Review container logs: `docker-compose logs -f`
3. Open an issue in the repository

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024 | Initial Docker setup with multi-stage builds |

---

**Maintained by:** Senior Development Team  
**Last Updated:** 2024
