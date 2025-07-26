import axios, { AxiosResponse, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { toast } from '@/hooks/use-toast';

// ========== UNIFIED TYPE DEFINITIONS ==========

// Base API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    statusCode: number;
    timestamp: string;
    requestId?: string;
    details?: any;
  };
  meta?: {
    page?: number;
    total?: number;
    limit?: number;
    totalPages?: number;
  };
}

// Auth Types
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface RefreshTokenData {
  refreshToken: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  avatar?: string;
  denomination?: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserProfileData {
  name?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  bio?: string;
}

// Post Types
export interface Post {
  id: string;
  title?: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  verseReference?: string;
  verseText?: string;
  isPublic?: boolean;
  communityId?: string;
  author: User;
  tags?: string[];
  likes?: number;
  comments?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  title?: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  verseReference?: string;
  verseText?: string;
  isPublic?: boolean;
  communityId?: string;
  tags?: string[];
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  imageUrl?: string;
  videoUrl?: string;
  verseReference?: string;
  verseText?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface LikePostData {
  postId: string;
  action: 'like' | 'unlike';
}

// Comment Types
export interface Comment {
  id: string;
  content: string;
  postId: string;
  author: User;
  parentId?: string;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentData {
  content: string;
  postId: string;
  parentId?: string;
}

// Community Types
export interface Community {
  id: string;
  name: string;
  description: string;
  memberCount?: number;
  isPublic?: boolean;
  createdAt: string;
}

// Bible Types
export interface BibleSearchData {
  query: string;
  translation?: string;
  books?: string[];
}

export interface BibleSearchResponse {
  results: BibleVerse[];
  total: number;
}

export interface BibleVerse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
}

export interface RandomVerseResponse {
  verse: string;
  reference: string;
  book: string;
  chapter: number;
  verseNumber: number;
}

// AI Types
export interface AIInteractionData {
  message: string;
  context?: string;
}

export interface AISearchData {
  query: string;
  includeContext?: boolean;
}

export interface AIResponse {
  response: string;
  sources?: string[];
  confidence?: number;
}

export interface AIFeedbackData {
  rating: number;
  comment?: string;
  interactionId?: string;
}

// Bookmark Types
export interface BookmarkData {
  id: string;
  verseId: string;
  verse: BibleVerse;
  note?: string;
  createdAt: string;
}

// Storage Types
export interface StorageFile {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  createdAt: string;
}

// ========== API CLIENT CONFIGURATION ==========

const API_BASE_URL = '/api';
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRY_ATTEMPTS = 3;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Token management utilities
class TokenManager {
  private static ACCESS_TOKEN_KEY = 'accessToken';
  private static REFRESH_TOKEN_KEY = 'refreshToken';
  private static USER_KEY = 'user';

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  static setTokens(accessToken: string, refreshToken?: string, user?: User): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

// ========== REQUEST/RESPONSE INTERCEPTORS ==========

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = TokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = Math.random().toString(36).substring(2, 15);
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = TokenManager.getRefreshToken();
      if (refreshToken && originalRequest.url !== '/client/auth/refresh') {
        try {
          const response = await api.post<ApiResponse<AuthResponse>>('/client/auth/refresh', {
            refreshToken,
          });
          
          if (response.data.success && response.data.data) {
            const { token, refreshToken: newRefreshToken, user } = response.data.data;
            TokenManager.setTokens(token, newRefreshToken, user);
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, logout user
          TokenManager.clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available
        TokenManager.clearTokens();
        window.location.href = '/login';
      }
    }
    
    // Handle other errors with toast notifications
    const message = error.response?.data?.error?.message || error.response?.data?.message || 'Erro inesperado';
    
    if (error.response?.status >= 500) {
      toast({
        title: 'Erro do servidor',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } else if (error.response?.status >= 400 && error.response?.status !== 401) {
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    } else if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      toast({
        title: 'Erro de conexão',
        description: 'Verifique sua conexão com a internet.',
        variant: 'destructive',
      });
    }
    
    return Promise.reject(error);
  }
);

// ========== UNIFIED API CLIENT ==========

export class UnifiedApiClient {
  // ========== AUTH ENDPOINTS ==========
  
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/client/auth/login', data);
    
    if (response.data.success && response.data.data) {
      const { token, refreshToken, user } = response.data.data;
      TokenManager.setTokens(token, refreshToken, user);
    }
    
    return response.data.data!;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/client/auth/register', data);
    
    if (response.data.success && response.data.data) {
      const { token, refreshToken, user } = response.data.data;
      TokenManager.setTokens(token, refreshToken, user);
    }
    
    return response.data.data!;
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<ApiResponse<AuthResponse>>('/client/auth/refresh', {
      refreshToken,
    });

    if (response.data.success && response.data.data) {
      const { token, refreshToken: newRefreshToken, user } = response.data.data;
      TokenManager.setTokens(token, newRefreshToken, user);
    }

    return response.data.data!;
  }

  async logout(): Promise<void> {
    try {
      await api.post('/client/auth/logout');
    } finally {
      TokenManager.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/client/user/me');
    return response.data;
  }

  // ========== USER ENDPOINTS ==========
  
  async updateProfile(data: UpdateUserProfileData): Promise<User> {
    const response = await api.patch<User>('/client/user/me', data);
    
    // Update cached user data
    const updatedUser = response.data;
    TokenManager.setTokens(
      TokenManager.getAccessToken()!,
      TokenManager.getRefreshToken(),
      updatedUser
    );
    
    return updatedUser;
  }

  async getUsers(page = 1, limit = 10): Promise<{ users: User[]; meta: any }> {
    const response = await api.get<ApiResponse<User[]>>('/users', {
      params: { page, limit }
    });
    
    return {
      users: response.data.data!,
      meta: response.data.meta || {}
    };
  }

  // ========== POST ENDPOINTS ==========
  
  async createPost(data: CreatePostData): Promise<Post> {
    const response = await api.post<ApiResponse<Post>>('/client/posts', data);
    return response.data.data!;
  }

  async getFeed(limit = 20, offset = 0, communityId?: string): Promise<{ posts: Post[]; meta: any }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    if (communityId) {
      params.append('communityId', communityId);
    }

    const response = await api.get<ApiResponse<Post[]>>(`/client/posts/feed?${params.toString()}`);
    
    return {
      posts: response.data.data!,
      meta: response.data.meta || {}
    };
  }

  async getPost(postId: string): Promise<Post> {
    const response = await api.get<ApiResponse<Post>>(`/client/posts/${postId}`);
    return response.data.data!;
  }

  async updatePost(postId: string, data: UpdatePostData): Promise<Post> {
    const response = await api.patch<ApiResponse<Post>>(`/client/posts/${postId}`, data);
    return response.data.data!;
  }

  async deletePost(postId: string): Promise<void> {
    await api.delete(`/client/posts/${postId}`);
  }

  async likePost(data: LikePostData): Promise<{ liked: boolean }> {
    const response = await api.post<ApiResponse<{ liked: boolean }>>('/client/posts/like', data);
    return response.data.data!;
  }

  // ========== COMMENT ENDPOINTS ==========
  
  async getComments(postId: string): Promise<Comment[]> {
    const response = await api.get<ApiResponse<Comment[]>>(`/client/posts/${postId}/comments`);
    return response.data.data!;
  }

  async createComment(data: CreateCommentData): Promise<Comment> {
    const response = await api.post<ApiResponse<Comment>>('/client/comments', data);
    return response.data.data!;
  }

  async updateComment(commentId: string, content: string): Promise<Comment> {
    const response = await api.patch<ApiResponse<Comment>>(`/client/comments/${commentId}`, {
      content,
    });
    return response.data.data!;
  }

  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/client/comments/${commentId}`);
  }

  // ========== COMMUNITY ENDPOINTS ==========
  
  async getCommunities(): Promise<Community[]> {
    const response = await api.get<ApiResponse<Community[]>>('/communities');
    return response.data.data!;
  }

  async joinCommunity(communityId: string): Promise<{ joined: boolean }> {
    const response = await api.post<ApiResponse<{ joined: boolean }>>(`/communities/${communityId}/join`);
    return response.data.data!;
  }

  // ========== BIBLE ENDPOINTS ==========
  
  async searchBible(data: BibleSearchData): Promise<BibleSearchResponse> {
    const response = await api.post<ApiResponse<BibleSearchResponse>>('/bible/search', data);
    return response.data.data!;
  }

  async getBibleBooks(): Promise<any> {
    const response = await api.get<ApiResponse<any>>('/bible/books');
    return response.data.data!;
  }

  async getBibleVerses(bookId?: string, chapter?: number): Promise<BibleVerse[]> {
    const params = new URLSearchParams();
    if (bookId) params.append('bookId', bookId);
    if (chapter) params.append('chapter', chapter.toString());
    
    const response = await api.get<ApiResponse<BibleVerse[]>>(`/bible/verses?${params.toString()}`);
    return response.data.data!;
  }

  async getRandomVerse(): Promise<RandomVerseResponse> {
    const response = await api.get<ApiResponse<RandomVerseResponse>>('/verses/random');
    return response.data.data!;
  }

  // ========== BOOKMARK ENDPOINTS ==========
  
  async getBookmarks(): Promise<BookmarkData[]> {
    const response = await api.get<ApiResponse<BookmarkData[]>>('/bible/bookmarks');
    return response.data.data!;
  }

  async createBookmark(data: Omit<BookmarkData, 'id' | 'createdAt'>): Promise<BookmarkData> {
    const response = await api.post<ApiResponse<BookmarkData>>('/bible/bookmarks', data);
    return response.data.data!;
  }

  async deleteBookmark(bookmarkId: string): Promise<void> {
    await api.delete(`/bible/bookmarks/${bookmarkId}`);
  }

  // ========== AI ENDPOINTS ==========
  
  async chatWithAI(data: AIInteractionData): Promise<AIResponse> {
    const response = await api.post<ApiResponse<AIResponse>>('/ai/chat', data);
    return response.data.data!;
  }

  async searchBibleAI(data: AISearchData): Promise<AIResponse> {
    const response = await api.post<ApiResponse<AIResponse>>('/bible/ai-search', data);
    return response.data.data!;
  }

  async submitAIFeedback(data: AIFeedbackData): Promise<void> {
    await api.post('/ai/feedback', data);
  }

  async getAIAnalytics(): Promise<any> {
    const response = await api.get<ApiResponse<any>>('/ai/analytics');
    return response.data.data!;
  }

  // ========== STORAGE ENDPOINTS ==========
  
  async uploadFile(file: File, folder = 'posts'): Promise<StorageFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    const response = await api.post<ApiResponse<StorageFile>>('/storage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.data!;
  }

  async getFiles(page = 1, limit = 10): Promise<{ files: StorageFile[]; meta: any }> {
    const response = await api.get<ApiResponse<StorageFile[]>>('/storage', {
      params: { page, limit }
    });
    
    return {
      files: response.data.data!,
      meta: response.data.meta || {}
    };
  }

  async deleteFile(fileId: string): Promise<void> {
    await api.delete(`/storage/${fileId}`);
  }

  // ========== UTILITY METHODS ==========
  
  isAuthenticated(): boolean {
    return TokenManager.isAuthenticated();
  }

  getToken(): string | null {
    return TokenManager.getAccessToken();
  }

  getUser(): User | null {
    return TokenManager.getUser();
  }

  clearAuth(): void {
    TokenManager.clearTokens();
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await api.get('/health');
    return response.data;
  }
}

// ========== SINGLETON INSTANCE ==========

export const apiClient = new UnifiedApiClient();

// ========== EXPORTS ==========

export default apiClient;
export { TokenManager };

// Re-export axios client for direct use when needed
export { api as axiosClient };