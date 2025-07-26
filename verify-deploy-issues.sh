#!/bin/bash

# ==============================================
# VERIFICADOR DE PROBLEMAS CRÍTICOS DE DEPLOY
# SocialBiblia - WSL Ubuntu
# ==============================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[CHECK]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

ISSUES_FOUND=0

check_issue() {
    local title="$1"
    local description="$2"
    local check_command="$3"
    local fix_command="$4"
    
    log "Verificando: $title"
    echo "   $description"
    
    if eval "$check_command"; then
        success "✓ $title - OK"
    else
        error "✗ $title - PROBLEMA ENCONTRADO"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        
        if [ -n "$fix_command" ]; then
            echo "   💡 Sugestão de correção: $fix_command"
        fi
    fi
    echo ""
}

echo "🔍 VERIFICADOR DE PROBLEMAS CRÍTICOS DE DEPLOY"
echo "=============================================="
echo ""

# ==============================================
# 1. PROBLEMA: Imports @packagejson
# ==============================================

check_issue \
    "Imports @packagejson problemáticos" \
    "Verificando se ainda existem imports @packagejson que causam MODULE_NOT_FOUND" \
    "! grep -r '@packagejson' apps/backend/src/ 2>/dev/null" \
    "Substituir imports @packagejson por caminhos relativos: import pkg from '../../package.json'"

# ==============================================
# 2. PROBLEMA: Inconsistência de Portas
# ==============================================

check_issue \
    "Configuração de porta no backend" \
    "Verificando se PORT está configurada como 3000 no config" \
    "grep -q 'PORT.*3000' apps/backend/src/core/config.ts" \
    "Alterar PORT para 3000 em apps/backend/src/core/config.ts"

check_issue \
    "Configuração de porta no Docker" \
    "Verificando se docker-compose usa porta 3000" \
    "grep -q 'PORT: 3000' docker-compose.new.yml" \
    "Alterar PORT para 3000 em docker-compose.new.yml"

check_issue \
    "Health check no Docker" \
    "Verificando se health check usa porta 3000" \
    "grep -q 'localhost:3000' docker-compose.new.yml" \
    "Alterar health check para usar porta 3000"

# ==============================================
# 3. PROBLEMA: Migrações SQLite vs PostgreSQL
# ==============================================

check_issue \
    "Schema Prisma configurado para SQLite" \
    "Verificando se provider está configurado como sqlite" \
    "grep -q 'provider.*sqlite' apps/backend/prisma/schema.prisma" \
    "Alterar provider para 'sqlite' em schema.prisma"

check_issue \
    "Migrações usando sintaxe SQLite" \
    "Verificando se migrações usam tipos SQLite (TEXT, DATETIME)" \
    "ls apps/backend/prisma/migrations/*/migration.sql 2>/dev/null | xargs grep -l 'TEXT\\|DATETIME' > /dev/null" \
    "Recriar migrações: npx prisma migrate reset --force && npx prisma migrate dev"

check_issue \
    "DATABASE_URL para SQLite" \
    "Verificando se DATABASE_URL aponta para arquivo SQLite" \
    "grep -q 'file:' docker-compose.new.yml" \
    "Configurar DATABASE_URL como file:/app/data/production.db"

# ==============================================
# 4. PROBLEMA: Arquivos Docker
# ==============================================

DOCKER_FILES=(
    "docker-compose.new.yml"
    "configs/docker/Dockerfile.backend" 
    "configs/docker/Dockerfile.web"
    "configs/docker/nginx.conf"
    "configs/docker/default.conf"
)

for file in "${DOCKER_FILES[@]}"; do
    check_issue \
        "Arquivo Docker: $file" \
        "Verificando se arquivo Docker essencial existe" \
        "[ -f '$file' ]" \
        "Criar arquivo $file baseado nos templates do projeto"
done

# ==============================================
# 5. PROBLEMA: Versão obsoleta do Docker Compose
# ==============================================

check_issue \
    "Versão obsoleta no docker-compose" \
    "Verificando se 'version' foi removida do docker-compose" \
    "! grep -q '^version:' docker-compose.new.yml" \
    "Remover linha 'version: 3.8' do docker-compose.new.yml"

# ==============================================
# 6. PROBLEMA: Seed duplo/conflitante
# ==============================================

check_issue \
    "Seed correto configurado" \
    "Verificando se apenas o seed correto existe" \
    "[ -f 'apps/backend/prisma/seed.ts' ] && [ ! -f 'apps/backend/prisma/seed/seed.ts' ]" \
    "Remover prisma/seed/seed.ts e manter apenas prisma/seed.ts"

check_issue \
    "Package.json seed configurado" \
    "Verificando se script de seed aponta para arquivo correto" \
    "grep -q 'prisma/seed.ts' apps/backend/package.json" \
    "Alterar script seed para apontar para prisma/seed.ts"

# ==============================================
# 7. PROBLEMA: Dependências faltando
# ==============================================

check_issue \
    "Node.js instalado" \
    "Verificando se Node.js está disponível" \
    "command -v node > /dev/null" \
    "Instalar Node.js: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"

check_issue \
    "Docker instalado" \
    "Verificando se Docker está disponível" \
    "command -v docker > /dev/null" \
    "Instalar Docker: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"

check_issue \
    "Docker Compose instalado" \
    "Verificando se Docker Compose está disponível" \
    "docker compose version > /dev/null 2>&1" \
    "Docker Compose já deveria estar incluído no Docker moderno"

# ==============================================
# 8. PROBLEMA: Configurações de Produção
# ==============================================

check_issue \
    "Arquivo .env configurado" \
    "Verificando se variáveis de ambiente estão configuradas" \
    "[ -f 'apps/backend/.env' ] || [ -f '.env' ]" \
    "Criar arquivo .env com DATABASE_URL, JWT_SECRET, etc."

check_issue \
    "Variáveis JWT configuradas" \
    "Verificando se JWT_SECRET está no docker-compose" \
    "grep -q 'JWT_SECRET' docker-compose.new.yml" \
    "Configurar JWT_SECRET no docker-compose.new.yml"

# ==============================================
# RELATÓRIO FINAL
# ==============================================

echo "======================================"
echo "   RELATÓRIO DE PROBLEMAS CRÍTICOS"
echo "======================================"
echo ""

if [ $ISSUES_FOUND -eq 0 ]; then
    success "🎉 NENHUM PROBLEMA CRÍTICO ENCONTRADO!"
    echo ""
    echo "✅ A aplicação parece estar configurada corretamente para deploy."
    echo "✅ Todos os problemas documentados foram resolvidos."
    echo ""
    echo "🚀 Próximos passos:"
    echo "   1. Execute o teste completo: bash test-complete-wsl.sh"
    echo "   2. Faça o deploy: docker-compose -f docker-compose.new.yml up -d"
    echo ""
else
    error "🚨 $ISSUES_FOUND PROBLEMAS CRÍTICOS ENCONTRADOS!"
    echo ""
    echo "⚠️  Os problemas acima precisam ser corrigidos antes do deploy."
    echo "⚠️  Cada problema tem uma sugestão de correção listada."
    echo ""
    echo "🔧 Após corrigir os problemas:"
    echo "   1. Execute este script novamente para verificar"
    echo "   2. Execute o teste completo: bash test-complete-wsl.sh"
    echo "   3. Faça o deploy quando tudo estiver OK"
    echo ""
fi

exit $ISSUES_FOUND 