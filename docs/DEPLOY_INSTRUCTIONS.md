# 🚀 INSTRUÇÕES DE DEPLOY - SOCIALBIBLIA

## 📋 CHECKLIST PRÉ-DEPLOY

### **1. Configurar Secrets no GitHub:**
```
VPS_HOST=31.97.85.98
VPS_USER=root
VPS_PASSWORD=Nando157940/
```

### **2. Fazer Push para GitHub:**
```bash
git add .
git commit -m "🚀 MIGRAÇÃO: Implementar Supabase self-hosted"
git push origin main
```

### **3. Na VPS, executar uma única vez:**
```bash
# SSH na VPS
ssh root@31.97.85.98

# Navegar para projeto
cd /root/socialbiblia

# Pull das mudanças
git pull origin main

# Instalar dependências frontend
cd apps/web
npm install

# Voltar para raiz e iniciar Supabase
cd ../../supabase
docker compose up -d

# Verificar se tudo está funcionando
docker compose ps
```

### **4. URLs de Acesso:**
- **Frontend:** http://31.97.85.98:3000
- **Supabase Studio:** http://31.97.85.98:3000
- **API Backend:** http://31.97.85.98:3001
- **Admin:** admin / admin

---

## 🔧 ESTRUTURA FINAL DO PROJETO

```
socialbiblia/
├── apps/
│   └── web/                    # Frontend React
│       ├── src/
│       │   ├── lib/
│       │   │   └── supabase.ts # Cliente Supabase
│       │   ├── hooks/
│       │   │   └── useSupabaseAuth.tsx
│       │   └── components/
│       │       ├── LoginForm.tsx
│       │       └── RegisterForm.tsx
│       └── .env.local          # Variáveis ambiente
├── packages/
│   └── shared/                 # Código compartilhado
├── supabase/                   # Instância Supabase ✨
│   ├── docker-compose.yml     # Docker config
│   ├── .env                    # Environment vars
│   └── volumes/                # Dados persistentes
│       └── db/init/
│           └── 01-schema.sql   # Schema inicial
├── scripts/                    # Scripts utilitários
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions
├── BACKUP_SCHEMA.sql           # Backup do schema original
└── MIGRACAO_SUPABASE.md        # Documentação migração
```

---

## ⚡ COMANDOS ÚTEIS

### **Supabase:**
```bash
# Iniciar instância
cd supabase && docker compose up -d

# Ver logs
docker compose logs -f

# Parar instância
docker compose down

# Backup do banco
docker compose exec db pg_dump -U postgres socialbiblia > backup.sql
```

### **Frontend:**
```bash
# Desenvolvimento local
cd apps/web
npm install
npm run dev

# Build para produção
npm run build
```

### **Monitoramento:**
```bash
# Status containers
docker compose ps

# Uso de recursos
docker stats

# Logs em tempo real
docker compose logs -f --tail=50
```

---

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

### **✅ Autenticação Supabase:**
- ✅ Registro com validação rigorosa de senha
- ✅ Login com email/senha
- ✅ Row Level Security (RLS)
- ✅ Dashboard admin (admin/admin)
- ✅ Sessões persistentes

### **✅ Frontend Modernizado:**
- ✅ Hook `useSupabaseAuth` para auth
- ✅ Indicadores visuais de força da senha
- ✅ Validação em tempo real
- ✅ Feedback de erro melhorado
- ✅ Formulários responsivos

### **✅ Infraestrutura:**
- ✅ Docker Compose configurado
- ✅ GitHub Actions para deploy
- ✅ Environment variables
- ✅ Schema SQL com RLS
- ✅ Backup e migração

### **✅ Deploy Automático:**
- ✅ CI/CD com GitHub Actions
- ✅ Deploy incremental
- ✅ Restart automático de containers

---

## 🔐 CREDENCIAIS PADRÃO

- **Supabase Admin:** admin / admin
- **PostgreSQL:** postgres / admin
- **Dashboard:** http://31.97.85.98:3000

---

## 📞 PRÓXIMOS PASSOS

1. **Fazer deploy:** Push para GitHub → Actions executam
2. **Testar:** Acessar URLs e validar funcionalidades
3. **Monitorar:** Verificar logs e performance
4. **Iterar:** Implementar novas features sobre Supabase

**🎉 Sistema pronto para produção!**