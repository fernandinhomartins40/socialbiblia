#!/bin/sh
set -e

echo "🚀 Iniciando Biblicai Frontend..."

# Verificar se os arquivos foram copiados corretamente
if [ ! -f "/usr/share/nginx/html/index.html" ]; then
    echo "❌ Erro: Arquivos da aplicação não encontrados!"
    exit 1
fi

echo "✅ Arquivos da aplicação encontrados"

# Verificar configurações do nginx
nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Erro: Configuração do nginx inválida!"
    exit 1
fi

echo "✅ Configuração do nginx válida"

# Substituir variáveis de ambiente no arquivo de configuração se necessário
if [ -n "$API_URL" ]; then
    echo "🔧 Configurando API_URL: $API_URL"
    # Aqui você pode adicionar lógica para substituir variáveis de ambiente
    # nos arquivos de configuração se necessário
fi

echo "🌐 Iniciando servidor nginx na porta 3000..."

# Executar o comando passado como argumento
exec "$@"