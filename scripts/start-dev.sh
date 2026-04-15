#!/bin/bash
# =============================================================================
# Development Startup Script for Linux/Mac
# =============================================================================
# Usage: ./scripts/start-dev.sh [options]
# Options:
#   -b, --build     Force rebuild containers
#   -d, --detach    Run in detached mode
#   -l, --logs      Show logs after starting (detached mode only)
#   -c, --clean     Clean up before starting
#   -h, --help      Show help
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Parse arguments
BUILD=false
DETACH=false
LOGS=false
CLEAN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--build)
            BUILD=true
            shift
            ;;
        -d|--detach)
            DETACH=true
            shift
            ;;
        -l|--logs)
            LOGS=true
            shift
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -b, --build     Force rebuild containers"
            echo "  -d, --detach    Run in detached mode"
            echo "  -l, --logs      Show logs after starting (detached mode only)"
            echo "  -c, --clean     Clean up containers and volumes before starting"
            echo "  -h, --help      Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}🚀 Rangilu-Rajkot Development Starter${NC}"
echo -e "${CYAN}========================================${NC}"

# Check if Docker is running
if ! docker info &>/dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Check for .env file
if [ ! -f "../.env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    if [ -f "../.env.docker" ]; then
        cp "../.env.docker" "../.env"
        echo -e "${YELLOW}📝 Created .env file. Please edit it with your configuration.${NC}"
        echo -e "${GRAY}   File location: $(cd .. && pwd)/.env${NC}"
        exit 1
    else
        echo -e "${RED}❌ .env.docker template not found!${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Environment file found${NC}"

# Clean up if requested
if [ "$CLEAN" = true ]; then
    echo -e "${YELLOW}🧹 Cleaning up containers and volumes...${NC}"
    (cd .. && docker-compose down -v --rmi local --remove-orphans) || true
    echo -e "${GREEN}✅ Cleanup completed${NC}"
fi

# Build argument
COMPOSE_ARGS="up"
if [ "$BUILD" = true ]; then
    COMPOSE_ARGS="up --build"
fi

if [ "$DETACH" = true ]; then
    COMPOSE_ARGS="$COMPOSE_ARGS -d"
    echo -e "${CYAN}🚀 Starting containers in detached mode...${NC}"
else
    echo -e "${CYAN}🚀 Starting containers (Press Ctrl+C to stop)...${NC}"
fi

echo -e "${GRAY}   Command: docker-compose $COMPOSE_ARGS${NC}"

# Start Docker Compose (docker-compose.yml is in current directory)
# shellcheck disable=SC2086
docker-compose $COMPOSE_ARGS

if [ "$DETACH" = true ]; then
    echo ""
    echo -e "${GREEN}✅ Containers started successfully!${NC}"
    echo ""
    echo -e "${CYAN}📋 Available commands:${NC}"
    echo -e "${GRAY}   View logs:    docker-compose logs -f${NC}"
    echo -e "${GRAY}   Stop:         docker-compose down${NC}"
    echo -e "${GRAY}   Restart:      docker-compose restart${NC}"
    echo ""
    echo -e "${CYAN}🌐 Application URLs:${NC}"
    echo -e "${GRAY}   API:          http://localhost:5000${NC}"
    echo -e "${GRAY}   Health:       http://localhost:5000/health${NC}"
    echo -e "${GRAY}   API Health:   http://localhost:5000/api/health${NC}"

    if [ "$LOGS" = true ]; then
        docker-compose logs -f
    fi
fi
