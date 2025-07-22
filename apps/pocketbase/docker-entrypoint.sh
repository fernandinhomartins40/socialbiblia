#!/bin/sh

echo "🚀 Iniciando PocketBase - Social Bíblia"
echo "📅 Data/Hora: $(date)"
echo "🌐 Servidor: 0.0.0.0:8080"

# Verificar se existe admin
if [ ! -f "./pb_data/data.db" ]; then
    echo "🔧 Primeira execução - Database será criado automaticamente"
    echo "📋 Acesse http://localhost:8080/_/ para criar admin após inicialização"
fi

# Definir variáveis de ambiente padrão para produção
export PB_DATA_DIR="./pb_data"

# Iniciar PocketBase
echo "🌟 PocketBase iniciando..."
exec ./pocketbase serve --http=0.0.0.0:8080 --dir=${PB_DATA_DIR}