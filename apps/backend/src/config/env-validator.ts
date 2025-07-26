import { z } from 'zod';

const requiredEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1000).max(65535)).default('3000'),
  APP_NAME: z.string().min(1),
  
  // JWT - OBRIGATÓRIO
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres para segurança'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET deve ter pelo menos 32 caracteres para segurança'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  
  // CORS
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN deve ser configurado por segurança'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default('100'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('logs/app.log'),
  
  // Upload
  MAX_FILE_SIZE: z.string().transform(Number).pipe(z.number().positive()).default('5242880'),
  UPLOAD_DIR: z.string().default('uploads'),
});

const optionalEnvSchema = z.object({
  // Helmet CSP
  CSP_DEFAULT_SRC: z.string().optional(),
  CSP_SCRIPT_SRC: z.string().optional(),
  CSP_STYLE_SRC: z.string().optional(),
  CSP_IMG_SRC: z.string().optional(),
  CSP_CONNECT_SRC: z.string().optional(),
  
  // Rate limiting adicional
  LOGIN_RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).optional(),
  LOGIN_RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).optional(),
  IP_RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).optional(),
  IP_RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).optional(),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).pipe(z.number().positive()).optional(),
  SMTP_SECURE: z.string().transform(val => val === 'true').optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  FROM_NAME: z.string().optional(),
  
  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).pipe(z.number().nonnegative()).optional(),
  REDIS_TTL: z.string().transform(Number).pipe(z.number().positive()).optional(),
  
  // Monitoramento
  SENTRY_DSN: z.string().optional(),
  DATADOG_API_KEY: z.string().optional(),
  PROMETHEUS_PORT: z.string().transform(Number).pipe(z.number().positive()).optional(),
  
  // Features
  ENABLE_SWAGGER: z.string().transform(val => val === 'true').optional(),
  ENABLE_METRICS: z.string().transform(val => val === 'true').optional(),
  ENABLE_CACHE: z.string().transform(val => val === 'true').optional(),
  ENABLE_EMAIL_VERIFICATION: z.string().transform(val => val === 'true').optional(),
  
  // Segurança
  SESSION_TIMEOUT: z.string().transform(Number).pipe(z.number().positive()).optional(),
  BCRYPT_SALT_ROUNDS: z.string().transform(Number).pipe(z.number().min(10).max(15)).optional(),
  CSRF_SECRET: z.string().min(32).optional(),
  
  // External APIs
  BIBLE_API_KEY: z.string().optional(),
  TRANSLATION_API_KEY: z.string().optional(),
  
  // Development
  DEBUG: z.string().optional(),
  HOT_RELOAD: z.string().transform(val => val === 'true').optional(),
  SEED_DATABASE: z.string().transform(val => val === 'true').optional(),
});

const envSchema = requiredEnvSchema.merge(optionalEnvSchema);

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  try {
    const env = envSchema.parse(process.env);
    
    // Verificações adicionais de segurança
    if (env.NODE_ENV === 'production') {
      // Em produção, JWT secrets não podem ter valores padrão
      if (env.JWT_SECRET.includes('CHANGE_THIS') || env.JWT_SECRET.includes('your-super-secret')) {
        throw new Error('❌ JWT_SECRET deve ser alterado em produção!');
      }
      
      if (env.JWT_REFRESH_SECRET.includes('CHANGE_THIS') || env.JWT_REFRESH_SECRET.includes('your-super-secret')) {
        throw new Error('❌ JWT_REFRESH_SECRET deve ser alterado em produção!');
      }
      
      // CORS não pode ser wildcard em produção
      if (env.CORS_ORIGIN.includes('*')) {
        throw new Error('❌ CORS_ORIGIN não pode ser wildcard (*) em produção!');
      }
      
      // Em produção, deve usar PostgreSQL
      if (env.DATABASE_URL.startsWith('file:')) {
        console.warn('⚠️ AVISO: Usando SQLite em produção não é recomendado!');
      }
    }
    
    console.log('✅ Configurações de ambiente validadas com sucesso');
    
    // Log de configurações carregadas (sem valores sensíveis)
    console.log(`📊 Ambiente: ${env.NODE_ENV}`);
    console.log(`🚀 Porta: ${env.PORT}`);
    console.log(`📁 App: ${env.APP_NAME}`);
    console.log(`🔐 JWT Expira em: ${env.JWT_EXPIRES_IN}`);
    console.log(`🌐 CORS Origins: ${env.CORS_ORIGIN.split(',').length} domínio(s)`);
    
    return env;
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Erro de validação das variáveis de ambiente:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\n📝 Verifique o arquivo .env.example para referência');
    } else {
      console.error('❌ Erro ao validar ambiente:', error);
    }
    
    process.exit(1);
  }
}

export default validateEnv;