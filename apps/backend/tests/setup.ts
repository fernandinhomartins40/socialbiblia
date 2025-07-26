import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Create test database
  execSync('npm run db:migrate', { stdio: 'inherit' });
});

beforeEach(async () => {
  // Clean up test data
  const tables = ['User', 'Post', 'Comment', 'Product'];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Global test utilities
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
