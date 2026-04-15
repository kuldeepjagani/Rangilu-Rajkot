# =============================================================================
# Development Startup Script for Windows (PowerShell)
# =============================================================================
# Usage: .\scripts\start-dev.ps1
# =============================================================================

param(
    [switch]$Build,
    [switch]$Detach,
    [switch]$Logs,
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Rangilu-Rajkot Development Starter" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if Docker is running
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Docker is not installed or not running." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker is running" -ForegroundColor Green

# Check for .env file
if (-not (Test-Path ".\.env")) {
    Write-Host "⚠️  .env file not found. Creating from template..." -ForegroundColor Yellow
    if (Test-Path ".\.env.docker") {
        Copy-Item ".\.env.docker" ".\.env"
        Write-Host "📝 Created .env file. Please edit it with your configuration." -ForegroundColor Yellow
        Write-Host "   File location: $PWD\.env" -ForegroundColor Gray
        exit 1
    } else {
        Write-Host "❌ .env.docker template not found!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Environment file found" -ForegroundColor Green

# Clean up if requested
if ($Clean) {
    Write-Host "🧹 Cleaning up containers and volumes..." -ForegroundColor Yellow
    docker-compose down -v --rmi local --remove-orphans
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Cleanup completed with warnings" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Cleanup completed" -ForegroundColor Green
    }
}

# Build and start
$composeArgs = @("up")

if ($Build) {
    $composeArgs += "--build"
}

if ($Detach) {
    $composeArgs += "-d"
    Write-Host "🚀 Starting containers in detached mode..." -ForegroundColor Cyan
} else {
    Write-Host "🚀 Starting containers (Press Ctrl+C to stop)..." -ForegroundColor Cyan
}

Write-Host "   Command: docker-compose $composeArgs" -ForegroundColor Gray

# Start Docker Compose (docker-compose.yml is in current directory)
try {
    docker-compose @composeArgs

    if ($Detach -and $LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Containers started successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Available commands:" -ForegroundColor Cyan
        Write-Host "   View logs:    docker-compose logs -f" -ForegroundColor Gray
        Write-Host "   Stop:         docker-compose down" -ForegroundColor Gray
        Write-Host "   Restart:      docker-compose restart" -ForegroundColor Gray
        Write-Host ""
        Write-Host "🌐 Application URLs:" -ForegroundColor Cyan
        Write-Host "   API:          http://localhost:5000" -ForegroundColor Gray
        Write-Host "   Health:       http://localhost:5000/health" -ForegroundColor Gray
        Write-Host "   API Health:   http://localhost:5000/api/health" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed to start containers: $_" -ForegroundColor Red
    exit 1
}

# Show logs if requested
if ($Logs -and $Detach) {
    docker-compose logs -f
}
