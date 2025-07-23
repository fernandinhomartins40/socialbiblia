export interface CreatePostData {
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  verseReference?: string;
  verseText?: string;
  isPublic?: boolean;
  authorId: string;
  communityId?: string;
}

export interface CreateCommentData {
  content: string;
  postId: string;
  authorId: string;
  parentId?: string;
}

export interface LikePostData {
  userId: string;
  postId: string;
  action: 'like' | 'unlike';
}

export interface DeletePostData {
  userId: string;
  postId: string;
}

export interface GetFeedOptions {
  userId?: string;
  limit?: number;
  offset?: number;
  communityId?: string;
}

export interface GetCommentsOptions {
  postId: string;
  limit?: number;
  offset?: number;
}