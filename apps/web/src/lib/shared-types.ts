// Temporary types to replace @shared/schema imports

export interface UserWithStats {
  id: string;
  email: string;
  name: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  denomination?: string;
  favoriteVerse?: string;
  _count?: {
    followers: number;
    following: number;
    posts: number;
  };
}

export interface PostWithDetails {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  type?: string;
  verseReference?: string;
  verseText?: string;
  imageUrl?: string;
  user?: UserWithStats;
  likes: Array<{ userId: string; id: string; }>;
  comments?: CommentWithDetails[];
  _count?: {
    likes: number;
    comments: number;
  };
}

// Type alias for compatibility
export type PostWithUser = PostWithDetails;

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