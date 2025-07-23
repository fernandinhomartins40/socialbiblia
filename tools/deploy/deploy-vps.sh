#!/bin/bash

# Script de Deploy para VPS - Biblicai Frontend
# Atualizado para funcionar apenas com o frontend React

set -e  # Exit on any error

# Configurações
PROJECT_NAME="biblicai"
CONTAINER_NAME="biblicai-frontend"
IMAGE_NAME="biblicai:latest"
PORT="3000"
NETWORK_NAME="biblicai-network"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
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
    if [[ ! -f "package.json" ]] || [[ ! -d "apps/web" ]]; then
        error "Execute este script no diretório raiz do projeto Biblicai"
    fi
    log "Diretório do projeto OK ✅"
}

# Parar e remover container anterior se existir
cleanup_old_container() {
    log "Limpando containers antigos..."
    
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        warn "Parando container anterior: $CONTAINER_NAME"
        docker stop $CONTAINER_NAME || true
    fi
    
    if docker ps -aq -f name=$CONTAINER_NAME | grep -q .; then
        warn "Removendo container anterior: $CONTAINER_NAME"
        docker rm $CONTAINER_NAME || true
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

# Build da aplicação
build_application() {
    log "Iniciando build da aplicação..."
    
    # Limpar builds anteriores
    info "Limpando builds anteriores..."
    rm -rf apps/web/dist
    
    # Build da aplicação web
    info "Fazendo build do frontend..."
    npm run build:web
    
    if [[ ! -d "apps/web/dist" ]]; then
        error "Build falhou! Diretório dist não foi criado."
    fi
    
    log "Build da aplicação concluído ✅"
}

# Build da imagem Docker
build_docker_image() {
    log "Iniciando build da imagem Docker..."
    
    # Remover imagem anterior se existir
    if docker images -q $IMAGE_NAME | grep -q .; then
        warn "Removendo imagem anterior: $IMAGE_NAME"
        docker rmi $IMAGE_NAME || true
    fi
    
    # Build da nova imagem
    info "Construindo nova imagem Docker..."
    docker build -t $IMAGE_NAME .
    
    log "Build da imagem Docker concluído ✅"
}

# Deploy do container
deploy_container() {
    log "Iniciando deploy do container..."
    
    # Executar o container
    info "Iniciando container: $CONTAINER_NAME"
    docker run -d \
        --name $CONTAINER_NAME \
        --network $NETWORK_NAME \
        -p $PORT:3000 \
        --restart unless-stopped \
        -e NODE_ENV=production \
        -v /var/log/biblicai:/var/log/nginx \
        $IMAGE_NAME
    
    log "Container deployado ✅"
}

# Verificar se o deploy foi bem-sucedido
verify_deployment() {
    log "Verificando deployment..."
    
    # Aguardar container inicializar
    sleep 10
    
    # Verificar se container está rodando
    if ! docker ps | grep -q $CONTAINER_NAME; then
        error "Container não está rodando!"
    fi
    
    # Verificar health check
    info "Verificando health check..."
    for i in {1..5}; do
        if curl -f -s http://localhost:$PORT/health > /dev/null; then
            log "Health check OK ✅"
            break
        fi
        
        if [[ $i -eq 5 ]]; then
            error "Health check falhou após 5 tentativas"
        fi
        
        warn "Health check falhou, tentativa $i/5. Aguardando..."
        sleep 5
    done
    
    log "Deployment verificado ✅"
}

# Mostrar logs do container
show_logs() {
    log "Últimos logs do container:"
    docker logs --tail 20 $CONTAINER_NAME
}

# Função principal
main() {
    log "🚀 Iniciando deploy do Biblicai Frontend para VPS..."
    
    check_docker
    check_project_dir
    cleanup_old_container
    create_network
    build_application
    build_docker_image
    deploy_container
    verify_deployment
    show_logs
    
    log "🎉 Deploy concluído com sucesso!"
    info "Aplicação disponível em: http://localhost:$PORT"
    info "Health check: http://localhost:$PORT/health"
    info "Para ver logs: docker logs -f $CONTAINER_NAME"
    info "Para parar: docker stop $CONTAINER_NAME"
}

# Verificar argumentos
case "${1:-}" in
    "cleanup")
        log "Executando apenas cleanup..."
        check_docker
        cleanup_old_container
        ;;
    "build")
        log "Executando apenas build..."
        check_docker
        check_project_dir
        build_application
        build_docker_image
        ;;
    "logs")
        log "Mostrando logs do container..."
        docker logs -f $CONTAINER_NAME
        ;;
    "status")
        log "Status do deployment:"
        if docker ps | grep -q $CONTAINER_NAME; then
            log "✅ Container está rodando"
            docker ps | grep $CONTAINER_NAME
        else
            warn "❌ Container não está rodando"
        fi
        ;;
    "")
        main
        ;;
    *)
        echo "Uso: $0 [cleanup|build|logs|status]"
        echo ""
        echo "Opções:"
        echo "  cleanup  - Remove containers e imagens antigas"
        echo "  build    - Apenas faz build da aplicação e imagem"
        echo "  logs     - Mostra logs do container em tempo real"
        echo "  status   - Mostra status do deployment"
        echo "  (vazio)  - Executa deploy completo"
        exit 1
        ;;
esac