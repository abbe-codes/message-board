import { apiRequest } from './api-client';

export interface UserSummary {
  id: string;
  displayName: string;
}

export async function listUsers(): Promise<UserSummary[]> {
  const response = await apiRequest<{ items: UserSummary[] }>('/users');

  return response.items;
}
