# 🚀 MIGRAÇÃO PARA SUPABASE - SOCIALBIBLIA

## 📊 CONTEXTO ATUAL

### **PROJETO:** SocialBiblia - Monorepo React + Node.js + PostgreSQL + Redis
- **VPS:** 31.97.85.98 (senha: Nando157940/)
- **STATUS ATUAL:** Backend Node.js com problemas, Frontend React funcional
- **ESTRUTURA:** Monorepo com apps/web e apps/backend

### **PROBLEMAS IDENTIFICADOS:**
- ❌ Backend Node.js complexo e com bugs
- ❌ Validação de senhas problemática
- ❌ Auth manual com JWT/bcrypt
- ❌ APIs REST criadas manualmente
- ❌ Sem real-time nativo
- ❌ Sem dashboard admin

### **SOLUÇÃO ESCOLHIDA:**
- ✅ Migração para Supabase self-hosted
- ✅ Repositório: https://github.com/MendesCorporation/multiple-supabase
- ✅ Script `generate.bash` para setup automático
- ✅ Manter estrutura monorepo
- ✅ Deploy via GitHub Actions

---

## 📋 PLANO DE MIGRAÇÃO EM 3 ETAPAS

### **🗂️ ETAPA 1: LIMPEZA E ORGANIZAÇÃO**
**Objetivo:** Eliminar backend atual e preparar workspace

#### **1.1 Backup e Documentação:**
- [ ] Backup dos dados PostgreSQL atuais
- [ ] Documentar schema das tabelas existentes
- [ ] Salvar configurações importantes (.env, docker-compose)

#### **1.2 Limpeza do Backend:**
- [ ] Remover pasta `apps/backend/` completamente
- [ ] Limpar docker-compose.yml (manter apenas PostgreSQL temporário)
- [ ] Remover dependências backend do package.json raiz
- [ ] Atualizar .gitignore

#### **1.3 Reorganização Workspace:**
```
socialbiblia/
├── apps/
│   └── web/              # Frontend React (mantém)
├── packages/
│   └── shared/           # Código compartilhado
├── supabase/             # ← Nova pasta para instância
├── docker-compose.yml    # ← Será substituído
└── scripts/              # Scripts de migração
```

#### **1.4 Atualização Frontend:**
- [ ] Remover chamadas para backend Node.js
- [ ] Preparar interfaces para Supabase
- [ ] Instalar @supabase/supabase-js

---

### **🔄 ETAPA 2: CLONE E CONFIGURAÇÃO SUPABASE**
**Objetivo:** Setup da instância Supabase self-hosted

#### **2.1 Clone do Repositório:**
```bash
# Na VPS e local
git clone https://github.com/MendesCorporation/multiple-supabase.git temp-supabase
cd temp-supabase
```

#### **2.2 Configuração do generate.bash:**
```bash
# Customizar generate.bash com:
ADMIN_EMAIL="admin@socialbiblia.com"
ADMIN_PASSWORD="admin"
PROJECT_NAME="socialbiblia"
DATABASE_PASSWORD="admin"
JWT_SECRET_KEY="[gerado automaticamente]"
INSTANCE_PORT_BASE="3000"
```

#### **2.3 Geração da Instância:**
```bash
sh generate.bash
# ✅ Cria instância completa
# ✅ Portas: 3000 (frontend), 3001 (API), 5432 (DB)
# ✅ Admin: admin/admin
```

#### **2.4 Migração para Workspace:**
- [ ] Copiar pasta `supabase/` gerada para workspace SocialBiblia
- [ ] Adaptar docker-compose.yml
- [ ] Configurar .env com URLs corretas
- [ ] Testar acesso ao dashboard admin

#### **2.5 Migração de Dados:**
- [ ] Executar backup PostgreSQL na nova instância
- [ ] Criar tabelas via SQL migrations
- [ ] Configurar Row Level Security (RLS)
- [ ] Testar Auth via dashboard

---

### **🎨 ETAPA 3: MIGRAÇÃO DO FRONTEND**
**Objetivo:** Conectar React ao Supabase

#### **3.1 Setup Cliente Supabase:**
```typescript
// packages/shared/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://31.97.85.98:3001'
const supabaseKey = 'eyJ...' // Chave da instância

export const supabase = createClient(supabaseUrl, supabaseKey)
```

#### **3.2 Migração da Autenticação:**
- [ ] Substituir `usePlugbaseAuth` por `useSupabaseAuth`
- [ ] Atualizar LoginForm para supabase.auth.signIn
- [ ] Atualizar RegisterForm para supabase.auth.signUp
- [ ] Remover componentes auth antigos

#### **3.3 Migração das APIs:**
```typescript
// Antes (backend manual)
await fetch('/api/auth/register', {...})

// Depois (Supabase)
await supabase.auth.signUp({...})
```

#### **3.4 Testes e Validação:**
- [ ] Testar registro de usuário
- [ ] Testar login/logout
- [ ] Validar redirecionamentos
- [ ] Confirmar dados no dashboard admin

---

## ⚙️ CONFIGURAÇÃO GITHUB ACTIONS

### **Deploy Incremental:**
```yaml
# .github/workflows/deploy.yml
name: Deploy SocialBiblia
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to VPS
        run: |
          # Deploy apenas alterações
          rsync -avz --delete ./apps/web/ user@vps:/app/web/
          docker-compose restart frontend
```

---

## 🎯 VANTAGENS DA MIGRAÇÃO

### **Antes (Backend Node.js):**
- ❌ Setup complexo com Prisma + Auth manual
- ❌ Validações problemáticas
- ❌ Sem dashboard admin
- ❌ Sem real-time nativo
- ❌ APIs REST manuais

### **Depois (Supabase):**
- ✅ Setup automático com generate.bash
- ✅ Auth robusto out-of-the-box
- ✅ Dashboard admin pronto
- ✅ Real-time WebSockets nativos
- ✅ APIs REST automáticas
- ✅ Row Level Security
- ✅ Storage para arquivos
- ✅ Edge Functions se necessário

---

## 📚 RECURSOS E DOCUMENTAÇÃO

### **Links Importantes:**
- **Repo Multiple Supabase:** https://github.com/MendesCorporation/multiple-supabase
- **Supabase Docs:** https://supabase.com/docs
- **Cliente JS:** https://supabase.com/docs/reference/javascript
- **Auth Guide:** https://supabase.com/docs/guides/auth

### **Comandos Úteis:**
```bash
# Gerar nova instância
sh generate.bash

# Ver logs Supabase
docker-compose logs supabase

# Acessar dashboard
http://31.97.85.98:3000

# Backup PostgreSQL
pg_dump -h localhost -p 5432 -U postgres socialbiblia > backup.sql
```

---

## ✅ CHECKLIST FINAL

### **Pré-migração:**
- [ ] Backup dados atuais
- [ ] Documentar schema atual
- [ ] Testar generate.bash localmente

### **Migração:**
- [ ] Limpeza completa backend Node.js
- [ ] Setup Supabase instância
- [ ] Migração frontend para cliente Supabase
- [ ] Configuração GitHub Actions

### **Pós-migração:**
- [ ] Testes completos auth
- [ ] Validação dashboard admin
- [ ] Deploy na VPS
- [ ] Documentação atualizada

---

**🎯 RESULTADO ESPERADO:**
Sistema SocialBiblia com backend Supabase robusto, frontend React otimizado, monorepo mantido, deploy automático e admin dashboard funcional!