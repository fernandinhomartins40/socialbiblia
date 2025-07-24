"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Iniciando seed do banco de dados...');
    const adminPassword = await bcrypt_1.default.hash('admin123', 12);
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
    const userPassword = await bcrypt_1.default.hash('user123', 12);
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
    const posts = await Promise.all([
        prisma.post.create({
            data: {
                title: 'Primeiro Post',
                slug: 'primeiro-post',
                content: 'Este é o conteúdo do primeiro post de exemplo.',
                excerpt: 'Resumo do primeiro post',
                status: 'PUBLISHED',
                authorId: admin.id,
                tags: ['primeiro', 'exemplo'],
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
                tags: ['segundo', 'rascunho'],
                category: 'Geral',
            },
        }),
    ]);
    console.log('✅ Seed concluído com sucesso!');
    console.log(`👤 Admin criado: admin@example.com / admin123`);
    console.log(`👤 User criado: user@example.com / user123`);
    console.log(`📝 Posts criados: ${posts.length}`);
}
main()
    .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map