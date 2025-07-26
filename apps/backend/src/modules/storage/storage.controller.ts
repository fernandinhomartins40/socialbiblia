import { Request, Response } from 'express';
import { StorageService } from './services/storage.service';
import { asyncHandler } from '../../middlewares/http_error_handler/error_handler';
import { AppError } from '../../middlewares/http_error_handler/error_handler';

export class StorageController {
  private storageService: StorageService;

  constructor() {
    this.storageService = new StorageService();
  }

  uploadFile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const result = await this.storageService.uploadFile({
      file: req.file,
      userId: req.user!.id,
      folder: req.body.folder || 'general',
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'File uploaded successfully',
    });
  });

  getFiles = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, folder } = req.query;
    
    const result = await this.storageService.getUserFiles({
      userId: req.user!.id,
      page: Number(page),
      limit: Number(limit),
      folder: folder as string,
    });

    res.json({
      success: true,
      data: result,
      message: 'Files retrieved successfully',
    });
  });

  deleteFile = asyncHandler(async (req: Request, res: Response) => {
    const { fileId } = req.params;
    
    await this.storageService.deleteFile({
      fileId,
      userId: req.user!.id,
    });

    res.status(204).send();
  });

  getFileUrl = asyncHandler(async (req: Request, res: Response) => {
    const { fileId } = req.params;
    
    const url = await this.storageService.getFileUrl({
      fileId,
      userId: req.user!.id,
    });

    res.json({
      success: true,
      data: { url },
      message: 'File URL generated',
    });
  });
}

export const storageController = new StorageController();
