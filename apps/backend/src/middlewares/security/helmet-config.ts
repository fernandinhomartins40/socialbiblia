import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

interface HelmetConfig {
  contentSecurityPolicy?: helmet.ContentSecurityPolicyOptions | boolean;
  crossOriginEmbedderPolicy?: helmet.CrossOriginEmbedderPolicyOptions | boolean;
  crossOriginOpenerPolicy?: helmet.CrossOriginOpenerPolicyOptions | boolean;
  crossOriginResourcePolicy?: helmet.CrossOriginResourcePolicyOptions | boolean;
  dnsPrefetchControl?: helmet.DnsPrefetchControlOptions | boolean;
  expectCt?: helmet.ExpectCtOptions | boolean;
  frameguard?: helmet.FrameguardOptions | boolean;
  hidePoweredBy?: helmet.HidePoweredByOptions | boolean;
  hsts?: helmet.HstsOptions | boolean;
  ieNoOpen?: boolean;
  noSniff?: boolean;
  originAgentCluster?: boolean;
  permittedCrossDomainPolicies?: helmet.PermittedCrossDomainPoliciesOptions | boolean;
  referrerPolicy?: helmet.ReferrerPolicyOptions | boolean;
  xssFilter?: boolean;
}

// Configuração básica do Helmet baseada no ambiente
const getHelmetConfig = (): HelmetConfig => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // CSP configurável via variáveis de ambiente
  const cspDirectives: helmet.ContentSecurityPolicyOptions['directives'] = {
    defaultSrc: (process.env.CSP_DEFAULT_SRC || "'self'").split(' '),
    scriptSrc: (process.env.CSP_SCRIPT_SRC || "'self' 'unsafe-inline'").split(' '),
    styleSrc: (process.env.CSP_STYLE_SRC || "'self' 'unsafe-inline'").split(' '),
    imgSrc: (process.env.CSP_IMG_SRC || "'self' data: https:").split(' '),
    connectSrc: (process.env.CSP_CONNECT_SRC || "'self'").split(' '),
    fontSrc: ["'self'", "https:", "data:"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  };

  const config: HelmetConfig = {
    // Content Security Policy
    contentSecurityPolicy: {
      directives: cspDirectives,
      reportOnly: isDevelopment, // Em desenvolvimento, apenas reporta violações
    },

    // Cross-Origin Embedder Policy
    crossOriginEmbedderPolicy: false, // Pode quebrar funcionalidades se habilitado

    // Cross-Origin Opener Policy
    crossOriginOpenerPolicy: { policy: "same-origin" },

    // Cross-Origin Resource Policy
    crossOriginResourcePolicy: { policy: "cross-origin" },

    // DNS Prefetch Control
    dnsPrefetchControl: { allow: false },

    // Expect-CT (deprecated but still useful)
    expectCt: false,

    // Frame Options
    frameguard: { action: 'deny' },

    // Hide X-Powered-By
    hidePoweredBy: true,

    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 ano
      includeSubDomains: true,
      preload: true
    },

    // IE No Open
    ieNoOpen: true,

    // No Sniff
    noSniff: true,

    // Origin Agent Cluster
    originAgentCluster: true,

    // Permitted Cross Domain Policies
    permittedCrossDomainPolicies: false,

    // Referrer Policy
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },

    // XSS Filter
    xssFilter: true,
  };

  // Em desenvolvimento, relaxar algumas regras
  if (isDevelopment) {
    config.hsts = false; // HSTS apenas em HTTPS
    if (config.contentSecurityPolicy && typeof config.contentSecurityPolicy === 'object') {
      config.contentSecurityPolicy.reportOnly = true;
    }
  }

  return config;
};

// Middleware do Helmet configurado
export const helmetMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const config = getHelmetConfig();
  helmet(config)(req, res, next);
};

// Middleware adicional para logs de CSP
export const cspReportHandler = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/csp-report' && req.method === 'POST') {
    console.warn('🛡️ CSP Violation Report:', req.body);
    res.status(204).end();
    return;
  }
  next();
};

// Exportar configuração para testes
export { getHelmetConfig };

export default {
  helmetMiddleware,
  cspReportHandler,
  getHelmetConfig,
};