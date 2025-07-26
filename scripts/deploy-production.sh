#!/bin/bash

set -e

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="/backups/socialbiblia"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Pre-deployment checks
log "Running pre-deployment checks..."

# Check if we're on main branch
if [[ $(git rev-parse --abbrev-ref HEAD) != "main" ]]; then
    error "Not on main branch. Please switch to main branch before deploying."
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    error "Uncommitted changes detected. Please commit or stash changes."
    exit 1
fi

# Pull latest changes
log "Pulling latest changes..."
git pull origin main

# Create backup
log "Creating database backup..."
mkdir -p $BACKUP_DIR
pg_dump $DATABASE_URL > $BACKUP_FILE
log "Backup created: $BACKUP_FILE"

# Run tests
log "Running tests..."
npm run test:backend
npm run test:web

# Build application
log "Building application..."
npm run build

# Deploy with Docker
log "Deploying with Docker..."
docker-compose -f docker-compose.yml up -d --build

# Wait for services to be ready
log "Waiting for services to be ready..."
sleep 30

# Run health check
log "Running health check..."
npm run health-check

# Run database migrations
log "Running database migrations..."
npm run db:migrate

log "✅ Production deployment completed successfully!"
log "Backup file: $BACKUP_FILE"
