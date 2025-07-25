#!/bin/bash

# ==============================================
# SCRIPT DE DEPLOY BIBLICAI - PRODUCTION VPS
# Backend: Express + Prisma + TypeScript + SQLite
# Frontend: React + Vite
# ==============================================

set -e

# Receber parâmetros do GitHub Actions
VPS_HOST="$1"
APP_DIR="$2"
REPO_URL="$3"

# Função de log com timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Função para executar comando com retry se container estiver reiniciando
execute_in_container() {
  local cmd="$1"
  local retries=3
  local delay=10
  
  for i in $(seq 1 $retries); do
    if docker compose -f docker-compose.new.yml exec -T api $cmd; then
      return 0
    else
      log "⚠️ Comando falhou (tentativa $i/$retries), verificando status do container..."
      container_status=$(docker compose -f docker-compose.new.yml ps api --format "{{.Status}}" 2>/dev/null || echo "not found")
      log "Status do container: $container_status"
      
      if echo "$container_status" | grep -q "restarting"; then
        log "Container reiniciando, aguardando $delay segundos..."
        sleep $delay
      else
        log "Container estável mas comando falhou"
        return 1
      fi
    fi
  done
  return 1
}

# ====================================
# ETAPA 1: PREPARAR AMBIENTE
# ====================================
log "🚀 INICIANDO DEPLOY BIBLICAI"
log "Backend: Express + Prisma + TypeScript"
log "Database: SQLite"
log "Frontend: React + Vite"

# Criar diretório da aplicação
mkdir -p $APP_DIR
cd $APP_DIR

# Parar containers existentes
log "⏹️ Parando containers existentes..."
docker compose -f docker-compose.new.yml down --remove-orphans 2>/dev/null || true

# ====================================
# ETAPA 2: ATUALIZAR CÓDIGO
# ====================================
log "📥 Atualizando código fonte..."

if [ ! -d ".git" ]; then
  log "📥 Clonando repositório..."
  git clone $REPO_URL . || {
    log "❌ Clone falhou, usando download direto..."
    curl -L ${REPO_URL%%.git}/archive/main.tar.gz | tar xz --strip-components=1
  }
else
  log "🔄 Atualizando repositório existente..."
  git fetch origin && git reset --hard origin/main && git clean -fd
fi

# Verificar se arquivos essenciais existem
REQUIRED_FILES="docker-compose.new.yml apps/backend/package.json apps/web/package.json configs/docker/Dockerfile.backend configs/docker/Dockerfile.web configs/docker/nginx.conf configs/docker/default.conf"
for file in $REQUIRED_FILES; do
  if [ ! -f "$file" ]; then
    log "❌ Arquivo obrigatório não encontrado: $file"
    ls -la $(dirname "$file")/
    exit 1
  fi
done

log "✅ Código fonte atualizado com sucesso"

# ====================================
# ETAPA 3: INSTALAR DEPENDÊNCIAS DO SISTEMA
# ====================================
log "🔧 Verificando dependências do sistema..."

# Atualizar lista de pacotes
apt-get update -qq

# Instalar Docker se necessário
if ! command -v docker >/dev/null 2>&1; then
  log "📦 Instalando Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl start docker
  systemctl enable docker
  log "✅ Docker instalado"
else
  log "✅ Docker já instalado ($(docker --version))"
fi

# Verificar Docker Compose
if ! docker compose version >/dev/null 2>&1; then
  log "📦 Instalando Docker Compose..."
  apt-get install -y docker-compose-plugin
  log "✅ Docker Compose instalado"
else
  log "✅ Docker Compose já instalado ($(docker compose version))"
fi

# Verificar se Docker está funcionando
if ! docker info >/dev/null 2>&1; then
  log "❌ Docker não está funcionando corretamente"
  systemctl restart docker
  sleep 10
  if ! docker info >/dev/null 2>&1; then
    log "❌ Falha crítica: Docker não está funcionando"
    exit 1
  fi
fi

log "✅ Todas as dependências do sistema verificadas"

# ====================================
# ETAPA 4: CONFIGURAR VARIÁVEIS DE AMBIENTE
# ====================================
log "📝 Configurando variáveis de ambiente..."

# Copiar arquivo de produção se não existir
if [ ! -f ".env" ]; then
  if [ -f ".env.production" ]; then
    log "📋 Usando .env.production existente"
    cp .env.production .env
  else
    log "📝 Criando arquivo .env de produção..."
    cat > .env << 'EOF'
# ==============================================
# CONFIGURAÇÕES DE PRODUÇÃO - BIBLICAI
# Backend: Express + Prisma + TypeScript + SQLite
# ==============================================

# Database Configuration (SQLite)
DATABASE_URL=file:./data/production.db

# API Configuration (Backend)
APP_URL_HOST=0.0.0.0
APP_URL_PORT=3000
SSL_ALLOW=false
API_PREFIX=api
API_JSON_LIMIT=5mb
API_EXT_URLENCODED=false
CORS_ALLOW_ORIGIN=*

# JWT Configuration
JWT_SECRET_USER=Biblicai@VincentQueimado#UserJWT2024!VPS#Secure
JWT_SECRET_DEVICE=Biblicai@VincentQueimado#DeviceJWT2024!VPS#Secure
JWT_EXPIRED_IN=24h

# Security Configuration
BCRYPT_SALTROUNDS=12
RATE_LIMIT_MAX=500
RATE_LIMIT_WINDOW=15

# Debug Configuration (DISABLED IN PRODUCTION)
DEBUG_HTTP_REQUEST=false
DEBUG_HTTP_CONNECTION=false

# Service Ports
API_PORT=3000
WEB_PORT=3000
SQLITEADMIN_PORT=8080

# Email Configuration (Optional)
EMAIL_USER=admin@biblicai.com.br
EMAIL_PASSWORD=
EMAIL_SERVICE=gmail
EMAIL_OAUTH_CLIENT_ID=
EMAIL_OAUTH_CLIENT_SECRET=
EMAIL_OAUTH_REFRESH_TOKEN=

# Production Environment
NODE_ENV=production
TZ=America/Sao_Paulo
COMPOSE_PROFILES=production
EOF
  fi
fi

log "✅ Variáveis de ambiente configuradas"

# ====================================
# ETAPA 5: LIMPEZA AGRESSIVA PRE-BUILD
# ====================================
log "🧹 Limpando ambiente com limpeza agressiva..."

# Parar containers do projeto
docker compose -f docker-compose.new.yml down --remove-orphans 2>/dev/null || true

# LIMPEZA AGRESSIVA: Remover containers conflitantes por nome
log "🗑️ Removendo containers conflitantes..."
for container_name in biblicai_api biblicai_web biblicai_nginx biblicai_sqliteadmin; do
 if docker ps -a --format "{{.Names}}" | grep -q "^${container_name}$"; then
   log "Removendo container conflitante: $container_name"
   docker rm -f $container_name 2>/dev/null || true
 fi
done

# Remover também containers antigos socialbiblia (fallback)
for container_name in socialbiblia_api socialbiblia_web socialbiblia_nginx socialbiblia_sqliteadmin; do
 if docker ps -a --format "{{.Names}}" | grep -q "^${container_name}$"; then
   log "Removendo container antigo: $container_name"
   docker rm -f $container_name 2>/dev/null || true
 fi
done

# Limpar imagens do projeto
docker images --format "table {{.Repository}}:{{.Tag}}" | grep -E "(biblicai|socialbiblia|backend|web)" | awk '{print $1}' | xargs -r docker rmi -f 2>/dev/null || true

# Limpar volumes órfãos do projeto
docker volume ls --format "{{.Name}}" | grep -E "(biblicai|socialbiblia)" | xargs -r docker volume rm 2>/dev/null || true

# Limpar networks órfãs
docker network ls --format "{{.Name}}" | grep -E "(biblicai|socialbiblia)" | xargs -r docker network rm 2>/dev/null || true

log "✅ Ambiente limpo"

# ====================================
# ETAPA 6: BUILD E DEPLOY
# ====================================
log "🔨 Iniciando build e deploy..."

# Build das imagens
log "🏗️ Fazendo build das imagens..."
if ! docker compose -f docker-compose.new.yml build --no-cache --parallel; then
  log "❌ Falha no build das imagens!"
  docker system df
  exit 1
fi

log "✅ Build das imagens concluído"

# Iniciar serviços
log "🚀 Iniciando serviços..."
if ! docker compose -f docker-compose.new.yml up -d; then
  log "❌ Falha ao iniciar serviços!"
  docker compose -f docker-compose.new.yml logs
  exit 1
fi

log "✅ Serviços iniciados"

# ====================================
# ETAPA 7: AGUARDAR INICIALIZAÇÃO
# ====================================
log "⏳ Aguardando inicialização dos serviços..."

# Aguardar API (SQLite é arquivo local, não precisa esperar)
log "🗃️ SQLite configurado como arquivo local - nenhuma espera necessária para banco"

# Executar migrações do Prisma (SQLite)
log "🗃️ Executando migrações do banco SQLite..."

# Aguardar container API estar pronto antes das migrações
timeout=120
container_stable=false

while [ $timeout -gt 0 ]; do
  # Verificar se container está rodando (não reiniciando)
  container_status=$(docker compose -f docker-compose.new.yml ps api --format "{{.Status}}" 2>/dev/null || echo "not found")
  
  # DEBUG INTENSIVO: Log sempre o status e logs recentes
  log "🔍 DEBUG: Container status: $container_status"
  log "📋 DEBUG: Últimos 10 logs do container:"
  docker compose -f docker-compose.new.yml logs --tail 10 api || true
  
  if echo "$container_status" | grep -q "Up" && ! echo "$container_status" | grep -q "restarting"; then
    log "✅ Container API rodando estável, aguardando mais 10s..."
    sleep 10
    
    # Verificar novamente se ainda está estável
    container_status=$(docker compose -f docker-compose.new.yml ps api --format "{{.Status}}" 2>/dev/null || echo "not found")
    if echo "$container_status" | grep -q "Up" && ! echo "$container_status" | grep -q "restarting"; then
      log "✅ Container API estável, iniciando migrações..."
      container_stable=true
      break
    else
      log "⚠️ Container voltou a reiniciar após parecer estável"
      log "📋 Logs completos para diagnóstico:"
      docker compose -f docker-compose.new.yml logs api || true
    fi
  fi
  
  if echo "$container_status" | grep -q "restarting"; then
    log "⚠️ Container API reiniciando constantemente!"
    log "🔧 AÇÃO CRÍTICA: Alternando para Dockerfile Debian para melhor compatibilidade Prisma"
    
    # Switch para Dockerfile Debian
    log "🔄 Parando serviços para alternar Dockerfile..."
    docker compose -f docker-compose.new.yml down || true
    
    # Backup do dockerfile atual e switch para Debian
    cp configs/docker/Dockerfile.backend configs/docker/Dockerfile.backend.alpine-backup
    cp configs/docker/Dockerfile.backend.debian configs/docker/Dockerfile.backend
    
    log "🏗️ Rebuilding com Dockerfile Debian..."
    docker compose -f docker-compose.new.yml build --no-cache api
    
    log "🚀 Iniciando serviços com Debian..."
    docker compose -f docker-compose.new.yml up -d
    
    # Resetar timeout para nova tentativa
    timeout=60
    log "🔄 Aguardando container com Debian estabilizar..."
    continue
  fi
  
  sleep 5
  timeout=$((timeout - 5))
  if [ $((timeout % 10)) -eq 0 ]; then
    log "⏳ Aguardando container API estabilizar... ($timeout segundos restantes)"
    log "Status atual: $container_status"
  fi
done

if [ "$container_stable" = false ]; then
  log "❌ Container API não estabilizou em tempo hábil"
  log "📋 Status final: $container_status"
  log "📋 Logs completos do container:"
  docker compose -f docker-compose.new.yml logs api || true
  exit 1
fi

# Verificar se as migrações existem
log "📋 Verificando migrações disponíveis..."
docker compose -f docker-compose.new.yml exec -T api npx prisma migrate status || log "⚠️ Status das migrações não pôde ser verificado"

# Garantir que o diretório data existe e tem permissões corretas
log "📁 Criando diretório data se não existir..."
execute_in_container "mkdir -p /app/data" || true
execute_in_container "chown backend:nodejs /app/data" || true

# Deploy das migrações para SQLite
log "🚀 Executando prisma migrate deploy para SQLite..."

if ! execute_in_container "npx prisma migrate deploy"; then
  log "⚠️ Migrações falharam, verificando logs..."
  docker compose -f docker-compose.new.yml logs api | tail -20
  
  log "🔄 Tentando gerar cliente Prisma e migrar novamente..."
  execute_in_container "npx prisma generate"
  execute_in_container "npx prisma migrate deploy"
fi

# Verificar se o banco SQLite foi criado corretamente
log "🔍 Verificando arquivo SQLite criado..."
if execute_in_container "ls -la /app/data/production.db"; then
  log "✅ Arquivo SQLite production.db criado com sucesso"
else
  log "⚠️ Arquivo SQLite pode não ter sido criado corretamente"
  log "🔍 Listando conteúdo do diretório data..."
  execute_in_container "ls -la /app/data/" || true
fi

# Executar seed (opcional)
log "🌱 Executando seed do banco..."
if execute_in_container "npm run prisma:seed"; then
  log "✅ Seed executado com sucesso"
else
  log "⚠️ Seed falhou - verificando se banco já tem dados..."
  # Verificar se já existem usuários (banco já populado)
  user_count=$(execute_in_container "npx prisma db execute --stdin <<< \"SELECT COUNT(*) as count FROM users;\"" 2>/dev/null | grep -o '[0-9]*' | tail -1 || echo "0")
  if [ -n "$user_count" ] && [ "$user_count" -gt 0 ] 2>/dev/null; then
    log "✅ Banco já contém dados ($user_count usuários) - seed desnecessário"
  else
    log "❌ Seed falhou e banco está vazio - problema crítico"
    docker compose -f docker-compose.new.yml logs api | tail -10
  fi
fi

# Aguardar API
log "🔌 Aguardando API..."
timeout=120
while [ $timeout -gt 0 ]; do
  if curl -f http://localhost:3000/api/info >/dev/null 2>&1; then
    log "✅ API pronta!"
    break
  fi
  sleep 2
  timeout=$((timeout - 2))
  if [ $((timeout % 20)) -eq 0 ]; then
    log "⏳ Aguardando API... ($timeout segundos restantes)"
  fi
done

if [ $timeout -le 0 ]; then
  log "❌ Timeout aguardando API"
  docker compose -f docker-compose.new.yml logs api
  exit 1
fi

# Aguardar Frontend
log "🌐 Aguardando Frontend..."
timeout=60
while [ $timeout -gt 0 ]; do
  if curl -f http://localhost:3000 >/dev/null 2>&1; then
    log "✅ Frontend pronto!"
    break
  fi
  sleep 2
  timeout=$((timeout - 2))
  if [ $((timeout % 10)) -eq 0 ]; then
    log "⏳ Aguardando Frontend... ($timeout segundos restantes)"
  fi
done

if [ $timeout -le 0 ]; then
  log "❌ Timeout aguardando Frontend"
  docker compose -f docker-compose.new.yml logs web
  exit 1
fi

# ====================================
# ETAPA 8: VERIFICAÇÕES FINAIS
# ====================================
log "🔍 Executando verificações finais..."

# Status dos containers
log "📊 Status dos containers:"
docker compose -f docker-compose.new.yml ps

# Health checks
HEALTH_ISSUES=""

# Test API endpoints
if curl -f http://localhost:3000/api/info >/dev/null 2>&1; then
  log "✅ API Health Check: OK"
else
  log "❌ API Health Check: FALHOU"
  HEALTH_ISSUES="api "
fi

# Test Frontend
if curl -f http://localhost:3000 >/dev/null 2>&1; then
  log "✅ Frontend Health Check: OK"
else
  log "❌ Frontend Health Check: FALHOU"
  HEALTH_ISSUES="frontend "
fi

# Test SQLite Admin
if curl -f http://localhost:8080 >/dev/null 2>&1; then
  log "✅ SQLite Admin Health Check: OK"
else
  log "⚠️ SQLite Admin Health Check: Pode estar inicializando"
fi

# Verificar se containers estão rodando
EXPECTED_CONTAINERS="biblicai_api biblicai_web biblicai_nginx biblicai_sqliteadmin"
for container in $EXPECTED_CONTAINERS; do
  if docker ps --format "{{.Names}}" | grep -q "$container"; then
    log "✅ Container $container: Rodando"
  else
    log "❌ Container $container: NÃO está rodando"
    HEALTH_ISSUES="$container "
  fi
done

# ====================================
# RESULTADO FINAL
# ====================================
if [ -n "$HEALTH_ISSUES" ]; then
  log "❌ DEPLOY CONCLUÍDO COM PROBLEMAS!"
  log "🔍 Serviços com problemas: $HEALTH_ISSUES"
  exit 1
else
  log "🎉 DEPLOY DA BIBLICAI CONCLUÍDO COM SUCESSO!"
  log ""
  log "🌐 APLICAÇÃO DISPONÍVEL EM:"
  log "   ✅ Frontend (React):     http://$VPS_HOST:3000"
  log "   ✅ API (Express):        http://$VPS_HOST:3000/api/"
  log "   ✅ API Docs (Swagger):   http://$VPS_HOST:3000/api/docs"
  log "   ✅ SQLite Admin:         http://$VPS_HOST:8080"
  log ""
  log "🔧 TECNOLOGIAS DEPLOYADAS:"
  log "   • Backend: Express + Prisma + TypeScript"
  log "   • Database: SQLite"
  log "   • Frontend: React 18 + Vite"
  log "   • Container: Docker + Docker Compose"
  log ""
  log "🚀 DEPLOY FINALIZADO - APLICAÇÃO PRONTA PARA USO!"
fi 