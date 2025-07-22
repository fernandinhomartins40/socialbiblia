#!/bin/sh

# Script de entrada para API container
echo "🚀 Iniciando API Social Bíblia..."

# Aguardar banco estar pronto
echo "⏳ Aguardando banco de dados..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "✅ Banco de dados está pronto!"

# Gerar cliente Prisma se necessário
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

# Iniciar aplicação
echo "🌟 Iniciando aplicação..."
exec node src/app.js