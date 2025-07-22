#!/bin/bash
# Script para verificar portas disponíveis na VPS Ubuntu 22.04
# Social Bíblia - Verificação de Portas antes do Deploy

set -e

echo "🔍 VERIFICANDO PORTAS DISPONÍVEIS NA VPS"
echo "========================================"
echo "VPS: Ubuntu 22.04"
echo "Data: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Função de log
log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

# Portas que a aplicação precisa usar
REQUIRED_PORTS=(3000 3344 5432 8080 80 443)
OCCUPIED_PORTS=()
AVAILABLE_PORTS=()

log "📋 VERIFICANDO PORTAS NECESSÁRIAS PARA SOCIAL BÍBLIA:"
echo "   • 3000  - Frontend (React)"
echo "   • 3344  - Backend API (Vincent Queimado)"  
echo "   • 5432  - PostgreSQL Database"
echo "   • 8080  - pgAdmin"
echo "   • 80    - HTTP (Nginx)"
echo "   • 443   - HTTPS (Nginx)"
echo ""

# Verificar cada porta necessária
log "🔍 VERIFICANDO STATUS DAS PORTAS..."
for port in "${REQUIRED_PORTS[@]}"; do
    # Verificar se a porta está em uso
    if netstat -tulpn 2>/dev/null | grep -q ":$port "; then
        OCCUPIED_PORTS+=($port)
        SERVICE=$(netstat -tulpn 2>/dev/null | grep ":$port " | awk '{print $1 " " $7}' | head -1)
        echo "❌ Porta $port: OCUPADA ($SERVICE)"
    else
        AVAILABLE_PORTS+=($port)
        echo "✅ Porta $port: DISPONÍVEL"
    fi
done

echo ""

# Mostrar resumo de portas ocupadas
if [ ${#OCCUPIED_PORTS[@]} -gt 0 ]; then
    log "⚠️  PORTAS OCUPADAS ENCONTRADAS:"
    for port in "${OCCUPIED_PORTS[@]}"; do
        echo "   🔴 Porta $port ocupada"
        # Mostrar qual processo está usando a porta
        PROCESS_INFO=$(netstat -tulpn 2>/dev/null | grep ":$port " | head -1)
        if [ ! -z "$PROCESS_INFO" ]; then
            PROCESS_ID=$(echo "$PROCESS_INFO" | awk '{print $7}' | cut -d'/' -f1)
            if [ "$PROCESS_ID" != "-" ] && [ ! -z "$PROCESS_ID" ]; then
                PROCESS_NAME=$(ps -p $PROCESS_ID -o comm= 2>/dev/null || echo "unknown")
                echo "      └─ Processo: $PROCESS_NAME (PID: $PROCESS_ID)"
            fi
        fi
    done
    echo ""
fi

# Mostrar resumo de portas disponíveis
if [ ${#AVAILABLE_PORTS[@]} -gt 0 ]; then
    log "✅ PORTAS DISPONÍVEIS:"
    for port in "${AVAILABLE_PORTS[@]}"; do
        echo "   🟢 Porta $port disponível"
    done
    echo ""
fi

# Verificação detalhada de serviços web
log "🌐 VERIFICANDO SERVIÇOS WEB EXISTENTES:"

# Verificar se Apache está rodando
if systemctl is-active --quiet apache2 2>/dev/null; then
    echo "   🔴 Apache2: ATIVO (pode conflitar com porta 80)"
    echo "      └─ Para parar: sudo systemctl stop apache2"
elif command -v apache2 >/dev/null 2>&1; then
    echo "   🟡 Apache2: INSTALADO mas INATIVO"  
else
    echo "   ✅ Apache2: NÃO INSTALADO"
fi

# Verificar se Nginx está rodando
if systemctl is-active --quiet nginx 2>/dev/null; then
    echo "   🔴 Nginx: ATIVO (pode conflitar com porta 80/443)"
    echo "      └─ Para parar: sudo systemctl stop nginx"
elif command -v nginx >/dev/null 2>&1; then
    echo "   🟡 Nginx: INSTALADO mas INATIVO"
else
    echo "   ✅ Nginx: NÃO INSTALADO"
fi

# Verificar se PostgreSQL está rodando
if systemctl is-active --quiet postgresql 2>/dev/null; then
    echo "   🔴 PostgreSQL: ATIVO (pode conflitar com porta 5432)"
    echo "      └─ Para parar: sudo systemctl stop postgresql"
elif command -v postgres >/dev/null 2>&1 || command -v psql >/dev/null 2>&1; then
    echo "   🟡 PostgreSQL: INSTALADO mas INATIVO"
else
    echo "   ✅ PostgreSQL: NÃO INSTALADO"
fi

echo ""

# Verificar containers Docker em execução
log "🐳 VERIFICANDO CONTAINERS DOCKER:"
if command -v docker >/dev/null 2>&1; then
    if docker ps -q >/dev/null 2>&1; then
        RUNNING_CONTAINERS=$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")
        if [ $(docker ps -q | wc -l) -gt 0 ]; then
            echo "   🔴 CONTAINERS EM EXECUÇÃO:"
            echo "$RUNNING_CONTAINERS"
            echo ""
            
            # Verificar especificamente containers com portas conflitantes
            CONFLICTING_CONTAINERS=$(docker ps --format "{{.Names}}\t{{.Ports}}" | grep -E "(3000|3344|5432|8080|80|443)" || true)
            if [ ! -z "$CONFLICTING_CONTAINERS" ]; then
                echo "   ⚠️  CONTAINERS COM PORTAS CONFLITANTES:"
                echo "$CONFLICTING_CONTAINERS"
                echo ""
            fi
        else
            echo "   ✅ Nenhum container em execução"
        fi
    else
        echo "   ⚠️  Docker não está rodando ou sem permissão"
    fi
else
    echo "   ✅ Docker não instalado"
fi

echo ""

# Verificação de recursos do sistema
log "💾 RECURSOS DO SISTEMA:"
echo "   Memory: $(free -h | grep '^Mem:' | awk '{print $3"/"$2" (used/total)"}')"
echo "   Disk: $(df -h / | tail -1 | awk '{print $3"/"$2" ("$5" used)"}')"
echo "   Load: $(uptime | sed 's/.*load average: //')"
echo ""

# Sugestões baseadas nos resultados
log "💡 SUGESTÕES DE AÇÃO:"

if [ ${#OCCUPIED_PORTS[@]} -eq 0 ]; then
    echo "   🎉 TODAS AS PORTAS ESTÃO DISPONÍVEIS!"
    echo "   ✅ Você pode prosseguir com o deploy da Social Bíblia"
else
    echo "   ⚠️  PORTAS OCUPADAS DETECTADAS"
    echo "   🔧 Opções para resolver:"
    echo ""
    
    for port in "${OCCUPIED_PORTS[@]}"; do
        case $port in
            80|443)
                echo "   🌐 Porta $port (HTTP/HTTPS):"
                echo "      • Parar Apache: sudo systemctl stop apache2"
                echo "      • Parar Nginx: sudo systemctl stop nginx"
                echo "      • Ou usar portas alternativas no docker-compose"
                ;;
            5432)
                echo "   🐘 Porta $port (PostgreSQL):"
                echo "      • Parar PostgreSQL: sudo systemctl stop postgresql"
                echo "      • Ou usar porta alternativa (ex: 5433)"
                ;;
            3000)
                echo "   ⚛️  Porta $port (Frontend):"
                echo "      • Verificar se há aplicação React/Node.js rodando"
                echo "      • Parar processo: sudo fuser -k 3000/tcp"
                echo "      • Ou usar porta alternativa (ex: 3001)"
                ;;
            3344)
                echo "   🔧 Porta $port (Backend API):"
                echo "      • Verificar se há API rodando"
                echo "      • Parar processo: sudo fuser -k 3344/tcp"
                echo "      • Ou usar porta alternativa (ex: 4000)"
                ;;
            8080)
                echo "   🔧 Porta $port (pgAdmin):"
                echo "      • Verificar aplicações web alternativas"
                echo "      • Parar processo: sudo fuser -k 8080/tcp"
                echo "      • Ou usar porta alternativa (ex: 8081)"
                ;;
        esac
        echo ""
    done
fi

# Comandos úteis
log "🛠️  COMANDOS ÚTEIS:"
echo "   • Verificar porta específica: sudo netstat -tulpn | grep :3000"
echo "   • Matar processo na porta: sudo fuser -k 3000/tcp"
echo "   • Ver todos os serviços ativos: sudo systemctl list-units --type=service --state=active"
echo "   • Parar todos containers Docker: docker stop \$(docker ps -q)"
echo "   • Ver logs do sistema: sudo journalctl -f"
echo ""

# Status final
if [ ${#OCCUPIED_PORTS[@]} -eq 0 ]; then
    log "🎉 STATUS: PRONTO PARA DEPLOY!"
    echo "   Todas as portas necessárias estão disponíveis."
    exit 0
else
    log "⚠️  STATUS: AÇÃO NECESSÁRIA"
    echo "   ${#OCCUPIED_PORTS[@]} porta(s) precisam ser liberadas antes do deploy."
    exit 1
fi