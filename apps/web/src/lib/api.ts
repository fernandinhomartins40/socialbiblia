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
// } from '@socialbiblia/shared';
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
// } from '@socialbiblia/shared';

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

interface CreatePostData {
  content: string;
  communityId?: string;
}

interface CreateCommentData {
  content: string;
  postId: string;
}

interface PostWithDetails {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
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
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
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
    return this.request('/client/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async register(data: RegisterData): Promise<ApiResponse> {
    return this.request('/client/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/client/auth/logout', {
      method: 'GET',
    });
  }

  async getCurrentUser(): Promise<UserWithStats> {
    return this.request('/client/user/me');
  }

  // User endpoints - Adapted for Vincent Queimado's API structure
  async updateProfile(data: UpdateUserProfileData): Promise<UserWithStats> {
    return this.request('/client/user/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Post endpoints
  async getPosts(userId?: string, limit = 20, offset = 0): Promise<PostWithDetails[]> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    return this.request(`/posts?${params.toString()}`);
  }

  async createPost(data: CreatePostData): Promise<PostWithDetails> {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deletePost(postId: string): Promise<ApiResponse> {
    return this.request(`/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  async likePost(postId: string): Promise<{ liked: boolean }> {
    return this.request(`/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  // Comment endpoints
  async getComments(postId: string) {
    return this.request(`/posts/${postId}/comments`);
  }

  async createComment(data: CreateCommentData) {
    return this.request('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Community endpoints
  async getCommunities(): Promise<Community[]> {
    return this.request('/communities');
  }

  async joinCommunity(communityId: string): Promise<{ joined: boolean }> {
    return this.request(`/communities/${communityId}/join`, {
      method: 'POST',
    });
  }

  // Follow endpoints
  async followUser(userId: string): Promise<{ followed: boolean }> {
    return this.request(`/users/${userId}/follow`, {
      method: 'POST',
    });
  }

  // Bible endpoints
  async getBibleBooks() {
    return this.request('/bible/books');
  }

  async getBibleBook(bookId: string) {
    return this.request(`/bible/books/${bookId}`);
  }

  async getBibleChapters(bookId: string) {
    return this.request(`/bible/books/${bookId}/chapters`);
  }

  async getBibleVerses(bookId?: string, chapter?: number) {
    const params = new URLSearchParams();
    if (bookId) params.append('bookId', bookId);
    if (chapter) params.append('chapter', chapter.toString());
    
    return this.request(`/bible/verses?${params.toString()}`);
  }

  async searchBible(data: BibleSearchData): Promise<BibleSearchResponse> {
    return this.request('/bible/search', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async searchBibleAI(data: BibleAISearchData): Promise<BibleSearchResponse> {
    return this.request('/bible/ai-search', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRandomVerse(): Promise<RandomVerseResponse> {
    return this.request('/verses/random');
  }

  // Bookmark endpoints
  async getBookmarks(): Promise<BookmarkData[]> {
    return this.request('/bible/bookmarks');
  }

  async createBookmark(data: any): Promise<BookmarkData> {
    return this.request('/bible/bookmarks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteBookmark(bookmarkId: string): Promise<ApiResponse> {
    return this.request(`/bible/bookmarks/${bookmarkId}`, {
      method: 'DELETE',
    });
  }

  // AI Chat endpoints
  async chatWithAI(data: AIInteractionData): Promise<AISearchResponse> {
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitAIFeedback(data: AIFeedbackData): Promise<ApiResponse> {
    return this.request('/ai/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAIAnalytics(): Promise<AIAnalyticsResponse> {
    return this.request('/ai/analytics');
  }

  // LLM endpoints
  async getLLMStatus(): Promise<LLMStatusResponse> {
    return this.request('/llm/status');
  }

  async testLLM(message?: string): Promise<any> {
    return this.request('/llm/test', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }
}

export const apiClient = new ApiClient();