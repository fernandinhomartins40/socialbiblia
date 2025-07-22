import { z } from 'zod';

// Schema para atualização de perfil do usuário
export const updateUserProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  phone: z.string().min(10, 'Telefone inválido').optional(),
  avatar: z.string().url('URL inválida').optional(),
  accountName: z.string().min(3, 'Nome da conta deve ter pelo menos 3 caracteres').optional(),
  accountLocationState: z.string().optional(),
  google_given_name: z.string().optional(),
  google_family_name: z.string().optional(),
  google_locale: z.string().optional(),
  google_avatar: z.string().url('URL inválida').optional(),
});

// Schema para dados básicos do usuário
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string(),
  avatar: z.string().nullable(),
  accountName: z.string().nullable(),
  accountLocationState: z.string().nullable(),
  accountType: z.string(),
  google_signin: z.boolean().nullable(),
  google_given_name: z.string().nullable(),
  google_family_name: z.string().nullable(),
  google_locale: z.string().nullable(),
  google_avatar: z.string().nullable(),
  isRegistered: z.boolean().nullable(),
  isDisabled: z.boolean().nullable(),
  isDeleted: z.boolean().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

// Types
export type UpdateUserProfileData = z.infer<typeof updateUserProfileSchema>;
export type User = z.infer<typeof userSchema>;