import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../../../utils/logger';
import { MigrationManager } from '../../../core/migrations';

interface PluginInfo {
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  priority: number;
  dependencies: string[];
  routes: number;
  hasDatabase: boolean;
  hasMigrations: boolean;
  pendingMigrations: number;
}

interface SystemStats {
  totalPlugins: number;
  enabledPlugins: number;
  disabledPlugins: number;
  totalRoutes: number;
  pendingMigrations: number;
}

export class DashboardService {
  private pluginsCache: PluginInfo[] = [];
  private lastCacheUpdate = 0;
  private cacheTimeout = 30000; // 30 segundos

  async init(): Promise<void> {
    Logger.info(`Inicializando ${this.constructor.name}...`);
    
    // Cache inicial
    await this.refreshPluginsCache();
    
    Logger.info(`${this.constructor.name} inicializado com sucesso`);
  }

  async cleanup(): Promise<void> {
    Logger.info(`Finalizando ${this.constructor.name}...`);
    this.pluginsCache = [];
  }

  async getPluginsList(): Promise<PluginInfo[]> {
    // Atualizar cache se necessário
    const now = Date.now();
    if (now - this.lastCacheUpdate > this.cacheTimeout) {
      await this.refreshPluginsCache();
    }
    
    return this.pluginsCache;
  }

  async getSystemStats(): Promise<SystemStats> {
    const plugins = await this.getPluginsList();
    
    const stats: SystemStats = {
      totalPlugins: plugins.length,
      enabledPlugins: plugins.filter(p => p.enabled).length,
      disabledPlugins: plugins.filter(p => !p.enabled).length,
      totalRoutes: plugins.reduce((sum, p) => sum + p.routes, 0),
      pendingMigrations: plugins.reduce((sum, p) => sum + p.pendingMigrations, 0)
    };
    
    return stats;
  }

  async togglePlugin(pluginName: string, enabled: boolean): Promise<boolean> {
    try {
      const pluginPath = path.join(process.cwd(), 'src', 'modules', pluginName, 'index.ts');
      
      // Verificar se plugin existe
      try {
        await fs.access(pluginPath);
      } catch {
        throw new Error(`Plugin "${pluginName}" não encontrado`);
      }
      
      // Ler conteúdo do plugin
      let pluginContent = await fs.readFile(pluginPath, 'utf-8');
      
      // Substituir enabled
      const currentState = enabled ? 'false' : 'true';
      const newState = enabled ? 'true' : 'false';
      
      pluginContent = pluginContent.replace(
        new RegExp(`enabled:\\s*${currentState}`, 'g'),
        `enabled: ${newState}`
      );
      
      // Salvar arquivo
      await fs.writeFile(pluginPath, pluginContent);
      
      // Atualizar cache
      await this.refreshPluginsCache();
      
      Logger.info(`Plugin ${pluginName} ${enabled ? 'habilitado' : 'desabilitado'} com sucesso`);
      return true;
      
    } catch (error) {
      Logger.error('Erro ao alterar estado do plugin:', error);
      throw error;
    }
  }

  async runMigrations(pluginName?: string): Promise<{ success: boolean; message: string }> {
    try {
      const migrationManager = MigrationManager.getInstance();
      await migrationManager.runMigrations(pluginName);
      
      // Atualizar cache
      await this.refreshPluginsCache();
      
      return {
        success: true,
        message: pluginName ? 
          `Migrations do plugin ${pluginName} executadas com sucesso` :
          'Todas as migrations executadas com sucesso'
      };
      
    } catch (error) {
      Logger.error('Erro ao executar migrations:', error);
      return {
        success: false,
        message: `Erro ao executar migrations: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  private async refreshPluginsCache(): Promise<void> {
    try {
      const plugins: PluginInfo[] = [];
      const modulesDir = path.join(process.cwd(), 'src', 'modules');
      
      const pluginDirs = await fs.readdir(modulesDir, { withFileTypes: true });
      const migrationManager = MigrationManager.getInstance();
      
      for (const pluginDir of pluginDirs) {
        if (!pluginDir.isDirectory()) continue;
        
        try {
          const pluginPath = path.join(modulesDir, pluginDir.name, 'index.ts');
          const pluginContent = await fs.readFile(pluginPath, 'utf-8');
          
          // Extrair metadata
          const metadata = this.extractPluginMetadata(pluginContent);
          
          // Verificar se tem migrations
          const migrationDir = path.join(modulesDir, pluginDir.name, 'migrations');
          let hasMigrations = false;
          let pendingMigrations = 0;
          
          try {
            await fs.access(migrationDir);
            hasMigrations = true;
            
            const pending = await migrationManager.getPendingMigrations(pluginDir.name);
            pendingMigrations = pending.length;
            
          } catch {
            // Plugin não tem migrations
          }
          
          // Contar rotas
          const routeCount = this.countRoutes(pluginContent);
          
          plugins.push({
            name: metadata.name || pluginDir.name,
            version: metadata.version || '1.0.0',
            description: metadata.description || 'Sem descrição',
            enabled: metadata.enabled !== false,
            priority: metadata.priority || 10,
            dependencies: metadata.dependencies || [],
            routes: routeCount,
            hasDatabase: hasMigrations,
            hasMigrations,
            pendingMigrations
          });
          
        } catch (error) {
          Logger.warn(`Erro ao processar plugin ${pluginDir.name}:`, error);
          
          // Adicionar plugin com informações básicas
          plugins.push({
            name: pluginDir.name,
            version: 'N/A',
            description: 'Erro ao carregar informações',
            enabled: false,
            priority: 999,
            dependencies: [],
            routes: 0,
            hasDatabase: false,
            hasMigrations: false,
            pendingMigrations: 0
          });
        }
      }
      
      // Ordenar por prioridade
      plugins.sort((a, b) => a.priority - b.priority);
      
      this.pluginsCache = plugins;
      this.lastCacheUpdate = Date.now();
      
      Logger.debug(`Cache de plugins atualizado: ${plugins.length} plugins`);
      
    } catch (error) {
      Logger.error('Erro ao atualizar cache de plugins:', error);
      throw error;
    }
  }

  private extractPluginMetadata(pluginContent: string): any {
    try {
      // Extrair o objeto metadata usando regex
      const metadataMatch = pluginContent.match(/metadata\s*=\s*{([^}]+)}/s);
      
      if (!metadataMatch) {
        return { enabled: true };
      }
      
      const metadataStr = metadataMatch[1];
      
      // Extrair campos individualmente
      const nameMatch = metadataStr.match(/name:\s*['"`]([^'"`]+)['"`]/);
      const versionMatch = metadataStr.match(/version:\s*['"`]([^'"`]+)['"`]/);
      const descriptionMatch = metadataStr.match(/description:\s*['"`]([^'"`]+)['"`]/);
      const enabledMatch = metadataStr.match(/enabled:\s*(true|false)/);
      const priorityMatch = metadataStr.match(/priority:\s*(\d+)/);
      const dependenciesMatch = metadataStr.match(/dependencies:\s*\[([^\]]*)\]/);
      
      const metadata: any = {
        name: nameMatch?.[1],
        version: versionMatch?.[1],
        description: descriptionMatch?.[1],
        enabled: enabledMatch?.[1] !== 'false',
        priority: priorityMatch ? parseInt(priorityMatch[1]) : undefined
      };
      
      if (dependenciesMatch) {
        metadata.dependencies = dependenciesMatch[1]
          .split(',')
          .map(dep => dep.replace(/['"`\s]/g, ''))
          .filter(dep => dep.length > 0);
      }
      
      return metadata;
      
    } catch (error) {
      return { enabled: true };
    }
  }

  private countRoutes(pluginContent: string): number {
    try {
      // Contar ocorrências de definições de rota
      const routeMatches = pluginContent.match(/method:\s*['"`](GET|POST|PUT|DELETE|PATCH)['"`]/g);
      return routeMatches ? routeMatches.length : 0;
    } catch {
      return 0;
    }
  }
}
