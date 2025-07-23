# 🚀 Deploy para VPS - Biblicai Frontend

## ✅ Sistema de Deploy Atualizado

O sistema de deploy foi **completamente atualizado** para funcionar apenas com o frontend React, já que o backend foi removido e substituído pelo Plugbase.

## 📁 Arquivos de Deploy

### **Principais**
- `Dockerfile` - Configuração Docker otimizada para produção
- `docker-compose.yml` - Orquestração completa (frontend + backend)
- `docker-compose.frontend-only.yml` - Apenas frontend
- `docker-entrypoint.sh` - Script de inicialização do container

### **Scripts**
- `scripts/deploy-vps.sh` - Deploy local na VPS
- `scripts/deploy-remote.sh` - Deploy remoto via SSH
- `scripts/test-build.sh` - Teste de build local

### **Configurações**
- `apps/web/.env.production` - Variáveis de produção
- `apps/web/.env.example` - Exemplo para desenvolvimento
- `env.example` - Configurações de deploy VPS

---

## 🎯 Como Fazer Deploy

### **1. Deploy Local (Teste)**

```bash
# Testar build primeiro
./scripts/test-build.sh

# Deploy local
./scripts/deploy-vps.sh

# Verificar
curl http://localhost:3000/health
```

### **2. Deploy Remoto na VPS**

```bash
# Configurar VPS
export VPS_HOST=192.168.1.100  # Seu IP
export VPS_USER=root           # Seu usuário
export SSH_KEY=~/.ssh/id_rsa   # Sua chave

# Deploy completo
./scripts/deploy-remote.sh

# Apenas sincronizar código
./scripts/deploy-remote.sh sync

# Ver logs remotos
./scripts/deploy-remote.sh logs
```

### **3. Deploy com Docker Compose**

```bash
# Frontend + Backend Plugbase
docker-compose up -d

# Apenas Frontend
docker-compose -f docker-compose.frontend-only.yml up -d

# Ver logs
docker-compose logs -f
```

---

## ⚙️ Configurações

### **Variáveis de Ambiente VPS**

Copie `env.example` para `.env` e configure:

```bash
VPS_HOST=seu-ip-ou-dominio
VPS_USER=ubuntu
VPS_PORT=22
VPS_PATH=/opt/biblicai
SSH_KEY=/home/user/.ssh/id_rsa
```

### **Configuração Nginx**

O nginx está configurado para:
- ✅ Servir arquivos estáticos com cache otimizado
- ✅ SPA routing (React Router)
- ✅ Proxy para API `/api` → backend Plugbase
- ✅ WebSocket support `/socket.io`
- ✅ Security headers
- ✅ Health check endpoint `/health`

### **Portas**

- **Frontend:** 3000
- **Backend Plugbase:** 3001 (quando via Docker)
- **API Proxy:** `/api` → backend:3000

---

## 🔧 Estrutura Docker

### **Multi-stage Build**
```dockerfile
# Stage 1: Build da aplicação
FROM node:18-alpine AS builder
# ... build process

# Stage 2: Produção com nginx
FROM nginx:alpine
# ... nginx + arquivos buildados
```

### **Otimizações**
- ✅ Imagem final otimizada (apenas nginx + arquivos estáticos)
- ✅ Health checks automáticos
- ✅ Logs persistentes via volumes
- ✅ Restart automático
- ✅ Cache inteligente de assets

---

## 🛡️ Segurança

### **Headers de Segurança**
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HTTPS)

### **CORS**
- Configurado para APIs externas
- Headers permitidos: `Authorization`, `Content-Type`
- Métodos: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`

---

## 📊 Monitoramento

### **Health Checks**
```bash
# Local
curl http://localhost:3000/health

# Remoto
curl http://seu-ip:3000/health
```

### **Logs**
```bash
# Container local
docker logs -f biblicai-frontend

# VPS remota
./scripts/deploy-remote.sh logs

# Nginx logs (dentro do container)
tail -f /var/log/nginx/biblicai_access.log
```

### **Status**
```bash
# Local
./scripts/deploy-vps.sh status

# Remoto
./scripts/deploy-remote.sh status
```

---

## 🚨 Troubleshooting

### **Build Falha**
```bash
# Limpar cache
rm -rf node_modules apps/web/node_modules apps/web/dist
npm install
npm run build:web
```

### **Container Não Inicia**
```bash
# Ver logs detalhados
docker logs biblicai-frontend

# Verificar configuração nginx
docker exec biblicai-frontend nginx -t
```

### **API Não Conecta**
1. Verificar se backend Plugbase está rodando
2. Conferir configuração de proxy no nginx
3. Verificar variáveis de ambiente
4. Testar conectividade: `curl http://backend:3000/api/health`

### **Deploy Remoto Falha**
1. Verificar conexão SSH: `ssh user@ip`
2. Verificar Docker na VPS: `docker --version`
3. Verificar permissões: `chmod +x scripts/*.sh`
4. Verificar logs: `./scripts/deploy-remote.sh logs`

---

## 🎉 Deploy Pronto!

Após o deploy bem-sucedido:

- **Frontend:** http://seu-ip:3000
- **Health Check:** http://seu-ip:3000/health
- **API:** http://seu-ip:3000/api (proxy para Plugbase)

### **Comandos Úteis**
```bash
# Status geral
./scripts/deploy-vps.sh status

# Reiniciar
docker restart biblicai-frontend

# Atualizar
./scripts/deploy-remote.sh

# Logs em tempo real
./scripts/deploy-remote.sh logs
```

**Seu frontend está pronto para produção! 🚀**