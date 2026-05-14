import { ApiError, apiRequest } from './api-client';

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: CurrentUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  displayName: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const response = await apiRequest<AuthResponse>('/auth/me');

    return response.user;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      return null;
    }

    throw error;
  }
}

export async function login(input: LoginInput): Promise<CurrentUser> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: input,
  });

  return response.user;
}

export async function register(input: RegisterInput): Promise<CurrentUser> {
  const response = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: input,
  });

  return response.user;
}

export async function logout(): Promise<void> {
  await apiRequest<{ success: boolean }>('/auth/logout', {
    method: 'POST',
  });
}
