import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../utils/responses';

export function notFoundHandler(req: Request, res: Response, _next: NextFunction) {
  res.status(404).json(
    ResponseUtil.error('Endpoint não encontrado', `A rota ${req.method} ${req.originalUrl} não existe`, {
      timestamp: new Date().toISOString(),
    })
  );
}
