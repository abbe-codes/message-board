import type { User } from '@prisma/client';

export type PublicUser = Pick<User, 'id' | 'email' | 'displayName' | 'createdAt' | 'updatedAt'>;
export type UserSummary = Pick<User, 'id' | 'displayName'>;

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toUserSummary(user: UserSummary): UserSummary {
  return {
    id: user.id,
    displayName: user.displayName,
  };
}
