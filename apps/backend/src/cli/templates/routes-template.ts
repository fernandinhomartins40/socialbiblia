interface GenerateOptions {
  type: 'crud' | 'auth' | 'api' | 'service';
  database: boolean;
  auth: boolean;
  websocket: boolean;
}

export function createRoutesTemplate(pluginName: string, className: string, options: GenerateOptions): string {
  return `import { PluginRoute } from '../../../types/plugin';
import { ${className}Controller } from '../controllers/${pluginName}.controller';
import { validate${className}Create, validate${className}Update } from '../schemas/${pluginName}.schema';
${options.auth ? `import auth from '../../../middlewares/auth/authenticate';` : ''}

export function ${pluginName}Routes(controller: ${className}Controller): PluginRoute[] {
  return [
    // Rotas públicas
    {
      method: 'GET',
      path: '/api/${pluginName}',
      handler: controller.getAll.bind(controller),
      middleware: []
    },
    {
      method: 'GET',
      path: '/api/${pluginName}/:id',
      handler: controller.getById.bind(controller),
      middleware: []
    },

    // Rotas protegidas
    {
      method: 'POST',
      path: '/api/${pluginName}',
      handler: controller.create.bind(controller),
      middleware: [
        ${options.auth ? 'authenticate,' : ''}
        validate${className}Create
      ]
    },
    {
      method: 'PUT',
      path: '/api/${pluginName}/:id',
      handler: controller.update.bind(controller),
      middleware: [
        ${options.auth ? 'authenticate,' : ''}
        validate${className}Update
      ]
    },
    {
      method: 'DELETE',
      path: '/api/${pluginName}/:id',
      handler: controller.delete.bind(controller),
      middleware: [
        ${options.auth ? 'authenticate' : ''}
      ]${options.auth ? '' : '.filter(Boolean)'}
    }
  ];
}
`;
}