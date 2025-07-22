#!/bin/sh

# Script de entrada para API container
echo "🚀 Iniciando API Social Bíblia..."
echo "📅 Data/Hora: $(date)"
echo "🔧 Node.js versão: $(node --version)"
echo "📦 NPM versão: $(npm --version)"

# Verificar arquivos essenciais
echo "📁 Verificando estrutura de arquivos..."
if [ ! -f "package.json" ]; then
  echo "❌ package.json não encontrado!"
  ls -la
  exit 1
fi

if [ ! -f "src/app.js" ] && [ ! -f "build/src/app.js" ] && [ ! -f "app.js" ]; then
  echo "❌ Arquivo app.js não encontrado!"
  echo "📁 Estrutura atual:"
  ls -la
  echo "📁 Conteúdo src/:"
  ls -la src/ 2>/dev/null || echo "Diretório src/ não existe"
  echo "📁 Conteúdo build/:"
  ls -la build/ 2>/dev/null || echo "Diretório build/ não existe"
  exit 1
fi

# Verificar variáveis de ambiente
echo "🔍 Verificando variáveis de ambiente..."
echo "DATABASE_URL: ${DATABASE_URL}"
echo "NODE_ENV: ${NODE_ENV}"
echo "API_PREFIX: ${API_PREFIX}"

# Aguardar banco estar pronto
echo "⏳ Aguardando banco de dados..."
timeout=90
while ! nc -z postgres 5432; do
  echo "⏳ Tentando conectar ao PostgreSQL... ($timeout segundos restantes)"
  sleep 3
  timeout=$((timeout - 3))
  if [ $timeout -le 0 ]; then
    echo "❌ Timeout aguardando banco de dados"
    echo "🔍 Verificando conectividade de rede..."
    ping -c 3 postgres || echo "❌ Não foi possível fazer ping no postgres"
    exit 1
  fi
done
echo "✅ Banco de dados está pronto!"

# Verificar se Prisma client existe
echo "🔧 Verificando cliente Prisma..."
if [ ! -d "node_modules/.prisma" ] && [ ! -d "node_modules/@prisma/client" ]; then
  echo "⚠️ Cliente Prisma não encontrado, gerando..."
  npx prisma generate || {
    echo "❌ Falha crítica ao gerar cliente Prisma!"
    exit 1
  }
else
  echo "✅ Cliente Prisma encontrado"
fi

# Verificar conexão com banco antes de iniciar
echo "🔍 Testando conexão com banco de dados..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ Conexão com banco estabelecida');
    prisma.\$disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar com banco:', err.message);
    process.exit(1);
  });
" || {
  echo "❌ Falha na conexão com banco de dados"
  exit 1
}

# Determinar arquivo principal
APP_FILE=""
if [ -f "src/app.js" ]; then
  APP_FILE="src/app.js"
elif [ -f "build/src/app.js" ]; then
  APP_FILE="build/src/app.js"
elif [ -f "app.js" ]; then
  APP_FILE="app.js"
else
  echo "❌ Nenhum arquivo app.js encontrado!"
  exit 1
fi

# Iniciar aplicação
echo "🌟 Iniciando aplicação..."
echo "🚀 Comando: node $APP_FILE"
exec node "$APP_FILE"