# 🔌 MAPEAMENTO DE PORTAS - SOCIALBIBLIA

## 📋 Portas Utilizadas pela Aplicação

### 🌐 **Portas Externas (Acessíveis da VPS)**
| Serviço | Porta Externa | Porta Interna | Descrição |
|---------|---------------|---------------|-----------|
| **Frontend** | `3000` | `3000` | Interface React (nginx/vite) |
| **Supabase API** | `3001` | `8000` | Gateway Kong (REST + Auth) |
| **PostgreSQL** | `5433` | `5432` | Banco principal ⚠️ |
| **Pooler** | `5434` | `5432` | Connection pooler ⚠️ |
| **Analytics** | `4001` | `4000` | Logflare analytics |
| **HTTPS Gateway** | `8444` | `8443` | Kong HTTPS |

### 🔒 **Portas Internas (Apenas rede Docker)**
| Serviço | Porta | Descrição |
|---------|--------|-----------|
| Auth (GoTrue) | `9999` | Serviço de autenticação |
| PostgREST | `3000` | API REST automática |
| Realtime | `4000` | WebSockets e subscriptions |
| Storage | `5000` | Upload de arquivos |
| ImgProxy | `5001` | Processamento de imagens |
| Meta | `8080` | Metadata do PostgreSQL |
| Pooler API | `6543` | API do connection pooler |

## ⚠️ **Isolamento e Conflitos**

### ✅ **Isolamento Garantido**
- **Containers**: Nomes únicos com sufixo `socialbiblia_20250726_154309`
- **Volumes**: Diretório isolado `volumes-socialbiblia_20250726_154309/`
- **Network**: Rede Docker isolada `supabase-socialbiblia_20250726_154309`
- **Dados**: PostgreSQL em volume isolado

### ⚠️ **Portas Alteradas para Evitar Conflitos**
- **PostgreSQL**: `5432` → `5433` (evita conflito com PostgreSQL do sistema)
- **Pooler**: `5432` → `5434` (segunda instância PostgreSQL)
- **HTTPS**: `8443` → `8444` (evita conflito com outras aplicações)
- **Analytics**: Porta dinâmica → `4001` (porta fixa e específica)

### 🎯 **URLs de Acesso**
```bash
# Frontend da aplicação
http://31.97.85.98:3000

# API Supabase (REST + Auth)
http://31.97.85.98:3001

# Conexão direta PostgreSQL (para admin)
postgresql://postgres:admin@31.97.85.98:5433/socialbiblia

# Analytics (se necessário)
http://31.97.85.98:4001
```

## 🔧 **Comandos Úteis**

### Verificar portas em uso na VPS:
```bash
# Verificar se as portas estão livres
sudo netstat -tulpn | grep -E ":(3000|3001|5433|5434|4001|8444)"

# Verificar containers rodando
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Verificar apenas containers SocialBiblia
docker ps --filter "name=socialbiblia" --format "table {{.Names}}\t{{.Ports}}"
```

### Parar aplicação sem afetar outras:
```bash
cd /root/socialbiblia/supabase
docker compose down
```

### Verificar logs específicos:
```bash
cd /root/socialbiblia/supabase
docker compose logs -f kong  # API Gateway
docker compose logs -f db    # PostgreSQL
```

## 🚨 **Compatibilidade com Outras Aplicações**

Esta configuração foi otimizada para **conviver com outras aplicações** na mesma VPS:

- ✅ **Não usa portas padrão** (80, 443, 5432 padrão)
- ✅ **Isolamento completo** de dados e configurações
- ✅ **Nomes únicos** para todos os recursos
- ✅ **Rede Docker isolada** 
- ✅ **Volumes isolados**

### Outras aplicações podem usar livremente:
- Portas `80`, `443` (nginx/apache padrão)
- Porta `5432` (PostgreSQL do sistema)
- Porta `3000` de outras aplicações (isoladas)
- Qualquer outra porta não listada acima