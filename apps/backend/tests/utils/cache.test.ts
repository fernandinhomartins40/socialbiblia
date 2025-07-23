import { cache, CacheService } from '../../src/utils/cache';

describe('CacheService', () => {
  beforeEach(async () => {
    // Clear cache before each test
    try {
      await cache.delPattern('test:*');
    } catch (error) {
      // Ignore if cache is not connected
    }
  });

  describe('set and get', () => {
    it('should set and get a value', async () => {
      const key = 'test:simple';
      const value = { test: 'data', number: 123 };
      
      const setResult = await cache.set(key, value, 60);
      expect(setResult).toBe(true);
      
      const getResult = await cache.get(key);
      expect(getResult).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const result = await cache.get('test:nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('del', () => {
    it('should delete a key', async () => {
      const key = 'test:delete';
      const value = 'test value';
      
      await cache.set(key, value);
      const deleted = await cache.del(key);
      
      expect(deleted).toBe(true);
      
      const result = await cache.get(key);
      expect(result).toBeNull();
    });
  });

  describe('exists', () => {
    it('should check if key exists', async () => {
      const key = 'test:exists';
      
      let exists = await cache.exists(key);
      expect(exists).toBe(false);
      
      await cache.set(key, 'value');
      exists = await cache.exists(key);
      expect(exists).toBe(true);
    });
  });

  describe('key helpers', () => {
    it('should generate consistent cache keys', () => {
      expect(CacheService.keys.user('123')).toBe('user:123');
      expect(CacheService.keys.post('abc')).toBe('post:abc');
      expect(CacheService.keys.posts(1, 10)).toBe('posts:1:10');
      expect(CacheService.keys.posts(1, 10, 'filter')).toBe('posts:1:10:filter');
    });
  });

  describe('TTL constants', () => {
    it('should have correct TTL values', () => {
      expect(CacheService.ttl.SHORT).toBe(60);
      expect(CacheService.ttl.MEDIUM).toBe(300);
      expect(CacheService.ttl.LONG).toBe(900);
      expect(CacheService.ttl.HOUR).toBe(3600);
      expect(CacheService.ttl.DAY).toBe(86400);
    });
  });
});