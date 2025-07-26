#!/bin/bash

# ===================================
# GERADOR SUPABASE PARA NOVA VPS
# ===================================

echo "🚀 Gerando nova instância Supabase para produção..."

# Verificar se argumentos foram fornecidos
if [ $# -eq 0 ]; then
    echo "❌ Erro: Forneça um nome para a instância!"
    echo "📖 Uso: $0 <nome-instancia> [vps-ip]"
    echo "📝 Exemplo: $0 socialbiblia-prod2 192.168.1.100"
    exit 1
fi

INSTANCE_NAME=$1
VPS_IP=${2:-"localhost"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📋 Configurações:"
echo "   Nome: $INSTANCE_NAME"
echo "   VPS IP: $VPS_IP"
echo "   Timestamp: $TIMESTAMP"

# ===================================
# GERAR CREDENCIAIS ÚNICAS
# ===================================

# Gerar senhas aleatórias seguras
POSTGRES_PASSWORD=$(openssl rand -hex 16)
DASHBOARD_PASSWORD=$(openssl rand -hex 8)
REDIS_PASSWORD=$(openssl rand -hex 12)

# Gerar JWT secrets únicos
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')

# Gerar chaves JWT customizadas para esta instância
echo "🔐 Gerando chaves JWT únicas..."

# Criar payload customizado para ANON
ANON_PAYLOAD=$(cat <<EOF
{
  "role": "anon",
  "iss": "supabase-${INSTANCE_NAME}",
  "iat": $(date +%s),
  "exp": 1884999600
}
EOF
)

# Criar payload customizado para SERVICE_ROLE  
SERVICE_PAYLOAD=$(cat <<EOF
{
  "role": "service_role",
  "iss": "supabase-${INSTANCE_NAME}",
  "iat": $(date +%s),
  "exp": 1884999600
}
EOF
)

# Gerar chaves JWT (usando openssl para simular JWT)
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.$(echo -n "$ANON_PAYLOAD" | base64 -w 0).$(echo -n "dummy_signature_anon_$INSTANCE_NAME" | base64 -w 0)"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.$(echo -n "$SERVICE_PAYLOAD" | base64 -w 0).$(echo -n "dummy_signature_service_$INSTANCE_NAME" | base64 -w 0)"

# Gerar portas únicas baseadas no hash do nome da instância
HASH=$(echo -n "$INSTANCE_NAME" | md5sum | cut -c1-4)
PORT_SUFFIX=$(printf "%d" 0x$HASH)
PORT_SUFFIX=$(($PORT_SUFFIX % 1000 + 1000)) # Entre 1000-1999

POSTGRES_PORT_EXT=$((5000 + $PORT_SUFFIX))
KONG_HTTP_PORT=$((3000 + ($PORT_SUFFIX % 100)))
KONG_HTTPS_PORT=$((8000 + ($PORT_SUFFIX % 100)))

# ===================================
# CONFIGURAÇÕES DA INSTÂNCIA
# ===================================
export INSTANCE_ID="${INSTANCE_NAME}_${TIMESTAMP}"
export POSTGRES_PASSWORD
export POSTGRES_DB="$INSTANCE_NAME"
export JWT_SECRET
export ANON_KEY
export SERVICE_ROLE_KEY
export DASHBOARD_USERNAME="admin"
export DASHBOARD_PASSWORD
export POSTGRES_PORT=5432
export POSTGRES_PORT_EXT
export KONG_HTTP_PORT
export KONG_HTTPS_PORT

# URLs específicas para esta VPS
export API_EXTERNAL_URL="http://${VPS_IP}:${KONG_HTTP_PORT}"
export SITE_URL="http://${VPS_IP}:3000"
export SUPABASE_PUBLIC_URL="http://${VPS_IP}:${KONG_HTTP_PORT}"
export STUDIO_DEFAULT_ORGANIZATION="$INSTANCE_NAME"
export STUDIO_DEFAULT_PROJECT="$INSTANCE_NAME Production"

# Configurações padrão
export ENABLE_EMAIL_SIGNUP="true"
export ENABLE_EMAIL_AUTOCONFIRM="true"
export ENABLE_ANONYMOUS_USERS="false"
export DISABLE_SIGNUP="false"
export JWT_EXPIRY=3600
export SMTP_ADMIN_EMAIL="admin@${INSTANCE_NAME}.com"
export SMTP_HOST="localhost"
export SMTP_PORT=1025
export SMTP_USER="admin"
export SMTP_PASS="admin"
export SMTP_SENDER_NAME="$INSTANCE_NAME"
export SUPABASE_ANON_KEY=${ANON_KEY}
export SUPABASE_SERVICE_KEY=${SERVICE_ROLE_KEY}
export IMGPROXY_ENABLE_WEBP_DETECTION="true"
export FUNCTIONS_VERIFY_JWT="false"
export DOCKER_SOCKET_LOCATION="/var/run/docker.sock"
export PGRST_DB_SCHEMAS=public,storage,graphql_public

echo "📁 Criando estrutura de diretórios..."

# Navegar para temp-supabase/docker se existir
if [ ! -d "temp-supabase/docker" ]; then
    echo "🔄 Clonando repositório multiple-supabase..."
    git clone https://github.com/MendesCorporation/multiple-supabase.git temp-supabase
fi

cd temp-supabase/docker

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

# Voltar para raiz do projeto
cd ../../

# Criar pasta específica para esta instância
mkdir -p "instances/${INSTANCE_NAME}"

# Copiar arquivos para instância específica
cp temp-supabase/docker/docker-compose-${INSTANCE_ID}.yml "instances/${INSTANCE_NAME}/docker-compose.yml"
cp temp-supabase/docker/.env-${INSTANCE_ID} "instances/${INSTANCE_NAME}/.env"
cp -r temp-supabase/docker/volumes-${INSTANCE_ID} "instances/${INSTANCE_NAME}/volumes"

# Aplicar schema personalizado
cat > "instances/${INSTANCE_NAME}/volumes/db/init/01-schema.sql" << 'SCHEMA_EOF'
-- Schema personalizado para nova instância
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  avatar VARCHAR(255),
  role VARCHAR(50) DEFAULT 'USER',
  is_email_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- RLS habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
SCHEMA_EOF

# Criar arquivo de credenciais
cat > "instances/${INSTANCE_NAME}/CREDENTIALS.md" << CRED_EOF
# 🔐 CREDENCIAIS - ${INSTANCE_NAME}

## 📋 Informações da Instância
- **Nome:** ${INSTANCE_NAME}
- **VPS IP:** ${VPS_IP}
- **Gerada em:** $(date)

## 🌐 URLs de Acesso
- **Frontend:** http://${VPS_IP}:3000
- **API Backend:** http://${VPS_IP}:${KONG_HTTP_PORT}
- **Dashboard Admin:** http://${VPS_IP}:3000

## 🔑 Credenciais de Acesso
- **Dashboard:** admin / ${DASHBOARD_PASSWORD}
- **PostgreSQL:** postgres / ${POSTGRES_PASSWORD}

## 🔧 Configurações Técnicas
- **PostgreSQL Port:** ${POSTGRES_PORT_EXT}
- **API Port:** ${KONG_HTTP_PORT}
- **HTTPS Port:** ${KONG_HTTPS_PORT}

## 🔐 Chaves JWT (para .env)
\`\`\`
VITE_SUPABASE_URL=http://${VPS_IP}:${KONG_HTTP_PORT}
VITE_SUPABASE_ANON_KEY=${ANON_KEY}
\`\`\`

## 🚀 Como iniciar:
\`\`\`bash
cd instances/${INSTANCE_NAME}
docker compose up -d
\`\`\`

⚠️  **IMPORTANTE:** Guarde estas credenciais em local seguro!
CRED_EOF

# Cleanup
rm -rf temp-supabase

echo "✅ Nova instância Supabase gerada com sucesso!"
echo ""
echo "📋 INFORMAÇÕES DA INSTÂNCIA:"
echo "   Nome: $INSTANCE_NAME"
echo "   VPS IP: $VPS_IP"
echo "   Dashboard: http://${VPS_IP}:3000"
echo "   API: http://${VPS_IP}:${KONG_HTTP_PORT}"
echo "   Admin: admin / $DASHBOARD_PASSWORD"
echo ""
echo "📁 Arquivos criados em:"
echo "   instances/${INSTANCE_NAME}/"
echo ""
echo "🔐 Credenciais salvas em:"
echo "   instances/${INSTANCE_NAME}/CREDENTIALS.md"
echo ""
echo "🚀 Para iniciar na VPS:"
echo "   cd instances/${INSTANCE_NAME}"
echo "   docker compose up -d"