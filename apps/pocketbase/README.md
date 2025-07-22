# PocketBase Backend - Social Bíblia

## 🚀 O que é PocketBase?

PocketBase é uma solução de backend **ultra-simples** que resolve todos os problemas que tivemos com Express + Prisma:

- ✅ **Executável único** - Sem npm install, sem build, sem dependências
- ✅ **SQLite embarcado** - Sem PostgreSQL, sem configuração de banco
- ✅ **Admin UI visual** - Gerenciar dados sem código
- ✅ **API REST automática** - Endpoints gerados automaticamente
- ✅ **Authentication completa** - JWT, OAuth, tudo funciona
- ✅ **Real-time** - WebSocket built-in
- ✅ **File upload** - Storage integrado

## 📋 Como usar

### 1. Primeira configuração (apenas uma vez)

1. Acesse: `http://31.97.85.98:8080/_/`
2. Crie seu usuário admin
3. Configure as collections (tabelas) necessárias

### 2. Collections necessárias para Social Bíblia

#### **Users Collection**
```
Campos:
- email (email, required, unique)
- name (text, required)
- phone (text)
- avatar (file)
- accountName (text)
- accountLocationState (text)
- accountType (select: "free", "premium") - default: "free"
- isRegistered (bool) - default: false
- isDisabled (bool) - default: false
```

#### **Posts Collection**
```
Campos:
- title (text, required)
- content (editor)
- author (relation to Users)
- created (datetime, auto)
- updated (datetime, auto)
```

### 3. API Endpoints automáticos

PocketBase cria automaticamente:

```
# Auth
POST /api/collections/users/auth-with-password
POST /api/collections/users/request-password-reset
POST /api/collections/users/confirm-password-reset

# Users CRUD
GET    /api/collections/users/records
POST   /api/collections/users/records
GET    /api/collections/users/records/{id}
PATCH  /api/collections/users/records/{id}
DELETE /api/collections/users/records/{id}

# Posts CRUD  
GET    /api/collections/posts/records
POST   /api/collections/posts/records
GET    /api/collections/posts/records/{id}
PATCH  /api/collections/posts/records/{id}
DELETE /api/collections/posts/records/{id}

# Real-time
/api/realtime (WebSocket)
```

### 4. Frontend Integration

```typescript
// No frontend (apps/web), instale o SDK do PocketBase:
npm install pocketbase

// Configure o cliente:
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://31.97.85.98:8080');

// Exemplo de login:
const authData = await pb.collection('users').authWithPassword(
    'user@example.com',
    'password123'
);

// Exemplo de CRUD:
const posts = await pb.collection('posts').getFullList();
const newPost = await pb.collection('posts').create({
    title: 'Meu post',
    content: 'Conteúdo aqui',
    author: pb.authStore.model?.id
});
```

## 🎯 Vantagens sobre Express/Prisma

| Recurso | Express+Prisma | PocketBase |
|---------|----------------|------------|
| Complexidade | 🔴 Alta | 🟢 Baixa |
| Deploy | 🔴 Problemático | 🟢 Trivial |
| Manutenção | 🔴 Constante | 🟢 Mínima |
| Admin UI | ❌ Não tem | ✅ Built-in |
| Real-time | 🔴 Manual | 🟢 Built-in |
| Auth | 🔴 Manual | 🟢 Built-in |
| File Upload | 🔴 Manual | 🟢 Built-in |
| Backup | 🔴 Complexo | 🟢 Um arquivo |

## 🔧 Comandos úteis

```bash
# Iniciar PocketBase local
./pocketbase serve

# Backup do banco
cp pb_data/data.db backup-$(date +%Y%m%d).db

# Ver logs
docker logs socialbiblia_pocketbase

# Acessar container
docker exec -it socialbiblia_pocketbase sh
```

## 📚 Documentação oficial

- [PocketBase Docs](https://pocketbase.io/docs/)
- [JavaScript SDK](https://github.com/pocketbase/js-sdk)
- [API Reference](https://pocketbase.io/docs/api-records/)