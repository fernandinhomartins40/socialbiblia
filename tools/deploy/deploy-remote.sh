#!/bin/bash

# Script para Deploy Remoto na VPS - Biblicai Frontend
# Este script sincroniza o código local com a VPS e executa o deploy

set -e

# Configurações da VPS (ajuste conforme necessário)
VPS_HOST="${VPS_HOST:-your-vps-ip}"
VPS_USER="${VPS_USER:-root}"
VPS_PORT="${VPS_PORT:-22}"
VPS_PATH="${VPS_PATH:-/opt/biblicai}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_rsa}"

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
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Verificar configurações
check_config() {
    log "Verificando configurações..."
    
    if [[ "$VPS_HOST" == "your-vps-ip" ]]; then
        error "Configure o IP da VPS na variável VPS_HOST ou export VPS_HOST=seu-ip"
    fi
    
    if [[ ! -f "$SSH_KEY" ]]; then
        error "Chave SSH não encontrada em $SSH_KEY"
    fi
    
    log "Configurações OK ✅"
}

# Verificar conexão SSH
check_ssh_connection() {
    log "Testando conexão SSH..."
    
    if ! ssh -i "$SSH_KEY" -p "$VPS_PORT" -o ConnectTimeout=10 -o BatchMode=yes "$VPS_USER@$VPS_HOST" echo "Conexão OK" &>/dev/null; then
        error "Não foi possível conectar na VPS. Verifique as configurações SSH."
    fi
    
    log "Conexão SSH OK ✅"
}

# Preparar arquivos localmente
prepare_local_files() {
    log "Preparando arquivos locais..."
    
    # Criar arquivo .env.production se não existir
    if [[ ! -f "apps/web/.env.production" ]]; then
        info "Criando arquivo .env.production..."
        cat > apps/web/.env.production << EOF
NODE_ENV=production
VITE_API_URL=/api
VITE_WS_URL=/socket.io
EOF
    fi
    
    # Verificar arquivos essenciais
    if [[ ! -f "package.json" ]] || [[ ! -d "apps/web" ]] || [[ ! -f "Dockerfile" ]]; then
        error "Arquivos essenciais não encontrados. Execute no diretório raiz do projeto."
    fi
    
    log "Arquivos locais preparados ✅"
}

# Sincronizar código com VPS
sync_code() {
    log "Sincronizando código com VPS..."
    
    # Criar diretório remoto se não existir
    ssh -i "$SSH_KEY" -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "mkdir -p $VPS_PATH"
    
    # Rsync com exclusões
    info "Transferindo arquivos..."
    rsync -avz --delete \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude 'apps/web/dist' \
        --exclude 'apps/web/node_modules' \
        --exclude '*.log' \
        --exclude '.env.local' \
        --exclude '.env.development' \
        -e "ssh -i $SSH_KEY -p $VPS_PORT" \
        ./ "$VPS_USER@$VPS_HOST:$VPS_PATH/"
    
    log "Código sincronizado ✅"
}

# Executar deploy na VPS
deploy_on_vps() {
    log "Executando deploy na VPS..."
    
    ssh -i "$SSH_KEY" -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" << 'EOF'
set -e

# Navegar para diretório do projeto
cd /opt/biblicai

# Dar permissão de execução para scripts
chmod +x scripts/*.sh

# Instalar dependências se necessário
if [[ ! -d "node_modules" ]]; then
    echo "Instalando dependências..."
    npm install
fi

# Executar deploy
echo "Executando deploy local na VPS..."
./scripts/deploy-vps.sh

echo "Deploy na VPS concluído!"
EOF
    
    log "Deploy na VPS concluído ✅"
}

# Verificar deployment
verify_remote_deployment() {
    log "Verificando deployment remoto..."
    
    # Verificar se aplicação está respondendo
    if ssh -i "$SSH_KEY" -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "curl -f -s http://localhost:3000/health" > /dev/null; then
        log "Aplicação está respondendo ✅"
    else
        warn "Aplicação não está respondendo ao health check"
    fi
    
    # Mostrar status dos containers
    info "Status dos containers:"
    ssh -i "$SSH_KEY" -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "docker ps | grep biblicai || echo 'Nenhum container encontrado'"
}

# Mostrar logs remotos
show_remote_logs() {
    log "Conectando aos logs da VPS..."
    ssh -i "$SSH_KEY" -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "docker logs -f biblicai-frontend"
}

# Função principal
main() {
    log "🚀 Iniciando deploy remoto do Biblicai Frontend..."
    
    check_config
    check_ssh_connection
    prepare_local_files
    sync_code
    deploy_on_vps
    verify_remote_deployment
    
    log "🎉 Deploy remoto concluído com sucesso!"
    info "Aplicação disponível em: http://$VPS_HOST:3000"
    info "Para ver logs: $0 logs"
    info "Para verificar status: $0 status"
}

# Verificar argumentos
case "${1:-}" in
    "logs")
        log "Mostrando logs remotos..."
        check_config
        check_ssh_connection
        show_remote_logs
        ;;
    "status")
        log "Verificando status remoto..."
        check_config
        check_ssh_connection
        verify_remote_deployment
        ;;
    "sync")
        log "Apenas sincronizando código..."
        check_config
        check_ssh_connection
        prepare_local_files
        sync_code
        ;;
    "")
        main
        ;;
    *)
        echo "Uso: $0 [logs|status|sync]"
        echo ""
        echo "Variáveis de ambiente necessárias:"
        echo "  VPS_HOST     - IP ou hostname da VPS"
        echo "  VPS_USER     - Usuário SSH (padrão: root)"
        echo "  VPS_PORT     - Porta SSH (padrão: 22)"
        echo "  VPS_PATH     - Caminho no servidor (padrão: /opt/biblicai)"
        echo "  SSH_KEY      - Caminho da chave SSH (padrão: ~/.ssh/id_rsa)"
        echo ""
        echo "Exemplo:"
        echo "  export VPS_HOST=192.168.1.100"
        echo "  export VPS_USER=ubuntu"
        echo "  $0"
        echo ""
        echo "Opções:"
        echo "  logs     - Mostra logs do container remoto"
        echo "  status   - Verifica status do deployment remoto"
        echo "  sync     - Apenas sincroniza código sem fazer deploy"
        echo "  (vazio)  - Executa deploy completo"
        exit 1
        ;;
esac