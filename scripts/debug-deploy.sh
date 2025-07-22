#!/bin/bash
# Script de Debug Reduzido para Deploy - Biblicai
# Captura apenas informações críticas para diagnóstico

echo "==========================================="
echo "🔍 BIBLICAI DEPLOY DEBUG REPORT"
echo "==========================================="
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ====================================
# INFORMAÇÕES DO SISTEMA
# ====================================
echo "📊 SISTEMA:"
echo "  OS: $(uname -a | cut -d' ' -f1-3)"
echo "  Memory: $(free -h | grep '^Mem:' | awk '{print $3"/"$2}')"
echo "  Disk: $(df -h / | tail -1 | awk '{print $3"/"$2}')"
echo ""

# ====================================
# DOCKER STATUS
# ====================================
echo "🐳 DOCKER:"
if command -v docker >/dev/null 2>&1; then
  echo "  Version: $(docker --version | cut -d' ' -f3 | tr -d ',')"
  echo "  Compose: $(docker compose version 2>/dev/null | grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+' || echo 'Not found')"
  if docker info >/dev/null 2>&1; then
    echo "  Status: ✅ Running"
  else
    echo "  Status: ❌ Not running"
  fi
else
  echo "  Status: ❌ Not installed"
fi
echo ""

# ====================================
# PORTAS EM USO
# ====================================
echo "🔌 PORTAS CRÍTICAS:"
for port in 3000 3344 5432 8080; do
  if netstat -tuln 2>/dev/null | grep -q ":$port "; then
    echo "  Port $port: ❌ Em uso"
  else
    echo "  Port $port: ✅ Livre"
  fi
done
echo ""

# ====================================
# CONTAINERS BIBLICAI
# ====================================
echo "📦 CONTAINERS BIBLICAI:"
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  biblicai_containers=$(docker ps -a --format "{{.Names}} {{.Status}}" | grep biblicai | head -5)
  if [ -n "$biblicai_containers" ]; then
    echo "$biblicai_containers" | while read name status; do
      echo "  $name: $status"
    done
  else
    echo "  Nenhum container Biblicai encontrado"
  fi
else
  echo "  Docker não disponível para verificação"
fi
echo ""

# ====================================
# ARQUIVOS CRÍTICOS
# ====================================
echo "📁 ARQUIVOS CRÍTICOS:"
critical_files=(
  "docker-compose.new.yml"
  ".env.production"
  "apps/backend/package.json"
  "apps/web/package.json"
  "configs/docker/Dockerfile.backend"
  "configs/docker/Dockerfile.web"
)

for file in "${critical_files[@]}"; do
  if [ -f "$file" ]; then
    size=$(ls -lh "$file" | awk '{print $5}')
    echo "  ✅ $file ($size)"
  else
    echo "  ❌ $file (Missing)"
  fi
done
echo ""

# ====================================
# LOGS DOS ÚLTIMOS CONTAINERS (se existirem)
# ====================================
echo "📋 ÚLTIMOS LOGS CRÍTICOS:"
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  if docker ps -a --format "{{.Names}}" | grep -q biblicai; then
    echo "--- POSTGRES LOGS (últimas 3 linhas) ---"
    docker logs biblicai_postgres 2>&1 | tail -3 || echo "Container biblicai_postgres não encontrado"
    echo ""
    echo "--- API LOGS (últimas 3 linhas) ---"
    docker logs biblicai_api 2>&1 | tail -3 || echo "Container biblicai_api não encontrado"
    echo ""
    echo "--- WEB LOGS (últimas 3 linhas) ---"
    docker logs biblicai_web 2>&1 | tail -3 || echo "Container biblicai_web não encontrado"
  else
    echo "Nenhum container Biblicai ativo para mostrar logs"
  fi
else
  echo "Docker não disponível para mostrar logs"
fi
echo ""

# ====================================
# HEALTH CHECKS
# ====================================
echo "🔍 HEALTH CHECKS:"
if curl -f http://localhost:3344/api/info >/dev/null 2>&1; then
  echo "  API (3344): ✅ Respondendo"
else
  echo "  API (3344): ❌ Não responde"
fi

if curl -f http://localhost:3000 >/dev/null 2>&1; then
  echo "  Frontend (3000): ✅ Respondendo"
else
  echo "  Frontend (3000): ❌ Não responde"
fi

if curl -f http://localhost:8080 >/dev/null 2>&1; then
  echo "  pgAdmin (8080): ✅ Respondendo"
else
  echo "  pgAdmin (8080): ❌ Não responde"
fi
echo ""

# ====================================
# DIAGNÓSTICO FINAL
# ====================================
echo "🎯 DIAGNÓSTICO:"
issues=0

# Verificar se Docker está funcionando
if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "  ❌ Docker não está funcionando"
  issues=$((issues + 1))
fi

# Verificar arquivos críticos
for file in "${critical_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "  ❌ Arquivo crítico missing: $file"
    issues=$((issues + 1))
  fi
done

# Verificar portas ocupadas incorretamente
for port in 3000 3344 5432; do
  if netstat -tuln 2>/dev/null | grep -q ":$port " && ! docker ps --format "{{.Names}}" 2>/dev/null | grep -q biblicai; then
    echo "  ❌ Porta $port ocupada por processo não-Biblicai"
    issues=$((issues + 1))
  fi
done

if [ $issues -eq 0 ]; then
  echo "  ✅ Nenhum problema crítico detectado"
else
  echo "  ❌ $issues problemas detectados"
fi

echo ""
echo "==========================================="
echo "🏁 FIM DO RELATÓRIO DEBUG"
echo "==========================================="