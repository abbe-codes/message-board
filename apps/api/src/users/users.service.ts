import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, type User } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { type PublicUser, type UserSummary, toPublicUser, toUserSummary } from './public-user';

interface CreateUserInput {
  email: string;
  displayName: string;
  passwordHash: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserInput): Promise<PublicUser> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: this.normalizeEmail(input.email),
          displayName: input.displayName.trim(),
          passwordHash: input.passwordHash,
        },
      });

      return toPublicUser(user);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('A user with this email already exists.');
      }

      throw error;
    }
  }

  async findPublicById(id: string): Promise<PublicUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user ? toPublicUser(user) : null;
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        email: this.normalizeEmail(email),
      },
    });
  }

  async listSummaries(): Promise<{ items: UserSummary[] }> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        displayName: true,
      },
      orderBy: [{ displayName: 'asc' }, { id: 'asc' }],
    });

    return {
      items: users.map(toUserSummary),
    };
  }

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
