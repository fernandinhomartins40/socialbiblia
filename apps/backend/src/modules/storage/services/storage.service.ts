import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../utils/logger';

const prisma = new PrismaClient();

interface UploadOptions {
  destination?: string;
  fileFilter?: (req: any, file: Express.Multer.File, callback: multer.FileFilterCallback) => void;
  limits?: multer.Options['limits'];
}

export class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || 'uploads';
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  createMulterConfig(options: UploadOptions = {}) {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const dest = options.destination || this.uploadDir;
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4();
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
      },
    });

    return multer({
      storage,
      fileFilter: options.fileFilter,
      limits: options.limits || {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    });
  }

  async saveFileMetadata(file: Express.Multer.File, userId: string) {
    try {
      const fileRecord = await prisma.file.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          userId,
        },
      });

      return {
        success: true,
        data: fileRecord,
        error: null,
      };
    } catch (error) {
      logger.error('Error saving file metadata:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to save file metadata',
      };
    }
  }

  async getFileById(fileId: string) {
    try {
      const file = await prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        return {
          success: false,
          data: null,
          error: 'File not found',
        };
      }

      return {
        success: true,
        data: file,
        error: null,
      };
    } catch (error) {
      logger.error('Error retrieving file:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to retrieve file',
      };
    }
  }

  async deleteFile(fileId: string) {
    try {
      const file = await prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        return {
          success: false,
          data: null,
          error: 'File not found',
        };
      }

      // Delete physical file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      // Delete database record
      await prisma.file.delete({
        where: { id: fileId },
      });

      return {
        success: true,
        data: { message: 'File deleted successfully' },
        error: null,
      };
    } catch (error) {
      logger.error('Error deleting file:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to delete file',
      };
    }
  }

  async getUserFiles(userId: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const [files, total] = await Promise.all([
        prisma.file.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.file.count({ where: { userId } }),
      ]);

      return {
        success: true,
        data: {
          files,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
        error: null,
      };
    } catch (error) {
      logger.error('Error retrieving user files:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to retrieve files',
      };
    }
  }
}
