import generatePassword from '../../src/functions/generate_password';

describe('generatePassword', () => {
  it('should generate a password with default length', () => {
    const password = generatePassword();
    expect(password).toHaveLength(12);
    expect(typeof password).toBe('string');
  });

  it('should generate a password with custom length', () => {
    const password = generatePassword(16);
    expect(password).toHaveLength(16);
  });

  it('should generate different passwords on each call', () => {
    const password1 = generatePassword();
    const password2 = generatePassword();
    expect(password1).not.toBe(password2);
  });

  it('should contain only valid characters', () => {
    const password = generatePassword(20);
    const validChars = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
    expect(password).toMatch(validChars);
  });
});
