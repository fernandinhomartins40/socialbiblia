export interface CreateUserDto {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface UserFilters {
  search?: string;
  role?: 'USER' | 'MODERATOR' | 'ADMIN';
  isActive?: boolean;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  avatar: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface UserWithStats extends UserResponse {
  _count?: {
    posts: number;
  };
}