import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import randtoken from 'rand-token';
import bcrypt from 'bcryptjs';

import config from '../../src/config/app';

const prisma = new PrismaClient();
const saltRounds = config.bcrypt.saltRounds;

const userQty = 9;
const users: any = [];
const posts: any = [];
const comments: any = [];

const states = [
    'AC',
    'AL',
    'AM',
    'AP',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MG',
    'MS',
    'MT',
    'PA',
    'PB',
    'PE',
    'PI',
    'PR',
    'RJ',
    'RN',
    'RO',
    'RR',
    'RS',
    'SC',
    'SE',
    'SP',
    'TO',
];

async function main() {
    for (let i = 0; i <= userQty; i += 1) {
        if (!i) {
            users.push({
                id: uuidv4(),
                name: 'johndoe',
                email: 'johndoe@sample.com',
                phone: `81999999999`,
                accountName: 'johndoe',
                accountLocationState: 'PE',
                password: bcrypt.hashSync('Johndoe@1234', saltRounds),
                isRegistered: true,
                tokenOfRegisterConfirmation: randtoken.suid(16),
                tokenOfResetPassword: randtoken.suid(16),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        } else {
            users.push({
                id: uuidv4(),
                name: `johndoe.sample${i}`,
                email: `johndoe.sample${i}@smaple.com`,
                phone: `8199999999${i}`,
                accountName: `account${i}`,
                accountLocationState: states[Math.floor(Math.random() * states.length)],
                password: bcrypt.hashSync('Johndoe@1234', saltRounds),
                isRegistered: true,
                tokenOfRegisterConfirmation: randtoken.suid(16),
                tokenOfResetPassword: randtoken.suid(16),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        }
    }

    await prisma.user.createMany({
        data: users,
    });

    // Create sample posts
    const samplePosts = [
        {
            id: uuidv4(),
            content: "Que a paz de Deus esteja com todos vocês! 🙏",
            authorId: users[0].id,
            isPublic: true,
            isPinned: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: uuidv4(),
            content: "Meditando na palavra de Deus hoje.",
            verseReference: "Salmos 23:1",
            verseText: "O Senhor é o meu pastor; nada me faltará.",
            authorId: users[1].id,
            isPublic: true,
            isPinned: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: uuidv4(),
            content: "Gratidão é a chave para uma vida plena! ✨",
            authorId: users[2].id,
            isPublic: true,
            isPinned: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];

    await prisma.post.createMany({
        data: samplePosts,
    });

    // Create sample comments
    const sampleComments = [
        {
            id: uuidv4(),
            content: "Amém! Que palavra abençoada!",
            postId: samplePosts[0].id,
            authorId: users[1].id,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: uuidv4(),
            content: "Que o Senhor continue te abençoando!",
            postId: samplePosts[0].id,
            authorId: users[2].id,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];

    await prisma.comment.createMany({
        data: sampleComments,
    });

    console.log(`✅ Seed concluído:`);
    console.log(`   • ${users.length} usuários criados`);
    console.log(`   • ${samplePosts.length} posts criados`);
    console.log(`   • ${sampleComments.length} comentários criados`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (err) => {
        /* eslint-disable no-console */
        console.error(err);
        /* eslint-enable no-console */
        await prisma.$disconnect();
        process.exit(1);
    });
