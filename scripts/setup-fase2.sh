#!/bin/bash

# ==============================================
# SCRIPT DE SETUP - FASE 2: INFRAESTRUTURA
# SocialBiblia - PostgreSQL, Redis, Docker
# ==============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função de log
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Configurações
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_DIR="$PROJECT_DIR/logs"
ENV_FILE="$PROJECT_DIR/.env"

# Criar diretórios necessários
mkdir -p "$BACKUP_DIR" "$LOG_DIR"

log "🚀 Iniciando setup da Fase 2 - Infraestrutura"

# ==============================================
# 1. VERIFICAR DEPENDÊNCIAS
# ==============================================

info "Verificando dependências do sistema..."

# Verificar Docker
if ! command -v docker &> /dev/null; then
    error "Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar Docker Compose
if ! docker compose version &> /dev/null; then
    error "Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js não está instalado. Por favor, instale o Node.js primeiro."
    exit 1
fi

log "✅ Todas as dependências estão instaladas"

# ==============================================
# 2. CONFIGURAR VARIÁVEIS DE AMBIENTE
# ==============================================

info "Configurando variáveis de ambiente..."

if [[ ! -f "$ENV_FILE" ]]; then
    log "Criando arquivo .env com configurações padrão..."
    
    cat > "$ENV_FILE" << 'EOF'
# ==============================================
# CONFIGURAÇÕES DE DESENVOLVIMENTO - SOCIALBIBLIA
# ==============================================

# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://socialbiblia_user:strong_dev_password_2024@localhost:5432/socialbiblia

# Redis Configuration
REDIS_URL=redis://:dev_redis_2024@localhost:6379

# JWT Configuration
JWT_SECRET=dev_jwt_secret_change_in_production_2024
JWT_REFRESH_SECRET=dev_refresh_secret_change_in_production_2024
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API Configuration
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000
UPLOAD_LIMIT=10mb

# Rate Limiting
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=900000

# Logging
LOG_LEVEL=debug

# Email Configuration (opcional)
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_SERVICE=gmail

# Backup Configuration
BACKUP_RETENTION_DAYS=30
BACKUP_SCHEDULE="0 2 * * *" # 2 AM daily
EOF
    
    log "✅ Arquivo .env criado"
else
    log "✅ Arquivo .env já existe"
fi

# ==============================================
# 3. CONFIGURAR DOCKER COMPOSE
# ==============================================

info "Configurando Docker Compose..."

# Verificar se o docker-compose.yml existe
if [[ ! -f "$PROJECT_DIR/docker-compose.yml" ]]; then
    warn "docker-compose.yml não encontrado. Usando configuração padrão..."
fi

# ==============================================
# 4. INICIAR SERVIÇOS
# ==============================================

log "Iniciando serviços com Docker Compose..."

cd "$PROJECT_DIR"

# Parar serviços existentes
docker compose down --remove-orphans 2>/dev/null || true

# Remover volumes antigos se solicitado
if [[ "$1" == "--clean" ]]; then
    info "Removendo volumes antigos..."
    docker compose down --volumes --remove-orphans || true
    docker volume prune -f || true
fi

# Build das imagens
log "Build das imagens Docker..."
docker compose build --no-cache

# Iniciar serviços
log "Iniciando serviços..."
docker compose up -d

# Aguardar serviços iniciarem
log "Aguardando serviços iniciarem..."
sleep 10

# ==============================================
# 5. VERIFICAR SAÚDE DOS SERVIÇOS
# ==============================================

info "Verificando saúde dos serviços..."

# Função para verificar serviço
check_service() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if docker compose ps | grep -q "$service.*Up"; then
            if nc -z localhost "$port" 2>/dev/null; then
                log "✅ $service está rodando na porta $port"
                return 0
            fi
        fi
        
        info "Aguardando $service... (tentativa $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    error "$service não está disponível após $max_attempts tentativas"
    return 1
}

# Verificar PostgreSQL
check_service "postgres" 5432

# Verificar Redis
check_service "redis" 6379

# ==============================================
# 6. CONFIGURAR BANCO DE DADOS
# ==============================================

info "Configurando banco de dados..."

# Aguardar PostgreSQL estar pronto
log "Aguardando PostgreSQL estar pronto..."
sleep 5

# Executar migrações
log "Executando migrações do Prisma..."
cd "$PROJECT_DIR/apps/backend"
npx prisma migrate deploy

# Gerar cliente Prisma
log "Gerando cliente Prisma..."
npx prisma generate

# Executar seed (se disponível)
if [[ -f "prisma/seed.ts" ]]; then
    log "Executando seed..."
    npx prisma db seed
fi

# ==============================================
# 7. CONFIGURAR BACKUP AUTOMÁTICO
# ==============================================

info "Configurando backup automático..."

# Tornar scripts executáveis
chmod +x "$PROJECT_DIR/scripts/backup-postgres.sh"
chmod +x "$PROJECT_DIR/scripts/migrate-to-postgres.js"

# Adicionar cron job para backup (se crontab disponível)
if command -v crontab &> /dev/null; then
    CRON_JOB="0 2 * * * $PROJECT_DIR/scripts/backup-postgres.sh >> $LOG_DIR/cron.log 2>&1"
    
    # Verificar se já existe
    if ! crontab -l 2>/dev/null | grep -q "backup-postgres.sh"; then
        (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        log "✅ Backup automático configurado para 2 AM diariamente"
    else
        log "✅ Backup automático já está configurado"
    fi
else
    warn "Crontab não disponível. Backup automático não configurado."
fi

# ==============================================
# 8. TESTAR CONECTIVIDADE
# ==============================================

info "Testando conectividade..."

# Testar PostgreSQL
if PGPASSWORD="strong_dev_password_2024" psql -h localhost -U socialbiblia_user -d socialbiblia -c "SELECT 1;" >/dev/null 2>&1; then
    log "✅ PostgreSQL conectado com sucesso"
else
    error "Falha ao conectar ao PostgreSQL"
    exit 1
fi

# Testar Redis
if redis-cli -a "dev_redis_2024" ping >/dev/null 2>&1; then
    log "✅ Redis conectado com sucesso"
else
    error "Falha ao conectar ao Redis"
    exit 1
fi

# ==============================================
# 9. GERAR RELATÓRIO
# ==============================================

log "Gerando relatório de setup..."

cat > "$LOG_DIR/setup-report.txt" << EOF
========================================
RELATÓRIO DE SETUP - FASE 2
========================================
Data: $(date)
Diretório do projeto: $PROJECT_DIR

Serviços iniciados:
- PostgreSQL: localhost:5432
- Redis: localhost:6379

Banco de dados:
- Nome: socialbiblia
- Usuário: socialbiblia_user
- URL: postgresql://socialbiblia_user:****@localhost:5432/socialbiblia

Backup configurado:
- Diretório: $BACKUP_DIR
- Log: $LOG_DIR/backup.log
- Retenção: 30 dias

Comandos úteis:
- Ver logs: docker compose logs -f
- Parar serviços: docker compose down
- Iniciar serviços: docker compose up -d
- Backup manual: ./scripts/backup-postgres.sh
- Migração: node scripts/migrate-to-postgres.js

========================================
EOF

log "✅ Setup da Fase 2 concluído com sucesso!"
log "Relatório salvo em: $LOG_DIR/setup-report.txt"
log ""
log "Próximos passos:"
log "1. Verificar se os serviços estão rodando: docker compose ps"
log "2. Testar a aplicação: npm run dev"
log "3. Acessar: http://localhost:3000"
