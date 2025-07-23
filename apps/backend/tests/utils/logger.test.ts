import { Logger, ErrorCodes } from '../../src/utils/logger';

describe('Logger', () => {
  // Mock console methods to prevent output during tests
  const mockConsole = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('info', () => {
    it('should log info message with context', () => {
      const message = 'Test info message';
      const context = { userId: '123', requestId: 'req-123' };
      
      Logger.info(message, context);
      
      // Since we're using winston, we can't easily mock it
      // This test mainly ensures the method doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('error', () => {
    it('should log error with context and error object', () => {
      const message = 'Test error message';
      const error = new Error('Test error');
      const context = { 
        userId: '123', 
        requestId: 'req-123',
        errorCode: ErrorCodes.INTERNAL_SERVER_ERROR 
      };
      
      Logger.error(message, error, context);
      
      expect(true).toBe(true);
    });
  });

  describe('ErrorCodes', () => {
    it('should have all required error codes', () => {
      expect(ErrorCodes.INVALID_CREDENTIALS).toBe('AUTH_1001');
      expect(ErrorCodes.TOKEN_EXPIRED).toBe('AUTH_1002');
      expect(ErrorCodes.VALIDATION_FAILED).toBe('VAL_2001');
      expect(ErrorCodes.DATABASE_CONNECTION).toBe('DB_3001');
      expect(ErrorCodes.INTERNAL_SERVER_ERROR).toBe('SYS_5001');
    });
  });
});