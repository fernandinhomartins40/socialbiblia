# Social Bíblia - Monorepo

Uma aplicação de rede social cristã com integração de IA para orientação espiritual e estudo bíblico.

## 🏗️ Arquitetura do Monorepo

```
socialbiblia/                          # 📦 Monorepo Root
├── 📱 apps/                           # Applications
│   ├── 🔧 backend/                    # Vincent Queimado Express + Prisma + TypeScript
│   │   ├── src/                       # Source code
│   │   ├── prisma/                    # Database schema & migrations  
│   │   ├── __test__/                  # Unit tests
│   │   └── docs/                      # API documentation (Swagger)
│   │
│   └── 🌐 web/                        # React + Vite Frontend
│       ├── src/                       # Source code
│       │   ├── components/            # React components
│       │   ├── pages/                 # Route pages  
│       │   ├── hooks/                 # Custom hooks
│       │   └── lib/                   # Utilities & API client
│       └── dist/                      # Build output (ignored)
│
├── ⚙️ configs/                        # Configuration files
│   └── 🐳 docker/                     # Docker configurations
│       ├── Dockerfile.backend         # Backend container
│       ├── Dockerfile.web            # Frontend container
│       └── nginx-vps.conf            # Nginx reverse proxy
│
├── 📜 scripts/                        # Automation scripts
│   ├── deploy-vps.sh                 # VPS deployment
│   └── test-local.sh                 # Local testing
│
├── 📚 docs/                          # Documentation
├── 🐳 docker-compose.new.yml         # Production Docker setup
└── 📦 package.json                   # Monorepo configuration
```

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- npm 9+
- Docker e Docker Compose (opcional, para banco de dados)

### Instalação

1. **Clone o repositório:**
```bash
git clone <repository-url>
cd socialbiblia
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure o banco de dados (usando Docker):**
```bash
docker-compose up -d postgres
```

4. **Configure as variáveis de ambiente:**
```bash
# Backend
cp apps/backend/.env.example apps/backend/.env
# Edite apps/backend/.env com suas configurações
```

5. **Execute as migrações do banco:**
```bash
cd apps/backend && npm run prisma:migrate
```

6. **Inicie o ambiente de desenvolvimento:**
```bash
npm run dev
```

Isso iniciará:
- Frontend em `http://localhost:3000`
- Backend em `http://localhost:4000`

## 📋 Scripts Disponíveis

### Comandos Raiz (executa em todos os workspaces)

- `npm run dev` - Inicia frontend e backend simultaneamente
- `npm run build` - Build de produção de frontend e backend
- `npm run lint` - Executa lint em todos os projetos
- `npm run typecheck` - Verifica tipos em todos os projetos
- `npm run test` - Executa testes em todos os projetos

### Comandos Específicos

- `npm run dev:web` - Inicia apenas o frontend
- `npm run dev:api` - Inicia apenas o backend
- `npm run build:web` - Build do frontend
- `npm run build:api` - Build do backend

### Comandos do Backend (API)

```bash
# Navegar para o backend
cd apps/api

# Comandos do Prisma
npm run prisma:migrate     # Executar migrações
npm run prisma:generate    # Gerar cliente Prisma
npm run prisma:seed        # Popular banco com dados iniciais
npm run prisma:reset       # Reset completo do banco

# Comandos de desenvolvimento
npm run dev                # Modo desenvolvimento com nodemon
npm run build              # Build de produção
npm run start              # Executar build de produção
npm run lint               # Linting
npm run test               # Testes unitários
```

## 🏛️ Funcionalidades Principais

### Frontend (React + Vite)
- ⚛️ React 18 com TypeScript
- 🎨 TailwindCSS + shadcn/ui
- 🔄 React Query para gerenciamento de estado
- 🌐 Wouter para roteamento
- 📱 Design responsivo

### Backend (Express + TypeScript)
- 🚀 Express com TypeScript
- 🗃️ Prisma ORM para banco de dados
- 🔐 Autenticação JWT + Passport
- 📧 Envio de emails (Nodemailer)
- 🛡️ Middleware de segurança (Helmet, CORS, Rate Limiting)
- 📝 Logging com Winston
- 🧪 Testes com Jest
- 📚 Documentação Swagger/OpenAPI

### Package Shared
- 🔗 Types e schemas compartilhados
- ✅ Validação com Zod
- 📦 Utilitários comuns

### Funcionalidades da Aplicação
- 👥 Sistema de posts e comentários
- 📖 Busca inteligente na Bíblia
- 🤖 Chat com IA para orientação espiritual
- 📚 Favoritos de versículos
- 👪 Sistema de comunidades
- 👤 Perfis de usuário
- 🔐 Autenticação completa

## 🛠️ Desenvolvimento

### Estrutura dos Apps

#### Frontend (`apps/web`)
```
src/
├── components/          # Componentes React
├── hooks/              # Custom hooks
├── lib/                # Utilitários e configurações
├── pages/              # Páginas da aplicação
└── types/              # Tipos específicos do frontend
```

#### Backend (`apps/api`)
```
src/
├── controllers/        # Controladores das rotas
├── middlewares/        # Middlewares customizados
├── routes/            # Definição das rotas
├── services/          # Lógica de negócio
├── dao/               # Data Access Objects
├── config/            # Configurações da aplicação
├── utils/             # Utilitários
└── schemas/           # Schemas de validação
```

#### Package Shared (`packages/shared`)
```
src/
├── schemas/           # Schemas Zod compartilhados
├── types/             # Tipos TypeScript compartilhados
└── index.ts           # Export principal
```

### Banco de Dados

O projeto utiliza PostgreSQL com Prisma ORM. O schema está definido em `apps/api/prisma/schema.prisma`.

**Comandos úteis do Prisma:**

```bash
cd apps/api

# Criar nova migração
npx prisma migrate dev --name nome_da_migracao

# Aplicar migrações em produção
npx prisma migrate deploy

# Visualizar banco de dados
npx prisma studio

# Reset completo (desenvolvimento apenas)
npx prisma migrate reset
```

## 🐳 Docker

Para desenvolvimento com Docker:

```bash
# Iniciar apenas o banco
docker-compose up -d postgres

# Iniciar banco + pgAdmin
docker-compose up -d postgres pgadmin

# Ver logs
docker-compose logs -f postgres

# Parar serviços
docker-compose down
```

**pgAdmin:** Acesse em `http://localhost:8080`
- Email: `admin@socialbiblia.com`
- Senha: `admin`

## 🔧 Configurações

### Variáveis de Ambiente

O arquivo `.env.example` no backend contém todas as variáveis necessárias. Principais configurações:

- `DATABASE_URL`: String de conexão PostgreSQL
- `JWT_SECRET_*`: Chaves secretas para JWT
- `CORS_ALLOW_ORIGIN`: Origem permitida para CORS
- `APP_URL_PORT`: Porta do servidor backend

### TypeScript

Cada aplicação tem seu próprio `tsconfig.json` configurado para suas necessidades específicas.

## 📦 Deploy

### Deploy Automático (VPS)

O projeto está configurado com deploy automático via GitHub Actions para a VPS Hostinger.

**Configuração necessária:**

1. **Secret no GitHub:**
   - `VPS_PASSWORD`: Senha da VPS (já configurada no repositório)

2. **Deploy automático:**
   - Push para branch `main` → Deploy automático
   - Deploy manual via GitHub Actions

**URLs de acesso após deploy:**
- **Principal:** `http://31.97.85.98` (via Nginx - se disponível)
- **Frontend:** `http://31.97.85.98:3000`
- **API:** `http://31.97.85.98:4000`
- **pgAdmin:** `http://31.97.85.98:8080`

### Deploy Manual (Docker)

```bash
# 1. Configurar variáveis de ambiente
cp .env.example .env.production
# Editar .env.production com suas configurações

# 2. Build e iniciar
docker compose -f docker-compose.production.yml up -d --build

# 3. Executar migrações
docker compose -f docker-compose.production.yml exec api npm run prisma:migrate deploy

# 4. Seed inicial (opcional)
docker compose -f docker-compose.production.yml exec api npm run prisma:seed
```

### Deploy Local (Desenvolvimento)

```bash
# Backend
cd apps/api
npm run build
npm run start

# Frontend
cd apps/web
npm run build
# Servir arquivos da pasta dist/
```

### Monitoramento

```bash
# Ver logs
docker compose -f docker-compose.production.yml logs -f

# Status dos containers
docker compose -f docker-compose.production.yml ps

# Uso de recursos
docker stats
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Desenvolvido com ❤️ para a comunidade cristã**