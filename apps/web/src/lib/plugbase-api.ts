import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { toast } from '@/hooks/use-toast'

// Tipos para as respostas da API Plugbase
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
  meta?: {
    page?: number
    total?: number
    limit?: number
    totalPages?: number
  }
}

// Tipos de dados para Auth
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  role?: string
}

export interface AuthResponse {
  token: string
  user: User
}

// Tipos de dados para User
export interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  avatar?: string
}

// Tipos de dados para Posts
export interface Post {
  id: string
  title: string
  content: string
  author: User
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface CreatePostRequest {
  title: string
  content: string
  tags?: string[]
}

export interface UpdatePostRequest {
  title?: string
  content?: string
  tags?: string[]
}

// Tipos de dados para Storage
export interface StorageFile {
  id: string
  filename: string
  originalName: string
  mimetype: string
  size: number
  url: string
  createdAt: string
}

// Configuração do cliente Axios
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptador para requisições - adiciona token JWT
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptador para respostas - trata erros globalmente
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response
  },
  (error) => {
    const message = error.response?.data?.message || 'Erro inesperado'
    
    // Trata erro de autenticação
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
      toast({
        title: 'Sessão expirada',
        description: 'Faça login novamente.',
        variant: 'destructive',
      })
    } else if (error.response?.status >= 500) {
      toast({
        title: 'Erro do servidor',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      })
    } else if (error.response?.status >= 400) {
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      })
    }
    
    return Promise.reject(error)
  }
)

// Classe principal do cliente API
export class PlugbaseAPI {
  // ========== AUTH ENDPOINTS ==========
  
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data)
    
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token)
    }
    
    return response.data.data
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data)
    
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token)
    }
    
    return response.data.data
  }

  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me')
    return response.data.data
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.removeItem('token')
    }
  }

  // ========== USERS ENDPOINTS ==========
  
  async getUsers(page = 1, limit = 10): Promise<{ users: User[]; meta: any }> {
    const response = await api.get<ApiResponse<User[]>>('/users', {
      params: { page, limit }
    })
    return {
      users: response.data.data,
      meta: response.data.meta || {}
    }
  }

  async createUser(data: RegisterRequest): Promise<User> {
    const response = await api.post<ApiResponse<User>>('/users', data)
    return response.data.data
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data)
    return response.data.data
  }

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`)
  }

  // ========== POSTS ENDPOINTS ==========
  
  async getPosts(page = 1, limit = 10): Promise<{ posts: Post[]; meta: any }> {
    const response = await api.get<ApiResponse<Post[]>>('/posts', {
      params: { page, limit }
    })
    return {
      posts: response.data.data,
      meta: response.data.meta || {}
    }
  }

  async getPost(id: string): Promise<Post> {
    const response = await api.get<ApiResponse<Post>>(`/posts/${id}`)
    return response.data.data
  }

  async createPost(data: CreatePostRequest): Promise<Post> {
    const response = await api.post<ApiResponse<Post>>('/posts', data)
    return response.data.data
  }

  async updatePost(id: string, data: UpdatePostRequest): Promise<Post> {
    const response = await api.put<ApiResponse<Post>>(`/posts/${id}`, data)
    return response.data.data
  }

  async deletePost(id: string): Promise<void> {
    await api.delete(`/posts/${id}`)
  }

  // ========== STORAGE ENDPOINTS ==========
  
  async uploadFile(file: File): Promise<StorageFile> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post<ApiResponse<StorageFile>>('/storage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    return response.data.data
  }

  async getFiles(page = 1, limit = 10): Promise<{ files: StorageFile[]; meta: any }> {
    const response = await api.get<ApiResponse<StorageFile[]>>('/storage', {
      params: { page, limit }
    })
    return {
      files: response.data.data,
      meta: response.data.meta || {}
    }
  }

  async deleteFile(id: string): Promise<void> {
    await api.delete(`/storage/${id}`)
  }

  // ========== UTILITY METHODS ==========
  
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token')
  }

  getToken(): string | null {
    return localStorage.getItem('token')
  }

  clearAuth(): void {
    localStorage.removeItem('token')
  }
}

// Instância singleton do cliente API
export const plugbaseAPI = new PlugbaseAPI()

// Export do cliente axios para uso direto quando necessário
export { api as axiosClient }