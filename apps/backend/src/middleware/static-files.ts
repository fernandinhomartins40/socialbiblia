import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { Logger } from '../utils/logger';

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
      Logger.warn(`Arquivo não encontrado: ${filePath}`);
      res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado'
      });
    });
}
