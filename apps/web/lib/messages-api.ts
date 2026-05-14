import { apiRequest } from './api-client';

export interface MessageAuthor {
  id: string;
  displayName: string;
}

export interface Message {
  id: string;
  body: string;
  tag: string;
  author: MessageAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface ListMessagesParams {
  limit?: number;
  cursor?: string;
  tag?: string;
  authorId?: string;
  from?: string;
  to?: string;
}

export interface ListMessagesResponse {
  items: Message[];
  nextCursor: string | null;
}

export interface MessageInput {
  body: string;
  tag: string;
}

export async function listMessages(params: ListMessagesParams = {}): Promise<ListMessagesResponse> {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  }

  const path = query.size > 0 ? `/messages?${query.toString()}` : '/messages';

  return apiRequest<ListMessagesResponse>(path);
}

export async function createMessage(input: MessageInput): Promise<Message> {
  return apiRequest<Message>('/messages', {
    method: 'POST',
    body: input,
  });
}

export async function updateMessage(id: string, input: Partial<MessageInput>): Promise<Message> {
  return apiRequest<Message>(`/messages/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export async function deleteMessage(id: string): Promise<{ success: true }> {
  return apiRequest<{ success: true }>(`/messages/${id}`, {
    method: 'DELETE',
  });
}
