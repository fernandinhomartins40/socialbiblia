#!/bin/bash

# Script de Deploy para VPS - Biblicai Monorepo Completo
# Deploy com frontend + backend + packages compartilhados

set -e  # Exit on any error

# Configurações
PROJECT_NAME="biblicai"
FRONTEND_CONTAINER="biblicai-frontend"
BACKEND_CONTAINER="biblicai-backend"
FRONTEND_IMAGE="biblicai-frontend:latest"
BACKEND_IMAGE="biblicai-backend:latest"
FRONTEND_PORT="3000"
BACKEND_PORT="3001"
NETWORK_NAME="biblicai-network"

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

# Verificar se Docker está instalado e rodando
check_docker() {
    log "Verificando Docker..."
    if ! command -v docker &> /dev/null; then
        error "Docker não está instalado. Por favor, instale o Docker primeiro."
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker não está rodando. Por favor, inicie o Docker daemon."
    fi
    
    log "Docker OK ✅"
}

# Verificar se estamos no diretório correto
check_project_dir() {
    log "Verificando diretório do projeto..."
    if [[ ! -f "package.json" ]] || [[ ! -d "apps/web" ]] || [[ ! -d "apps/backend" ]]; then
        error "Execute este script no diretório raiz do projeto Biblicai monorepo"
    fi
    log "Diretório do projeto OK ✅"
}

# Parar e remover containers anteriores
cleanup_old_containers() {
    log "Limpando containers antigos..."
    
    # Frontend
    if docker ps -q -f name=$FRONTEND_CONTAINER | grep -q .; then
        warn "Parando container anterior: $FRONTEND_CONTAINER"
        docker stop $FRONTEND_CONTAINER || true
    fi
    
    if docker ps -aq -f name=$FRONTEND_CONTAINER | grep -q .; then
        warn "Removendo container anterior: $FRONTEND_CONTAINER"
        docker rm $FRONTEND_CONTAINER || true
    fi
    
    # Backend
    if docker ps -q -f name=$BACKEND_CONTAINER | grep -q .; then
        warn "Parando container anterior: $BACKEND_CONTAINER"
        docker stop $BACKEND_CONTAINER || true
    fi
    
    if docker ps -aq -f name=$BACKEND_CONTAINER | grep -q .; then
        warn "Removendo container anterior: $BACKEND_CONTAINER"
        docker rm $BACKEND_CONTAINER || true
    fi
    
    log "Cleanup concluído ✅"
}

# Criar network se não existir
create_network() {
    log "Verificando network Docker..."
    if ! docker network ls | grep -q $NETWORK_NAME; then
        info "Criando network: $NETWORK_NAME"
        docker network create $NETWORK_NAME
    else
        info "Network $NETWORK_NAME já existe"
    fi
    log "Network OK ✅"
}

# Build completo do monorepo
build_monorepo() {
    log "Iniciando build completo do monorepo..."
    
    # Instalar dependências
    info "Instalando dependências..."
    npm run install-all
    
    # Build dos packages primeiro
    info "Building packages compartilhados..."
    npm run build:packages
    
    # Build das aplicações
    info "Building aplicações..."
    npm run build
    
    if [[ ! -d "apps/web/dist" ]] || [[ ! -d "apps/backend/dist" ]]; then
        error "Build falhou! Diretórios dist não foram criados."
    fi
    
    log "Build do monorepo concluído ✅"
}

# Build das imagens Docker
build_docker_images() {
    log "Iniciando build das imagens Docker..."
    
    # Remover imagens anteriores se existirem
    if docker images -q $FRONTEND_IMAGE | grep -q .; then
        warn "Removendo imagem anterior: $FRONTEND_IMAGE"
        docker rmi $FRONTEND_IMAGE || true
    fi
    
    if docker images -q $BACKEND_IMAGE | grep -q .; then
        warn "Removendo imagem anterior: $BACKEND_IMAGE"
        docker rmi $BACKEND_IMAGE || true
    fi
    
    # Build usando docker-compose
    info "Construindo imagens com docker-compose..."
    cd docker && docker-compose -f docker-compose.yml build && cd ..
    
    log "Build das imagens Docker concluído ✅"
}

# Deploy dos containers
deploy_containers() {
    log "Iniciando deploy dos containers..."
    
    # Deploy via docker-compose
    info "Iniciando containers via docker-compose..."
    cd docker && docker-compose -f docker-compose.yml up -d && cd ..
    
    log "Containers deployados ✅"
}

# Verificar se o deploy foi bem-sucedido
verify_deployment() {
    log "Verificando deployment..."
    
    # Aguardar containers inicializarem
    sleep 15
    
    # Verificar se containers estão rodando
    if ! docker ps | grep -q $FRONTEND_CONTAINER; then
        error "Container frontend não está rodando!"
    fi
    
    if ! docker ps | grep -q $BACKEND_CONTAINER; then
        error "Container backend não está rodando!"
    fi
    
    # Verificar health checks
    info "Verificando health checks..."
    
    # Frontend
    for i in {1..5}; do
        if curl -f -s http://localhost:$FRONTEND_PORT/health > /dev/null; then
            log "Frontend health check OK ✅"
            break
        fi
        
        if [[ $i -eq 5 ]]; then
            error "Frontend health check falhou após 5 tentativas"
        fi
        
        warn "Frontend health check falhou, tentativa $i/5. Aguardando..."
        sleep 5
    done
    
    # Backend
    for i in {1..5}; do
        if curl -f -s http://localhost:$BACKEND_PORT/api/health > /dev/null; then
            log "Backend health check OK ✅"
            break
        fi
        
        if [[ $i -eq 5 ]]; then
            error "Backend health check falhou após 5 tentativas"
        fi
        
        warn "Backend health check falhou, tentativa $i/5. Aguardando..."
        sleep 5
    done
    
    log "Deployment verificado ✅"
}

# Mostrar logs dos containers
show_logs() {
    log "Últimos logs dos containers:"
    echo ""
    info "Frontend logs:"
    docker logs --tail 10 $FRONTEND_CONTAINER
    echo ""
    info "Backend logs:"
    docker logs --tail 10 $BACKEND_CONTAINER
}

# Função principal
main() {
    log "🚀 Iniciando deploy completo do Biblicai Monorepo para VPS..."
    
    check_docker
    check_project_dir
    cleanup_old_containers
    create_network
    build_monorepo
    build_docker_images
    deploy_containers
    verify_deployment
    show_logs
    
    log "🎉 Deploy completo concluído com sucesso!"
    info "Frontend disponível em: http://localhost:$FRONTEND_PORT"
    info "Backend disponível em: http://localhost:$BACKEND_PORT"
    info "API docs: http://localhost:$BACKEND_PORT/api-docs"
    info "Dashboard: http://localhost:$BACKEND_PORT/dashboard"
    echo ""
    info "Para ver logs:"
    echo "  Frontend: docker logs -f $FRONTEND_CONTAINER"
    echo "  Backend: docker logs -f $BACKEND_CONTAINER"
    echo ""
    info "Para parar:"
    echo "  cd docker && docker-compose down"
}

# Verificar argumentos
case "${1:-}" in
    "cleanup")
        log "Executando apenas cleanup..."
        check_docker
        cleanup_old_containers
        ;;
    "build")
        log "Executando apenas build..."
        check_docker
        check_project_dir
        build_monorepo
        build_docker_images
        ;;
    "logs")
        log "Mostrando logs dos containers..."
        show_logs
        ;;
    "status")
        log "Status do deployment:"
        if docker ps | grep -q $FRONTEND_CONTAINER; then
            log "✅ Frontend está rodando"
        else
            warn "❌ Frontend não está rodando"
        fi
        
        if docker ps | grep -q $BACKEND_CONTAINER; then
            log "✅ Backend está rodando"
        else
            warn "❌ Backend não está rodando"
        fi
        
        docker ps | grep biblicai || echo "Nenhum container encontrado"
        ;;
    "")
        main
        ;;
    *)
        echo "Uso: $0 [cleanup|build|logs|status]"
        echo ""
        echo "Opções:"
        echo "  cleanup  - Remove containers e imagens antigas"
        echo "  build    - Apenas faz build do monorepo e imagens"
        echo "  logs     - Mostra logs dos containers"
        echo "  status   - Mostra status do deployment"
        echo "  (vazio)  - Executa deploy completo"
        exit 1
        ;;
esac