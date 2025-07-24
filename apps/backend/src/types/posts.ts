export interface CreatePostDto {
  title: string;
  content: string;
  excerpt?: string;
  status?: string;
  tags?: string[];
  category?: string;
  featured?: boolean;
}

export interface UpdatePostDto {
  title?: string;
  content?: string;
  excerpt?: string | null;
  status?: string;
  tags?: string[];
  category?: string | null;  
  featured?: boolean;
}

export interface PostFilters {
  status?: string;
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
  status: string;
  tags: string[] | string | null;
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