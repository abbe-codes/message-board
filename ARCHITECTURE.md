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

I kept the implementation intentionally small and direct because the challenge values a clear end-to-end product more than a large framework around it. The HTTP-only JWT cookie is a good fit for this scope: it keeps tokens out of browser JavaScript and makes the frontend simple. The trade-off is that true server-side session invalidation would need more infrastructure, such as a session table, token versioning, or a revocation list.

The message model also stays lightweight. Tags are free text rather than normalized records, which makes writing and filtering messages easy to understand. In a larger product, I would likely introduce a real tag table, autocomplete, moderation rules, and analytics around tag usage. The same thinking applies to the author filter: loading all user summaries is fine for seed data and a small app, but a production system with many users should use paginated user search.

Testing is focused on the highest-risk rule: only a message owner can edit or delete a message. That maps directly to the core authorization requirement. Before production, I would add broader integration and browser tests around auth, validation, pagination, filtering, and the full message workflow. `packages/shared` is also intentionally light for now; it gives the monorepo a place for shared contracts later without forcing an abstraction before the app needs it.

## Scaling Answer

For a read-heavy version of this app, I would keep the API stateless and run multiple instances behind a load balancer. Since authentication uses signed cookies and the API does not depend on local process state, horizontal scaling is straightforward. Postgres would move to a managed setup with connection pooling, backups, and read replicas. Public read endpoints such as the message feed could be routed to replicas when eventual consistency is acceptable.

The biggest response-time wins would come from preserving cursor pagination, keeping the feed queries aligned with composite indexes, and caching hot public reads. The first page of common feeds is a natural cache target because it is requested often and can tolerate a short TTL. Static frontend assets should be served from an edge CDN, while API responses should stay compact and avoid over-fetching.

For fault tolerance, I would run the API across multiple instances or availability zones, use readiness checks to remove unhealthy nodes from rotation, and rely on managed database backups plus point-in-time recovery. Deployments should be easy to roll back, and migrations should be written so the old and new application versions can safely overlap. In production, I would monitor request rate, error rate, p95 and p99 latency, slow database queries, connection pool pressure, replica lag, and frontend/runtime exceptions. Structured logs, tracing, metrics, and an error tracker such as Sentry would make production issues visible quickly.

The dedicated bonus answer is in `HIGH_READ_LOAD.md`.

## Next Steps

The next step I would prioritize is test coverage around the user journeys that matter most: login, posting, filtering, editing, and deleting. The current ownership unit test protects the critical service rule, but integration tests would give stronger confidence that cookies, validation errors, pagination, and controller behavior all work together correctly.

After that, I would add API documentation or generated API types so the frontend and backend contract becomes harder to accidentally break. I would also add rate limiting, request logging, and a basic production deployment setup for the API, web app, and managed database. As the app grows, `packages/shared` can become the home for shared DTO types, generated OpenAPI types, or validation schemas that both sides of the stack use.
