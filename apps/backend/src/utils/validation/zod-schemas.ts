import { z } from 'zod';

// Schemas básicos reutilizáveis
export const idSchema = z.string().min(1, 'ID é obrigatório');
export const emailSchema = z.string().email('Email inválido');
export const passwordSchema = z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Senha deve conter ao menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial');

// Schemas para autenticação
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Senha é obrigatória'),
});

export const registerSchema = z.object({
    name: z.string()
        .min(2, 'Nome deve ter pelo menos 2 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres')
        .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Novas senhas não coincidem",
    path: ["confirmNewPassword"],
});

// Schemas para usuários
export const updateUserSchema = z.object({
    name: z.string()
        .min(2, 'Nome deve ter pelo menos 2 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres')
        .optional(),
    email: emailSchema.optional(),
    bio: z.string()
        .max(500, 'Bio deve ter no máximo 500 caracteres')
        .optional(),
    avatar: z.string().url('URL do avatar inválida').optional(),
});

export const userByIdSchema = z.object({
    id: idSchema,
});

// Schemas para paginação
export const paginationSchema = z.object({
    page: z.string()
        .regex(/^\d+$/, 'Página deve ser um número')
        .transform((val) => parseInt(val, 10))
        .refine((val) => val >= 1, 'Página deve ser maior que 0')
        .default('1'),
    limit: z.string()
        .regex(/^\d+$/, 'Limite deve ser um número')
        .transform((val) => parseInt(val, 10))
        .refine((val) => val >= 1 && val <= 100, 'Limite deve estar entre 1 e 100')
        .default('10'),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'email', 'createdAt', 'updatedAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Schemas para busca
export const searchSchema = z.object({
    query: z.string()
        .min(1, 'Termo de busca é obrigatório')
        .max(200, 'Termo de busca deve ter no máximo 200 caracteres'),
    type: z.enum(['user', 'post', 'comment', 'all']).default('all'),
    filters: z.object({
        dateFrom: z.string().datetime().optional(),
        dateTo: z.string().datetime().optional(),
        category: z.string().optional(),
    }).optional(),
});

// Schemas para posts/conteúdo (assumindo que existe)
export const createPostSchema = z.object({
    title: z.string()
        .min(3, 'Título deve ter pelo menos 3 caracteres')
        .max(200, 'Título deve ter no máximo 200 caracteres'),
    content: z.string()
        .min(10, 'Conteúdo deve ter pelo menos 10 caracteres')
        .max(5000, 'Conteúdo deve ter no máximo 5000 caracteres'),
    category: z.string().optional(),
    tags: z.array(z.string()).max(10, 'Máximo 10 tags permitidas').optional(),
    isPublic: z.boolean().default(true),
});

export const updatePostSchema = createPostSchema.partial();

export const postByIdSchema = z.object({
    id: idSchema,
});

// Schemas para comentários
export const createCommentSchema = z.object({
    content: z.string()
        .min(1, 'Comentário não pode estar vazio')
        .max(1000, 'Comentário deve ter no máximo 1000 caracteres'),
    postId: idSchema,
    parentId: idSchema.optional(), // Para respostas a comentários
});

export const updateCommentSchema = z.object({
    content: z.string()
        .min(1, 'Comentário não pode estar vazio')
        .max(1000, 'Comentário deve ter no máximo 1000 caracteres'),
});

export const commentByIdSchema = z.object({
    id: idSchema,
});

// Schema para upload de arquivos
export const uploadSchema = z.object({
    file: z.object({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z.string().refine(
            (val) => ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes(val),
            'Tipo de arquivo não permitido'
        ),
        size: z.number().max(5 * 1024 * 1024, 'Arquivo deve ter no máximo 5MB'),
    }),
    folder: z.enum(['avatars', 'posts', 'documents']).default('posts'),
});

// Schema para configurações/admin
export const adminUpdateUserSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    email: emailSchema.optional(),
    isActive: z.boolean().optional(),
    role: z.enum(['user', 'moderator', 'admin']).optional(),
    permissions: z.array(z.string()).optional(),
});

// Schema para reports/denúncias
export const reportSchema = z.object({
    targetType: z.enum(['user', 'post', 'comment']),
    targetId: idSchema,
    reason: z.enum([
        'spam',
        'inappropriate_content',
        'harassment',
        'hate_speech',
        'misinformation',
        'copyright_violation',
        'other'
    ]),
    description: z.string()
        .min(10, 'Descrição deve ter pelo menos 10 caracteres')
        .max(500, 'Descrição deve ter no máximo 500 caracteres')
        .optional(),
});

// Types derivados dos schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserByIdInput = z.infer<typeof userByIdSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PostByIdInput = z.infer<typeof postByIdSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CommentByIdInput = z.infer<typeof commentByIdSchema>;
export type UploadInput = z.infer<typeof uploadSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type ReportInput = z.infer<typeof reportSchema>;

// Middleware helper para validação
export const validateSchema = (schema: z.ZodSchema) => {
    return (req: any, res: any, next: any) => {
        try {
            // Validar body, params e query baseado no que está presente
            const dataToValidate = {
                ...req.body,
                ...req.params,
                ...req.query,
            };

            const validatedData = schema.parse(dataToValidate);
            
            // Separar os dados validados de volta para suas respectivas propriedades
            req.validatedData = validatedData;
            
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));

                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Dados inválidos fornecidos',
                        details: formattedErrors,
                    },
                });
            }
            
            next(error);
        }
    };
};

// Validação apenas do body
export const validateBody = (schema: z.ZodSchema) => {
    return (req: any, res: any, next: any) => {
        try {
            const validatedData = schema.parse(req.body);
            req.validatedBody = validatedData;
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));

                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Dados inválidos no corpo da requisição',
                        details: formattedErrors,
                    },
                });
            }
            
            next(error);
        }
    };
};

// Validação apenas dos params
export const validateParams = (schema: z.ZodSchema) => {
    return (req: any, res: any, next: any) => {
        try {
            const validatedData = schema.parse(req.params);
            req.validatedParams = validatedData;
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));

                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Parâmetros inválidos na URL',
                        details: formattedErrors,
                    },
                });
            }
            
            next(error);
        }
    };
};

// Validação apenas da query
export const validateQuery = (schema: z.ZodSchema) => {
    return (req: any, res: any, next: any) => {
        try {
            const validatedData = schema.parse(req.query);
            req.validatedQuery = validatedData;
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));

                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Parâmetros de consulta inválidos',
                        details: formattedErrors,
                    },
                });
            }
            
            next(error);
        }
    };
};