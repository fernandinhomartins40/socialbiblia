import { z } from 'zod';

// Schema para criação de post
export const createPostSchema = z.object({
  content: z.string().min(1, 'Conteúdo é obrigatório').max(1000, 'Conteúdo muito longo'),
  imageUrl: z.string().url('URL inválida').optional(),
  verseReference: z.string().optional(),
  verseText: z.string().optional(),
  type: z.enum(['post', 'prayer', 'verse']).default('post'),
});

// Schema para comentário
export const createCommentSchema = z.object({
  postId: z.string(),
  content: z.string().min(1, 'Comentário não pode estar vazio').max(500, 'Comentário muito longo'),
});

// Schema para interação com IA
export const aiInteractionSchema = z.object({
  userMessage: z.string().min(1, 'Mensagem é obrigatória'),
  emotion: z.string().optional(),
});

// Schema para feedback da IA
export const aiFeedbackSchema = z.object({
  interactionId: z.string(),
  feedback: z.enum(['useful', 'not_useful']),
  verseId: z.string().optional(),
  emotion: z.string().optional(),
  context: z.string().optional(),
});

// Types
export type CreatePostData = z.infer<typeof createPostSchema>;
export type CreateCommentData = z.infer<typeof createCommentSchema>;
export type AIInteractionData = z.infer<typeof aiInteractionSchema>;
export type AIFeedbackData = z.infer<typeof aiFeedbackSchema>;