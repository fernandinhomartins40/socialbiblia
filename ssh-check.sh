#!/bin/bash

# Script para verificar status da VPS
VPS_PASSWORD="Nando157940/"
VPS_HOST="31.97.85.98"
VPS_USER="root"
APP_DIR="/opt/biblicai"

echo "=== Conectando na VPS ==="
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'ENDSSH'
echo "Conectado na VPS!"
cd /opt/biblicai

echo ""
echo "=== Verificando diretório atual ==="
pwd
ls -la

echo ""
echo "=== Status dos containers ==="
docker ps

echo ""
echo "=== Docker Compose status ==="
docker-compose ps

echo ""
echo "=== Último commit ==="
git log --oneline -1

echo ""
echo "=== Logs recentes dos containers (últimas 30 linhas) ==="
docker-compose logs --tail 30

echo ""
echo "=== Verificando portas em uso ==="
netstat -tlnp | grep -E ':(3000|3001|5432|6379)'

echo ""
echo "=== Espaço em disco ==="
df -h

echo ""
echo "=== Memória ==="
free -h

ENDSSH

echo "=== Verificação concluída ==="