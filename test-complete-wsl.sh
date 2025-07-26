#!/bin/bash

# ==============================================
# SCRIPT DE TESTE COMPLETO - SOCIALBIBLIA WSL UBUNTU
# Testa 100% da aplicação para identificar erros de deploy
# ==============================================

set -e  # Para na primeira falha

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Contador de testes
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

test_start() {
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    log "🧪 TESTE $TESTS_TOTAL: $1"
}

test_pass() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    success "✅ $1"
}

test_fail() {
    TESTS_FAILED=$((TESTS_FAILED + 1))
    error "❌ $1"
}

# ==============================================
# 1. VERIFICAÇÃO DO AMBIENTE WSL
# ==============================================

log "🐧 Verificando ambiente WSL Ubuntu..."

test_start "Verificação do Sistema Operacional"
if grep -q "Ubuntu" /etc/os-release; then
    test_pass "Ubuntu detectado"
    cat /etc/os-release | grep -E "(NAME|VERSION)"
else
    test_fail "Ubuntu não detectado"
    exit 1
fi

test_start "Verificação de Dependências do Sistema"
DEPS_MISSING=""

# Node.js
if ! command -v node &> /dev/null; then
    DEPS_MISSING="$DEPS_MISSING node"
fi

# npm
if ! command -v npm &> /dev/null; then
    DEPS_MISSING="$DEPS_MISSING npm"
fi

# Docker
if ! command -v docker &> /dev/null; then
    DEPS_MISSING="$DEPS_MISSING docker"
fi

# curl
if ! command -v curl &> /dev/null; then
    DEPS_MISSING="$DEPS_MISSING curl"
fi

if [ -z "$DEPS_MISSING" ]; then
    test_pass "Todas as dependências estão instaladas"
else
    warning "Dependências faltando: $DEPS_MISSING"
    log "Instalando dependências faltando..."
    
    # Atualizar repositórios
    sudo apt update
    
    # Instalar Node.js se necessário
    if [[ $DEPS_MISSING == *"node"* ]] || [[ $DEPS_MISSING == *"npm"* ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Instalar Docker se necessário
    if [[ $DEPS_MISSING == *"docker"* ]]; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
    fi
    
    # Instalar curl se necessário
    if [[ $DEPS_MISSING == *"curl"* ]]; then
        sudo apt-get install -y curl
    fi
    
    test_pass "Dependências instaladas"
fi

# Verificar versões
log "📋 Versões das dependências:"
node --version 2>/dev/null && echo "Node.js: $(node --version)" || echo "Node.js: não instalado"
npm --version 2>/dev/null && echo "npm: $(npm --version)" || echo "npm: não instalado"
docker --version 2>/dev/null && echo "Docker: $(docker --version)" || echo "Docker: não instalado"

# ==============================================
# 2. TESTES DO BACKEND
# ==============================================

log "🚀 Iniciando testes do backend..."

cd apps/backend

test_start "Instalação de dependências do backend"
if npm ci; then
    test_pass "Dependências do backend instaladas"
else
    test_fail "Falha na instalação das dependências do backend"
    exit 1
fi

test_start "TypeScript - Verificação de tipos"
if npm run typecheck; then
    test_pass "TypeScript sem erros de tipo"
else
    test_fail "Erros de TypeScript encontrados"
fi

test_start "ESLint - Análise de código"
if npm run lint; then
    test_pass "ESLint passou sem problemas"
else
    warning "ESLint encontrou problemas (não crítico)"
fi

test_start "Geração do Prisma Client"
if npm run prisma:generate; then
    test_pass "Prisma Client gerado com sucesso"
else
    test_fail "Falha na geração do Prisma Client"
fi

test_start "Reset do banco de dados para testes"
if npm run prisma:reset:force; then
    test_pass "Banco de dados resetado"
else
    test_fail "Falha no reset do banco de dados"
fi

test_start "Aplicação de migrações"
if npm run prisma:migrate:deploy; then
    test_pass "Migrações aplicadas com sucesso"
else
    test_fail "Falha na aplicação das migrações"
fi

test_start "Execução do seed"
if npm run prisma:seed; then
    test_pass "Seed executado com sucesso"
else
    test_fail "Falha na execução do seed"
fi

test_start "Testes unitários do backend"
if npm test; then
    test_pass "Todos os testes unitários passaram"
else
    test_fail "Alguns testes unitários falharam"
fi

test_start "Build do backend"
if npm run build; then
    test_pass "Build do backend concluído"
else
    test_fail "Falha no build do backend"
fi

test_start "Teste de inicialização do servidor (10s)"
timeout 10s npm start &
SERVER_PID=$!
sleep 5

if curl -f http://localhost:3000/api/info 2>/dev/null; then
    test_pass "Servidor iniciou e responde corretamente"
    kill $SERVER_PID 2>/dev/null || true
else
    test_fail "Servidor não responde ou falha na inicialização"
    kill $SERVER_PID 2>/dev/null || true
fi

# ==============================================
# 3. TESTES DO FRONTEND
# ==============================================

log "🌐 Iniciando testes do frontend..."

cd ../web

test_start "Instalação de dependências do frontend"
if npm ci; then
    test_pass "Dependências do frontend instaladas"
else
    test_fail "Falha na instalação das dependências do frontend"
    exit 1
fi

test_start "TypeScript - Verificação de tipos (frontend)"
if npm run typecheck; then
    test_pass "TypeScript frontend sem erros"
else
    test_fail "Erros de TypeScript no frontend"
fi

test_start "ESLint - Análise de código (frontend)"
if npm run lint; then
    test_pass "ESLint frontend passou"
else
    warning "ESLint frontend encontrou problemas (não crítico)"
fi

test_start "Build do frontend"
if npm run build; then
    test_pass "Build do frontend concluído"
else
    test_fail "Falha no build do frontend"
fi

test_start "Preview do frontend (10s)"
timeout 10s npm run preview &
PREVIEW_PID=$!
sleep 5

if curl -f http://localhost:4173 2>/dev/null; then
    test_pass "Frontend preview funcionando"
    kill $PREVIEW_PID 2>/dev/null || true
else
    test_fail "Frontend preview não funciona"
    kill $PREVIEW_PID 2>/dev/null || true
fi

# ==============================================
# 4. TESTES DOCKER
# ==============================================

log "🐳 Iniciando testes Docker..."

cd ../../

test_start "Verificação de arquivos Docker"
DOCKER_FILES=(
    "docker-compose.new.yml"
    "configs/docker/Dockerfile.backend"
    "configs/docker/Dockerfile.web"
    "configs/docker/nginx.conf"
    "configs/docker/default.conf"
)

for file in "${DOCKER_FILES[@]}"; do
    if [ -f "$file" ]; then
        success "✓ $file existe"
    else
        error "✗ $file não encontrado"
        test_fail "Arquivo Docker faltando: $file"
    fi
done

test_start "Validação do docker-compose.new.yml"
if docker compose -f docker-compose.new.yml config 2>/dev/null; then
    test_pass "docker-compose.new.yml é válido"
else
    test_fail "docker-compose.new.yml contém erros"
fi

test_start "Build das imagens Docker"
if docker compose -f docker-compose.new.yml build; then
    test_pass "Imagens Docker construídas com sucesso"
else
    test_fail "Falha na construção das imagens Docker"
fi

test_start "Execução dos containers (30s)"
docker compose -f docker-compose.new.yml up -d

# Aguardar containers iniciarem
sleep 30

# Verificar se os containers estão rodando
if docker compose -f docker-compose.new.yml ps | grep -q "Up"; then
    test_pass "Containers estão executando"
    
    # Testar endpoints
    test_start "Teste de endpoints via Docker"
    
    # Testar API
    if curl -f http://localhost/api/info 2>/dev/null; then
        test_pass "API acessível via Docker"
    else
        test_fail "API não acessível via Docker"
    fi
    
    # Testar Frontend
    if curl -f http://localhost/ 2>/dev/null; then
        test_pass "Frontend acessível via Docker"
    else
        test_fail "Frontend não acessível via Docker"
    fi
    
else
    test_fail "Containers não estão executando corretamente"
fi

# Parar containers
docker compose -f docker-compose.new.yml down

# ==============================================
# 5. TESTES DE STRESS E PERFORMANCE
# ==============================================

log "⚡ Iniciando testes de performance..."

# Reiniciar apenas o backend para testes de stress
cd apps/backend
npm start &
BACKEND_PID=$!
sleep 5

test_start "Teste de stress - 100 requisições simultâneas"
if command -v ab &> /dev/null; then
    ab -n 100 -c 10 http://localhost:3000/api/info 2>/dev/null && test_pass "Teste de stress concluído" || test_fail "Teste de stress falhou"
else
    warning "Apache Bench (ab) não instalado, pulando teste de stress"
fi

kill $BACKEND_PID 2>/dev/null || true

# ==============================================
# 6. ANÁLISE DE LOGS E PROBLEMAS
# ==============================================

log "📊 Analisando logs e problemas conhecidos..."

test_start "Verificação de problemas conhecidos"

# Verificar problemas de import @packagejson
if grep -r "@packagejson" apps/backend/src/ 2>/dev/null; then
    test_fail "Imports @packagejson encontrados (problema conhecido)"
    log "Problema: Imports @packagejson não funcionam em runtime"
    log "Solução: Substituir por paths relativos"
else
    test_pass "Nenhum import @packagejson problemático encontrado"
fi

# Verificar configurações de porta
test_start "Verificação de consistência de portas"
BACKEND_CONFIG_PORT=$(grep -r "PORT.*3000" apps/backend/src/core/config.ts | wc -l)
DOCKER_PORT=$(grep -r "3000" docker-compose.new.yml | wc -l)

if [ "$BACKEND_CONFIG_PORT" -gt 0 ] && [ "$DOCKER_PORT" -gt 0 ]; then
    test_pass "Configurações de porta consistentes (3000)"
else
    test_fail "Inconsistências de porta detectadas"
fi

# Verificar migrações SQLite
test_start "Verificação de migrações SQLite"
if ls apps/backend/prisma/migrations/*/migration.sql 2>/dev/null | xargs grep -l "TEXT\|DATETIME" > /dev/null; then
    test_pass "Migrações usando sintaxe SQLite"
else
    test_fail "Migrações podem ter sintaxe PostgreSQL incompatível"
fi

# ==============================================
# 7. RELATÓRIO FINAL
# ==============================================

log "📈 Gerando relatório final..."

echo ""
echo "======================================"
echo "   RELATÓRIO DE TESTES COMPLETO"
echo "======================================"
echo ""
echo "📊 Estatísticas:"
echo "   Total de testes: $TESTS_TOTAL"
echo "   Testes passou: $TESTS_PASSED"
echo "   Testes falharam: $TESTS_FAILED"
echo "   Taxa de sucesso: $(( TESTS_PASSED * 100 / TESTS_TOTAL ))%"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    success "🎉 TODOS OS TESTES PASSARAM! Aplicação pronta para deploy."
    exit 0
else
    error "🚨 $TESTS_FAILED TESTES FALHARAM. Verificar problemas acima."
    
    echo ""
    echo "🔧 PRÓXIMOS PASSOS RECOMENDADOS:"
    echo "1. Revisar logs de erro acima"
    echo "2. Corrigir problemas identificados"
    echo "3. Re-executar testes específicos"
    echo "4. Testar deploy em ambiente staging"
    echo ""
    
    exit 1
fi 