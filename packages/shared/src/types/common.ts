// Tipos comuns utilizados em toda a aplicação

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  success: boolean;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export interface UserWithStats {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  accountName?: string | null;
  accountType: string;
  createdAt: Date;
  _count: {
    followers: number;
    following: number;
    posts: number;
  };
}

export interface PostWithDetails {
  id: string;
  userId: string;
  content: string;
  imageUrl?: string | null;
  verseReference?: string | null;
  verseText?: string | null;
  type: 'post' | 'prayer' | 'verse';
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
    accountName?: string | null;
  };
  comments: CommentWithUser[];
  likes: { userId: string }[];
  _count: {
    likes: number;
    comments: number;
  };
}

export interface CommentWithUser {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
    accountName?: string | null;
  };
}

export interface Community {
  id: string;
  name: string;
  description?: string | null;
  icon: string;
  color: string;
  memberCount: number;
  createdAt: Date;
}

export interface AIInteraction {
  id: string;
  userId: string;
  userMessage: string;
  aiResponse: string;
  emotion?: string | null;
  feedback?: string | null;
  createdAt: Date;
}