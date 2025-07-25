import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import auth from '../../src/middlewares/auth/authenticate';
import { UnauthorizedError, ForbiddenError } from '../../src/utils/errors';
import { prisma } from '../../src/core/database';
import { config } from '../../src/core/config';

// Mock dependencies
jest.mock('../../src/core/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    refreshToken: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('../../src/utils/logger', () => ({
  Logger: {
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
  ErrorCodes: {
    UNAUTHORIZED: 'AUTH_1004',
    TOKEN_INVALID: 'AUTH_1003',
    TOKEN_EXPIRED: 'AUTH_1002',
    FORBIDDEN: 'AUTH_1005',
  },
}));

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      ip: '127.0.0.1',
      method: 'GET',
      originalUrl: '/test',
      get: jest.fn().mockReturnValue('test-agent'),
    };
    mockRes = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should throw UnauthorizedError when no token provided', async () => {
      await expect(
        authenticateToken(mockReq as any, mockRes as Response, mockNext)
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError when token is invalid', async () => {
      mockReq.headers = {
        authorization: 'Bearer invalid-token',
      };

      await expect(
        authenticateToken(mockReq as any, mockRes as Response, mockNext)
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should authenticate valid token with active user', async () => {
      const validPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'USER',
      };

      const validToken = jwt.sign(validPayload, config.jwt.secret);
      mockReq.headers = {
        authorization: `Bearer ${validToken}`,
      };

      // Mock user exists and is active
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        isActive: true,
        role: 'USER',
      });

      // Mock token exists
      (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue({
        id: 'token-123',
        userId: 'user-123',
      });

      await authenticateToken(mockReq as any, mockRes as Response, mockNext);

      expect((mockReq as any).user).toEqual(validPayload);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user is inactive', async () => {
      const validPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'USER',
      };

      const validToken = jwt.sign(validPayload, config.jwt.secret);
      mockReq.headers = {
        authorization: `Bearer ${validToken}`,
      };

      // Mock user exists but is inactive
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        isActive: false,
        role: 'USER',
      });

      await expect(
        authenticateToken(mockReq as any, mockRes as Response, mockNext)
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('authorizeRoles', () => {
    it('should throw UnauthorizedError when user is not authenticated', () => {
      const middleware = authorizeRoles('ADMIN');
      
      expect(() => {
        middleware(mockReq as any, mockRes as Response, mockNext);
      }).toThrow(UnauthorizedError);
    });

    it('should throw ForbiddenError when user lacks required role', () => {
      mockReq.user = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'USER',
      };

      const middleware = authorizeRoles('ADMIN');
      
      expect(() => {
        middleware(mockReq as any, mockRes as Response, mockNext);
      }).toThrow(ForbiddenError);
    });

    it('should allow access when user has required role', () => {
      mockReq.user = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'ADMIN',
      };

      const middleware = authorizeRoles('ADMIN');
      middleware(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow access when user has one of multiple required roles', () => {
      mockReq.user = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'MODERATOR',
      };

      const middleware = authorizeRoles('ADMIN', 'MODERATOR');
      middleware(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});