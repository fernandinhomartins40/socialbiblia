import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../../utils/logger';
import { prisma } from '../../../core/database';

export interface StorageProvider {
  name: string;
  upload(file: Buffer, filename: string, options?: any): Promise<string>;
  download(url: string): Promise<Buffer>;
  delete(url: string): Promise<boolean>;
  getPublicUrl(url: string): string;
}

export interface FileMetadata {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  provider: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Provider Local (Sistema de arquivos)
class LocalStorageProvider implements StorageProvider {
  name = 'local';
  private basePath: string;

  constructor() {
    this.basePath = path.join(process.cwd(), 'uploads');
  }

  async init(): Promise<void> {
    // Criar diretório de uploads se não existir
    try {
      await fs.access(this.basePath);
    } catch {
      await fs.mkdir(this.basePath, { recursive: true });
      Logger.info(`Diretório de uploads criado: ${this.basePath}`);
    }
  }

  async upload(file: Buffer, filename: string, options?: any): Promise<string> {
    const uniqueFilename = `${uuidv4()}-${filename}`;
    const filePath = path.join(this.basePath, uniqueFilename);
    
    await fs.writeFile(filePath, file);
    
    return `/uploads/${uniqueFilename}`;
  }

  async download(url: string): Promise<Buffer> {
    const filename = url.replace('/uploads/', '');
    const filePath = path.join(this.basePath, filename);
    
    return await fs.readFile(filePath);
  }

  async delete(url: string): Promise<boolean> {
    try {
      const filename = url.replace('/uploads/', '');
      const filePath = path.join(this.basePath, filename);
      
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      Logger.error('Erro ao deletar arquivo:', error);
      return false;
    }
  }

  getPublicUrl(url: string): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return `${baseUrl}${url}`;
  }
}

// Provider Memory (Para desenvolvimento/testes)
class MemoryStorageProvider implements StorageProvider {
  name = 'memory';
  private storage: Map<string, Buffer> = new Map();

  async upload(file: Buffer, filename: string): Promise<string> {
    const uniqueFilename = `${uuidv4()}-${filename}`;
    const url = `/memory/${uniqueFilename}`;
    
    this.storage.set(url, file);
    
    return url;
  }

  async download(url: string): Promise<Buffer> {
    const buffer = this.storage.get(url);
    if (!buffer) {
      throw new Error('Arquivo não encontrado');
    }
    return buffer;
  }

  async delete(url: string): Promise<boolean> {
    return this.storage.delete(url);
  }

  getPublicUrl(url: string): string {
    return `data:application/octet-stream;base64,${this.storage.get(url)?.toString('base64') || ''}`;
  }
}

export class StorageService {
  private providers: Map<string, StorageProvider> = new Map();
  private defaultProvider: string = 'local';

  async init(): Promise<void> {
    Logger.info(`Inicializando ${this.constructor.name}...`);
    
    // Inicializar providers
    const localProvider = new LocalStorageProvider();
    await localProvider.init();
    this.providers.set('local', localProvider);
    
    const memoryProvider = new MemoryStorageProvider();
    this.providers.set('memory', memoryProvider);
    
    // Configurar provider padrão via env
    this.defaultProvider = process.env.STORAGE_PROVIDER || 'local';
    
    // Criar tabela de metadados se não existir
    await this.initDatabase();
    
    Logger.info(`${this.constructor.name} inicializado com sucesso`);
    Logger.info(`Provider padrão: ${this.defaultProvider}`);
    Logger.info(`Providers disponíveis: ${Array.from(this.providers.keys()).join(', ')}`);
  }

  async cleanup(): Promise<void> {
    Logger.info(`Finalizando ${this.constructor.name}...`);
    this.providers.clear();
  }

  private async initDatabase(): Promise<void> {
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS file_metadata (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          original_name VARCHAR(255) NOT NULL,
          filename VARCHAR(255) NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          size INTEGER NOT NULL,
          url TEXT NOT NULL,
          provider VARCHAR(50) NOT NULL,
          user_id VARCHAR(36),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_file_metadata_user_id ON file_metadata(user_id)
      `;
      
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_file_metadata_provider ON file_metadata(provider)
      `;
      
      Logger.debug('Tabela de metadados de arquivos inicializada');
    } catch (error) {
      Logger.error('Erro ao inicializar tabela de metadados:', error);
      throw error;
    }
  }

  async uploadFile(
    file: Buffer, 
    originalName: string, 
    mimeType: string, 
    options: {
      provider?: string;
      userId?: string;
    } = {}
  ): Promise<FileMetadata> {
    try {
      const provider = this.providers.get(options.provider || this.defaultProvider);
      if (!provider) {
        throw new Error(`Provider "${options.provider || this.defaultProvider}" não encontrado`);
      }

      // Upload do arquivo
      const url = await provider.upload(file, originalName, options);
      
      // Salvar metadados no banco
      const metadata = {
        id: uuidv4(),
        originalName,
        filename: path.basename(url),
        mimeType,
        size: file.length,
        url,
        provider: provider.name,
        userId: options.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await prisma.$executeRaw`
        INSERT INTO file_metadata (
          id, original_name, filename, mime_type, size, url, provider, user_id, created_at, updated_at
        ) VALUES (
          ${metadata.id}, ${metadata.originalName}, ${metadata.filename}, 
          ${metadata.mimeType}, ${metadata.size}, ${metadata.url}, 
          ${metadata.provider}, ${metadata.userId}, ${metadata.createdAt}, ${metadata.updatedAt}
        )
      `;

      Logger.info(`Arquivo uploaded: ${originalName} (${metadata.size} bytes) via ${provider.name}`);
      
      return metadata;
    } catch (error) {
      Logger.error('Erro ao fazer upload de arquivo:', error);
      throw error;
    }
  }

  async downloadFile(fileId: string): Promise<{ buffer: Buffer; metadata: FileMetadata }> {
    try {
      // Buscar metadados
      const result = await prisma.$queryRaw<Array<any>>`
        SELECT * FROM file_metadata WHERE id = ${fileId}
      `;

      if (result.length === 0) {
        throw new Error('Arquivo não encontrado');
      }

      const metadata = result[0] as any;
      const provider = this.providers.get(metadata.provider);
      
      if (!provider) {
        throw new Error(`Provider "${metadata.provider}" não disponível`);
      }

      // Download do arquivo
      const buffer = await provider.download(metadata.url);

      return {
        buffer,
        metadata: {
          id: metadata.id,
          originalName: metadata.original_name,
          filename: metadata.filename,
          mimeType: metadata.mime_type,
          size: metadata.size,
          url: metadata.url,
          provider: metadata.provider,
          userId: metadata.user_id,
          createdAt: metadata.created_at,
          updatedAt: metadata.updated_at
        }
      };
    } catch (error) {
      Logger.error('Erro ao fazer download de arquivo:', error);
      throw error;
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    try {
      // Buscar metadados
      const result = await prisma.$queryRaw<Array<any>>`
        SELECT * FROM file_metadata WHERE id = ${fileId}
      `;

      if (result.length === 0) {
        throw new Error('Arquivo não encontrado');
      }

      const metadata = result[0];
      const provider = this.providers.get(metadata.provider);
      
      if (!provider) {
        throw new Error(`Provider "${metadata.provider}" não disponível`);
      }

      // Deletar arquivo do storage
      const deleted = await provider.delete(metadata.url);
      
      if (deleted) {
        // Remover metadados do banco
        await prisma.$executeRaw`
          DELETE FROM file_metadata WHERE id = ${fileId}
        `;
        
        Logger.info(`Arquivo deletado: ${metadata.original_name} (${fileId})`);
      }

      return deleted;
    } catch (error) {
      Logger.error('Erro ao deletar arquivo:', error);
      throw error;
    }
  }

  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    try {
      const result = await prisma.$queryRaw<Array<any>>`
        SELECT * FROM file_metadata WHERE id = ${fileId}
      `;

      if (result.length === 0) {
        return null;
      }

      const metadata = result[0];
      return {
        id: metadata.id,
        originalName: metadata.original_name,
        filename: metadata.filename,
        mimeType: metadata.mime_type,
        size: metadata.size,
        url: metadata.url,
        provider: metadata.provider,
        userId: metadata.user_id,
        createdAt: metadata.created_at,
        updatedAt: metadata.updated_at
      };
    } catch (error) {
      Logger.error('Erro ao buscar metadados do arquivo:', error);
      throw error;
    }
  }

  async listFiles(options: {
    userId?: string;
    provider?: string;
    mimeType?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    files: FileMetadata[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { userId, provider, mimeType, page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;

      // Construir WHERE clause
      const conditions = [];
      const params: any[] = [];

      if (userId) {
        conditions.push(`user_id = $${params.length + 1}`);
        params.push(userId);
      }

      if (provider) {
        conditions.push(`provider = $${params.length + 1}`);
        params.push(provider);
      }

      if (mimeType) {
        conditions.push(`mime_type LIKE $${params.length + 1}`);
        params.push(`${mimeType}%`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Contar total
      const countQuery = `SELECT COUNT(*) as total FROM file_metadata ${whereClause}`;
      const countResult = await prisma.$queryRawUnsafe(countQuery, ...params) as Array<any>;
      const total = parseInt(countResult[0].total);

      // Buscar arquivos
      const dataQuery = `
        SELECT * FROM file_metadata 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      const files = await prisma.$queryRawUnsafe(dataQuery, ...params) as Array<any>;

      return {
        files: files.map(f => ({
          id: f.id,
          originalName: f.original_name,
          filename: f.filename,
          mimeType: f.mime_type,
          size: f.size,
          url: f.url,
          provider: f.provider,
          userId: f.user_id,
          createdAt: f.created_at,
          updatedAt: f.updated_at
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      Logger.error('Erro ao listar arquivos:', error);
      throw error;
    }
  }

  async getPublicUrl(fileId: string): Promise<string> {
    try {
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        throw new Error('Arquivo não encontrado');
      }

      const provider = this.providers.get(metadata.provider);
      if (!provider) {
        throw new Error(`Provider "${metadata.provider}" não disponível`);
      }

      return provider.getPublicUrl(metadata.url);
    } catch (error) {
      Logger.error('Erro ao gerar URL pública:', error);
      throw error;
    }
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getStorageStats(): any {
    return {
      defaultProvider: this.defaultProvider,
      availableProviders: this.getAvailableProviders(),
      providersCount: this.providers.size
    };
  }
}
