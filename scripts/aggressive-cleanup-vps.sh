#!/bin/bash

# ==============================================
# SCRIPT DE LIMPEZA AGRESSIVA - BIBLICAI VPS
# Remove TUDO relacionado a versões antigas
# ==============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

echo "=========================================="
echo "🧹 LIMPEZA AGRESSIVA - BIBLICAI VPS"
echo "=========================================="
log "🚨 ATENÇÃO: Este script irá remover TUDO relacionado ao Biblicai"
log "Isso inclui: containers, imagens, volumes, networks, dados do banco"
echo "=========================================="

# Confirmar limpeza
read -p "Tem certeza que deseja continuar? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "❌ Limpeza cancelada pelo usuário"
    exit 0
fi

log "🧹 Iniciando limpeza agressiva..."

# ====================================
# ETAPA 1: PARAR TODOS OS CONTAINERS
# ====================================
log "⏹️ Parando todos os containers relacionados..."

# Parar containers por compose
docker compose -f docker-compose.new.yml down --remove-orphans 2>/dev/null || true
docker compose -f docker-compose.yml down --remove-orphans 2>/dev/null || true

# Parar containers por nome (atual e antigos)
CONTAINER_PATTERNS=(
    "biblicai"
    "socialbiblia" 
    "plugbase"
    "backend"
    "frontend"
    "web"
    "api"
    "nginx"
    "sqliteadmin"
)

for pattern in "${CONTAINER_PATTERNS[@]}"; do
    containers=$(docker ps -a --format "{{.Names}}" | grep -i "$pattern" || true)
    if [ -n "$containers" ]; then
        log "Parando containers com padrão: $pattern"
        echo "$containers" | xargs -r docker stop 2>/dev/null || true
        echo "$containers" | xargs -r docker rm -f 2>/dev/null || true
    fi
done

log "✅ Containers parados e removidos"

# ====================================
# ETAPA 2: REMOVER IMAGENS
# ====================================
log "🗑️ Removendo todas as imagens relacionadas..."

# Remover imagens por padrão
IMAGE_PATTERNS=(
    "biblicai"
    "socialbiblia"
    "plugbase"
    "backend"
    "frontend"
)

for pattern in "${IMAGE_PATTERNS[@]}"; do
    images=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -i "$pattern" || true)
    if [ -n "$images" ]; then
        log "Removendo imagens com padrão: $pattern"
        echo "$images" | xargs -r docker rmi -f 2>/dev/null || true
    fi
done

# Limpeza geral de imagens órfãs
docker image prune -f 2>/dev/null || true

log "✅ Imagens removidas"

# ====================================
# ETAPA 3: REMOVER VOLUMES
# ====================================
log "💾 Removendo todos os volumes relacionados..."

# Remover volumes por padrão
VOLUME_PATTERNS=(
    "biblicai"
    "socialbiblia"
    "plugbase"
    "api_data"
    "web_logs"
    "nginx_logs"
)

for pattern in "${VOLUME_PATTERNS[@]}"; do
    volumes=$(docker volume ls --format "{{.Name}}" | grep -i "$pattern" || true)
    if [ -n "$volumes" ]; then
        log "Removendo volumes com padrão: $pattern"
        echo "$volumes" | xargs -r docker volume rm -f 2>/dev/null || true
    fi
done

# Limpeza geral de volumes órfãos
docker volume prune -f 2>/dev/null || true

log "✅ Volumes removidos"

# ====================================
# ETAPA 4: REMOVER NETWORKS
# ====================================
log "🌐 Removendo networks relacionadas..."

# Remover networks por padrão
NETWORK_PATTERNS=(
    "biblicai"
    "socialbiblia"
    "plugbase"
)

for pattern in "${NETWORK_PATTERNS[@]}"; do
    networks=$(docker network ls --format "{{.Name}}" | grep -i "$pattern" || true)
    if [ -n "$networks" ]; then
        log "Removendo networks com padrão: $pattern"
        echo "$networks" | xargs -r docker network rm 2>/dev/null || true
    fi
done

log "✅ Networks removidas"

# ====================================
# ETAPA 5: LIMPAR ARQUIVOS DO SISTEMA
# ====================================
log "📁 Limpando arquivos e diretórios do sistema..."

# Diretórios a limpar
DIRECTORIES_TO_CLEAN=(
    "/opt/biblicai"
    "/opt/socialbiblia"
    "/var/lib/docker/volumes/biblicai*"
    "/var/lib/docker/volumes/socialbiblia*"
    "/tmp/biblicai*"
    "/tmp/socialbiblia*"
)

for dir in "${DIRECTORIES_TO_CLEAN[@]}"; do
    if [ -d "$dir" ] || [ -f "$dir" ]; then
        log "Removendo: $dir"
        rm -rf $dir 2>/dev/null || true
    fi
done

log "✅ Arquivos do sistema limpos"

# ====================================
# ETAPA 6: VERIFICAR PORTAS EM USO
# ====================================
log "🔌 Verificando portas em uso..."

PORTS_TO_CHECK=(3000 8080 80 443)

for port in "${PORTS_TO_CHECK[@]}"; do
    pid=$(netstat -tulpn 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1 | head -1)
    if [ -n "$pid" ] && [ "$pid" != "-" ]; then
        process_name=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
        warn "Porta $port em uso por PID $pid ($process_name)"
        
        # Se não for um processo crítico do sistema, perguntar se deve matar
        if [[ ! "$process_name" =~ ^(systemd|init|kernel)$ ]]; then
            read -p "Matar processo na porta $port? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                kill -9 $pid 2>/dev/null || warn "Não foi possível matar processo $pid"
            fi
        fi
    else
        info "Porta $port: livre"
    fi
done

# ====================================
# ETAPA 7: LIMPEZA FINAL DO DOCKER
# ====================================
log "🐳 Limpeza final do Docker..."

# Limpeza completa do Docker
docker system prune -af --volumes 2>/dev/null || true

# Verificar se Docker está funcionando
if ! docker info >/dev/null 2>&1; then
    warn "Docker pode estar com problemas, reiniciando..."
    systemctl restart docker
    sleep 10
fi

log "✅ Limpeza final do Docker concluída"

# ====================================
# ETAPA 8: RELATÓRIO FINAL
# ====================================
log "📋 Gerando relatório de limpeza..."

echo ""
echo "=========================================="
echo "🔍 RELATÓRIO DE LIMPEZA AGRESSIVA"
echo "=========================================="
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

echo "🐳 DOCKER STATUS:"
echo "  Containers: $(docker ps -a --format '{{.Names}}' | wc -l)"
echo "  Images: $(docker images --format '{{.Repository}}' | wc -l)"
echo "  Volumes: $(docker volume ls --format '{{.Name}}' | wc -l)"
echo "  Networks: $(docker network ls --format '{{.Name}}' | grep -v bridge | grep -v host | grep -v none | wc -l)"
echo ""

echo "🔌 PORTAS:"
for port in 3000 8080 80; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo "  Port $port: EM USO"
    else
        echo "  Port $port: LIVRE"
    fi
done
echo ""

echo "💾 ESPAÇO EM DISCO:"
df -h / | tail -1 | awk '{print "  Usado: "$3"/"$2" ("$5")"}'
echo ""

echo "=========================================="
echo "✅ LIMPEZA AGRESSIVA CONCLUÍDA"
echo "=========================================="
echo ""

log "🎉 Ambiente completamente limpo!"
log "🚀 Agora você pode fazer um deploy limpo"
log ""
log "💡 Próximos passos:"
log "   1. Execute o deploy normalmente"
log "   2. Se ainda houver problemas, considere reiniciar a VPS"
log "   3. Monitore os logs durante o deploy" 