// Enhanced types for social network functionality

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  profileImageUrl?: string;
  bio?: string;
  denomination?: string;
  location?: string;
  isVerified?: boolean;
  isPrivate?: boolean;
}

export interface UserWithStats extends User {
  _count?: {
    followers: number;
    following: number;
    posts: number;
  };
  favoriteVerse?: string;
}

export interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  verseReference?: string;
  verseText?: string;
  isPublic: boolean;
  isPinned: boolean;
  authorId: string;
  communityId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostWithUser extends Post {
  author: User;
  community?: Community;
  stats: {
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
  };
  isLiked: boolean;
}

// Legacy compatibility
export interface PostWithDetails extends PostWithUser {
  userId: string; // For backward compatibility
  user?: UserWithStats; // For backward compatibility
  likes: Array<{ userId: string; id: string; }>;
  comments?: CommentWithDetails[];
  _count?: {
    likes: number;
    comments: number;
  };
}

export interface CommentWithDetails {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  postId: string;
  user?: UserWithStats;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  icon?: string;
  color?: string;
  memberCount?: number;
  _count?: {
    members: number;
    posts: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface BibleVerse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation?: string;
}

export interface BibleBook {
  id: string;
  name: string;
  abbreviation: string;
  chapters: number;
  testament?: string;
  order?: number;
}

export interface BiblicalChapter {
  id: string;
  book: string;
  chapter: number;
  verses: BibleVerse[];
}

export interface BiblicalBookmark {
  id: string;
  verseId: string;
  note?: string;
}

export interface LLMResponse {
  success: boolean;
  data: any;
  timestamp: string;
}

export interface RandomVerse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}