#!/bin/bash

# Script para testar o processo de build local

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
    exit 1
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Verificar se estamos no diretório correto
if [[ ! -f "package.json" ]] || [[ ! -d "apps/web" ]]; then
    error "Execute este script no diretório raiz do projeto"
fi

log "🧪 Iniciando teste de build..."

# Limpar builds anteriores
log "Limpando builds anteriores..."
rm -rf apps/web/dist

# Instalar dependências se necessário
if [[ ! -d "node_modules" ]]; then
    log "Instalando dependências do projeto raiz..."
    npm install
fi

if [[ ! -d "apps/web/node_modules" ]]; then
    log "Instalando dependências do frontend..."
    cd apps/web && npm install && cd ../..
fi

# Testar build da aplicação web
log "Testando build do frontend..."
npm run build:web

# Verificar se o build foi bem-sucedido
if [[ ! -d "apps/web/dist" ]]; then
    error "Build falhou! Diretório dist não foi criado."
fi

if [[ ! -f "apps/web/dist/index.html" ]]; then
    error "Build falhou! Arquivo index.html não foi gerado."
fi

# Verificar tamanho dos arquivos
log "Informações do build:"
echo "📁 Diretório: apps/web/dist"
echo "📊 Tamanho total: $(du -sh apps/web/dist | cut -f1)"
echo "📋 Arquivos gerados:"
ls -la apps/web/dist/

# Verificar se existem arquivos JS e CSS
js_files=$(find apps/web/dist -name "*.js" | wc -l)
css_files=$(find apps/web/dist -name "*.css" | wc -l)

info "Arquivos JavaScript: $js_files"
info "Arquivos CSS: $css_files"

if [[ $js_files -eq 0 ]]; then
    error "Nenhum arquivo JavaScript foi gerado!"
fi

if [[ $css_files -eq 0 ]]; then
    log "⚠️  Nenhum arquivo CSS foi gerado (pode ser normal se CSS estiver inline)"
fi

log "✅ Teste de build concluído com sucesso!"
log "🎉 Build está pronto para deploy!"

# Mostrar próximos passos
echo ""
info "Próximos passos:"
echo "1. Para testar localmente:"
echo "   cd apps/web && npm run preview"
echo ""
echo "2. Para fazer deploy local:"
echo "   ./scripts/deploy-vps.sh"
echo ""
echo "3. Para fazer deploy remoto:"
echo "   export VPS_HOST=seu-ip && ./scripts/deploy-remote.sh"