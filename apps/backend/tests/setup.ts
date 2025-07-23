import { prisma } from '../src/core/database';
import { cache } from '../src/utils/cache';

// Setup global test environment
beforeAll(async () => {
  // Connect to test database
  try {
    await prisma.$connect();
  } catch (error) {
    console.error('Failed to connect to test database:', error);
  }

  // Connect to cache (optional for tests)
  try {
    await cache.connect();
  } catch (error) {
    console.warn('Failed to connect to cache (continuing without cache):', error);
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Clean up database connections
  await prisma.$disconnect();
  
  // Clean up cache connections
  await cache.disconnect();
});

// Clean up between tests
afterEach(async () => {
  // Clear cache between tests
  try {
    await cache.delPattern('*');
  } catch (error) {
    // Ignore cache errors in tests
  }
});