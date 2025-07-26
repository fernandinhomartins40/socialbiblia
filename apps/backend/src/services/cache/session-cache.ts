import { cache } from '../../config/redis';
import { logger } from '../../utils/logger/winston/logger';
import crypto from 'crypto';

// Interface para dados da sessão
interface SessionData {
  userId: string;
  email: string;
  role: string;
  isActive: boolean;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
  refreshTokenId?: string;
  loginTime: Date;
  expiresAt: Date;
}

// Interface para configuração de sessão
interface SessionConfig {
  maxAge?: number; // em segundos
  rolling?: boolean; // renovar automaticamente
  secure?: boolean;
  httpOnly?: boolean;
}

// Interface para estatísticas de sessão
interface SessionStats {
  activeSessions: number;
  totalSessions: number;
  averageSessionDuration: number;
  sessionsCreatedToday: number;
  sessionsExpiredToday: number;
}

export class SessionCacheService {
  private readonly sessionPrefix = 'session';
  private readonly userSessionPrefix = 'user_sessions';
  private readonly sessionStatsPrefix = 'session_stats';
  
  private defaultMaxAge = 24 * 60 * 60; // 24 horas em segundos
  private maxSessionsPerUser = 5; // Máximo de sessões simultâneas por usuário

  // Criar nova sessão
  async createSession(
    sessionId: string,
    sessionData: Omit<SessionData, 'loginTime' | 'expiresAt'>,
    config: SessionConfig = {}
  ): Promise<boolean> {
    try {
      const { maxAge = this.defaultMaxAge } = config;
      
      const fullSessionData: SessionData = {
        ...sessionData,
        loginTime: new Date(),
        expiresAt: new Date(Date.now() + maxAge * 1000),
        lastActivity: new Date(),
      };

      // Verificar limite de sessões por usuário
      await this.enforceSessionLimit(sessionData.userId);

      // Armazenar sessão principal
      const sessionKey = `${this.sessionPrefix}:${sessionId}`;
      const success = await cache.set(sessionKey, fullSessionData, maxAge);

      if (success) {
        // Adicionar à lista de sessões do usuário
        await this.addUserSession(sessionData.userId, sessionId, maxAge);
        
        // Atualizar estatísticas
        await this.updateSessionStats('created');

        logger.logSecurity('session_created', 'Session created successfully', {
          sessionId: sessionId.substring(0, 8) + '***', // Mask session ID
          userId: sessionData.userId,
          ipAddress: sessionData.ipAddress,
          maxAge,
        });

        return true;
      }

      return false;

    } catch (error) {
      logger.logError('session_create_error', 'Failed to create session', {
        sessionId: sessionId.substring(0, 8) + '***',
        userId: sessionData.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // Obter sessão
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const sessionKey = `${this.sessionPrefix}:${sessionId}`;
      const sessionData = await cache.get<SessionData>(sessionKey);

      if (!sessionData) {
        return null;
      }

      // Verificar se a sessão expirou
      if (new Date() > new Date(sessionData.expiresAt)) {
        await this.destroySession(sessionId);
        return null;
      }

      // Verificar se o usuário ainda está ativo
      if (!sessionData.isActive) {
        await this.destroySession(sessionId);
        return null;
      }

      return sessionData;

    } catch (error) {
      logger.logError('session_get_error', 'Failed to get session', {
        sessionId: sessionId.substring(0, 8) + '***',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  // Atualizar atividade da sessão
  async updateSessionActivity(
    sessionId: string,
    additionalData: Partial<SessionData> = {}
  ): Promise<boolean> {
    try {
      const sessionData = await this.getSession(sessionId);
      
      if (!sessionData) {
        return false;
      }

      const updatedData: SessionData = {
        ...sessionData,
        ...additionalData,
        lastActivity: new Date(),
      };

      const sessionKey = `${this.sessionPrefix}:${sessionId}`;
      const ttl = Math.floor((new Date(sessionData.expiresAt).getTime() - Date.now()) / 1000);

      if (ttl <= 0) {
        await this.destroySession(sessionId);
        return false;
      }

      const success = await cache.set(sessionKey, updatedData, ttl);

      if (success) {
        logger.debug(`Session activity updated: ${sessionId.substring(0, 8)}***`);
      }

      return success;

    } catch (error) {
      logger.logError('session_update_error', 'Failed to update session activity', {
        sessionId: sessionId.substring(0, 8) + '***',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // Renovar sessão (rolling sessions)
  async renewSession(sessionId: string, maxAge: number = this.defaultMaxAge): Promise<boolean> {
    try {
      const sessionData = await this.getSession(sessionId);
      
      if (!sessionData) {
        return false;
      }

      const renewedData: SessionData = {
        ...sessionData,
        expiresAt: new Date(Date.now() + maxAge * 1000),
        lastActivity: new Date(),
      };

      const sessionKey = `${this.sessionPrefix}:${sessionId}`;
      const success = await cache.set(sessionKey, renewedData, maxAge);

      if (success) {
        // Renovar também na lista de sessões do usuário
        await this.addUserSession(sessionData.userId, sessionId, maxAge);

        logger.logSecurity('session_renewed', 'Session renewed', {
          sessionId: sessionId.substring(0, 8) + '***',
          userId: sessionData.userId,
          newExpiration: renewedData.expiresAt,
        });
      }

      return success;

    } catch (error) {
      logger.logError('session_renew_error', 'Failed to renew session', {
        sessionId: sessionId.substring(0, 8) + '***',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // Destruir sessão
  async destroySession(sessionId: string): Promise<boolean> {
    try {
      const sessionData = await this.getSession(sessionId);
      
      const sessionKey = `${this.sessionPrefix}:${sessionId}`;
      const success = await cache.del(sessionKey);

      if (sessionData) {
        // Remover da lista de sessões do usuário
        await this.removeUserSession(sessionData.userId, sessionId);
        
        // Atualizar estatísticas
        await this.updateSessionStats('destroyed');

        logger.logSecurity('session_destroyed', 'Session destroyed', {
          sessionId: sessionId.substring(0, 8) + '***',
          userId: sessionData.userId,
        });
      }

      return success;

    } catch (error) {
      logger.logError('session_destroy_error', 'Failed to destroy session', {
        sessionId: sessionId.substring(0, 8) + '***',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // Destruir todas as sessões de um usuário
  async destroyAllUserSessions(userId: string, exceptSessionId?: string): Promise<number> {
    try {
      const userSessions = await this.getUserSessions(userId);
      let destroyedCount = 0;

      for (const sessionId of userSessions) {
        if (sessionId !== exceptSessionId) {
          const success = await this.destroySession(sessionId);
          if (success) {
            destroyedCount++;
          }
        }
      }

      if (destroyedCount > 0) {
        logger.logSecurity('user_sessions_destroyed', 'All user sessions destroyed', {
          userId,
          destroyedCount,
          exceptSessionId: exceptSessionId?.substring(0, 8) + '***',
        });
      }

      return destroyedCount;

    } catch (error) {
      logger.logError('destroy_user_sessions_error', 'Failed to destroy user sessions', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  // Obter todas as sessões ativas de um usuário
  async getUserSessions(userId: string): Promise<string[]> {
    try {
      const userSessionKey = `${this.userSessionPrefix}:${userId}`;
      const sessionIds = await cache.get<string[]>(userSessionKey);
      
      if (!sessionIds) {
        return [];
      }

      // Verificar quais sessões ainda são válidas
      const validSessions: string[] = [];
      
      for (const sessionId of sessionIds) {
        const sessionData = await this.getSession(sessionId);
        if (sessionData) {
          validSessions.push(sessionId);
        }
      }

      // Atualizar a lista se houver diferença
      if (validSessions.length !== sessionIds.length) {
        await cache.set(userSessionKey, validSessions, this.defaultMaxAge);
      }

      return validSessions;

    } catch (error) {
      logger.logError('get_user_sessions_error', 'Failed to get user sessions', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  // Adicionar sessão à lista do usuário
  private async addUserSession(userId: string, sessionId: string, maxAge: number): Promise<void> {
    try {
      const userSessionKey = `${this.userSessionPrefix}:${userId}`;
      const currentSessions = await cache.get<string[]>(userSessionKey) || [];
      
      // Adicionar nova sessão se não existir
      if (!currentSessions.includes(sessionId)) {
        currentSessions.push(sessionId);
      }

      await cache.set(userSessionKey, currentSessions, maxAge);

    } catch (error) {
      logger.logError('add_user_session_error', 'Failed to add user session', {
        userId,
        sessionId: sessionId.substring(0, 8) + '***',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Remover sessão da lista do usuário
  private async removeUserSession(userId: string, sessionId: string): Promise<void> {
    try {
      const userSessionKey = `${this.userSessionPrefix}:${userId}`;
      const currentSessions = await cache.get<string[]>(userSessionKey) || [];
      
      const updatedSessions = currentSessions.filter(id => id !== sessionId);
      
      if (updatedSessions.length > 0) {
        await cache.set(userSessionKey, updatedSessions, this.defaultMaxAge);
      } else {
        await cache.del(userSessionKey);
      }

    } catch (error) {
      logger.logError('remove_user_session_error', 'Failed to remove user session', {
        userId,
        sessionId: sessionId.substring(0, 8) + '***',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Aplicar limite de sessões por usuário
  private async enforceSessionLimit(userId: string): Promise<void> {
    try {
      const userSessions = await this.getUserSessions(userId);
      
      if (userSessions.length >= this.maxSessionsPerUser) {
        // Remover as sessões mais antigas
        const sessionsToRemove = userSessions.length - this.maxSessionsPerUser + 1;
        
        for (let i = 0; i < sessionsToRemove; i++) {
          await this.destroySession(userSessions[i]);
        }

        logger.logSecurity('session_limit_enforced', 'Session limit enforced', {
          userId,
          removedSessions: sessionsToRemove,
          maxSessions: this.maxSessionsPerUser,
        });
      }

    } catch (error) {
      logger.logError('enforce_session_limit_error', 'Failed to enforce session limit', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Atualizar estatísticas de sessão
  private async updateSessionStats(action: 'created' | 'destroyed'): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const statsKey = `${this.sessionStatsPrefix}:${today}`;
      
      const currentStats = await cache.get<any>(statsKey) || {
        created: 0,
        destroyed: 0,
        date: today,
      };

      currentStats[action]++;
      
      await cache.set(statsKey, currentStats, 86400); // 24 horas

    } catch (error) {
      logger.logError('update_session_stats_error', 'Failed to update session stats', {
        action,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Obter estatísticas de sessão
  async getSessionStats(): Promise<SessionStats> {
    try {
      // Contar sessões ativas
      const sessionKeys = await cache.keys(`${this.sessionPrefix}:*`);
      let activeSessions = 0;
      let totalDuration = 0;
      let validSessions = 0;

      for (const key of sessionKeys.slice(0, 100)) { // Limitar para performance
        const sessionData = await cache.get<SessionData>(key);
        if (sessionData) {
          const now = new Date();
          if (now <= new Date(sessionData.expiresAt)) {
            activeSessions++;
            
            // Calcular duração da sessão
            const duration = now.getTime() - new Date(sessionData.loginTime).getTime();
            totalDuration += duration;
            validSessions++;
          }
        }
      }

      // Obter estatísticas do dia
      const today = new Date().toISOString().split('T')[0];
      const todayStats = await cache.get<any>(`${this.sessionStatsPrefix}:${today}`) || {
        created: 0,
        destroyed: 0,
      };

      return {
        activeSessions,
        totalSessions: sessionKeys.length,
        averageSessionDuration: validSessions > 0 ? Math.floor(totalDuration / validSessions / 1000 / 60) : 0, // em minutos
        sessionsCreatedToday: todayStats.created,
        sessionsExpiredToday: todayStats.destroyed,
      };

    } catch (error) {
      logger.logError('get_session_stats_error', 'Failed to get session stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        activeSessions: 0,
        totalSessions: 0,
        averageSessionDuration: 0,
        sessionsCreatedToday: 0,
        sessionsExpiredToday: 0,
      };
    }
  }

  // Limpeza de sessões expiradas
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const sessionKeys = await cache.keys(`${this.sessionPrefix}:*`);
      let cleanedCount = 0;

      for (const key of sessionKeys) {
        const sessionData = await cache.get<SessionData>(key);
        
        if (!sessionData || new Date() > new Date(sessionData.expiresAt)) {
          const sessionId = key.replace(`${this.sessionPrefix}:`, '');
          const success = await this.destroySession(sessionId);
          
          if (success) {
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} expired sessions`);
      }

      return cleanedCount;

    } catch (error) {
      logger.logError('cleanup_sessions_error', 'Failed to cleanup expired sessions', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  // Verificar se uma sessão existe e é válida
  async isValidSession(sessionId: string): Promise<boolean> {
    try {
      const sessionData = await this.getSession(sessionId);
      return sessionData !== null;
    } catch (error) {
      return false;
    }
  }

  // Obter informações detalhadas de uma sessão (para admin)
  async getSessionDetails(sessionId: string): Promise<SessionData | null> {
    try {
      return await this.getSession(sessionId);
    } catch (error) {
      logger.logError('get_session_details_error', 'Failed to get session details', {
        sessionId: sessionId.substring(0, 8) + '***',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  // Configurar limite máximo de sessões por usuário
  setMaxSessionsPerUser(limit: number): void {
    this.maxSessionsPerUser = limit;
    logger.info(`Max sessions per user updated to: ${limit}`);
  }
}

// Export singleton instance
export const sessionCache = new SessionCacheService();