import type { Prisma } from '@prisma/client';

export const messageInclude = {
  author: {
    select: {
      id: true,
      displayName: true,
    },
  },
} as const satisfies Prisma.MessageInclude;

type MessageWithAuthor = Prisma.MessageGetPayload<{
  include: typeof messageInclude;
}>;

export interface MessageResponse {
  id: string;
  body: string;
  tag: string;
  author: {
    id: string;
    displayName: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export function toMessageResponse(message: MessageWithAuthor): MessageResponse {
  return {
    id: message.id,
    body: message.body,
    tag: message.tag,
    author: {
      id: message.author.id,
      displayName: message.author.displayName,
    },
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}
