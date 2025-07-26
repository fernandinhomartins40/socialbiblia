#!/bin/bash

# ==============================================
# SCRIPT DE BACKUP AUTOMÁTICO - POSTGRESQL
# SocialBiblia Database Backup System
# ==============================================

set -e

# Configurações
BACKUP_DIR="/opt/socialbiblia/backups"
LOG_DIR="/opt/socialbiblia/logs"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="socialbiblia_backup_${TIMESTAMP}.sql.gz"
LOG_FILE="${LOG_DIR}/backup_${TIMESTAMP}.log"

# Criar diretórios necessários
mkdir -p "$BACKUP_DIR" "$LOG_DIR"

# Função de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Função de erro
error_exit() {
    log "ERRO: $1"
    exit 1
}

# Configurações do banco
DB_NAME="${POSTGRES_DB:-socialbiblia}"
DB_USER="${POSTGRES_USER:-socialbiblia_user}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"

# Verificar variáveis de ambiente
if [[ -z "$POSTGRES_PASSWORD" ]]; then
    error_exit "POSTGRES_PASSWORD não configurada"
fi

log "Iniciando backup do banco PostgreSQL: $DB_NAME"

# Verificar conectividade
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; then
    error_exit "PostgreSQL não está acessível em $DB_HOST:$DB_PORT"
fi

# Criar backup
log "Criando backup..."
cd "$BACKUP_DIR"

# Backup completo com compressão
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --no-owner \
    --no-privileges \
    --no-tablespaces \
    --no-unlogged-table-data \
    --quote-all-identifiers \
    --exclude-schema=information_schema \
    --exclude-schema=pg_catalog \
    --exclude-schema=public \
    --exclude-table=spatial_ref_sys \
    2>>"$LOG_FILE" | gzip > "$BACKUP_FILE"

# Verificar se o backup foi criado
if [[ ! -f "$BACKUP_FILE" ]]; then
    error_exit "Arquivo de backup não foi criado"
fi

# Verificar tamanho do backup
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup criado com sucesso: $BACKUP_FILE ($BACKUP_SIZE)"

# Backup adicional: Schema apenas
SCHEMA_BACKUP="socialbiblia_schema_${TIMESTAMP}.sql"
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --schema-only \
    --no-owner \
    --no-privileges \
    > "$SCHEMA_BACKUP"

log "Schema backup criado: $SCHEMA_BACKUP"

# Backup adicional: Dados apenas
DATA_BACKUP="socialbiblia_data_${TIMESTAMP}.sql.gz"
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --data-only \
    --no-owner \
    --no-privileges \
    2>>"$LOG_FILE" | gzip > "$DATA_BACKUP"

log "Data backup criado: $DATA_BACKUP"

# Backup do Redis (se configurado)
if command -v redis-cli &> /dev/null; then
    REDIS_BACKUP="socialbiblia_redis_${TIMESTAMP}.rdb"
    if redis-cli --rdb "$REDIS_BACKUP" 2>/dev/null; then
        log "Redis backup criado: $REDIS_BACKUP"
    else
        log "Aviso: Redis backup não foi criado"
    fi
fi

# Limpar backups antigos
log "Limpando backups antigos (mais de $RETENTION_DAYS dias)..."
find "$BACKUP_DIR" -name "socialbiblia_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete || true
find "$BACKUP_DIR" -name "socialbiblia_schema_*.sql" -mtime +$RETENTION_DAYS -delete || true
find "$BACKUP_DIR" -name "socialbiblia_data_*.sql.gz" -mtime +$RETENTION_DAYS -delete || true
find "$BACKUP_DIR" -name "socialbiblia_redis_*.rdb" -mtime +$RETENTION_DAYS -delete || true

# Calcular espaço utilizado
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Espaço total utilizado: $TOTAL_SIZE"

# Verificar integridade do backup
log "Verificando integridade do backup..."
if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
    log "Integridade do backup verificada"
else
    error_exit "Arquivo de backup corrompido"
fi

# Testar restauração (opcional)
if [[ "${TEST_RESTORE:-false}" == "true" ]]; then
    log "Testando restauração do backup..."
    
    TEST_DB="${DB_NAME}_test_restore_${TIMESTAMP}"
    
    PGPASSWORD="$POSTGRES_PASSWORD" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEST_DB"
    
    if gunzip -c "$BACKUP_FILE" | PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB" >/dev/null 2>&1; then
        log "Teste de restauração bem-sucedido"
        PGPASSWORD="$POSTGRES_PASSWORD" dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEST_DB"
    else
        log "Aviso: Teste de restauração falhou"
        PGPASSWORD="$POSTGRES_PASSWORD" dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEST_DB" || true
    fi
fi

# Enviar notificação (opcional)
if [[ -n "${WEBHOOK_URL:-}" ]]; then
    curl -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"✅ Backup do banco SocialBiblia concluído: $BACKUP_FILE ($BACKUP_SIZE)\"}" \
        2>/dev/null || true
fi

log "Backup concluído com sucesso!"
log "Arquivo: $BACKUP_FILE"
log "Tamanho: $BACKUP_SIZE"
log "Local: $BACKUP_DIR"
log "Log: $LOG_FILE"

# Exibir resumo
echo ""
echo "========================================"
echo "RESUMO DO BACKUP"
echo "========================================"
echo "Arquivo principal: $BACKUP_FILE"
echo "Schema: $SCHEMA_BACKUP"
echo "Dados: $DATA_BACKUP"
echo "Tamanho total: $TOTAL_SIZE"
echo "Log: $LOG_FILE"
echo "========================================"
