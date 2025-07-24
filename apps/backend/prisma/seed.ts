import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 [SEED] Iniciando seed do banco de dados...');
  
  try {
    // Verificar se o banco de dados está acessível
    await prisma.$connect();
    console.log('✅ [SEED] Conexão com banco estabelecida');

    // Limpar dados existentes se necessário (apenas em desenvolvimento)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🧹 [SEED] Limpando dados existentes (dev)...');
      await prisma.comment.deleteMany();
      await prisma.post.deleteMany();
      await prisma.refreshToken.deleteMany();
      await prisma.passwordResetToken.deleteMany();
      await prisma.emailVerificationToken.deleteMany();
      await prisma.user.deleteMany();
      console.log('✅ [SEED] Dados limpos');
    }

    // Criar usuário admin
    console.log('👤 [SEED] Criando usuário admin...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        username: 'admin',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    console.log(`✅ [SEED] Admin criado: ${admin.id}`);

    // Criar usuário regular
    console.log('👤 [SEED] Criando usuário regular...');
    const userPassword = await bcrypt.hash('user123', 12);
    const user = await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        email: 'user@example.com',
        username: 'user',
        password: userPassword,
        firstName: 'Regular',
        lastName: 'User',
        role: 'USER',
        isEmailVerified: true,
      },
    });
    console.log(`✅ [SEED] User criado: ${user.id}`);

    // Criar posts de exemplo
    console.log('📝 [SEED] Criando posts de exemplo...');
    const posts = await Promise.all([
      prisma.post.create({
        data: {
          title: 'Primeiro Post',
          slug: 'primeiro-post',
          content: 'Este é o conteúdo do primeiro post de exemplo.',
          excerpt: 'Resumo do primeiro post',
          status: 'PUBLISHED',
          authorId: admin.id,
          tags: JSON.stringify(['primeiro', 'exemplo']),
          category: 'Geral',
          featured: true,
        },
      }),
      prisma.post.create({
        data: {
          title: 'Segundo Post',
          slug: 'segundo-post',
          content: 'Este é o conteúdo do segundo post de exemplo.',
          excerpt: 'Resumo do segundo post',
          status: 'DRAFT',
          authorId: user.id,
          tags: JSON.stringify(['segundo', 'rascunho']),
          category: 'Geral',
        },
      }),
    ]);
    console.log(`✅ [SEED] Posts criados: ${posts.length}`);

    // Criar comentários de exemplo
    console.log('💬 [SEED] Criando comentários de exemplo...');
    await prisma.comment.create({
      data: {
        content: 'Este é um comentário de exemplo no primeiro post.',
        postId: posts[0].id,
        authorId: user.id,
        isApproved: true,
      },
    });
    console.log('✅ [SEED] Comentário criado');

    console.log('✅ [SEED] Seed concluído com sucesso!');
    console.log(`👤 Admin: admin@example.com / admin123`);
    console.log(`👤 User: user@example.com / user123`);
    console.log(`📝 Posts: ${posts.length}`);
    console.log(`💬 Comentários: 1`);

  } catch (error) {
    console.error('❌ [SEED] Erro durante seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ [SEED] Erro crítico no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 [SEED] Desconectando do banco...');
    await prisma.$disconnect();
    console.log('✅ [SEED] Desconexão concluída');
  });
