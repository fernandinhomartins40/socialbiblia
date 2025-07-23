# 🚀 Plugbase Backend

Backend plugável, enterprise-ready e reutilizável construído com TypeScript, Express.js e Prisma.

## ✨ Características Principais

- **🔌 Arquitetura Plugável**: Sistema de plugins dinâmico com carregamento automático
- **⚙️ Plugin Manager**: Gerenciamento completo de plugins com hooks e dependências
- **🔄 Hot Reload**: Habilitar/desabilitar plugins em runtime
- **🎯 TypeScript**: Tipagem forte e melhor experiência de desenvolvimento
- **🔐 Autenticação JWT**: Sistema completo com refresh tokens
- **🛡️ Rate Limiting**: Proteção contra abuso de API por endpoint
- **⚡ Cache Redis**: Performance otimizada para consultas frequentes
- **📊 Logging Estruturado**: Sistema avançado de logs com códigos de erro
- **✅ Validação Robusta**: Validação de dados com Zod
- **📖 Documentação OpenAPI**: API completamente documentada com Swagger
- **🧪 Testes Unitários**: Suite de testes com Jest e coverage
- **🔗 Connection Pooling**: Otimização de conexões com banco de dados
- **🔧 Middleware Avançado**: Rate limiting, autenticação, validação e error handling
- **🛡️ Segurança Enterprise**: Headers de segurança, CORS, validação rigorosa

## 📋 Índice

- [🚀 Instalação Rápida](#-instalação-rápida)
- [📁 Estrutura do Projeto](#-estrutura-do-projeto)
- [🔧 Configuração](#-configuração)
- [🐳 Docker](#-docker)
- [📡 APIs](#-apis)
- [🔐 Autenticação](#-autenticação)
- [🧪 Testes](#-testes)
- [🚀 Deploy](#-deploy)
- [📖 Documentação](#-documentação)
- [🔌 Sistema de Plugins](#-sistema-de-plugins)
- [🛡️ Segurança](#-segurança)
- [⚡ Performance](#-performance)
- [📊 Monitoramento](#-monitoramento)

## 🚀 Instalação Rápida

### Pré-requisitos
- Node.js >= 18.0.0
- PostgreSQL >= 13.0
- Redis >= 6.0
- npm ou yarn

### Instalação Local
```bash
# 1. Clone o repositório
git clone <repository-url>
cd plugbase/backend

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/plugbase"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV="development"

# Redis
REDIS_URL="redis://localhost:6379"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL="info"

# Plugins (opcional - configuração avançada)
PLUGINS_CONFIG='{"auth":{"enabled":true},"users":{"enabled":true},"posts":{"enabled":true},"products":{"enabled":true},"health":{"enabled":true},"example":{"enabled":false}}'
```

```bash
# 4. Configure o banco de dados
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# 5. Inicie o servidor
npm run dev
```

### Instalação com Docker
```bash
# 1. Configure as variáveis de ambiente
cp .env.example .env

# 2. Inicie com Docker Compose
docker-compose up -d

# 3. Configure o banco de dados
docker-compose exec backend npx prisma migrate dev --name init
docker-compose exec backend npx prisma db seed
```

## 📁 Estrutura do Projeto

```
src/
├── core/              # Configurações centrais
│   ├── config.ts     # Configurações da aplicação
│   ├── database.ts   # Configuração do Prisma
│   ├── plugin-manager.ts # Gerenciador de plugins
│   └── router.ts     # Roteador principal (dinâmico)
├── middleware/        # Middlewares customizados
│   ├── auth.ts       # Autenticação e autorização
│   ├── errorHandler.ts # Tratamento de erros
│   ├── rateLimiting.ts # Rate limiting por endpoint
│   └── validation.ts  # Validação de dados
├── modules/           # Módulos da aplicação (plugins)
│   ├── auth/         # Plugin Autenticação JWT
│   │   ├── index.ts          # Plugin principal
│   │   ├── auth.controller.ts
│   │   ├── auth.routes.ts
│   │   └── auth.service.ts
│   ├── users/        # Plugin Gerenciamento de usuários
│   │   ├── index.ts          # Plugin principal
│   │   ├── users.controller.ts
│   │   ├── users.routes.ts
│   │   └── users.service.ts
│   ├── posts/        # Plugin Gerenciamento de posts
│   │   ├── index.ts          # Plugin principal
│   │   ├── posts.controller.ts
│   │   ├── posts.routes.ts
│   │   └── posts.service.ts
│   ├── products/     # Plugin Produtos (Schema Modular)
│   │   ├── index.ts          # Plugin principal
│   │   ├── schema.sql        # Schema SQL independente
│   │   ├── database.ts       # Database manager
│   │   ├── types.ts          # Tipos TypeScript
│   │   ├── products.controller.ts
│   │   ├── products.routes.ts
│   │   └── products.service.ts
│   ├── example/      # Plugin de demonstração
│   │   └── index.ts          # Plugin com rotas dinâmicas
│   └── health/       # Plugin Health checks e métricas
│       ├── index.ts          # Plugin principal
│       ├── health.controller.ts
│       └── health.routes.ts
├── types/            # Definições de tipos TypeScript
│   ├── api.ts        # Tipos de API
│   ├── auth.ts       # Tipos de autenticação
│   ├── users.ts      # Tipos de usuários
│   ├── posts.ts      # Tipos de posts
│   └── plugin.ts     # Interface Plugin e Plugin Manager
├── utils/            # Utilitários
│   ├── cache.ts      # Sistema de cache Redis
│   ├── errors.ts     # Classes de erro customizadas
│   ├── logger.ts     # Sistema de logging estruturado
│   ├── responses.ts  # Padronização de respostas
│   ├── swagger.ts    # Configuração do Swagger/OpenAPI
│   └── validation.ts # Schemas de validação Zod
├── tests/            # Testes unitários e integração
│   ├── middleware/   # Testes de middleware
│   ├── utils/        # Testes de utilitários
│   └── setup.ts      # Configuração de testes
└── app.ts            # Aplicação principal com plugin manager
```

## 🔧 Configuração

### Variáveis de Ambiente (.env)
```bash
# Servidor
PORT=3000
NODE_ENV=development

# Banco de Dados
DATABASE_URL="postgresql://user:pass@localhost:5432/plugbase"

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🐳 Docker

### Desenvolvimento
```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

### Produção
```bash
# Build da imagem
docker build -t plugbase-backend .

# Executar container
docker run -p 3000:3000 -e PORT=3000 plugbase-backend
```

## 📡 APIs

### Endpoints da API

#### 🔌 Sistema Central
- `GET /api` - Informações da API e plugins carregados
- `GET /api/plugins/info` - Informações detalhadas dos plugins
- `POST /api/plugins/:name/enable` - Habilitar plugin
- `POST /api/plugins/:name/disable` - Desabilitar plugin

#### 🔐 Plugin Auth
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/refresh` - Renovar token de acesso
- `POST /api/auth/logout` - Fazer logout
- `POST /api/auth/logout-all` - Logout de todos os dispositivos
- `GET /api/auth/me` - Obter perfil do usuário

#### 👥 Plugin Users
- `GET /api/users` - Listar usuários (paginado, com busca)
- `GET /api/users/:id` - Obter usuário por ID
- `PUT /api/users/:id` - Atualizar perfil do usuário
- `DELETE /api/users/:id` - Deletar usuário (Admin)

#### 📝 Plugin Posts
- `GET /api/posts` - Listar posts (paginado, com filtros)
- `GET /api/posts/:id` - Obter post por ID
- `POST /api/posts` - Criar novo post
- `PUT /api/posts/:id` - Atualizar post
- `DELETE /api/posts/:id` - Deletar post

#### ⚡ Plugin Health
- `GET /api/health` - Status básico da API
- `GET /api/health/ready` - Verificação de prontidão
- `GET /api/health/metrics` - Métricas da aplicação

#### 🎯 Plugin Example (Demonstração)
- `GET /api/example` - Informações básicas do plugin
- `GET /api/example/protected` - Rota protegida
- `GET /api/example/info` - Informações do plugin

#### 🛍️ Plugin Products (Schema Modular)
- `GET /api/products` - Listar produtos (paginado, com filtros)
- `GET /api/products/my` - Meus produtos
- `GET /api/products/featured` - Produtos em destaque
- `GET /api/products/stats` - Estatísticas (Admin)
- `GET /api/products/:id` - Buscar produto por ID
- `GET /api/products/slug/:slug` - Buscar produto por slug
- `GET /api/products/:id/related` - Produtos relacionados
- `POST /api/products` - Criar produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Deletar produto

### 📚 Documentação da API

A documentação completa da API está disponível via Swagger UI:
- **Local**: http://localhost:3000/api-docs
- **Produção**: https://api.plugbase.com/api-docs

### Exemplos de Uso

#### Registro de Usuário
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

#### Criar Post (com autenticação)
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Meu primeiro post",
    "content": "Conteúdo do post...",
    "status": "PUBLISHED",
    "tags": ["tutorial", "api"]
  }'
```

#### Criar Produto (com autenticação)
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "iPhone 15",
    "description": "Smartphone Apple iPhone 15",
    "price": 999.99,
    "status": "active",
    "featured": true,
    "tags": ["smartphone", "apple", "eletrônicos"]
  }'
```

#### Listar Produtos com Filtros
```bash
# Buscar produtos por categoria
curl "http://localhost:3000/api/products?categoryId=cat-123&page=1&limit=10"

# Buscar produtos em destaque
curl "http://localhost:3000/api/products/featured?limit=5"

# Buscar produtos por texto
curl "http://localhost:3000/api/products?search=iphone&status=active"
```

## 🔐 Autenticação

### Fluxo de Autenticação
1. Registro: `POST /api/v1/auth/register`
2. Login: `POST /api/v1/auth/login`
3. Usar token JWT no header: `Authorization: Bearer <token>`
4. Refresh token: `POST /api/v1/auth/refresh`

### Exemplo de Uso
```bash
# Registro
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "user",
    "password": "Senha@123"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Senha@123"
  }'
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com coverage
npm run test:coverage

# Executar testes de integração
npm run test:integration

# Verificar tipos TypeScript
npm run typecheck

# Executar linting
npm run lint

# Executar linting com correção automática
npm run lint:fix

# Formatar código
npm run format
```

### Estrutura de Testes
```
tests/
├── middleware/        # Testes de middleware
│   └── auth.test.ts  # Testes de autenticação
├── utils/            # Testes de utilitários
│   ├── cache.test.ts # Testes de cache
│   └── logger.test.ts # Testes de logging
└── setup.ts          # Configuração global de testes
```

## 🚀 Build e Deploy

### Build para Produção
```bash
# Build do projeto
npm run build

# Verificar tipos TypeScript
npm run typecheck

# Executar linting
npm run lint

# Formatar código
npm run format
```

### Deploy com PM2
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Configurar PM2
cp ecosystem.config.js.example ecosystem.config.js
# Edite as configurações

# Build e iniciar com PM2
npm run build
pm2 start ecosystem.config.js

# Salvar configuração do PM2
pm2 save
pm2 startup
```

### Deploy com Docker
```bash
# Build da imagem
docker build -t plugbase-backend .

# Executar container
docker run -p 3000:3000 -e PORT=3000 plugbase-backend

# Deploy com Docker Swarm
docker stack deploy -c docker-compose.prod.yml plugbase
```

## 📖 Documentação

### Criar Novo Módulo
1. Criar pasta em `src/modules/nome-do-modulo/`
2. Implementar service, controller e routes
3. Adicionar rotas no `src/core/router.ts`
4. Criar schemas de validação em `src/utils/validation.ts`
5. Adicionar tipos em `src/types/`

### Exemplo de Módulo
```typescript
// src/modules/products/products.service.ts
export class ProductsService {
  static async getAll() {
    return prisma.product.findMany();
  }
  
  static async create(data: CreateProductDto) {
    return prisma.product.create({ data });
  }
}

// src/modules/products/products.controller.ts
export class ProductsController {
  static async getAll(req: Request, res: Response) {
    const products = await ProductsService.getAll();
    res.json(ResponseUtil.success(products, 'Produtos encontrados'));
  }
  
  static async create(req: Request, res: Response) {
    const product = await ProductsService.create(req.body);
    res.status(201).json(ResponseUtil.success(product, 'Produto criado'));
  }
}

// src/modules/products/products.routes.ts
const router = Router();
router.get('/', ProductsController.getAll);
router.post('/', authenticateToken, validateRequest(createProductSchema), ProductsController.create);
export { router as productsRouter };
```

## 🔌 Sistema de Plugins

### Arquitetura Plugável

O Plugbase Backend é construído com uma **arquitetura verdadeiramente plugável**, onde cada módulo é um plugin independente que pode ser:

- **Carregado dinamicamente** na inicialização
- **Habilitado/desabilitado** via configuração
- **Gerenciado em runtime** (futuro)
- **Dependente de outros plugins**

### Estrutura de um Plugin

```typescript
// src/modules/meu-plugin/index.ts
import { Plugin } from '../../types/plugin';
import { Logger } from '../../utils/logger';

const meuPlugin: Plugin = {
  metadata: {
    name: 'meu-plugin',
    version: '1.0.0',
    description: 'Descrição do meu plugin',
    author: 'Seu Nome',
    dependencies: ['auth'], // Plugins necessários
    enabled: true,
    priority: 5, // Ordem de carregamento (menor = primeiro)
  },
  
  routes: [
    {
      path: '/api/meu-plugin',
      router: meuRouter,
      middleware: [/* middlewares específicos */],
    },
  ],
  
  hooks: {
    beforeInit: async () => {
      Logger.info('Inicializando meu plugin...');
    },
    afterInit: async () => {
      Logger.info('Plugin inicializado!');
    },
    beforeStart: async (app) => {
      // Configurações antes do servidor iniciar
    },
    afterStart: async (app) => {
      // Configurações após servidor iniciar
    },
    beforeShutdown: async () => {
      // Limpeza antes de desligar
    },
  },
  
  async init() {
    // Inicialização específica do plugin
  },
  
  async shutdown() {
    // Limpeza específica do plugin
  },
};

export default meuPlugin;
```

### Configuração de Plugins

Via variável de ambiente:
```bash
PLUGINS_CONFIG='{"auth":{"enabled":true},"users":{"enabled":true},"posts":{"enabled":false}}'
```

Ou configuração padrão no código:
```typescript
// Todos os plugins habilitados por padrão
const defaultConfig = {
  auth: { enabled: true },
  users: { enabled: true },
  posts: { enabled: true },
  health: { enabled: true },
  example: { enabled: true },
};
```

### Hooks do Sistema

Os plugins podem se conectar em vários pontos do ciclo de vida:

1. **beforeInit**: Antes da inicialização do plugin
2. **afterInit**: Após a inicialização do plugin  
3. **beforeStart**: Antes do servidor iniciar
4. **afterStart**: Após o servidor iniciar
5. **beforeShutdown**: Antes do sistema desligar

### Dependências entre Plugins

```typescript
metadata: {
  name: 'posts',
  dependencies: ['auth', 'users'], // Será carregado após auth e users
}
```

### Gerenciamento em Runtime

```bash
# Ver plugins carregados
curl http://localhost:3000/api/plugins/info

# Habilitar plugin (requer reinício)
curl -X POST http://localhost:3000/api/plugins/example/enable

# Desabilitar plugin (requer reinício)  
curl -X POST http://localhost:3000/api/plugins/example/disable
```

### Vantagens da Arquitetura Plugável

- **🔧 Modularidade**: Cada funcionalidade é isolada
- **🔄 Flexibilidade**: Habilitar/desabilitar recursos facilmente
- **🚀 Escalabilidade**: Adicionar novos recursos sem modificar o core
- **🧪 Testabilidade**: Testar plugins independentemente
- **📦 Distribuição**: Plugins podem ser distribuídos separadamente
- **⚙️ Configurabilidade**: Configurar plugins por ambiente
- **🔗 Reutilização**: Reutilizar plugins entre projetos
- **🗄️ Schema Modular**: Cada plugin gerencia suas próprias tabelas
- **🔀 Relacionamentos Inteligentes**: Sem FKs diretas, mas integração funcional
- **📊 Migrations Independentes**: Sistema de migrations por plugin

## 🗄️ Sistema de Database Modular

### Abordagem de Schema por Plugin

Cada plugin pode gerenciar suas próprias tabelas de forma independente, mantendo a flexibilidade da arquitetura plugável:

#### Estrutura de Database Modular
```
📊 Database (PostgreSQL)
├── 🔐 Plugin Auth
│   ├── users
│   ├── refresh_tokens
│   └── password_reset_tokens
├── 📝 Plugin Posts  
│   └── posts (user_id como string)
├── 🛍️ Plugin Products
│   ├── products (user_id como string)
│   ├── categories
│   ├── product_variants
│   └── plugin_migrations
└── ⚡ Plugin Health
    └── (sem tabelas próprias)
```

#### Migrations por Plugin
```typescript
// Cada plugin controla suas migrations
class ProductsDatabase {
  static async runMigrations(): Promise<void> {
    // Verificar se migration já foi aplicada
    const applied = await this.isMigrationApplied('products_schema_001');
    
    if (!applied) {
      // Executar schema SQL específico do plugin
      await client.$executeRawUnsafe(schemaSql);
      
      // Registrar migration como aplicada
      await this.recordMigration('products_schema_001', 'Initial products schema');
    }
  }
}
```

#### Relacionamentos Sem Foreign Keys
```sql
-- Plugin Products referencia User via string (não FK)
CREATE TABLE products (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL, -- Referência lógica para users.id
  category_id VARCHAR REFERENCES categories(id), -- FK interna do plugin
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sem FK direta: user_id -> users.id
-- Relacionamento gerenciado no código
```

#### Integração entre Plugins
```typescript
// Service busca dados de outros plugins via API interna
class ProductsService {
  static async getProductWithAuthor(productId: string) {
    // 1. Buscar produto (tabela do plugin Products)
    const product = await ProductsDatabase.findProductById(productId);
    
    if (product && product.userId) {
      // 2. Buscar usuário (plugin Auth, sem JOIN)
      const author = await AuthService.getUserById(product.userId);
      
      // 3. Combinar dados
      return { ...product, author };
    }
  }
}
```

### Exemplo Prático: Plugin Products

O plugin Products demonstra um schema modular completo:

#### Schema SQL Independente
```sql
-- src/modules/products/schema.sql
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  parent_id VARCHAR REFERENCES categories(id), -- FK interna
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  user_id VARCHAR NOT NULL, -- Referência lógica (sem FK)
  category_id VARCHAR REFERENCES categories(id), -- FK interna
  status VARCHAR(20) DEFAULT 'draft',
  tags TEXT[],
  images JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Database Manager Específico
```typescript
// src/modules/products/database.ts
export class ProductsDatabase {
  // Queries específicas do domínio Products
  static async findProducts(filters: ProductFilters) {
    const query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.deleted_at IS NULL
      ${filters.search ? "AND p.name ILIKE $1" : ""}
    `;
    
    return this.query(query, params);
  }
  
  // Migrations independentes
  static async runMigrations() {
    const schemaSql = readFileSync('schema.sql', 'utf-8');
    await client.$executeRawUnsafe(schemaSql);
  }
}
```

#### Plugin com Hooks de Database
```typescript
// src/modules/products/index.ts
const productsPlugin: Plugin = {
  metadata: {
    name: 'products',
    dependencies: ['auth'], // Usa dados do plugin Auth
  },
  
  hooks: {
    beforeInit: async () => {
      await ProductsDatabase.connect();
    },
    
    afterInit: async () => {
      await ProductsDatabase.runMigrations();
    },
    
    beforeShutdown: async () => {
      await ProductsDatabase.disconnect();
    },
  },
  
  routes: [{ path: '/api/products', router: productsRouter }],
};
```

### Vantagens do Schema Modular

#### ✅ **Isolamento Total**
- Plugin Products pode ser removido sem afetar outros plugins
- Tabelas products e categories são específicas do plugin
- Migrations independentes por plugin

#### ✅ **Flexibilidade**
- Habilitar/desabilitar plugins sem quebrar relacionamentos
- Cada plugin evolui sua estrutura independentemente
- Testes isolados por domínio

#### ✅ **Relacionamentos Inteligentes**
```typescript
// Sem FK no banco, mas funcional no código
const productWithAuthor = await ProductsService.getProductWithAuthor(id);
// Retorna: { id, name, price, author: { name, email } }
```

#### ✅ **Escalabilidade**
- Performance otimizada por domínio
- Cache específico por plugin
- Queries especializadas

## 🛡️ Segurança

- **Autenticação JWT** com refresh tokens
- **Rate limiting** específico por endpoint
- **Validação rigorosa** de dados de entrada com Zod
- **Sanitização** de dados sensíveis nos logs
- **CORS** configurado adequadamente
- **Headers de segurança** com Helmet
- **Soft delete** para preservação de dados
- **Logs estruturados** com códigos de erro categorizados

## ⚡ Performance

### Cache Redis
Estratégias de cache implementadas:
- **Cache de usuários**: TTL de 1 hora
- **Cache de posts**: TTL de 30 minutos
- **Invalidação automática**: Ao atualizar/deletar registros
- **Connection pooling**: Otimização de conexões

### Rate Limiting
O sistema possui diferentes limitadores:
- **Geral**: 100 requests por 15 minutos
- **Autenticação**: 5 tentativas por 15 minutos
- **Criação de conteúdo**: 5 posts por minuto
- **Busca**: 30 buscas por minuto

### Connection Pooling
Configuração otimizada do Prisma para melhor performance em produção.

## 📊 Monitoramento

### Health Checks
O sistema inclui endpoints de monitoramento:
- `GET /api/health` - Status da aplicação
- `GET /api/health/ready` - Conectividade com dependências
- `GET /api/health/metrics` - Métricas de performance

### Logging Estruturado
Sistema com níveis e códigos de erro:
- **Códigos de Autenticação**: AUTH_1001 - AUTH_1999
- **Códigos de Validação**: VAL_2001 - VAL_2999
- **Códigos de Banco de Dados**: DB_3001 - DB_3999
- **Códigos do Sistema**: SYS_5001 - SYS_5999

### Métricas
- Uso de memória e CPU
- Número total de requests
- Taxa de requests por segundo
- Tempo de uptime da aplicação

## 🔄 Migration e Seeds

```bash
# Criar nova migration
npx prisma migrate dev --name migration_name

# Reset do banco (cuidado em produção!)
npx prisma migrate reset

# Aplicar migrations em produção
npx prisma migrate deploy

# Executar seeds
npx prisma db seed
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

Para suporte e dúvidas:
- **Email**: support@plugbase.com
- **Documentation**: https://docs.plugbase.com
- **Issues**: https://github.com/plugbase/backend/issues

---

**Desenvolvido com ❤️ pela equipe Plugbase**
