# High Read Load Bonus

If the app needed to support thousands of read requests per second, I would treat it as a mostly stateless, read-heavy system. The API is already a good starting point for that because it does not depend on local process state; authentication is based on signed cookies, and the message feed can be read independently by many clients.

## How I Would Scale It

I would run several API instances behind a load balancer and keep those instances horizontally scalable. The database would move to managed Postgres with connection pooling, tuned indexes, automated backups, and read replicas. The main write database would remain the source of truth, while read-heavy endpoints such as `GET /messages` and `GET /users` could be served from replicas when the product can tolerate a small amount of replication lag.

The feed should continue using cursor pagination instead of offset pagination. Cursor pagination keeps requests predictable as the table grows and avoids the performance problems that show up when clients request deep offset pages. For hot public reads, I would add a cache layer such as Redis. Common first-page feed results and popular filter combinations are good cache candidates because many users are likely to request the same data repeatedly.

The web app should also sit behind an edge CDN. Static assets can be cached aggressively, while API responses can use shorter caching rules based on how fresh the feed needs to be.

## Minimal Response Time

The fastest request is the one that does the least work. I would keep the message list query aligned with the database indexes, return compact DTOs, and avoid loading fields the UI does not need. The first page of popular feeds can be cached with a short TTL, then refreshed or invalidated after writes depending on the freshness requirements.

Connection pooling is important because thousands of read requests should not create thousands of direct database connections. I would also measure p95 and p99 latency rather than relying on averages, because tail latency is usually where users feel the system slowing down. If read traffic becomes much larger than write traffic, I would separate read and write paths more clearly so public feed reads do not compete with message creation or auth writes.

## Fault Tolerance

For fault tolerance, I would run more than one API instance and spread them across availability zones or failure domains when the infrastructure supports it. Health and readiness checks should remove bad instances from the load balancer before users notice them. The API should also support graceful shutdown so deploys do not kill in-flight requests.

On the database side, I would rely on managed backups, point-in-time recovery, and replicas. Deployments should use immutable builds and simple rollback steps. Database migrations should be backward compatible whenever possible, so old and new application versions can safely run at the same time during a rolling deploy.

Retries can help with short infrastructure failures, but they need timeouts and limits. Otherwise, retries can make an outage worse by multiplying load when the database or cache is already struggling.

## Monitoring Performance And Errors

In production, I would add structured logs, metrics, traces, and error reporting from the beginning. Every request should include enough context to debug it later, such as a request ID, route name, status code, latency, and user ID when one is available.

The core API metrics would be request rate, error rate, p50/p95/p99 latency, and saturation. For the database, I would watch query latency, slow queries, connection pool usage, locks, and replica lag. For the frontend, I would send runtime errors to an error tracker such as Sentry and track basic user-facing performance signals.

Alerts should focus on symptoms that users feel: elevated 5xx errors, high p95 latency, login failures, database saturation, slow queries, and replica lag. Dashboards are useful, but alerts should be tied to clear action so the team can respond quickly without noise.
