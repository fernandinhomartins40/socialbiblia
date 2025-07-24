import { Response } from 'express';
import { AuthenticatedRequest } from '../../../types/auth';
import multer from 'multer';
import { StorageService } from '../services/storage.service';
import { Logger } from '../../../utils/logger';
import { ApiResponse, PaginatedResponse } from '../../../types/api';

// Configuração do multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Máximo 5 arquivos por vez
  },
  fileFilter: (req, file, cb) => {
    // Tipos de arquivo permitidos (pode ser configurado via env)
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/json',
      'application/zip'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
    }
  }
});

export class StorageController {
  public upload = upload; // Exportar middleware do multer

  constructor(private storageService: StorageService) {}

  // POST /api/storage/upload
  async uploadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'Nenhum arquivo enviado'
        });
        return;
      }

      const { provider } = req.body;
      const userId = req.user?.id;

      const metadata = await this.storageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        { provider, userId }
      );

      const response: ApiResponse = {
        success: true,
        data: metadata,
        message: 'Arquivo enviado com sucesso'
      };

      res.status(201).json(response);
    } catch (error) {
      Logger.error('Erro ao fazer upload de arquivo:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  // POST /api/storage/upload/multiple
  async uploadMultipleFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Nenhum arquivo enviado'
        });
        return;
      }

      const { provider } = req.body;
      const userId = req.user?.id;

      const uploadPromises = req.files.map(file => 
        this.storageService.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          { provider, userId }
        )
      );

      const results = await Promise.all(uploadPromises);

      const response: ApiResponse = {
        success: true,
        data: results,
        message: `${results.length} arquivo(s) enviado(s) com sucesso`
      };

      res.status(201).json(response);
    } catch (error) {
      Logger.error('Erro ao fazer upload de múltiplos arquivos:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  // GET /api/storage/download/:id
  async downloadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const { buffer, metadata } = await this.storageService.downloadFile(id);

      res.setHeader('Content-Type', metadata.mimeType);
      res.setHeader('Content-Length', metadata.size);
      res.setHeader('Content-Disposition', `attachment; filename="${metadata.originalName}"`);

      res.send(buffer);
    } catch (error) {
      Logger.error('Erro ao fazer download de arquivo:', error);
      res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : 'Arquivo não encontrado'
      });
    }
  }

  // GET /api/storage/view/:id
  async viewFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const { buffer, metadata } = await this.storageService.downloadFile(id);

      res.setHeader('Content-Type', metadata.mimeType);
      res.setHeader('Content-Length', metadata.size);
      res.setHeader('Content-Disposition', `inline; filename="${metadata.originalName}"`);

      res.send(buffer);
    } catch (error) {
      Logger.error('Erro ao visualizar arquivo:', error);
      res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : 'Arquivo não encontrado'
      });
    }
  }

  // DELETE /api/storage/:id
  async deleteFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await this.storageService.deleteFile(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Arquivo não encontrado'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Arquivo deletado com sucesso'
      };

      res.json(response);
    } catch (error) {
      Logger.error('Erro ao deletar arquivo:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  // GET /api/storage/:id/metadata
  async getFileMetadata(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const metadata = await this.storageService.getFileMetadata(id);

      if (!metadata) {
        res.status(404).json({
          success: false,
          error: 'Arquivo não encontrado'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: metadata
      };

      res.json(response);
    } catch (error) {
      Logger.error('Erro ao buscar metadados do arquivo:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/storage
  async listFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { provider, mimeType, page = 1, limit = 10 } = req.query;
      const userId = req.user?.id;

      const result = await this.storageService.listFiles({
        userId,
        provider: provider as string,
        mimeType: mimeType as string,
        page: Number(page),
        limit: Number(limit)
      });

      const response: PaginatedResponse<any> = {
        success: true,
        data: result.files,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: result.page * result.limit < result.total,
          hasPrev: result.page > 1,
          timestamp: new Date().toISOString(),
          requestId: req.header('x-request-id') || 'unknown'
        }
      };

      res.json(response);
    } catch (error) {
      Logger.error('Erro ao listar arquivos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/storage/:id/url
  async getPublicUrl(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const url = await this.storageService.getPublicUrl(id);

      const response: ApiResponse = {
        success: true,
        data: { url }
      };

      res.json(response);
    } catch (error) {
      Logger.error('Erro ao gerar URL pública:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  // GET /api/storage/providers
  async getProviders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const providers = this.storageService.getAvailableProviders();
      const stats = this.storageService.getStorageStats();

      const response: ApiResponse = {
        success: true,
        data: {
          providers,
          stats
        }
      };

      res.json(response);
    } catch (error) {
      Logger.error('Erro ao buscar providers:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/storage/test
  async getTestPage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const html = this.generateTestHTML();
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      Logger.error('Erro ao gerar página de teste:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  private generateTestHTML(): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Storage Test Page</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-8">Storage Test Page</h1>
        
        <!-- Upload Single File -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">Upload Arquivo Único</h2>
            <form id="single-upload-form" enctype="multipart/form-data">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Arquivo:</label>
                    <input type="file" name="file" required class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Provider:</label>
                    <select name="provider" class="block w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="">Padrão</option>
                        <option value="local">Local</option>
                        <option value="memory">Memory</option>
                    </select>
                </div>
                <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Upload
                </button>
            </form>
        </div>

        <!-- Upload Multiple Files -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">Upload Múltiplos Arquivos</h2>
            <form id="multiple-upload-form" enctype="multipart/form-data">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Arquivos:</label>
                    <input type="file" name="files" multiple required class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100">
                </div>
                <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Upload Múltiplos
                </button>
            </form>
        </div>

        <!-- File List -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold">Arquivos</h2>
                <button id="refresh-files" class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                    Atualizar
                </button>
            </div>
            <div id="files-list" class="space-y-2">
                <!-- Arquivos aparecerão aqui -->
            </div>
        </div>

        <!-- Messages -->
        <div id="messages" class="fixed bottom-4 right-4 space-y-2">
            <!-- Mensagens aparecerão aqui -->
        </div>
    </div>

    <script>
        function showMessage(message, type = 'info') {
            const messagesContainer = document.getElementById('messages');
            const messageEl = document.createElement('div');
            messageEl.className = \`p-4 rounded-lg shadow-lg text-white \${
                type === 'success' ? 'bg-green-500' : 
                type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }\`;
            messageEl.textContent = message;
            
            messagesContainer.appendChild(messageEl);
            
            setTimeout(() => {
                messageEl.remove();
            }, 5000);
        }

        // Single file upload
        document.getElementById('single-upload-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            
            try {
                const response = await fetch('/api/storage/upload', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showMessage('Arquivo enviado com sucesso!', 'success');
                    loadFiles();
                    e.target.reset();
                } else {
                    showMessage(result.error, 'error');
                }
            } catch (error) {
                showMessage('Erro ao enviar arquivo', 'error');
            }
        });

        // Multiple files upload
        document.getElementById('multiple-upload-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            
            try {
                const response = await fetch('/api/storage/upload/multiple', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showMessage(result.message, 'success');
                    loadFiles();
                    e.target.reset();
                } else {
                    showMessage(result.error, 'error');
                }
            } catch (error) {
                showMessage('Erro ao enviar arquivos', 'error');
            }
        });

        // Load files
        async function loadFiles() {
            try {
                const response = await fetch('/api/storage');
                const result = await response.json();
                
                if (result.success) {
                    displayFiles(result.data);
                } else {
                    showMessage('Erro ao carregar arquivos', 'error');
                }
            } catch (error) {
                showMessage('Erro ao carregar arquivos', 'error');
            }
        }

        function displayFiles(files) {
            const container = document.getElementById('files-list');
            container.innerHTML = '';
            
            if (files.length === 0) {
                container.innerHTML = '<p class="text-gray-500">Nenhum arquivo encontrado</p>';
                return;
            }
            
            files.forEach(file => {
                const fileEl = document.createElement('div');
                fileEl.className = 'flex items-center justify-between p-3 bg-gray-50 rounded border';
                fileEl.innerHTML = \`
                    <div class="flex-1">
                        <div class="font-medium">\${file.originalName}</div>
                        <div class="text-sm text-gray-500">
                            \${file.mimeType} • \${formatFileSize(file.size)} • \${file.provider}
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="downloadFile('\${file.id}')" class="text-blue-600 hover:text-blue-800">
                            Download
                        </button>
                        <button onclick="viewFile('\${file.id}')" class="text-green-600 hover:text-green-800">
                            Visualizar
                        </button>
                        <button onclick="deleteFile('\${file.id}')" class="text-red-600 hover:text-red-800">
                            Deletar
                        </button>
                    </div>
                \`;
                container.appendChild(fileEl);
            });
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        async function downloadFile(id) {
            window.open(\`/api/storage/download/\${id}\`, '_blank');
        }

        async function viewFile(id) {
            window.open(\`/api/storage/view/\${id}\`, '_blank');
        }

        async function deleteFile(id) {
            if (!confirm('Tem certeza que deseja deletar este arquivo?')) return;
            
            try {
                const response = await fetch(\`/api/storage/\${id}\`, {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showMessage('Arquivo deletado com sucesso!', 'success');
                    loadFiles();
                } else {
                    showMessage(result.error, 'error');
                }
            } catch (error) {
                showMessage('Erro ao deletar arquivo', 'error');
            }
        }

        // Event listeners
        document.getElementById('refresh-files').addEventListener('click', loadFiles);

        // Load files on page load
        loadFiles();
    </script>
</body>
</html>`;
  }
}
