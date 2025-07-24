"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const rand_token_1 = __importDefault(require("rand-token"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const app_1 = __importDefault(require("../../src/config/app"));
const prisma = new client_1.PrismaClient();
const saltRounds = app_1.default.bcrypt.saltRounds;
const userQty = 9;
const users = [];
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
                id: (0, uuid_1.v4)(),
                name: 'johndoe',
                email: 'johndoe@sample.com',
                phone: `81999999999`,
                accountName: 'johndoe',
                accountLocationState: 'PE',
                password: bcryptjs_1.default.hashSync('Johndoe@1234', saltRounds),
                isRegistered: true,
                tokenOfRegisterConfirmation: rand_token_1.default.suid(16),
                tokenOfResetPassword: rand_token_1.default.suid(16),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        }
        else {
            users.push({
                id: (0, uuid_1.v4)(),
                name: `johndoe.sample${i}`,
                email: `johndoe.sample${i}@smaple.com`,
                phone: `8199999999${i}`,
                accountName: `account${i}`,
                accountLocationState: states[Math.floor(Math.random() * states.length)],
                password: bcryptjs_1.default.hashSync('Johndoe@1234', saltRounds),
                isRegistered: true,
                tokenOfRegisterConfirmation: rand_token_1.default.suid(16),
                tokenOfResetPassword: rand_token_1.default.suid(16),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        }
    }
    await prisma.user.createMany({
        data: users,
    });
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map