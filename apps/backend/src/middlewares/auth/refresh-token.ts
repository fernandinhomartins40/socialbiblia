import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
// import logger from '../../utils/logger/winston/logger';

export interface RefreshTokenPayload {
  id: string;
  email: string;
  type: 'refresh';
}

export interface AccessTokenPayload {
  id: string;
  email: string;
  type: 'access';
}

class RefreshTokenService {
  private jwtSecret: string;
  private jwtRefreshSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || '';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || '';
    this.accessTokenExpiry = process.env.JWT_EXPIRES_IN || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    if (!this.jwtSecret || !this.jwtRefreshSecret) {
      throw new Error('JWT secrets não configurados adequadamente');
    }
  }

  // Gerar access token
  generateAccessToken(userId: string, userEmail: string): string {
    const payload: AccessTokenPayload = {
      id: userId,
      email: userEmail,
      type: 'access',
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'socialbiblia-api',
      audience: 'socialbiblia-client',
    });
  }

  // Gerar refresh token
  generateRefreshToken(userId: string, userEmail: string): string {
    const payload: RefreshTokenPayload = {
      id: userId,
      email: userEmail,
      type: 'refresh',
    };

    return jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'socialbiblia-api',
      audience: 'socialbiblia-client',
    });
  }

  // Gerar ambos os tokens
  generateTokenPair(userId: string, userEmail: string) {
    return {
      accessToken: this.generateAccessToken(userId, userEmail),
      refreshToken: this.generateRefreshToken(userId, userEmail),
    };
  }

  // Verificar access token
  verifyAccessToken(token: string): AccessTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'socialbiblia-api',
        audience: 'socialbiblia-client',
      }) as AccessTokenPayload;

      if (decoded.type !== 'access') {
        throw new Error('Token type inválido');
      }

      return decoded;
    } catch (error) {
      console.warn('Access token inválido:', error);
      return null;
    }
  }

  // Verificar refresh token
  verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtRefreshSecret, {
        issuer: 'socialbiblia-api',
        audience: 'socialbiblia-client',
      }) as RefreshTokenPayload;

      if (decoded.type !== 'refresh') {
        throw new Error('Token type inválido');
      }

      return decoded;
    } catch (error) {
      console.warn('Refresh token inválido:', error);
      return null;
    }
  }

  // Renovar access token usando refresh token
  refreshAccessToken(refreshToken: string): { accessToken: string } | null {
    const payload = this.verifyRefreshToken(refreshToken);
    
    if (!payload) {
      return null;
    }

    const newAccessToken = this.generateAccessToken(payload.id, payload.email);
    
    return { accessToken: newAccessToken };
  }

  // Extrair token do header Authorization
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    return authHeader.substring(7); // Remove "Bearer "
  }

  // Middleware para refresh token endpoint
  refreshTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token é obrigatório',
        });
      }

      const result = this.refreshAccessToken(refreshToken);

      if (!result) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token inválido ou expirado',
        });
      }

      res.json({
        success: true,
        data: {
          token: result.accessToken,
          // Opcionalmente, também retornar um novo refresh token
          // refreshToken: this.generateRefreshToken(payload.id, payload.email),
        },
      });
    } catch (error) {
      console.error('Erro no refresh token middleware:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  };

  // Middleware para validar access token
  validateAccessTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const token = this.extractTokenFromHeader(authHeader);

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token de acesso não fornecido',
        });
      }

      const payload = this.verifyAccessToken(token);

      if (!payload) {
        return res.status(401).json({
          success: false,
          message: 'Token de acesso inválido ou expirado',
        });
      }

      // Adicionar dados do usuário à requisição
      req.user = {
        id: payload.id,
        email: payload.email,
      };

      next();
    } catch (error) {
      console.error('Erro no middleware de validação de token:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  };
}

// Instância singleton
export const refreshTokenService = new RefreshTokenService();

export default RefreshTokenService;