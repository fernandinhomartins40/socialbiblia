# Multi-stage build para otimizar tamanho da imagem final
FROM node:18-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração de dependências
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação web
RUN npm run build:web

# Estágio de produção
FROM nginx:alpine

# Instalar curl para health checks
RUN apk add --no-cache curl

# Copiar configurações do nginx
COPY apps/web/docker/nginx.conf /etc/nginx/nginx.conf
COPY apps/web/docker/default.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos buildados do estágio anterior
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copiar script de entrypoint personalizado
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Criar diretórios de log
RUN mkdir -p /var/log/nginx

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Executar nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]