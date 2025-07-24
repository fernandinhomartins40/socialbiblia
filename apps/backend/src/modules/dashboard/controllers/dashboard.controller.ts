import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { Logger } from '../../../utils/logger';
import { ApiResponse } from '../../../types/api';

export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  // GET /api/dashboard
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const [plugins, stats] = await Promise.all([
        this.dashboardService.getPluginsList(),
        this.dashboardService.getSystemStats()
      ]);

      const response: ApiResponse = {
        success: true,
        data: {
          plugins,
          stats
        }
      };

      res.json(response);
    } catch (error) {
      Logger.error('Erro ao buscar dados do dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/dashboard/plugins
  async getPlugins(req: Request, res: Response): Promise<void> {
    try {
      const plugins = await this.dashboardService.getPluginsList();

      const response: ApiResponse = {
        success: true,
        data: plugins
      };

      res.json(response);
    } catch (error) {
      Logger.error('Erro ao buscar plugins:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/dashboard/stats
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.dashboardService.getSystemStats();

      const response: ApiResponse = {
        success: true,
        data: stats
      };

      res.json(response);
    } catch (error) {
      Logger.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // POST /api/dashboard/plugins/:name/toggle
  async togglePlugin(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') {
        res.status(400).json({
          success: false,
          error: 'Campo "enabled" deve ser um boolean'
        });
        return;
      }

      await this.dashboardService.togglePlugin(name, enabled);

      const response: ApiResponse = {
        success: true,
        message: `Plugin ${name} ${enabled ? 'habilitado' : 'desabilitado'} com sucesso`,
        data: { name, enabled }
      };

      res.json(response);
    } catch (error) {
      Logger.error('Erro ao alterar estado do plugin:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  // POST /api/dashboard/migrations/run
  async runMigrations(req: Request, res: Response): Promise<void> {
    try {
      const { plugin } = req.body;

      const result = await this.dashboardService.runMigrations(plugin);

      const response: ApiResponse = {
        success: result.success,
        message: result.message
      };

      if (result.success) {
        res.json(response);
      } else {
        res.status(500).json(response);
      }
    } catch (error) {
      Logger.error('Erro ao executar migrations:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/dashboard/ui
  async getDashboardUI(req: Request, res: Response): Promise<void> {
    try {
      // Retornar HTML do dashboard
      const html = this.generateDashboardHTML();
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      Logger.error('Erro ao gerar UI do dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  private generateDashboardHTML(): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plugbase Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-gray-100 min-h-screen">
    <div x-data="dashboard()" x-init="init()" class="container mx-auto px-4 py-8">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">
                <i class="fas fa-plug text-blue-600"></i>
                Plugbase Dashboard
            </h1>
            <p class="text-gray-600">Gerencie seus plugins de forma visual e intuitiva</p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-blue-100">
                        <i class="fas fa-plug text-blue-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Total Plugins</p>
                        <p class="text-2xl font-semibold text-gray-900" x-text="stats.totalPlugins">-</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-green-100">
                        <i class="fas fa-check-circle text-green-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Ativos</p>
                        <p class="text-2xl font-semibold text-gray-900" x-text="stats.enabledPlugins">-</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-gray-100">
                        <i class="fas fa-times-circle text-gray-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Inativos</p>
                        <p class="text-2xl font-semibold text-gray-900" x-text="stats.disabledPlugins">-</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-yellow-100">
                        <i class="fas fa-database text-yellow-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Migrations Pendentes</p>
                        <p class="text-2xl font-semibold text-gray-900" x-text="stats.pendingMigrations">-</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div class="mb-6 flex flex-wrap gap-4">
            <button @click="refreshData()" 
                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                <i class="fas fa-sync-alt mr-2"></i>
                Atualizar
            </button>
            
            <button @click="runAllMigrations()" 
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    x-show="stats.pendingMigrations > 0">
                <i class="fas fa-database mr-2"></i>
                Executar Todas Migrations
            </button>
        </div>

        <!-- Plugins Table -->
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-800">Plugins</h2>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plugin</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Versão</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rotas</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Migrations</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <template x-for="plugin in plugins" :key="plugin.name">
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="p-2 rounded-full" 
                                             :class="plugin.enabled ? 'bg-green-100' : 'bg-gray-100'">
                                            <i class="fas fa-plug text-sm" 
                                               :class="plugin.enabled ? 'text-green-600' : 'text-gray-400'"></i>
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-medium text-gray-900" x-text="plugin.name"></div>
                                            <div class="text-sm text-gray-500" x-text="plugin.description"></div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                                          :class="plugin.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                                        <span x-text="plugin.enabled ? 'Ativo' : 'Inativo'"></span>
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" x-text="plugin.version"></td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" x-text="plugin.routes"></td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center space-x-2">
                                        <span class="text-sm text-gray-900" x-text="plugin.pendingMigrations"></span>
                                        <span x-show="plugin.pendingMigrations > 0" 
                                              class="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                            Pendente
                                        </span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button @click="togglePlugin(plugin)" 
                                            class="text-indigo-600 hover:text-indigo-900 transition-colors"
                                            x-text="plugin.enabled ? 'Desabilitar' : 'Habilitar'">
                                    </button>
                                    
                                    <button @click="runPluginMigrations(plugin.name)" 
                                            x-show="plugin.pendingMigrations > 0"
                                            class="text-green-600 hover:text-green-900 transition-colors">
                                        Migrar
                                    </button>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Loading Overlay -->
        <div x-show="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white p-6 rounded-lg">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-spinner fa-spin text-blue-600"></i>
                    <span class="text-gray-700">Carregando...</span>
                </div>
            </div>
        </div>

        <!-- Success Message -->
        <div x-show="successMessage" 
             x-transition 
             class="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50">
            <div class="flex items-center space-x-2">
                <i class="fas fa-check-circle"></i>
                <span x-text="successMessage"></span>
            </div>
        </div>

        <!-- Error Message -->
        <div x-show="errorMessage" 
             x-transition 
             class="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
            <div class="flex items-center space-x-2">
                <i class="fas fa-exclamation-circle"></i>
                <span x-text="errorMessage"></span>
            </div>
        </div>
    </div>

    <script>
        function dashboard() {
            return {
                plugins: [],
                stats: {
                    totalPlugins: 0,
                    enabledPlugins: 0,
                    disabledPlugins: 0,
                    pendingMigrations: 0
                },
                loading: false,
                successMessage: '',
                errorMessage: '',

                async init() {
                    await this.refreshData();
                },

                async refreshData() {
                    this.loading = true;
                    try {
                        const response = await fetch('/api/dashboard');
                        const data = await response.json();
                        
                        if (data.success) {
                            this.plugins = data.data.plugins;
                            this.stats = data.data.stats;
                        } else {
                            this.showError('Erro ao carregar dados');
                        }
                    } catch (error) {
                        this.showError('Erro de conexão');
                    } finally {
                        this.loading = false;
                    }
                },

                async togglePlugin(plugin) {
                    this.loading = true;
                    try {
                        const response = await fetch(\`/api/dashboard/plugins/\${plugin.name}/toggle\`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                enabled: !plugin.enabled
                            })
                        });

                        const data = await response.json();
                        
                        if (data.success) {
                            this.showSuccess(data.message);
                            await this.refreshData();
                        } else {
                            this.showError(data.error);
                        }
                    } catch (error) {
                        this.showError('Erro de conexão');
                    } finally {
                        this.loading = false;
                    }
                },

                async runPluginMigrations(pluginName) {
                    this.loading = true;
                    try {
                        const response = await fetch('/api/dashboard/migrations/run', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                plugin: pluginName
                            })
                        });

                        const data = await response.json();
                        
                        if (data.success) {
                            this.showSuccess(data.message);
                            await this.refreshData();
                        } else {
                            this.showError(data.message);
                        }
                    } catch (error) {
                        this.showError('Erro de conexão');
                    } finally {
                        this.loading = false;
                    }
                },

                async runAllMigrations() {
                    this.loading = true;
                    try {
                        const response = await fetch('/api/dashboard/migrations/run', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({})
                        });

                        const data = await response.json();
                        
                        if (data.success) {
                            this.showSuccess(data.message);
                            await this.refreshData();
                        } else {
                            this.showError(data.message);
                        }
                    } catch (error) {
                        this.showError('Erro de conexão');
                    } finally {
                        this.loading = false;
                    }
                },

                showSuccess(message) {
                    this.successMessage = message;
                    setTimeout(() => {
                        this.successMessage = '';
                    }, 3000);
                },

                showError(message) {
                    this.errorMessage = message;
                    setTimeout(() => {
                        this.errorMessage = '';
                    }, 5000);
                }
            }
        }
    </script>
</body>
</html>`;
  }
}
