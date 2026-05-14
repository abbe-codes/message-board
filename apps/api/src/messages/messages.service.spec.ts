import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';

import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from './messages.service';

type FindUniqueOwnerArgs = {
  where: { id: string };
  select: { authorId: true };
};

describe('MessagesService', () => {
  it('blocks update and delete when the user does not own the message', async () => {
    const currentUserId = 'user-current';
    const otherUserId = 'user-other';
    const messageId = 'message-1';
    const findUnique = jest
      .fn<(args: FindUniqueOwnerArgs) => Promise<{ authorId: string } | null>>()
      .mockResolvedValue({
        authorId: otherUserId,
      });
    const update = jest.fn();
    const remove = jest.fn();
    const prisma = {
      message: {
        findUnique,
        update,
        delete: remove,
      },
    };
    const service = new MessagesService(prisma as unknown as PrismaService);

    await expect(service.update(currentUserId, messageId, { body: 'Edited message' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.delete(currentUserId, messageId)).rejects.toBeInstanceOf(ForbiddenException);

    expect(findUnique).toHaveBeenCalledTimes(2);
    expect(findUnique).toHaveBeenNthCalledWith(1, {
      where: { id: messageId },
      select: { authorId: true },
    });
    expect(findUnique).toHaveBeenNthCalledWith(2, {
      where: { id: messageId },
      select: { authorId: true },
    });
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});
