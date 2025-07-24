export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  parentId?: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  
  // Relacionamentos opcionais
  author?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  post?: {
    id: string;
    title: string;
    slug: string;
  };
  parent?: Comment;
  replies?: Comment[];
}

export interface CreateCommentData {
  content: string;
  postId: string;
  parentId?: string;
}

export interface UpdateCommentData {
  content?: string;
  isApproved?: boolean;
}

export interface CommentFilters {
  postId?: string;
  authorId?: string;
  parentId?: string;
  isApproved?: boolean;
  search?: string;
}

export interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[];
  replyCount: number;
}