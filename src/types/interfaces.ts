import { UserStatus } from "./enums";

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  status?: UserStatus;
  roles?: string[];
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  status?: UserStatus;
  roles?: string[];
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  status: UserStatus;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}