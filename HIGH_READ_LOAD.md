# High Read Load Bonus

If the app needed to support thousands of read requests per second, I would scale it as a mostly stateless read-heavy system.

## How I Would Scale It

- Run multiple API instances behind a load balancer. The API is already stateless because auth uses signed cookies, so horizontal scaling is straightforward.
- Use managed Postgres with connection pooling, tuned indexes, automated backups, and read replicas.
- Route read-heavy endpoints such as `GET /messages` and `GET /users` to replicas when the data freshness requirements allow it.
- Keep cursor pagination as the default feed strategy because it performs better and stays more stable than large offset pagination.
- Add a cache layer, such as Redis, for hot public feed pages and common filter combinations.
- Put the NextJS app behind an edge CDN for static assets and cacheable public responses.

## Minimal Response Time

- Keep the feed query index-friendly with composite indexes that match the filters and sort order.
- Cache the first page of popular feeds with a short TTL and invalidate or refresh after writes.
- Use response compression and small DTOs so list responses stay cheap over the network.
- Add database connection pooling to avoid connection churn under spikes.
- Use separate read and write paths if traffic grows enough that writes should not compete with public reads.
- Measure p95 and p99 latency, not only averages, and tune based on real traces.

## Fault Tolerance

- Run at least two API instances across availability zones or failure domains.
- Use managed Postgres backups, point-in-time recovery, and replicas.
- Add health and readiness checks so unhealthy API instances are removed from rotation.
- Add graceful shutdown so in-flight requests finish during deploys.
- Use retries with timeouts for transient infrastructure failures, but avoid retry storms.
- Keep deployment rollback simple with immutable builds and database migrations that are backward compatible.

## Monitoring Performance And Errors

- Emit structured logs with request IDs, user IDs when available, route names, status codes, and latency.
- Track API metrics: request rate, error rate, p50/p95/p99 latency, saturation, and slow endpoints.
- Track database metrics: query latency, connection pool usage, locks, replica lag, and slow queries.
- Add distributed tracing around request handlers, Prisma calls, cache calls, and external services.
- Send exceptions and frontend runtime errors to an error tracker such as Sentry.
- Alert on symptoms users feel: elevated 5xx rate, high p95 latency, failed login spikes, database saturation, and replica lag.
