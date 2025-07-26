import { cache } from '../../config/redis';
import { queryCache } from './query-cache';
import { sessionCache } from './session-cache';
import { logger } from '../../utils/logger/winston/logger';
import { EventEmitter } from 'events';

// Interface para eventos de invalidação
interface InvalidationEvent {
  type: 'user' | 'post' | 'comment' | 'session' | 'query' | 'custom';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout';
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Interface para regras de invalidação
interface InvalidationRule {
  pattern: string;
  conditions?: string[];
  cascade?: boolean;
  delay?: number; // delay em ms
  priority?: 'low' | 'medium' | 'high';
}

// Interface para estatísticas de invalidação
interface InvalidationStats {
  totalInvalidations: number;
  invalidationsByType: Record<string, number>;
  invalidationsByEntity: Record<string, number>;
  averageInvalidationTime: number;
  failedInvalidations: number;
}

export class CacheInvalidationService extends EventEmitter {
  private invalidationRules: Map<string, InvalidationRule[]> = new Map();
  private invalidationQueue: InvalidationEvent[] = [];
  private isProcessingQueue = false;
  private stats: InvalidationStats = {
    totalInvalidations: 0,
    invalidationsByType: {},
    invalidationsByEntity: {},
    averageInvalidationTime: 0,
    failedInvalidations: 0,
  };

  constructor() {
    super();
    this.setupDefaultRules();
    this.startQueueProcessor();
  }

  // Configurar regras padrão de invalidação
  private setupDefaultRules(): void {
    // Regras para usuários
    this.addInvalidationRule('user:create', [
      { pattern: 'user_query:*', cascade: true },
      { pattern: 'feed_query:*', cascade: true },
    ]);

    this.addInvalidationRule('user:update', [
      { pattern: 'user_query:{entityId}:*', cascade: true },
      { pattern: 'feed_query:*', cascade: true },
      { pattern: 'query_cache:user:*', cascade: true },
    ]);

    this.addInvalidationRule('user:delete', [
      { pattern: 'user_query:{entityId}:*', cascade: true },
      { pattern: 'session:*', conditions: ['userId:{entityId}'], cascade: true },
      { pattern: 'feed_query:*', cascade: true },
    ]);

    // Regras para posts
    this.addInvalidationRule('post:create', [
      { pattern: 'feed_query:*', cascade: true },
      { pattern: 'search_query:*', cascade: true },
      { pattern: 'post_query:*', cascade: false },
    ]);

    this.addInvalidationRule('post:update', [
      { pattern: 'post_query:{entityId}:*', cascade: true },
      { pattern: 'feed_query:*', cascade: true },
      { pattern: 'search_query:*', cascade: true },
    ]);

    this.addInvalidationRule('post:delete', [
      { pattern: 'post_query:{entityId}:*', cascade: true },
      { pattern: 'feed_query:*', cascade: true },
      { pattern: 'search_query:*', cascade: true },
    ]);

    // Regras para comentários
    this.addInvalidationRule('comment:create', [
      { pattern: 'post_query:{metadata.postId}:*', cascade: true },
      { pattern: 'feed_query:*', cascade: true },
    ]);

    this.addInvalidationRule('comment:update', [
      { pattern: 'post_query:{metadata.postId}:*', cascade: true },
    ]);

    this.addInvalidationRule('comment:delete', [
      { pattern: 'post_query:{metadata.postId}:*', cascade: true },
      { pattern: 'feed_query:*', cascade: true },
    ]);

    // Regras para sessões
    this.addInvalidationRule('session:login', [
      { pattern: 'user_query:{entityId}:*', cascade: false },
    ]);

    this.addInvalidationRule('session:logout', [
      { pattern: 'session:{entityId}', cascade: false },
      { pattern: 'user_sessions:{metadata.userId}', cascade: false },
    ]);

    logger.info('Default cache invalidation rules configured');
  }

  // Adicionar regra de invalidação
  addInvalidationRule(eventKey: string, rules: InvalidationRule[]): void {
    this.invalidationRules.set(eventKey, rules);
    
    logger.debug(`Invalidation rule added: ${eventKey}`, {
      rulesCount: rules.length,
    });
  }

  // Remover regra de invalidação
  removeInvalidationRule(eventKey: string): void {
    this.invalidationRules.delete(eventKey);
    logger.debug(`Invalidation rule removed: ${eventKey}`);
  }

  // Disparar evento de invalidação
  async triggerInvalidation(event: Omit<InvalidationEvent, 'timestamp'>): Promise<void> {
    const fullEvent: InvalidationEvent = {
      ...event,
      timestamp: new Date(),
    };

    // Adicionar à fila de processamento
    this.invalidationQueue.push(fullEvent);

    // Emitir evento para listeners
    this.emit('invalidation', fullEvent);

    logger.debug('Invalidation event triggered', {
      type: event.type,
      entityId: event.entityId,
      action: event.action,
    });
  }

  // Processar fila de invalidação
  private async startQueueProcessor(): void {
    setInterval(async () => {
      if (!this.isProcessingQueue && this.invalidationQueue.length > 0) {
        await this.processInvalidationQueue();
      }
    }, 100); // Processar a cada 100ms

    logger.info('Invalidation queue processor started');
  }

  private async processInvalidationQueue(): Promise<void> {
    if (this.isProcessingQueue || this.invalidationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    const startTime = Date.now();

    try {
      // Processar eventos em lotes
      const batchSize = 10;
      const batch = this.invalidationQueue.splice(0, batchSize);

      const processPromises = batch.map(event => this.processInvalidationEvent(event));
      await Promise.allSettled(processPromises);

      // Atualizar estatísticas
      const processingTime = Date.now() - startTime;
      this.updateStats(batch.length, processingTime);

    } catch (error) {
      logger.logError('invalidation_queue_error', 'Error processing invalidation queue', {
        error: error instanceof Error ? error.message : 'Unknown error',
        queueSize: this.invalidationQueue.length,
      });
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Processar evento individual de invalidação
  private async processInvalidationEvent(event: InvalidationEvent): Promise<void> {
    const eventKey = `${event.type}:${event.action}`;
    const rules = this.invalidationRules.get(eventKey);

    if (!rules || rules.length === 0) {
      logger.debug(`No invalidation rules found for: ${eventKey}`);
      return;
    }

    try {
      const invalidationPromises = rules.map(rule => 
        this.applyInvalidationRule(rule, event)
      );

      await Promise.allSettled(invalidationPromises);

      logger.debug(`Applied ${rules.length} invalidation rules for: ${eventKey}`, {
        entityId: event.entityId,
      });

    } catch (error) {
      this.stats.failedInvalidations++;
      
      logger.logError('invalidation_event_error', 'Failed to process invalidation event', {
        eventKey,
        entityId: event.entityId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Aplicar regra de invalidação específica
  private async applyInvalidationRule(rule: InvalidationRule, event: InvalidationEvent): Promise<void> {
    try {
      // Substituir placeholders no pattern
      let pattern = rule.pattern;
      pattern = pattern.replace('{entityId}', event.entityId);
      
      // Substituir metadados se existirem
      if (event.metadata) {
        Object.entries(event.metadata).forEach(([key, value]) => {
          pattern = pattern.replace(`{metadata.${key}}`, String(value));
        });
      }

      // Aplicar delay se especificado
      if (rule.delay && rule.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, rule.delay));
      }

      // Verificar condições adicionais
      if (rule.conditions && !this.checkConditions(rule.conditions, event)) {
        logger.debug(`Invalidation rule conditions not met: ${pattern}`);
        return;
      }

      // Executar a invalidação
      let invalidatedCount = 0;

      if (pattern.includes('*')) {
        // Pattern matching - usar delByPattern
        invalidatedCount = await cache.delByPattern(pattern);
      } else {
        // Chave específica
        const deleted = await cache.del(pattern);
        invalidatedCount = deleted ? 1 : 0;
      }

      if (invalidatedCount > 0) {
        logger.debug(`Invalidated ${invalidatedCount} cache entries`, {
          pattern,
          rule: rule.pattern,
          cascade: rule.cascade,
        });

        // Se cascade estiver habilitado, invalidar caches relacionados
        if (rule.cascade) {
          await this.processCascadeInvalidation(pattern, event);
        }
      }

    } catch (error) {
      logger.logError('invalidation_rule_error', 'Failed to apply invalidation rule', {
        pattern: rule.pattern,
        entityId: event.entityId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // Verificar condições da regra
  private checkConditions(conditions: string[], event: InvalidationEvent): boolean {
    return conditions.every(condition => {
      // Substituir placeholders na condição
      let resolvedCondition = condition;
      resolvedCondition = resolvedCondition.replace('{entityId}', event.entityId);
      
      if (event.metadata) {
        Object.entries(event.metadata).forEach(([key, value]) => {
          resolvedCondition = resolvedCondition.replace(`{metadata.${key}}`, String(value));
        });
      }

      // Implementar lógica de verificação de condições
      // Por enquanto, assumindo que a condição é sempre verdadeira
      return true;
    });
  }

  // Processar invalidação em cascata
  private async processCascadeInvalidation(pattern: string, event: InvalidationEvent): Promise<void> {
    try {
      // Invalidações específicas em cascata
      if (pattern.includes('user_query:')) {
        await queryCache.invalidateUserCache(event.entityId);
      }
      
      if (pattern.includes('post_query:')) {
        await queryCache.invalidatePostCache(event.entityId);
      }
      
      if (pattern.includes('feed_query:')) {
        await queryCache.invalidateAllFeeds();
      }
      
      if (pattern.includes('session:')) {
        if (event.metadata?.userId) {
          await sessionCache.destroyAllUserSessions(event.metadata.userId);
        }
      }

      logger.debug('Cascade invalidation completed', {
        pattern,
        entityId: event.entityId,
      });

    } catch (error) {
      logger.logError('cascade_invalidation_error', 'Failed to process cascade invalidation', {
        pattern,
        entityId: event.entityId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Invalidação manual por padrão
  async invalidateByPattern(pattern: string, cascade: boolean = false): Promise<number> {
    try {
      const invalidatedCount = await cache.delByPattern(pattern);

      if (cascade && invalidatedCount > 0) {
        // Trigger cascade invalidation
        await this.triggerInvalidation({
          type: 'custom',
          entityId: 'manual',
          action: 'delete',
          metadata: { pattern, cascade: true },
        });
      }

      logger.info(`Manual invalidation completed: ${pattern}`, {
        invalidatedCount,
        cascade,
      });

      return invalidatedCount;

    } catch (error) {
      logger.logError('manual_invalidation_error', 'Failed to manually invalidate cache', {
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  // Invalidação completa por tipo de entidade
  async invalidateEntityType(entityType: 'user' | 'post' | 'comment' | 'session'): Promise<number> {
    const patterns = {
      user: ['user_query:*', 'user_sessions:*'],
      post: ['post_query:*', 'feed_query:*'],
      comment: ['post_query:*'], // Comments affect posts
      session: ['session:*', 'user_sessions:*'],
    };

    let totalInvalidated = 0;

    try {
      const entityPatterns = patterns[entityType] || [];
      
      for (const pattern of entityPatterns) {
        const count = await cache.delByPattern(pattern);
        totalInvalidated += count;
      }

      logger.info(`Entity type invalidation completed: ${entityType}`, {
        patterns: entityPatterns,
        totalInvalidated,
      });

      return totalInvalidated;

    } catch (error) {
      logger.logError('entity_invalidation_error', 'Failed to invalidate entity type', {
        entityType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  // Limpeza programada de cache expirado
  async scheduleCleanup(): Promise<void> {
    try {
      // Limpeza de sessões expiradas
      const expiredSessions = await sessionCache.cleanupExpiredSessions();
      
      // Limpeza de queries antigas (baseado em TTL)
      const expiredQueries = await this.cleanupExpiredQueries();

      logger.info('Scheduled cache cleanup completed', {
        expiredSessions,
        expiredQueries,
      });

    } catch (error) {
      logger.logError('scheduled_cleanup_error', 'Failed to perform scheduled cleanup', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async cleanupExpiredQueries(): Promise<number> {
    // Implementar lógica para limpar queries expiradas
    // Por enquanto, retornamos 0
    return 0;
  }

  // Atualizar estatísticas
  private updateStats(batchSize: number, processingTime: number): void {
    this.stats.totalInvalidations += batchSize;
    
    // Calcular tempo médio de invalidação
    const currentAverage = this.stats.averageInvalidationTime;
    const newAverage = (currentAverage + processingTime / batchSize) / 2;
    this.stats.averageInvalidationTime = Math.round(newAverage);
  }

  // Obter estatísticas de invalidação
  getStats(): InvalidationStats {
    return { ...this.stats };
  }

  // Reset das estatísticas
  resetStats(): void {
    this.stats = {
      totalInvalidations: 0,
      invalidationsByType: {},
      invalidationsByEntity: {},
      averageInvalidationTime: 0,
      failedInvalidations: 0,
    };
    
    logger.info('Invalidation stats reset');
  }

  // Obter informações da fila
  getQueueInfo(): {
    queueSize: number;
    isProcessing: boolean;
    rules: string[];
  } {
    return {
      queueSize: this.invalidationQueue.length,
      isProcessing: this.isProcessingQueue,
      rules: Array.from(this.invalidationRules.keys()),
    };
  }
}

// Export singleton instance
export const cacheInvalidation = new CacheInvalidationService();

// Helper functions para facilitar o uso
export const invalidateCache = {
  user: {
    created: (userId: string, metadata?: Record<string, any>) =>
      cacheInvalidation.triggerInvalidation({
        type: 'user',
        entityId: userId,
        action: 'create',
        metadata,
      }),
    
    updated: (userId: string, metadata?: Record<string, any>) =>
      cacheInvalidation.triggerInvalidation({
        type: 'user',
        entityId: userId,
        action: 'update',
        metadata,
      }),
    
    deleted: (userId: string, metadata?: Record<string, any>) =>
      cacheInvalidation.triggerInvalidation({
        type: 'user',
        entityId: userId,
        action: 'delete',
        metadata,
      }),
  },

  post: {
    created: (postId: string, metadata?: Record<string, any>) =>
      cacheInvalidation.triggerInvalidation({
        type: 'post',
        entityId: postId,
        action: 'create',
        metadata,
      }),
    
    updated: (postId: string, metadata?: Record<string, any>) =>
      cacheInvalidation.triggerInvalidation({
        type: 'post',
        entityId: postId,
        action: 'update',
        metadata,
      }),
    
    deleted: (postId: string, metadata?: Record<string, any>) =>
      cacheInvalidation.triggerInvalidation({
        type: 'post',
        entityId: postId,
        action: 'delete',
        metadata,
      }),
  },

  comment: {
    created: (commentId: string, postId: string, metadata?: Record<string, any>) =>
      cacheInvalidation.triggerInvalidation({
        type: 'comment',
        entityId: commentId,
        action: 'create',
        metadata: { postId, ...metadata },
      }),
    
    updated: (commentId: string, postId: string, metadata?: Record<string, any>) =>
      cacheInvalidation.triggerInvalidation({
        type: 'comment',
        entityId: commentId,
        action: 'update',
        metadata: { postId, ...metadata },
      }),
    
    deleted: (commentId: string, postId: string, metadata?: Record<string, any>) =>
      cacheInvalidation.triggerInvalidation({
        type: 'comment',
        entityId: commentId,
        action: 'delete',
        metadata: { postId, ...metadata },
      }),
  },

  session: {
    login: (sessionId: string, userId: string, metadata?: Record<string, any>) =>
      cacheInvalidation.triggerInvalidation({
        type: 'session',
        entityId: sessionId,
        action: 'login',
        metadata: { userId, ...metadata },
      }),
    
    logout: (sessionId: string, userId: string, metadata?: Record<string, any>) =>
      cacheInvalidation.triggerInvalidation({
        type: 'session',
        entityId: sessionId,
        action: 'logout',
        metadata: { userId, ...metadata },
      }),
  },
};