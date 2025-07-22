#!/bin/bash

# Script para debug local do build Docker
echo "🔍 INICIANDO DEBUG DO BUILD DOCKER"
echo "=================================="

# Verificar estrutura de arquivos
echo "📁 Verificando estrutura de arquivos..."
echo ""
echo "Arquivos docker-compose.new.yml:"
ls -la docker-compose.new.yml || echo "❌ docker-compose.new.yml não encontrado"

echo ""
echo "Estrutura apps/:"
ls -la apps/ || echo "❌ Diretório apps/ não encontrado"

echo ""
echo "Estrutura apps/web/:"
ls -la apps/web/ || echo "❌ Diretório apps/web/ não encontrado"

echo ""
echo "Estrutura apps/backend/:"
ls -la apps/backend/ || echo "❌ Diretório apps/backend/ não encontrado"

echo ""
echo "Estrutura configs/docker/:"
ls -la configs/docker/ || echo "❌ Diretório configs/docker/ não encontrado"

echo ""
echo "📋 Verificando arquivos de configuração..."
echo "docker-compose.new.yml:"
if [ -f "docker-compose.new.yml" ]; then
    echo "✅ Existe"
    head -10 docker-compose.new.yml
else
    echo "❌ Não encontrado"
fi

echo ""
echo "apps/web/package.json:"
if [ -f "apps/web/package.json" ]; then
    echo "✅ Existe"
    head -5 apps/web/package.json
else
    echo "❌ Não encontrado"
fi

echo ""
echo "apps/backend/package.json:"
if [ -f "apps/backend/package.json" ]; then
    echo "✅ Existe"
    head -5 apps/backend/package.json
else
    echo "❌ Não encontrado"
fi

echo ""
echo "configs/docker/Dockerfile.web:"
if [ -f "configs/docker/Dockerfile.web" ]; then
    echo "✅ Existe"
    head -10 configs/docker/Dockerfile.web
else
    echo "❌ Não encontrado"
fi

echo ""
echo "configs/docker/Dockerfile.backend:"
if [ -f "configs/docker/Dockerfile.backend" ]; then
    echo "✅ Existe"
    head -10 configs/docker/Dockerfile.backend
else
    echo "❌ Não encontrado"
fi

echo ""
echo "🔧 Testando contextos de build..."

echo ""
echo "Testando contexto apps/web (para frontend):"
cd apps/web 2>/dev/null || { echo "❌ Não foi possível acessar apps/web"; exit 1; }
echo "PWD: $(pwd)"
echo "Arquivos no contexto:"
ls -la
echo "Dockerfile.web path: ../../configs/docker/Dockerfile.web"
ls -la ../../configs/docker/Dockerfile.web || echo "❌ Dockerfile.web não acessível do contexto"
cd ../..

echo ""
echo "Testando contexto apps/backend (para backend):"
cd apps/backend 2>/dev/null || { echo "❌ Não foi possível acessar apps/backend"; exit 1; }
echo "PWD: $(pwd)"
echo "Arquivos no contexto:"
ls -la
echo "Dockerfile.backend path: ../../configs/docker/Dockerfile.backend"
ls -la ../../configs/docker/Dockerfile.backend || echo "❌ Dockerfile.backend não acessível do contexto"
cd ../..

echo ""
echo "🐳 Testando build individual dos serviços..."

echo ""
echo "Tentando build apenas do frontend:"
docker compose -f docker-compose.new.yml build web --no-cache 2>&1 | head -20

echo ""
echo "Tentando build apenas do backend:"
docker compose -f docker-compose.new.yml build api --no-cache 2>&1 | head -20

echo ""
echo "🔍 DEBUG CONCLUÍDO"