# Architecture

## Structure

This project is an npm workspace monorepo:

- `apps/api` contains the NestJS API, Prisma schema, migrations, seed script, auth, messages, users, health checks, validation, and normalized errors.
- `apps/web` contains the NextJS App Router frontend, auth provider, login/register pages, message page, API clients, and UI components.
- `packages/shared` is reserved for shared contracts when the API and frontend need stricter type sharing.
- `docker-compose.yml` runs local Postgres.

## Data Model

The schema intentionally stays small:

- `User` stores email, display name, password hash, and timestamps.
- `Message` stores body, tag, author, and timestamps.

Messages belong to users with cascade delete. Message indexes support common feed access patterns:

- newest-first pagination by `createdAt` and `id`
- tag filtering with newest-first pagination
- author filtering with newest-first pagination

## Backend Decisions

NestJS is organized by feature modules:

- `AuthModule` owns registration, login, logout, current-user lookup, cookie issuing, and JWT validation.
- `MessagesModule` owns listing, creation, updates, deletes, cursor pagination, and ownership checks.
- `UsersModule` exposes public user summaries for the frontend author filter.
- `PrismaModule` centralizes database access.

Authorization is enforced in the service layer for message updates and deletes. Controllers still require authentication for protected routes, but ownership lives beside the write operation so another controller or job cannot accidentally bypass it.

Validation uses NestJS DTOs and a global `ValidationPipe` with `whitelist`, `transform`, and `forbidNonWhitelisted`. API errors go through a global exception filter so the frontend receives one predictable error shape.

Auth uses an HTTP-only JWT cookie. This keeps tokens out of browser JavaScript while still making the NextJS client simple through `credentials: include`.

## Frontend Decisions

The message page is public. Anonymous users can read and filter the feed, while the composer prompts them to log in.

The frontend keeps API calls in small client modules:

- `auth-api.ts`
- `messages-api.ts`
- `users-api.ts`
- `api-client.ts`

Message UI is split into focused components:

- `MessageComposer` handles authenticated posting.
- `MessageFilters` handles draft filters and apply/reset behavior.
- `MessageItem` handles display plus inline owner edit/delete controls.

The feed uses cursor pagination and an `IntersectionObserver` sentinel. That avoids offset drift when newer messages arrive and maps cleanly to the backend query.

## Trade-Offs

- JWT cookies are simple for this challenge, but server-side session invalidation would require a session table or token revocation strategy.
- The author filter currently fetches all user summaries. That is fine for demo data, but large deployments should use user search or paginated users.
- Tags are free text. This is fast to build and flexible, but a production system may want normalized tag records, autocomplete, and moderation.
- The frontend has focused manual smoke coverage and the API has one meaningful unit test. More tests would be added around auth flows, validation, pagination, and UI behavior before production.
- `packages/shared` is intentionally light. It can later hold generated OpenAPI types, shared DTO schemas, or Zod contracts if the project grows.

## Scaling Answer

For higher traffic, the first scaling moves are straightforward:

- Keep the API stateless so horizontal scaling works behind a load balancer.
- Use managed Postgres with connection pooling, backups, and read replicas if read volume grows.
- Preserve cursor pagination for stable feed performance.
- Add caching for public feed pages or common filters, with short TTLs.
- Add rate limiting on auth and message creation.
- Add observability: structured logs, request IDs, metrics, traces, and error reporting.
- Move secrets into a real secret manager.
- Add CI to run install, typecheck, tests, builds, and migration checks on every pull request.

For very large feeds, introduce a search/indexing layer for tag and text queries, archive older messages, and consider event-driven fanout if the product evolves into personalized timelines.

The dedicated bonus answer is in `HIGH_READ_LOAD.md`.

## Next Steps

- Add end-to-end tests for login, posting, filtering, editing, and deleting.
- Add integration tests for auth cookies, validation errors, and pagination.
- Add OpenAPI documentation or generated API types.
- Add rate limiting and request logging middleware.
- Add deployment configuration for the API, web app, and managed database.
- Expand `packages/shared` once the API contract needs stricter cross-app reuse.
