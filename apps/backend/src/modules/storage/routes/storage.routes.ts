import { PluginRoute } from '../../../types/plugin';
import { StorageController } from '../controllers/storage.controller';
import { authenticate } from '../../../middleware/auth';

export function storageRoutes(controller: StorageController): PluginRoute[] {
  return [
    // Página de teste do Storage
    {
      method: 'GET',
      path: '/storage/test',
      handler: controller.getTestPage.bind(controller),
      middleware: []
    },

    // Upload de arquivo único
    {
      method: 'POST',
      path: '/api/storage/upload',
      handler: controller.uploadFile.bind(controller),
      middleware: [controller.upload.single('file')]
    },

    // Upload de múltiplos arquivos
    {
      method: 'POST',
      path: '/api/storage/upload/multiple',
      handler: controller.uploadMultipleFiles.bind(controller),
      middleware: [controller.upload.array('files', 5)]
    },

    // Download de arquivo
    {
      method: 'GET',
      path: '/api/storage/download/:id',
      handler: controller.downloadFile.bind(controller),
      middleware: []
    },

    // Visualizar arquivo (inline)
    {
      method: 'GET',
      path: '/api/storage/view/:id',
      handler: controller.viewFile.bind(controller),
      middleware: []
    },

    // Deletar arquivo
    {
      method: 'DELETE',
      path: '/api/storage/:id',
      handler: controller.deleteFile.bind(controller),
      middleware: []
    },

    // Obter metadados do arquivo
    {
      method: 'GET',
      path: '/api/storage/:id/metadata',
      handler: controller.getFileMetadata.bind(controller),
      middleware: []
    },

    // Listar arquivos
    {
      method: 'GET',
      path: '/api/storage',
      handler: controller.listFiles.bind(controller),
      middleware: []
    },

    // Obter URL pública do arquivo
    {
      method: 'GET',
      path: '/api/storage/:id/url',
      handler: controller.getPublicUrl.bind(controller),
      middleware: []
    },

    // Listar providers disponíveis
    {
      method: 'GET',
      path: '/api/storage/providers',
      handler: controller.getProviders.bind(controller),
      middleware: []
    }
  ];
}