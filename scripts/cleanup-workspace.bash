#!/bin/bash

echo "🧹 Iniciando limpeza do workspace SocialBiblia..."

# ===================================
# BACKUP ANTES DE LIMPAR
# ===================================
echo "💾 Criando backup de segurança..."
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Fazer backup dos arquivos importantes que serão removidos
cp -r apps/backend "$BACKUP_DIR/" 2>/dev/null || echo "Backend já removido"
cp docker-compose.yml "$BACKUP_DIR/" 2>/dev/null
cp package.json "$BACKUP_DIR/" 2>/dev/null

echo "✅ Backup criado em: $BACKUP_DIR"

# ===================================
# REMOÇÃO DE ARQUIVOS OBSOLETOS
# ===================================

echo "🗑️ Removendo arquivos obsoletos..."

# Documentação duplicada/obsoleta
rm -f CLEAN-MONOREPO-STRUCTURE.md
rm -f DEPLOY-FIXES-SUMMARY.md
rm -f DEPLOYMENT-READY.md
rm -f DEPLOY_INCREMENTAL.md
rm -f DEPLOY_NOTES.md
rm -f FASE2-STATUS.md
rm -f FASE3-IMPLEMENTATION.md
rm -f FASE4-COMPLETION.md
rm -f GITHUB-ACTIONS-OPTIMIZED.md
rm -f PLANO-CORRECAO-MELHORIAS.md
rm -f README-DEPLOY.md
rm -f README-DEPLOYMENT.md
rm -f README-LLM.md
rm -f README-MONOREPO.md
rm -f "RELATÓRIO-TESTES-WSL-UBUNTU.md"

# Scripts obsoletos
rm -f get-docker.sh
rm -f ssh-check.sh
rm -f test-complete-wsl.sh
rm -f verify-deploy-issues.sh
rm -f trigger-deploy.txt
rm -f "h origin main"

# Configurações antigas
rm -f env.example
rm -f docker-compose.new.yml
rm -f tsconfig.base.json

# Docker configs obsoletos
rm -rf configs/
rm -rf docker/
rm -rf tools/
rm -rf init-scripts/
rm -rf docs/

# Scripts obsoletos
rm -f scripts/aggressive-cleanup-vps.sh
rm -f scripts/backup-postgres.sh
rm -f scripts/deploy-production.sh
rm -f scripts/deploy-vps.sh
rm -f scripts/health-check.js
rm -f scripts/migrate-to-postgres.js
rm -f scripts/setup-fase2.sh
rm -f scripts/setup-postgres.sh
rm -f scripts/test-local.sh

# Backend removido (se ainda existir algum resto)
rm -rf apps/backend

echo "✅ Arquivos obsoletos removidos!"

# ===================================
# LIMPEZA DE PASTAS VAZIAS
# ===================================

echo "📁 Removendo pastas vazias..."

# Remover node_modules da raiz (não deveria estar lá)
rm -rf node_modules/

# Remover pastas vazias
find . -type d -empty -delete 2>/dev/null

echo "✅ Pastas vazias removidas!"

# ===================================
# LIMPEZA DO FRONTEND
# ===================================

echo "🧹 Limpando frontend..."

cd apps/web

# Remover arquivos obsoletos do frontend
rm -f README-PLUGBASE-INTEGRATION.md

# Remover hooks obsoletos
rm -f src/hooks/useAuth.ts
rm -f src/hooks/usePlugbaseAPI.ts
rm -f src/hooks/usePlugbaseAuth.tsx
rm -f src/hooks/useWebSocket.ts

# Remover libs obsoletas
rm -f src/lib/api-adapters.ts
rm -f src/lib/api.ts
rm -f src/lib/authUtils.ts
rm -f src/lib/integration-summary.md
rm -f src/lib/lazy-components.ts
rm -f src/lib/plugbase-api.ts
rm -f src/lib/secure-storage.ts
rm -f src/lib/shared-types.ts
rm -f src/lib/unified-api.ts
rm -f src/lib/utils.test.ts

# Remover services obsoletos
rm -f src/services/auth.service.ts
rm -f src/services/post.service.ts
rm -f src/services/user.service.ts
rm -f src/services/websocket.service.ts

# Remover components obsoletos
rm -f src/components/AIChat.tsx
rm -f src/components/AdvancedBibleSearch.tsx
rm -f src/components/AuthModal.tsx
rm -f src/components/BibleSearchBar.tsx
rm -f src/components/Communities.tsx
rm -f src/components/CreatePost.tsx
rm -f src/components/FileUpload.tsx
rm -f src/components/LocalLLMTest.tsx
rm -f src/components/NotificationCenter.tsx
rm -f src/components/PlugbaseDemo.tsx
rm -f src/components/Post.tsx
rm -f src/components/UserProfile.tsx

# Remover pages obsoletas
rm -f src/pages/AdminDashboard.tsx
rm -f src/pages/Bible.tsx

# Remover docker config do frontend
rm -rf docker/

# Remover tests obsoletos
rm -rf src/test/

# Remover dist se existir
rm -rf dist/

cd ../../

echo "✅ Frontend limpo!"

# ===================================
# REORGANIZAR ESTRUTURA
# ===================================

echo "📂 Reorganizando estrutura..."

# Mover arquivos importantes para lugares corretos
mkdir -p docs/
mv BACKUP_SCHEMA.sql docs/
mv MIGRACAO_SUPABASE.md docs/
mv DEPLOY_INSTRUCTIONS.md docs/

# Manter apenas README principal
cp README.md docs/README-original.md

echo "✅ Estrutura reorganizada!"

# ===================================
# MOSTRAR ESTRUTURA FINAL
# ===================================

echo ""
echo "📁 ESTRUTURA FINAL DO WORKSPACE:"
echo ""
tree -I 'node_modules|.git|volumes*|backup_*' -L 3 || ls -la

echo ""
echo "✅ Limpeza concluída com sucesso!"
echo ""
echo "📦 Backup salvo em: $BACKUP_DIR"
echo "📚 Documentação movida para: docs/"
echo ""
echo "🎯 Próximos passos:"
echo "   1. Verificar se tudo funciona: npm run dev"
echo "   2. Commit das mudanças: git add . && git commit -m '🧹 CLEANUP: Reorganizar workspace'"
echo "   3. Deploy: git push origin main"