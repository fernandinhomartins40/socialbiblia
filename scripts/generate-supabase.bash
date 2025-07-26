#!/bin/bash

echo "🚀 Gerando instância Supabase para SocialBiblia..."

# ===================================
# CONFIGURAÇÕES CUSTOMIZADAS
# ===================================
export INSTANCE_ID="socialbiblia_$(date +%Y%m%d_%H%M%S)"
export POSTGRES_PASSWORD="admin"
export POSTGRES_DB="socialbiblia"

# Chaves JWT configuradas (não alterar - funcionam localmente)
export JWT_SECRET=9f878Nhjk3TJyVKgyaGh83hh6Pu9j9yfxnZSuphb
export ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzI3MjMzMjAwLAogICJleHAiOiAxODg0OTk5NjAwCn0.O0qBbl300xfJrhmW3YktijUJQ5ZW6OXVyZjnSwSCzCg
export SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogInNlcnZpY2Vfcm9sZSIsCiAgImlzcyI6ICJzdXBhYmFzZSIsCiAgImlhdCI6IDE3MjcyMzMyMDAsCiAgImV4cCI6IDE4ODQ5OTk2MDAKfQ.7KpglgDbGij2ich1kiVbzBj6Znz_S5anWm0iOemyS18

# Dashboard Admin - conforme solicitado
export DASHBOARD_USERNAME=admin
export DASHBOARD_PASSWORD=admin

# Portas fixas para facilitar
export POSTGRES_PORT=5432
export POSTGRES_PORT_EXT=5432
export KONG_HTTP_PORT=3001  # API Backend
export KONG_HTTPS_PORT=8443

# URLs para SocialBiblia
export API_EXTERNAL_URL="http://localhost:3001"
export SITE_URL="http://localhost:3000"
export SUPABASE_PUBLIC_URL="http://localhost:3001"
export STUDIO_DEFAULT_ORGANIZATION="SocialBiblia"
export STUDIO_DEFAULT_PROJECT="SocialBiblia Production"

# Configurações Auth
export ENABLE_EMAIL_SIGNUP="true"
export ENABLE_EMAIL_AUTOCONFIRM="true"
export ENABLE_ANONYMOUS_USERS="false"
export DISABLE_SIGNUP="false"
export JWT_EXPIRY=3600

# SMTP (desenvolvimento)
export SMTP_ADMIN_EMAIL="admin@socialbiblia.com"
export SMTP_HOST="localhost"
export SMTP_PORT=1025
export SMTP_USER="admin"
export SMTP_PASS="admin"
export SMTP_SENDER_NAME="SocialBiblia"

# Outras configurações
export SUPABASE_ANON_KEY=${ANON_KEY}
export SUPABASE_SERVICE_KEY=${SERVICE_ROLE_KEY}
export IMGPROXY_ENABLE_WEBP_DETECTION="true"
export FUNCTIONS_VERIFY_JWT="false"
export DOCKER_SOCKET_LOCATION="/var/run/docker.sock"
export PGRST_DB_SCHEMAS=public,storage,graphql_public

echo "📁 Criando estrutura de diretórios..."

# Navegar para temp-supabase/docker
cd temp-supabase/docker

# Verificar se arquivos necessários existem
if [ ! -f ".env.template" ]; then
    echo "❌ Erro: Arquivo .env.template não encontrado!"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erro: Arquivo docker-compose.yml não encontrado!"
    exit 1
fi

# Gerar arquivos da instância
echo "🔧 Gerando arquivos de configuração..."
envsubst < .env.template > .env-${INSTANCE_ID}
envsubst < docker-compose.yml > docker-compose-${INSTANCE_ID}.yml

# Criar diretórios de volumes
mkdir -p volumes-${INSTANCE_ID}/functions
mkdir -p volumes-${INSTANCE_ID}/logs
mkdir -p volumes-${INSTANCE_ID}/db/init
mkdir -p volumes-${INSTANCE_ID}/api

# Copiar arquivos necessários
if [ -d "volumes/db/" ]; then
    cp -a volumes/db/. volumes-${INSTANCE_ID}/db/
fi

if [ -d "volumes/functions/" ]; then
    cp -a volumes/functions/. volumes-${INSTANCE_ID}/functions/
fi

if [ -f "volumes/logs/vector.yml" ]; then
    envsubst < volumes/logs/vector.yml > volumes-${INSTANCE_ID}/logs/vector.yml
fi

if [ -f "volumes/api/kong.yml" ]; then
    envsubst < volumes/api/kong.yml > volumes-${INSTANCE_ID}/api/kong.yml
fi

# Copiar arquivos para workspace SocialBiblia
echo "📦 Copiando arquivos para workspace SocialBiblia..."
cd ../../

# Criar pasta supabase no workspace
mkdir -p supabase

# Copiar docker-compose e .env
cp temp-supabase/docker/docker-compose-${INSTANCE_ID}.yml supabase/docker-compose.yml
cp temp-supabase/docker/.env-${INSTANCE_ID} supabase/.env

# Copiar volumes
cp -r temp-supabase/docker/volumes-${INSTANCE_ID} supabase/volumes

echo "✅ Instância Supabase gerada com sucesso!"
echo ""
echo "📋 INFORMAÇÕES DA INSTÂNCIA:"
echo "   ID: ${INSTANCE_ID}"
echo "   Dashboard: http://localhost:3000"
echo "   API: http://localhost:3001"
echo "   Admin: admin / admin"
echo ""
echo "🚀 Para iniciar:"
echo "   cd supabase"
echo "   docker-compose up -d"
echo ""
echo "🔧 Arquivos criados:"
echo "   supabase/docker-compose.yml"
echo "   supabase/.env"
echo "   supabase/volumes/"