import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Interface para request com ID
interface RequestWithId extends Request {
  requestId?: string;
}

export function requestLogger(req: RequestWithId, res: Response, next: NextFunction) {
  const start = Date.now();
  
  // Gerar ou usar request ID existente
  req.requestId = (req.headers['x-request-id'] as string) || uuidv4();
  res.setHeader('x-request-id', req.requestId);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const context = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    };
    
    Logger.http('HTTP Request completed', context);
  });
  
  next();
}

