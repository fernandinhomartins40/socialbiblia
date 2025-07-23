export interface CreatePostDto {
  title: string;
  content: string;
  excerpt?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  tags?: string[];
  category?: string;
  featured?: boolean;
}

export interface UpdatePostDto {
  title?: string;
  content?: string;
  excerpt?: string | null;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  tags?: string[];
  category?: string | null;  
  featured?: boolean;
}

export interface PostFilters {
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  category?: string;
  featured?: boolean;
  authorId?: string;
  search?: string;
}

export interface PostResponse {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  tags: string[];
  category: string | null;
  featured: boolean;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  author?: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  };
}