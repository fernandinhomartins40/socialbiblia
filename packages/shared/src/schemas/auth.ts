import { z } from 'zod';

// Schema de registro de usuário (baseado no backend)
export const registerSchema = z.object({
  email: z.string().email({
    message: 'Insira um endereço de email correto',
  }),
  name: z
    .string()
    .min(3, {
      message: 'Nome muito curto',
    })
    .max(32, {
      message: 'Nome muito longo',
    }),
  phone: z
    .string()
    .min(11, {
      message: 'Telefone muito curto',
    })
    .max(15, {
      message: 'Telefone muito longo',
    }),
  password: z
    .string()
    .min(6, {
      message: 'Senha deve ter pelo menos 6 caracteres',
    })
    .max(50, {
      message: 'Senha muito longa',
    }),
});

// Schema de confirmação de registro
export const registerConfirmationSchema = z.object({
  email: z.string().email({
    message: 'Insira um endereço de email correto',
  }),
  token: z.string({
    required_error: 'Token é obrigatório',
    invalid_type_error: 'Token incorreto',
  }),
});

// Schema de login
export const loginSchema = z.object({
  email: z.string().email({
    message: 'Insira um endereço de email correto',
  }),
  password: z
    .string()
    .min(1, {
      message: 'Senha é obrigatória',
    }),
});

// Schema para solicitação de reset de senha
export const forgotPasswordRequestSchema = z.object({
  email: z.string().email({
    message: 'Insira um endereço de email correto',
  }),
});

// Schema para reset de senha
export const resetPasswordSchema = z.object({
  email: z.string().email({
    message: 'Insira um endereço de email correto',
  }),
  token: z.string({
    required_error: 'Token é obrigatório',
  }),
  password: z
    .string()
    .min(6, {
      message: 'Senha deve ter pelo menos 6 caracteres',
    })
    .max(50, {
      message: 'Senha muito longa',
    }),
});

// Types
export type RegisterData = z.infer<typeof registerSchema>;
export type RegisterConfirmationData = z.infer<typeof registerConfirmationSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordRequestSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;