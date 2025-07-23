import { z } from 'zod';

// Schemas de autenticação
export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z.string()
    .min(3, 'Username deve ter pelo menos 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username deve conter apenas letras, números, hífens e underscores'),
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial'),
  firstName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  lastName: z.string().min(2, 'Sobrenome deve ter pelo menos 2 caracteres').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const passwordResetSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  newPassword: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

// Schemas de usuário
export const updateUserSchema = z.object({
  firstName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  lastName: z.string().min(2, 'Sobrenome deve ter pelo menos 2 caracteres').optional(),
  avatar: z.string().url('URL do avatar inválida').optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string()
    .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial'),
});

// Schemas de posts
export const createPostSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(200, 'Título deve ter no máximo 200 caracteres'),
  content: z.string().min(10, 'Conteúdo deve ter pelo menos 10 caracteres'),
  excerpt: z.string().max(500, 'Resumo deve ter no máximo 500 caracteres').optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  tags: z.array(z.string()).max(10, 'Máximo de 10 tags').optional(),
  category: z.string().max(50, 'Categoria deve ter no máximo 50 caracteres').optional(),
  featured: z.boolean().optional(),
});

export const updatePostSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(200, 'Título deve ter no máximo 200 caracteres').optional(),
  content: z.string().min(10, 'Conteúdo deve ter pelo menos 10 caracteres').optional(),
  excerpt: z.string().max(500, 'Resumo deve ter no máximo 500 caracteres').optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  tags: z.array(z.string()).max(10, 'Máximo de 10 tags').optional(),
  category: z.string().max(50, 'Categoria deve ter no máximo 50 caracteres').optional().nullable(),
  featured: z.boolean().optional(),
});

// Schemas de paginação e filtros
export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1, 'Página deve ser maior que 0')).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1, 'Limite deve ser maior que 0').max(100, 'Limite máximo é 100')).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
});

// Schema de upload
export const uploadSchema = z.object({
  file: z.any().refine((file: any) => file?.size <= 5 * 1024 * 1024, 'Arquivo deve ter no máximo 5MB')
    .refine(
      (file: any) => ['image/jpeg', 'image/png', 'image/webp'].includes(file?.mimetype),
      'Apenas imagens JPEG, PNG e WebP são permitidas'
    ),
});

// Schema de query params
export const queryParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  category: z.string().optional(),
  featured: z.coerce.boolean().optional(),
});
