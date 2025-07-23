import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../core/logger';

export function staticFiles(req: Request, res: Response, next: NextFunction): void {
  // Verificar se é uma requisição para /uploads/
  if (!req.path.startsWith('/uploads/')) {
    return next();
  }

  const filename = req.path.replace('/uploads/', '');
  const filePath = path.join(process.cwd(), 'uploads', filename);

  // Servir arquivo se existir
  fs.access(filePath)
    .then(() => {
      res.sendFile(filePath);
    })
    .catch(() => {
      logger.warn(`Arquivo não encontrado: ${filePath}`);
      res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado'
      });
    });
}