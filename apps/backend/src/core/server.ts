import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';

export function createServer(): express.Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  
  // CORS configuration
  app.use(cors({
    origin: config.cors.origin,
    credentials: true,
  }));

  // Compression
  app.use(compression());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
      success: false,
      error: 'Too many requests',
      message: 'Muitas requisições, tente novamente mais tarde',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoints
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'Servidor está funcionando',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/ready', (req, res) => {
    res.json({
      success: true,
      message: 'Servidor está pronto',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
