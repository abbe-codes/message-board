import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { messageInclude, type MessageResponse, toMessageResponse } from './message-response';

interface DecodedCursor {
  createdAt: string;
  id: string;
}

export interface ListMessagesResponse {
  items: MessageResponse[];
  nextCursor: string | null;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class MessagesService {
  private readonly defaultLimit = 20;

  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: string, dto: CreateMessageDto): Promise<MessageResponse> {
    const message = await this.prisma.message.create({
      data: {
        authorId,
        body: dto.body,
        tag: dto.tag,
      },
      include: messageInclude,
    });

    return toMessageResponse(message);
  }

  async list(query: ListMessagesQueryDto): Promise<ListMessagesResponse> {
    const limit = query.limit ?? this.defaultLimit;
    const where = this.buildWhere(query);
    const cursor = this.decodeCursor(query.cursor);
    const messages = await this.prisma.message.findMany({
      where: cursor
        ? {
            AND: [
              where,
              {
                OR: [
                  { createdAt: { lt: cursor.createdAt } },
                  {
                    createdAt: cursor.createdAt,
                    id: { lt: cursor.id },
                  },
                ],
              },
            ],
          }
        : where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      include: messageInclude,
    });
    const hasNextPage = messages.length > limit;
    const pageItems = hasNextPage ? messages.slice(0, limit) : messages;
    const lastItem = pageItems.at(-1);

    return {
      items: pageItems.map(toMessageResponse),
      nextCursor: hasNextPage && lastItem ? this.encodeCursor(lastItem) : null,
    };
  }

  async update(authorId: string, messageId: string, dto: UpdateMessageDto): Promise<MessageResponse> {
    if (dto.body === undefined && dto.tag === undefined) {
      throw new BadRequestException('Provide at least one message field to update.');
    }

    await this.ensureMessageOwnedByUser(messageId, authorId);

    const data: Prisma.MessageUpdateInput = {};

    if (dto.body !== undefined) {
      data.body = dto.body;
    }

    if (dto.tag !== undefined) {
      data.tag = dto.tag;
    }

    const message = await this.prisma.message.update({
      where: { id: messageId },
      data,
      include: messageInclude,
    });

    return toMessageResponse(message);
  }

  async delete(authorId: string, messageId: string): Promise<{ success: true }> {
    await this.ensureMessageOwnedByUser(messageId, authorId);

    await this.prisma.message.delete({
      where: { id: messageId },
    });

    return { success: true };
  }

  private buildWhere(query: ListMessagesQueryDto): Prisma.MessageWhereInput {
    const where: Prisma.MessageWhereInput = {};

    if (query.tag) {
      where.tag = query.tag;
    }

    if (query.authorId) {
      where.authorId = query.authorId;
    }

    if (query.from || query.to) {
      const createdAt: Prisma.DateTimeFilter = {};
      const from = query.from ? new Date(query.from) : undefined;
      const to = query.to ? new Date(query.to) : undefined;

      if (from && to && from > to) {
        throw new BadRequestException('The from date must be before the to date.');
      }

      if (from) {
        createdAt.gte = from;
      }

      if (to) {
        createdAt.lte = to;
      }

      where.createdAt = createdAt;
    }

    return where;
  }

  private async ensureMessageOwnedByUser(messageId: string, authorId: string): Promise<void> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { authorId: true },
    });

    if (!message) {
      throw new NotFoundException('Message not found.');
    }

    if (message.authorId !== authorId) {
      throw new ForbiddenException('Only the message author can modify this message.');
    }
  }

  private decodeCursor(cursor: string | undefined): { createdAt: Date; id: string } | null {
    if (!cursor) {
      return null;
    }

    try {
      const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
      const parsed = JSON.parse(decoded) as Partial<DecodedCursor>;

      if (!parsed.createdAt || !parsed.id || !uuidRegex.test(parsed.id)) {
        throw new Error('Cursor is missing fields.');
      }

      const createdAt = new Date(parsed.createdAt);

      if (Number.isNaN(createdAt.getTime())) {
        throw new Error('Cursor has invalid date.');
      }

      return {
        createdAt,
        id: parsed.id,
      };
    } catch {
      throw new BadRequestException('Invalid pagination cursor.');
    }
  }

  private encodeCursor(message: { createdAt: Date; id: string }): string {
    return Buffer.from(
      JSON.stringify({
        createdAt: message.createdAt.toISOString(),
        id: message.id,
      }),
      'utf8',
    ).toString('base64url');
  }
}
