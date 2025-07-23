import { z } from 'zod'

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.string().optional(),
})

// User Schemas
export const updateUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  avatar: z.string().url('URL inválida').optional(),
})

// Post Schemas
export const createPostSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  tags: z.array(z.string()).optional(),
})

export const updatePostSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').optional(),
  content: z.string().min(1, 'Conteúdo é obrigatório').optional(),
  tags: z.array(z.string()).optional(),
})

// Comment Schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  postId: z.string().uuid('ID do post inválido'),
})

// Bible Schemas
export const bibleSearchSchema = z.object({
  query: z.string().min(1, 'Consulta é obrigatória'),
  version: z.string().optional(),
  books: z.array(z.string()).optional(),
})

export const bibleReferenceSchema = z.object({
  book: z.string().min(1, 'Livro é obrigatório'),
  chapter: z.number().min(1, 'Capítulo deve ser maior que 0'),
  verse: z.number().min(1, 'Versículo deve ser maior que 0').optional(),
})

// File Upload Schemas
export const fileUploadSchema = z.object({
  file: z.any().refine(
    (file) => file instanceof File,
    'Arquivo é obrigatório'
  ).refine(
    (file) => file.size <= 10 * 1024 * 1024, // 10MB
    'Arquivo deve ter no máximo 10MB'
  ),
})

// API Response Schema
export const apiResponseSchema = <T>(dataSchema: z.ZodSchema<T>) => z.object({
  success: z.boolean(),
  data: dataSchema,
  message: z.string(),
  meta: z.object({
    page: z.number().optional(),
    total: z.number().optional(),
    limit: z.number().optional(),
    totalPages: z.number().optional(),
  }).optional(),
})

// Pagination Schema
export const paginationSchema = z.object({
  page: z.number().min(1, 'Página deve ser maior que 0').default(1),
  limit: z.number().min(1, 'Limite deve ser maior que 0').max(100, 'Limite máximo é 100').default(20),
})

// WebSocket Event Schema
export const wsEventSchema = z.object({
  type: z.string(),
  data: z.any(),
  timestamp: z.string(),
})

// Notification Schema
export const notificationSchema = z.object({
  id: z.string(),
  type: z.enum(['info', 'success', 'warning', 'error']),
  title: z.string(),
  message: z.string(),
  timestamp: z.string(),
  read: z.boolean(),
})

// Export types from schemas
export type LoginData = z.infer<typeof loginSchema>
export type RegisterData = z.infer<typeof registerSchema>
export type UpdateUserData = z.infer<typeof updateUserSchema>
export type CreatePostData = z.infer<typeof createPostSchema>
export type UpdatePostData = z.infer<typeof updatePostSchema>
export type CreateCommentData = z.infer<typeof createCommentSchema>
export type BibleSearchData = z.infer<typeof bibleSearchSchema>
export type BibleReferenceData = z.infer<typeof bibleReferenceSchema>
export type PaginationData = z.infer<typeof paginationSchema>
export type WsEventData = z.infer<typeof wsEventSchema>
export type NotificationData = z.infer<typeof notificationSchema>