// Teste simples para verificar problemas na inicialização
import { PrismaClient } from '@prisma/client';

console.log('🧪 Teste de inicialização da API...');

// Teste 1: Variáveis de ambiente
console.log('📋 Variáveis de ambiente:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');

// Teste 2: Prisma Client
console.log('🗄️ Testando Prisma Client...');
const prisma = new PrismaClient();

prisma.$connect()
  .then(() => {
    console.log('✅ Conexão com Prisma estabelecida');
    return prisma.$disconnect();
  })
  .then(() => {
    console.log('✅ Prisma Client fechado');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro no Prisma:', err.message);
    process.exit(1);
  });