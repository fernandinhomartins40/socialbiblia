import { Router } from 'express';
import { PluginRoute } from '../../../types/plugin';
import { StorageController } from '../controllers/storage.controller';
import auth from '../../../middlewares/auth/authenticate';

export function storageRoutes(controller: StorageController): PluginRoute[] {
  const router = Router();
  
  // Página de teste do Storage
  router.get('/storage/test', controller.getTestPage.bind(controller));
  
  // Upload de arquivo único
  router.post('/api/storage/upload', controller.upload.single('file'), controller.uploadFile.bind(controller));
  
  // Upload de múltiplos arquivos
  router.post('/api/storage/upload/multiple', controller.upload.array('files', 5), controller.uploadMultipleFiles.bind(controller));
  
  // Download de arquivo
  router.get('/api/storage/download/:id', controller.downloadFile.bind(controller));
  
  // Visualizar arquivo (inline)
  router.get('/api/storage/view/:id', controller.viewFile.bind(controller));
  
  // Deletar arquivo
  router.delete('/api/storage/:id', controller.deleteFile.bind(controller));
  
  // Obter metadados do arquivo
  router.get('/api/storage/:id/metadata', controller.getFileMetadata.bind(controller));
  
  // Listar arquivos
  router.get('/api/storage', controller.listFiles.bind(controller));
  
  // Obter URL pública do arquivo
  router.get('/api/storage/:id/url', controller.getPublicUrl.bind(controller));
  
  // Listar providers disponíveis
  router.get('/api/storage/providers', controller.getProviders.bind(controller));
  
  return [
    {
      path: '/',
      router,
    }
  ];
}