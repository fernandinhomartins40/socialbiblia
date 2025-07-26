import generateHashPassword from '../../src/functions/generate_hash_password';

describe('generateHashPassword', () => {
  it('should generate a hash from password', async () => {
    const password = 'testpassword123';
    const result = await generateHashPassword(password);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(typeof result.data).toBe('string');
    expect(result.data).not.toBe(password);
  });

  it('should generate different hashes for same password', async () => {
    const password = 'testpassword123';
    const hash1 = await generateHashPassword(password);
    const hash2 = await generateHashPassword(password);
    
    expect(hash1.data).not.toBe(hash2.data);
  });

  it('should handle empty password', async () => {
    const result = await generateHashPassword('');
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
