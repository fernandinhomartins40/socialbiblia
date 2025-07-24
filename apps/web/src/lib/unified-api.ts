// Unified API Client for Biblicai Frontend
// Integrates with Vincent Queimado Express + Prisma + TypeScript Backend

import { toast } from '@/hooks/use-toast';

// Types for API responses and requests
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  profileImageUrl?: string;
  bio?: string;
  denomination?: string;
  location?: string;
  isVerified?: boolean;
  isPrivate?: boolean;
  role?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  verseReference?: string;
  verseText?: string;
  isPublic?: boolean;
  communityId?: string;
}

export interface CreateCommentData {
  content: string;
  postId: string;
}

export interface UpdateUserProfileData {
  name?: string;
  phone?: string;
  bio?: string;
  denomination?: string;
  location?: string;
}

// Base API configuration
const API_BASE_URL = '/api';

class UnifiedApiClient {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Handle 401 unauthorized errors
      if (response.status === 401) {
        // Clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        toast({
          title: 'Sessão expirada',
          description: 'Faça login novamente.',
          variant: 'destructive',
        });
        
        // Redirect to login page
        window.location.href = '/login';
        throw new Error('Session expired');
      }
      
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse<T>(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // =============================================================================
  // AUTHENTICATION ENDPOINTS
  // =============================================================================
  
  async login(data: LoginData): Promise<ApiResponse> {
    const response = await this.request<ApiResponse>('/client/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store tokens if login is successful
    if (response.success && response.data) {
      localStorage.setItem('accessToken', response.data.token);
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }

    return response;
  }

  async register(data: RegisterData): Promise<ApiResponse> {
    return this.request<ApiResponse>('/client/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request<ApiResponse>('/client/auth/logout', {
      method: 'GET',
    });

    // Clear tokens on logout
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    return response;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/client/user/me');
  }

  async updateProfile(data: UpdateUserProfileData): Promise<User> {
    return this.request<User>('/client/user/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // =============================================================================
  // POSTS ENDPOINTS (Simulated - to be implemented in backend)
  // =============================================================================
  
  async createPost(data: CreatePostData): Promise<ApiResponse> {
    // For now, simulate since posts endpoints don't exist yet
    console.warn('Posts endpoints not implemented in backend yet');
    return {
      success: true,
      message: 'Post created successfully (simulated)',
      data: { id: Date.now().toString(), ...data }
    };
  }

  async getFeed(limit: number = 20, offset: number = 0): Promise<ApiResponse> {
    // For now, simulate since posts endpoints don't exist yet
    console.warn('Feed endpoints not implemented in backend yet');
    return {
      success: true,
      data: { posts: [] }
    };
  }

  async likePost(data: { postId: string; action: 'like' | 'unlike' }): Promise<ApiResponse> {
    // For now, simulate since posts endpoints don't exist yet
    console.warn('Like endpoints not implemented in backend yet');
    return {
      success: true,
      message: `Post ${data.action}d successfully (simulated)`
    };
  }

  async deletePost(postId: string): Promise<ApiResponse> {
    // For now, simulate since posts endpoints don't exist yet
    console.warn('Delete post endpoints not implemented in backend yet');
    return {
      success: true,
      message: 'Post deleted successfully (simulated)'
    };
  }

  async getComments(postId: string): Promise<{ comments: any[] }> {
    // For now, simulate since comments endpoints don't exist yet
    console.warn('Comments endpoints not implemented in backend yet');
    return { comments: [] };
  }

  async createComment(data: CreateCommentData): Promise<ApiResponse> {
    // For now, simulate since comments endpoints don't exist yet
    console.warn('Comments endpoints not implemented in backend yet');
    return {
      success: true,
      message: 'Comment created successfully (simulated)',
      data: { id: Date.now().toString(), ...data }
    };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================
  
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  clearAuth(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // =============================================================================
  // HEALTH CHECK AND API INFO
  // =============================================================================
  
  async getApiInfo(): Promise<any> {
    return this.request<any>('/info');
  }

  async checkHealth(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/info`);
      return await response.json();
    } catch (error) {
      throw new Error('Backend is not responding');
    }
  }
}

// Export singleton instance
export const apiClient = new UnifiedApiClient();

// Export class for testing or custom instances
export { UnifiedApiClient }; 