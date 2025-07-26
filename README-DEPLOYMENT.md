# 🚀 Guia de Deploy - SocialBiblia

## 📋 Pré-requisitos

### Sistema
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose

### Variáveis de Ambiente
Copie `.env.example` para `.env` e configure:

```bash
# Backend
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/socialbiblia
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
CORS_ORIGIN=https://yourdomain.com

# Frontend
VITE_API_URL=https://api.yourdomain.com
```

## 🐳 Deploy com Docker

### 1. Build e Deploy
```bash
# Build todas as imagens
docker-compose build

# Iniciar todos os serviços
docker-compose up -d

# Verificar status
docker-compose ps
```

### 2. Configuração Inicial
```bash
# Executar migrações
npm run db:migrate

# Popular dados iniciais (opcional)
npm run db:seed
```

### 3. Verificação de Saúde
```bash
# Verificar todos os serviços
npm run health-check

# Verificar logs
docker-compose logs -f
```

## 🔧 Deploy Manual

### Backend
```bash
cd apps/backend
npm ci
npm run build
npm run start:prod
```

### Frontend
```bash
cd apps/web
npm ci
npm run build
npm run preview
```

## 📊 Monitoramento

### Health Checks
- Backend: `http://localhost:3001/health`
- Frontend: `http://localhost:3000`
- Database: Verificar conexão PostgreSQL

### Métricas
- API Docs: `http://localhost:3001/api-docs`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3002`

## 🔄 Rollback

### Rollback Automático
```bash
npm run rollback
```

### Rollback Manual
```bash
# Parar serviços
docker-compose down

# Restaurar backup
pg_restore -d socialbiblia backup.sql

# Reiniciar versão anterior
git checkout <previous-commit>
docker-compose up -d --build
```

## 🛡️ Segurança

### SSL/TLS
```bash
# Com Certbot
certbot --nginx -d yourdomain.com
```

### Firewall
```bash
# UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 📈 Performance

### Otimizações
- CDN para assets estáticos
- Cache com Redis
- Rate limiting configurado
- Compressão gzip ativada

### Escalabilidade
- Horizontal: Adicionar mais containers
- Vertical: Aumentar recursos dos containers

## 🚨 Troubleshooting

### Problemas Comuns

#### Erro de Conexão com Banco
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql
sudo systemctl restart postgresql

# Verificar conexão
psql -h localhost -U user -d socialbiblia
```

#### Erro de Porta em Uso
```bash
# Verificar processos
lsof -i :3001
kill -9 <PID>
```

#### Erro de Permissões
```bash
# Fixar permissões
sudo chown -R $USER:$USER .
chmod +x scripts/*.sh
```

## 📞 Suporte

### Logs
```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f web

# Database logs
docker-compose logs -f postgres
```

### Contato
- Email: support@socialbiblia.com
- Issues: GitHub Issues
- Discord: SocialBiblia Community
