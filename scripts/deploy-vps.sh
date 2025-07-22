#!/bin/bash
# Deploy Script para VPS Ubuntu 22.04 - Social Bíblia
# Vincent Queimado Express + Prisma + TypeScript Backend

set -e  # Exit on any error

# Configurações
PROJECT_NAME="socialbiblia"
DOCKER_COMPOSE_FILE="docker-compose.new.yml"
ENV_FILE=".env.production"

echo "🚀 INICIANDO DEPLOY - SOCIAL BÍBLIA VPS"
echo "========================================"

# Verificar se Docker e Docker Compose estão instalados
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Instalando..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker instalado com sucesso"
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Instalando..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose instalado com sucesso"
fi

# Verificar recursos do sistema
echo "📊 VERIFICANDO RECURSOS DO SISTEMA:"
echo "RAM disponível: $(free -h | awk '/Mem:/ {print $7}')"
echo "Espaço em disco: $(df -h / | awk 'NR==2 {print $4}')"
echo "Load average: $(uptime | awk -F'load average:' '{print $2}')"
echo ""

# Parar containers existentes (se houver)
echo "🛑 PARANDO CONTAINERS EXISTENTES..."
docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans 2>/dev/null || true

# Limpar recursos não utilizados
echo "🧹 LIMPANDO RECURSOS DOCKER NÃO UTILIZADOS..."
docker system prune -f

# Verificar se o arquivo .env existe
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Arquivo $ENV_FILE não encontrado!"
    exit 1
fi

# Copiar arquivo de environment
cp $ENV_FILE .env

# Build das imagens
echo "🏗️  FAZENDO BUILD DAS IMAGENS..."
docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache --parallel

# Iniciar serviços
echo "🚀 INICIANDO SERVIÇOS..."
docker-compose -f $DOCKER_COMPOSE_FILE up -d

# Aguardar inicialização do PostgreSQL
echo "⏳ AGUARDANDO INICIALIZAÇÃO DO POSTGRESQL..."
timeout=60
counter=0
while ! docker-compose -f $DOCKER_COMPOSE_FILE exec -T postgres pg_isready -U socialbiblia_user -d socialbiblia_db; do
    sleep 1
    counter=$((counter+1))
    if [ $counter -ge $timeout ]; then
        echo "❌ PostgreSQL não iniciou em $timeout segundos!"
        docker-compose -f $DOCKER_COMPOSE_FILE logs postgres
        exit 1
    fi
done

echo "✅ PostgreSQL iniciado com sucesso!"

# Executar migrações do Prisma
echo "🗃️  EXECUTANDO MIGRAÇÕES DO BANCO DE DADOS..."
docker-compose -f $DOCKER_COMPOSE_FILE exec -T api npx prisma migrate deploy || {
    echo "⚠️  Tentando reset das migrações..."
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T api npx prisma migrate reset --force
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T api npx prisma migrate deploy
}

# Executar seed do banco (se necessário)
echo "🌱 EXECUTANDO SEED DO BANCO DE DADOS..."
docker-compose -f $DOCKER_COMPOSE_FILE exec -T api npm run prisma:seed || echo "⚠️  Seed falhou ou já foi executado"

# Aguardar inicialização da API
echo "⏳ AGUARDANDO INICIALIZAÇÃO DA API..."
timeout=120
counter=0
while ! curl -f http://localhost:3344/api/info >/dev/null 2>&1; do
    sleep 1
    counter=$((counter+1))
    if [ $counter -ge $timeout ]; then
        echo "❌ API não respondeu em $timeout segundos!"
        echo "📋 LOGS DA API:"
        docker-compose -f $DOCKER_COMPOSE_FILE logs api
        exit 1
    fi
    if [ $((counter % 10)) -eq 0 ]; then
        echo "Aguardando... $counter/$timeout segundos"
    fi
done

echo "✅ API iniciada com sucesso!"

# Aguardar inicialização do Frontend
echo "⏳ AGUARDANDO INICIALIZAÇÃO DO FRONTEND..."
timeout=60
counter=0
while ! curl -f http://localhost:3000 >/dev/null 2>&1; do
    sleep 1
    counter=$((counter+1))
    if [ $counter -ge $timeout ]; then
        echo "❌ Frontend não respondeu em $timeout segundos!"
        docker-compose -f $DOCKER_COMPOSE_FILE logs web
        exit 1
    fi
    if [ $((counter % 10)) -eq 0 ]; then
        echo "Aguardando... $counter/$timeout segundos"
    fi
done

echo "✅ Frontend iniciado com sucesso!"

# Verificar status final
echo ""
echo "📊 STATUS FINAL DOS SERVIÇOS:"
docker-compose -f $DOCKER_COMPOSE_FILE ps

echo ""
echo "🔗 ENDPOINTS DISPONÍVEIS:"
echo "- API Backend: http://localhost:3344/api/info"
echo "- Frontend: http://localhost:3000"
echo "- pgAdmin: http://localhost:8080"
echo "- Swagger Docs: http://localhost:3344/api/docs"
echo ""

# Teste final da API
echo "🧪 TESTANDO ENDPOINTS DA API..."
if curl -f http://localhost:3344/api/info >/dev/null 2>&1; then
    echo "✅ Endpoint /api/info está funcionando"
else
    echo "❌ Endpoint /api/info não está funcionando"
fi

echo ""
echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo "========================================"
echo "A aplicação Social Bíblia está rodando na VPS"
echo "Backend: Vincent Queimado Express + Prisma + TypeScript"
echo "Database: PostgreSQL 15"
echo "Ambiente: Produção"
echo ""

# Mostrar informações sobre logs
echo "📋 PARA VER LOGS:"
echo "docker-compose -f $DOCKER_COMPOSE_FILE logs -f [serviço]"
echo ""
echo "🔧 PARA PARAR SERVIÇOS:"
echo "docker-compose -f $DOCKER_COMPOSE_FILE down"
echo ""