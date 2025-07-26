#!/bin/bash

# Script para configurar PostgreSQL para desenvolvimento
# Automatiza a migração completa SQLite → PostgreSQL

set -e

echo "🚀 Configurando PostgreSQL para SocialBiblia..."
echo "================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se Docker está rodando
check_docker() {
    log_info "Verificando Docker..."
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker não está rodando. Inicie o Docker primeiro."
        exit 1
    fi
    log_success "Docker está rodando"
}

# Parar containers existentes
stop_existing_containers() {
    log_info "Parando containers existentes..."
    
    if docker ps -q --filter "name=socialbiblia-postgres" | grep -q .; then
        docker stop socialbiblia-postgres >/dev/null 2>&1 || true
        docker rm socialbiblia-postgres >/dev/null 2>&1 || true
        log_success "Container PostgreSQL anterior removido"
    fi
    
    if docker ps -q --filter "name=socialbiblia-redis" | grep -q .; then
        docker stop socialbiblia-redis >/dev/null 2>&1 || true
        docker rm socialbiblia-redis >/dev/null 2>&1 || true
        log_success "Container Redis anterior removido"
    fi
}

# Criar diretórios necessários
create_directories() {
    log_info "Criando diretórios necessários..."
    
    mkdir -p docker/postgres/init
    mkdir -p docker/postgres/data
    mkdir -p scripts/backups
    
    log_success "Diretórios criados"
}

# Iniciar PostgreSQL e Redis
start_databases() {
    log_info "Iniciando PostgreSQL e Redis..."
    
    # Definir senhas padrão se não existirem
    export POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-"strong_dev_password_2024"}
    export REDIS_PASSWORD=${REDIS_PASSWORD:-"dev_redis_2024"}
    
    # Iniciar apenas os serviços de banco
    docker-compose up -d postgres redis
    
    log_info "Aguardando PostgreSQL ficar pronto..."
    
    # Aguardar PostgreSQL ficar pronto (máximo 60 segundos)
    for i in {1..60}; do
        if docker exec socialbiblia-postgres pg_isready -U socialbiblia_user -d socialbiblia >/dev/null 2>&1; then
            log_success "PostgreSQL está pronto!"
            break
        fi
        
        if [ $i -eq 60 ]; then
            log_error "PostgreSQL não ficou pronto em 60 segundos"
            exit 1
        fi
        
        sleep 1
    done
    
    log_success "Bancos de dados iniciados"
}

# Configurar variáveis de ambiente
setup_env() {
    log_info "Configurando variáveis de ambiente..."
    
    # Backup do .env atual se existir
    if [ -f "apps/backend/.env" ]; then
        cp apps/backend/.env "apps/backend/.env.backup.$(date +%s)"
        log_success "Backup do .env atual criado"
    fi
    
    # Atualizar .env com PostgreSQL
    cat > apps/backend/.env << EOF
# Configuração para PostgreSQL (gerado automaticamente)
NODE_ENV=development
DATABASE_URL="postgresql://socialbiblia_user:${POSTGRES_PASSWORD}@localhost:5432/socialbiblia"
REDIS_URL="redis://:${REDIS_PASSWORD}@localhost:6379"

# JWT Configuration
JWT_SECRET="dev_jwt_secret_change_in_production_2024"
JWT_REFRESH_SECRET="dev_refresh_secret_change_in_production_2024"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server Configuration
PORT=3001
CORS_ORIGIN="http://localhost:3000"

# Upload Configuration
UPLOAD_LIMIT="10mb"
UPLOAD_PATH="./uploads"

# Rate Limiting
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=900000

# Logging
LOG_LEVEL="debug"
LOG_FILE="./logs/app.log"

# Security
HELMET_CSP_SCRIPT_SRC="'self' 'unsafe-inline' 'unsafe-eval'"
HELMET_CSP_STYLE_SRC="'self' 'unsafe-inline'"
HELMET_CSP_IMG_SRC="'self' data: https:"
HELMET_CSP_CONNECT_SRC="'self' ws://localhost:* wss://localhost:*"
EOF

    log_success "Arquivo .env configurado para PostgreSQL"
}

# Executar migrações Prisma
run_migrations() {
    log_info "Executando migrações Prisma..."
    
    cd apps/backend
    
    # Gerar cliente Prisma
    log_info "Gerando cliente Prisma..."
    npm run prisma:generate
    
    # Executar migrações
    log_info "Executando migrações do banco..."
    npm run prisma:migrate:deploy 2>/dev/null || npm run prisma:migrate dev --name init
    
    cd ../..
    
    log_success "Migrações executadas com sucesso"
}

# Migrar dados do SQLite (se existir)
migrate_sqlite_data() {
    SQLITE_PATH="apps/backend/prisma/dev.db"
    
    if [ -f "$SQLITE_PATH" ]; then
        log_info "Banco SQLite encontrado. Iniciando migração de dados..."
        
        # Instalar dependência pg se não existir
        cd apps/backend
        if ! npm list pg >/dev/null 2>&1; then
            log_info "Instalando dependência 'pg'..."
            npm install pg
        fi
        cd ../..
        
        # Executar script de migração
        node scripts/migrate-to-postgres.js
        
        log_success "Dados migrados do SQLite para PostgreSQL"
        
        # Criar backup do SQLite
        BACKUP_PATH="scripts/backups/sqlite-backup-$(date +%s).db"
        cp "$SQLITE_PATH" "$BACKUP_PATH"
        log_success "Backup SQLite criado: $BACKUP_PATH"
        
    else
        log_info "Nenhum banco SQLite encontrado. Pulando migração de dados."
        
        # Executar seed se disponível
        cd apps/backend
        if npm run prisma:seed >/dev/null 2>&1; then
            log_success "Dados de exemplo inseridos"
        else
            log_info "Nenhum seed disponível"
        fi
        cd ../..
    fi
}

# Verificar conexão final
verify_setup() {
    log_info "Verificando configuração final..."
    
    # Testar conexão PostgreSQL
    if docker exec socialbiblia-postgres psql -U socialbiblia_user -d socialbiblia -c "SELECT 1;" >/dev/null 2>&1; then
        log_success "Conexão PostgreSQL OK"
    else
        log_error "Falha na conexão PostgreSQL"
        exit 1
    fi
    
    # Testar conexão Redis
    if docker exec socialbiblia-redis redis-cli -a "${REDIS_PASSWORD}" ping >/dev/null 2>&1; then
        log_success "Conexão Redis OK"
    else
        log_error "Falha na conexão Redis"
        exit 1
    fi
    
    # Verificar tabelas criadas
    TABLES_COUNT=$(docker exec socialbiblia-postgres psql -U socialbiblia_user -d socialbiblia -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
    
    if [ "$TABLES_COUNT" -gt 0 ]; then
        log_success "$TABLES_COUNT tabelas criadas no PostgreSQL"
    else
        log_error "Nenhuma tabela encontrada no PostgreSQL"
        exit 1
    fi
}

# Criar script de backup
create_backup_script() {
    log_info "Criando script de backup automático..."
    
    cat > scripts/backup-postgres.sh << 'EOF'
#!/bin/bash

# Script de backup automático PostgreSQL
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="scripts/backups"
BACKUP_FILE="$BACKUP_DIR/postgres-backup-$DATE.sql"

mkdir -p "$BACKUP_DIR"

echo "🔄 Criando backup PostgreSQL..."

docker exec socialbiblia-postgres pg_dump -U socialbiblia_user -d socialbiblia > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup criado: $BACKUP_FILE"
    
    # Manter apenas os 7 backups mais recentes
    ls -t "$BACKUP_DIR"/postgres-backup-*.sql | tail -n +8 | xargs -r rm
    echo "🧹 Backups antigos removidos"
else
    echo "❌ Falha ao criar backup"
    exit 1
fi
EOF

    chmod +x scripts/backup-postgres.sh
    log_success "Script de backup criado: scripts/backup-postgres.sh"
}

# Mostrar informações finais
show_final_info() {
    echo ""
    echo "================================================="
    log_success "PostgreSQL configurado com sucesso!"
    echo "================================================="
    echo ""
    echo "📊 Informações da configuração:"
    echo "   • PostgreSQL: localhost:5432"
    echo "   • Redis: localhost:6379"
    echo "   • Database: socialbiblia"
    echo "   • User: socialbiblia_user"
    echo ""
    echo "🔧 Comandos úteis:"
    echo "   • Conectar ao PostgreSQL:"
    echo "     docker exec -it socialbiblia-postgres psql -U socialbiblia_user -d socialbiblia"
    echo ""
    echo "   • Conectar ao Redis:"
    echo "     docker exec -it socialbiblia-redis redis-cli -a '${REDIS_PASSWORD}'"
    echo ""
    echo "   • Criar backup:"
    echo "     ./scripts/backup-postgres.sh"
    echo ""
    echo "   • Ver logs dos containers:"
    echo "     docker-compose logs -f postgres redis"
    echo ""
    log_success "Configuração concluída! 🎉"
}

# Função principal
main() {
    check_docker
    stop_existing_containers
    create_directories
    start_databases
    setup_env
    run_migrations
    migrate_sqlite_data
    verify_setup
    create_backup_script
    show_final_info
}

# Executar função principal
main