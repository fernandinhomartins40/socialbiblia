import { Application } from 'express';
import { readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { Plugin, LoadedPlugin, PluginRegistry, PluginConfig } from '../types/plugin';
import { Logger } from '../utils/logger';

export class PluginManager {
  private static instance: PluginManager;
  private loadedPlugins: Map<string, LoadedPlugin> = new Map();
  private pluginRegistry: PluginRegistry = {};
  private pluginsDir: string;

  private constructor() {
    this.pluginsDir = resolve(__dirname, '../modules');
    this.loadPluginConfig();
  }

  static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  private loadPluginConfig(): void {
    try {
      // Carregar configuração de plugins do ambiente ou arquivo
      const configEnv = process.env.PLUGINS_CONFIG;
      if (configEnv) {
        this.pluginRegistry = JSON.parse(configEnv);
      } else {
        // Configuração padrão
        this.pluginRegistry = {
          auth: { enabled: true },
          users: { enabled: true },
          posts: { enabled: true },
          health: { enabled: true },
          example: { enabled: true },
          products: { enabled: true },
        };
      }
    } catch (error) {
      Logger.warn('Erro ao carregar configuração de plugins, usando configuração padrão');
      this.pluginRegistry = {
        auth: { enabled: true },
        users: { enabled: true },
        posts: { enabled: true },
        health: { enabled: true },
        example: { enabled: true },
        products: { enabled: true },
      };
    }
  }

  async discoverPlugins(): Promise<void> {
    try {
      const pluginDirs = readdirSync(this.pluginsDir).filter(dir => {
        const fullPath = join(this.pluginsDir, dir);
        return statSync(fullPath).isDirectory();
      });

      Logger.info(`Descobrindo plugins em: ${this.pluginsDir}`, {
        pluginDirs,
        registry: this.pluginRegistry,
      } as any);

      for (const pluginDir of pluginDirs) {
        await this.loadPlugin(pluginDir);
      }
    } catch (error) {
      Logger.error('Erro ao descobrir plugins', error as Error);
    }
  }

  private async loadPlugin(pluginName: string): Promise<void> {
    try {
      const pluginConfig = this.pluginRegistry[pluginName];
      
      if (!pluginConfig || !pluginConfig.enabled) {
        Logger.info(`Plugin ${pluginName} desabilitado, pulando...`);
        return;
      }

      const pluginPath = join(this.pluginsDir, pluginName);
      const pluginIndexPath = join(pluginPath, 'index.ts');
      
      // Verificar se o plugin tem um arquivo index.ts
      try {
        statSync(pluginIndexPath);
      } catch {
        // Se não tem index.ts, criar um plugin baseado na estrutura atual
        const plugin = await this.createLegacyPlugin(pluginName, pluginPath);
        if (plugin) {
          this.loadedPlugins.set(pluginName, { plugin, config: pluginConfig });
          Logger.info(`Plugin legado ${pluginName} carregado com sucesso`);
        }
        return;
      }

      // Carregar plugin moderno
      const pluginModule = await import(pluginIndexPath);
      const plugin: Plugin = pluginModule.default || pluginModule.plugin;

      if (!plugin || !plugin.metadata) {
        Logger.warn(`Plugin ${pluginName} não tem estrutura válida`);
        return;
      }

      this.loadedPlugins.set(pluginName, { plugin, config: pluginConfig });
      Logger.info(`Plugin ${pluginName} carregado com sucesso`, {
        version: plugin.metadata.version,
        description: plugin.metadata.description,
      });

    } catch (error) {
      Logger.error(`Erro ao carregar plugin ${pluginName}`, error as Error);
    }
  }

  private async createLegacyPlugin(pluginName: string, pluginPath: string): Promise<Plugin | null> {
    try {
      // Tentar carregar as rotas do plugin legado
      const routesPath = join(pluginPath, `${pluginName}.routes`);
      let router;
      
      try {
        const routeModule = await import(routesPath);
        router = routeModule[`${pluginName}Router`] || routeModule.default;
      } catch {
        Logger.warn(`Plugin ${pluginName} não tem arquivo de rotas válido`);
        return null;
      }

      if (!router) {
        Logger.warn(`Plugin ${pluginName} não exporta router válido`);
        return null;
      }

      // Criar plugin baseado na estrutura legada
      const plugin: Plugin = {
        metadata: {
          name: pluginName,
          version: '1.0.0',
          description: `Plugin legado ${pluginName}`,
          enabled: true,
        },
        routes: [
          {
            path: `/api/${pluginName}`,
            router: router,
          },
        ],
      };

      return plugin;
    } catch (error) {
      Logger.error(`Erro ao criar plugin legado ${pluginName}`, error as Error);
      return null;
    }
  }

  async initializePlugins(): Promise<void> {
    const sortedPlugins = Array.from(this.loadedPlugins.values()).sort(
      (a, b) => (a.plugin.metadata.priority || 0) - (b.plugin.metadata.priority || 0)
    );

    for (const { plugin, config } of sortedPlugins) {
      try {
        // Executar hook beforeInit
        if (plugin.hooks?.beforeInit) {
          await plugin.hooks.beforeInit();
        }

        // Executar método init do plugin
        if (plugin.init) {
          await plugin.init();
        }

        // Executar hook afterInit
        if (plugin.hooks?.afterInit) {
          await plugin.hooks.afterInit();
        }

        Logger.info(`Plugin ${plugin.metadata.name} inicializado com sucesso`);
      } catch (error) {
        Logger.error(`Erro ao inicializar plugin ${plugin.metadata.name}`, error as Error);
      }
    }
  }

  async registerRoutes(app: Application): Promise<void> {
    for (const [pluginName, { plugin, config }] of this.loadedPlugins) {
      try {
        if (plugin.routes) {
          for (const route of plugin.routes) {
            // Aplicar middlewares específicos do plugin se existirem
            if (route.middleware && route.middleware.length > 0) {
              app.use(route.path, ...route.middleware, route.router);
            } else {
              app.use(route.path, route.router);
            }
            
            Logger.info(`Rotas do plugin ${pluginName} registradas em ${route.path}`);
          }
        }

        // Executar hook beforeStart
        if (plugin.hooks?.beforeStart) {
          await plugin.hooks.beforeStart(app);
        }
      } catch (error) {
        Logger.error(`Erro ao registrar rotas do plugin ${pluginName}`, error as Error);
      }
    }
  }

  async startPlugins(app: Application): Promise<void> {
    for (const [pluginName, { plugin }] of this.loadedPlugins) {
      try {
        // Executar hook afterStart
        if (plugin.hooks?.afterStart) {
          await plugin.hooks.afterStart(app);
        }
      } catch (error) {
        Logger.error(`Erro ao iniciar plugin ${pluginName}`, error as Error);
      }
    }
  }

  async shutdownPlugins(): Promise<void> {
    for (const [pluginName, { plugin }] of this.loadedPlugins) {
      try {
        // Executar hook beforeShutdown
        if (plugin.hooks?.beforeShutdown) {
          await plugin.hooks.beforeShutdown();
        }

        // Executar método shutdown do plugin
        if (plugin.shutdown) {
          await plugin.shutdown();
        }

        Logger.info(`Plugin ${pluginName} desligado com sucesso`);
      } catch (error) {
        Logger.error(`Erro ao desligar plugin ${pluginName}`, error as Error);
      }
    }
  }

  getLoadedPlugins(): Map<string, LoadedPlugin> {
    return this.loadedPlugins;
  }

  getPluginInfo(): Array<{ name: string; version: string; description: string; enabled: boolean }> {
    return Array.from(this.loadedPlugins.values()).map(({ plugin }) => ({
      name: plugin.metadata.name,
      version: plugin.metadata.version,
      description: plugin.metadata.description,
      enabled: plugin.metadata.enabled,
    }));
  }

  enablePlugin(pluginName: string): void {
    this.pluginRegistry[pluginName] = { enabled: true };
    Logger.info(`Plugin ${pluginName} habilitado`);
  }

  disablePlugin(pluginName: string): void {
    this.pluginRegistry[pluginName] = { enabled: false };
    this.loadedPlugins.delete(pluginName);
    Logger.info(`Plugin ${pluginName} desabilitado`);
  }
}