// Temporary: Defining types locally instead of using shared package
// import { 
//   LoginData, 
//   RegisterData, 
//   CreatePostData, 
//   CreateCommentData,
//   BibleSearchData,
//   BibleAISearchData,
//   AIInteractionData,
//   AIFeedbackData,
//   UpdateUserProfileData
// } from '@biblicai/shared';
// import type {
//   ApiResponse,
//   UserWithStats,
//   PostWithDetails,
//   Community,
//   AIInteraction,
//   BibleSearchResponse,
//   AISearchResponse,
//   AIAnalyticsResponse,
//   BookmarkData,
//   RandomVerseResponse,
//   LLMStatusResponse
// } from '@biblicai/shared';

// Local type definitions for testing
interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

interface CreatePostData {
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  verseReference?: string;
  verseText?: string;
  isPublic?: boolean;
  communityId?: string;
}

interface LikePostData {
  postId: string;
  action: 'like' | 'unlike';
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface UserWithStats {
  id: string;
  email: string;
  name: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  denomination?: string;
}

interface CreateCommentData {
  content: string;
  postId: string;
}

interface Community {
  id: string;
  name: string;
  description: string;
}

interface BibleSearchData {
  query: string;
}

interface BibleAISearchData {
  query: string;
}

interface AIInteractionData {
  message: string;
}

interface AIFeedbackData {
  rating: number;
  comment?: string;
}

interface UpdateUserProfileData {
  name?: string;
  phone?: string;
}

interface BibleSearchResponse {
  results: any[];
}

interface AISearchResponse {
  response: string;
}

interface AIAnalyticsResponse {
  stats: any;
}

interface BookmarkData {
  id: string;
  verseId: string;
}

interface RandomVerseResponse {
  verse: string;
  reference: string;
}

interface LLMStatusResponse {
  status: string;
}


const API_BASE_URL = '/api';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry: boolean = false
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('accessToken');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Handle 401 unauthorized errors with token refresh
        if (response.status === 401 && !isRetry && endpoint !== '/client/auth/refresh' && endpoint !== '/client/auth/login') {
          try {
            await this.refreshToken();
            // Retry the original request with new token
            return this.request(endpoint, options, true);
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
            throw new Error('Session expired');
          }
        }
        
        const error = await response.text();
        throw new Error(error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints - Adapted for Vincent Queimado's API structure
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

  async refreshToken(): Promise<ApiResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.request<ApiResponse>('/client/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    // Update tokens if refresh is successful
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

  async getCurrentUser(): Promise<UserWithStats> {
    return this.request<UserWithStats>('/client/user/me');
  }

  // Posts endpoints
  async createPost(data: CreatePostData): Promise<ApiResponse> {
    return this.request<ApiResponse>('/client/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFeed(limit: number = 20, offset: number = 0, communityId?: string): Promise<ApiResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    if (communityId) {
      params.append('communityId', communityId);
    }

    return this.request<ApiResponse>(`/client/posts/feed?${params.toString()}`);
  }

  async likePost(data: LikePostData): Promise<ApiResponse> {
    return this.request<ApiResponse>('/client/posts/like', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // User endpoints - Adapted for Vincent Queimado's API structure
  async updateProfile(data: UpdateUserProfileData): Promise<UserWithStats> {
    return this.request<UserWithStats>('/client/user/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Delete post
  async deletePost(postId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/client/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  // Comment endpoints
  async getComments(postId: string): Promise<{ comments: any[] }> {
    return this.request<{ comments: any[] }>(`/client/posts/${postId}/comments`);
  }

  async createComment(data: CreateCommentData): Promise<ApiResponse> {
    return this.request<ApiResponse>('/client/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Community endpoints
  async getCommunities(): Promise<Community[]> {
    return this.request<Community[]>('/communities');
  }

  async joinCommunity(communityId: string): Promise<{ joined: boolean }> {
    return this.request<{ joined: boolean }>(`/communities/${communityId}/join`, {
      method: 'POST',
    });
  }

  // Follow endpoints
  async followUser(userId: string): Promise<{ followed: boolean }> {
    return this.request<{ followed: boolean }>(`/users/${userId}/follow`, {
      method: 'POST',
    });
  }

  // Bible endpoints
  async getBibleBooks(): Promise<any> {
    return this.request<any>('/bible/books');
  }

  async getBibleBook(bookId: string): Promise<any> {
    return this.request<any>(`/bible/books/${bookId}`);
  }

  async getBibleChapters(bookId: string): Promise<any> {
    return this.request<any>(`/bible/books/${bookId}/chapters`);
  }

  async getBibleVerses(bookId?: string, chapter?: number): Promise<any> {
    const params = new URLSearchParams();
    if (bookId) params.append('bookId', bookId);
    if (chapter) params.append('chapter', chapter.toString());
    
    return this.request<any>(`/bible/verses?${params.toString()}`);
  }

  async searchBible(data: BibleSearchData): Promise<BibleSearchResponse> {
    return this.request<BibleSearchResponse>('/bible/search', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async searchBibleAI(data: BibleAISearchData): Promise<BibleSearchResponse> {
    return this.request<BibleSearchResponse>('/bible/ai-search', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRandomVerse(): Promise<RandomVerseResponse> {
    return this.request<RandomVerseResponse>('/verses/random');
  }

  // Bookmark endpoints
  async getBookmarks(): Promise<BookmarkData[]> {
    return this.request<BookmarkData[]>('/bible/bookmarks');
  }

  async createBookmark(data: any): Promise<BookmarkData> {
    return this.request<BookmarkData>('/bible/bookmarks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteBookmark(bookmarkId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/bible/bookmarks/${bookmarkId}`, {
      method: 'DELETE',
    });
  }

  // AI Chat endpoints
  async chatWithAI(data: AIInteractionData): Promise<AISearchResponse> {
    return this.request<AISearchResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitAIFeedback(data: AIFeedbackData): Promise<ApiResponse> {
    return this.request<ApiResponse>('/ai/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAIAnalytics(): Promise<AIAnalyticsResponse> {
    return this.request<AIAnalyticsResponse>('/ai/analytics');
  }

  // LLM endpoints
  async getLLMStatus(): Promise<LLMStatusResponse> {
    return this.request<LLMStatusResponse>('/llm/status');
  }

  async testLLM(message?: string): Promise<any> {
    return this.request<any>('/llm/test', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }
}

export const apiClient = new ApiClient();