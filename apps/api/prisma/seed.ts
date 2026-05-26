import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { logger } from '@sde-challenge/shared';

const prisma = new PrismaClient();

const userIds = {
  ada: '57c73320-6f27-4210-b215-f051fd16a518',
  grace: '2ad1d171-41cc-462d-a05e-df951cf6a525',
  alan: '6ab54536-2bb1-4145-a04c-d5e1655f1d7b',
} as const;

const seedUsers = [
  {
    id: userIds.ada,
    email: 'ada@example.com',
    displayName: 'Ada Lovelace',
  },
  {
    id: userIds.grace,
    email: 'grace@example.com',
    displayName: 'Grace Hopper',
  },
  {
    id: userIds.alan,
    email: 'alan@example.com',
    displayName: 'Alan Turing',
  },
];

const seedMessages = [
  {
    id: '6ad5c035-1677-4c2c-9edb-21e4d8d58bb1',
    authorId: userIds.ada,
    tag: 'idea',
    body: 'What if tags were lightweight enough to create while writing, but still useful for filtering later?',
    createdAt: new Date('2026-05-10T09:30:00.000Z'),
  },
  {
    id: '773fc29a-6218-482b-bb17-df5d409c3b9c',
    authorId: userIds.grace,
    tag: 'work',
    body: 'Cursor pagination keeps the feed stable even when new messages arrive during scrolling.',
    createdAt: new Date('2026-05-10T11:45:00.000Z'),
  },
  {
    id: '3b6d4eca-3972-4f7a-97f0-2b5606b57bde',
    authorId: userIds.alan,
    tag: 'question',
    body: 'Should the first page default to all tags, or remember the last filter a user selected?',
    createdAt: new Date('2026-05-11T08:15:00.000Z'),
  },
  {
    id: 'c950a480-28ee-4b17-87ff-ea29a9c3b936',
    authorId: userIds.ada,
    tag: 'general',
    body: 'Keeping the model small makes the ownership and filtering rules easier to reason about.',
    createdAt: new Date('2026-05-11T14:05:00.000Z'),
  },
  {
    id: 'b99453fa-df1d-4a8b-aed4-8f2c638556b3',
    authorId: userIds.grace,
    tag: 'release',
    body: 'A health endpoint plus a readiness check gives us a clean deployment contract from day one.',
    createdAt: new Date('2026-05-12T16:20:00.000Z'),
  },
];

async function main() {
  const passwordHash = await hash('Password123!', 12);

  for (const user of seedUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        displayName: user.displayName,
        passwordHash,
      },
      create: {
        ...user,
        passwordHash,
      },
    });
  }

  for (const message of seedMessages) {
    await prisma.message.upsert({
      where: { id: message.id },
      update: {
        body: message.body,
        tag: message.tag,
        authorId: message.authorId,
        createdAt: message.createdAt,
      },
      create: message,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    logger.error('Prisma seed failed', error);
    await prisma.$disconnect();
    process.exit(1);
  });
