// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
  meta?: {
    page?: number
    total?: number
    limit?: number
    totalPages?: number
  }
}

// User Types
export interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface CreateUserRequest {
  email: string
  password: string
  name: string
  role?: string
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  avatar?: string
}

// Auth Types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  role?: string
}

export interface AuthResponse {
  token: string
  user: User
  refreshToken?: string
}

// Post Types
export interface Post {
  id: string
  title: string
  content: string
  author: User
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface CreatePostRequest {
  title: string
  content: string
  tags?: string[]
}

export interface UpdatePostRequest {
  title?: string
  content?: string
  tags?: string[]
}

// Storage Types
export interface StorageFile {
  id: string
  filename: string
  originalName: string
  mimetype: string
  size: number
  url: string
  createdAt: string
}

// WebSocket Types
export interface NotificationData {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
}

export interface RealtimeEvent {
  type: string
  data: any
  timestamp: string
}

// Bible Types (specific to the application)
export interface BibleVerse {
  id: string
  book: string
  chapter: number
  verse: number
  text: string
  version: string
}

export interface BibleSearchRequest {
  query: string
  version?: string
  books?: string[]
}

export interface BibleSearchResponse {
  verses: BibleVerse[]
  total: number
  query: string
}

// Community Types
export interface Community {
  id: string
  name: string
  description: string
  memberCount: number
  isPrivate: boolean
  createdAt: string
}

// Comment Types
export interface Comment {
  id: string
  content: string
  author: User
  postId: string
  createdAt: string
  updatedAt: string
}

export interface CreateCommentRequest {
  content: string
  postId: string
}