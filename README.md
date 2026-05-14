# SDE Full Stack Challenge

Small full-stack message board using NestJS, Prisma, Postgres, and NextJS.

## What Is Included

- Public message feed with tag, author, and date filters
- Cursor-based infinite scroll
- Register, login, logout, and current-user auth
- HTTP-only JWT cookie session strategy
- Authenticated message create
- Owner-only message edit and delete
- DTO validation, including 240 character message limit
- Normalized API error responses
- Local Postgres through Docker Compose
- One focused backend unit test for message ownership

## Requirements

- Node.js 22 or newer
- npm 10 or newer
- Docker Desktop

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Start Postgres:

```bash
npm run db:up
```

Create the database schema and seed demo data:

```bash
npm run api:prisma:migrate -- --name init
npm run api:prisma:seed
```

The seed script creates these users:

```txt
ada@example.com
grace@example.com
alan@example.com
```

Each seeded user uses the password `Password123!`.

## Run Locally

Run the API in one terminal:

```bash
npm run api:dev
```

Run the web app in another terminal:

```bash
npm run web:dev
```

Open the app:

```txt
http://localhost:3000/messages
```

The API runs on:

```txt
http://localhost:4000
```

## Test And Verify

Run lint:

```bash
npm run lint
```

Run the API unit test:

```bash
npm run test -w @sde-challenge/api
```

Run type checks:

```bash
npm run api:typecheck
npm run web:typecheck
```

Run production builds:

```bash
npm run api:build
npm run web:build
```

Run all workspace tests that exist:

```bash
npm run test
```

## Environment

The main local variables are in `.env.example`:

```txt
API_PORT=4000
WEB_PORT=3000
DATABASE_URL=postgresql://challenge_user:challenge_password@localhost:5432/challenge_messages?schema=public
JWT_SECRET=replace-with-a-long-random-secret-for-local-development
JWT_EXPIRES_IN=7d
AUTH_COOKIE_NAME=sde_challenge_session
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAME_SITE=lax
CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## API Surface

- `GET /health` checks process liveness
- `GET /health/ready` checks database readiness
- `POST /auth/register` creates a user and sets the auth cookie
- `POST /auth/login` verifies credentials and sets the auth cookie
- `POST /auth/logout` clears the auth cookie
- `GET /auth/me` returns the authenticated user
- `GET /users` lists user summaries for filtering
- `GET /messages` lists messages with optional `tag`, `authorId`, `from`, `to`, `limit`, and `cursor`
- `POST /messages` creates an authenticated user's message
- `PATCH /messages/:id` edits a message owned by the authenticated user
- `DELETE /messages/:id` deletes a message owned by the authenticated user

## Error Shape

API errors use this normalized response shape:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed.",
  "details": [
    {
      "field": "body",
      "code": "maxLength",
      "message": "body must be shorter than or equal to 240 characters"
    }
  ],
  "path": "/messages",
  "timestamp": "2026-05-14T10:00:00.000Z"
}
```

## Workspace

- `apps/api` is the NestJS backend
- `apps/web` is the NextJS frontend
- `packages/shared` is reserved for shared contracts

See `ARCHITECTURE.md` for design decisions, trade-offs, scaling notes, and next steps.
