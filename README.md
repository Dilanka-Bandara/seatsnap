# SeatSnap

An event ticketing and seat booking platform for Sri Lanka, built to learn Spring
Boot and full-stack engineering.

**Current milestone: project foundation.** This is not a finished booking system.
The original requirements and six-phase roadmap are in [docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md).

## Included

- Java 21 target, Spring Boot 3.5.16, official Maven Wrapper, feature packages,
  dev/prod configuration, and dependencies for the planned backend.
- Public `/api/status`, CSRF token endpoint, exact-origin CORS, request IDs,
  protected-by-default routes, Actuator, and development-only Swagger UI.
- Five MockMvc security tests and a Docker-required application integration test.
- Next.js App Router, TypeScript, Tailwind, shadcn-compatible button/configuration,
  TanStack Query, responsive landing page, and real backend connectivity status.
- PostgreSQL 16, Redis, Kafka KRaft, Kafka UI, and Mailpit Compose definitions.
- Backend layered-jar and frontend standalone Dockerfiles.

Not implemented yet: schema/entities/seed data, authentication, event management,
seat holds, Stripe, ticket generation, WebSocket updates, outbox consumers, AI,
dashboards, production infrastructure, and CI/CD. Feature folders reserve the
structure; installing a dependency does not implement its feature.

## Run locally (PowerShell)

Install JDK 21, Node.js 22 LTS, pnpm, and Docker Desktop with Linux containers.
The current machine has JDK 22, which can compile the Java 21 target; the container
build uses Java 21. Open Docker Desktop and wait until its engine is ready.

From the repository root:

```powershell
Copy-Item .env.example .env  # first run only; don't overwrite personal settings
docker compose up -d
cd backend
.\mvnw.cmd spring-boot:run
```

In a second terminal from the repository root:

```powershell
cd frontend
pnpm install
pnpm dev
```

On macOS/Linux, use `cp .env.example .env` and `./mvnw` instead.
The dev backend reads the root `.env`; the frontend defaults to localhost:8080.
To change it, copy `frontend/.env.example` to `frontend/.env.local` and restart.
If ports are occupied, set `POSTGRES_PORT` and the matching `DATABASE_URL` port,
and/or `REDIS_PORT` in `.env`. On this machine the generated local `.env` uses
PostgreSQL port **5434** and Redis port **6380** to avoid existing services.
Port 8080 was also occupied, so the local `.env` sets `SERVER_PORT=8081` and
`frontend/.env.local` points to `http://localhost:8081`. Use that port for the
backend URLs below on this machine.

| Service | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend status | http://localhost:8080/api/status |
| Swagger (dev only) | http://localhost:8080/swagger-ui.html |
| Infrastructure health | http://localhost:8080/actuator/health |
| Kafka UI | http://localhost:8085 |
| Mailpit | http://localhost:8025 |

The landing page can run independently: it shows a retry action while the backend
is offline. Status describes the implementation stage; Actuator checks services.
There are no demo accounts yet. Prometheus/Grafana provisioning comes later.

To use application containers: `docker compose --profile app up --build`.
This Compose file is for local use only, with ports bound to localhost.

## Verify

```powershell
cd backend
.\mvnw.cmd test                  # MockMvc; no external infrastructure needed
.\mvnw.cmd verify                # includes PostgreSQL/Redis Testcontainers; Docker required
cd ../frontend
pnpm lint
pnpm typecheck
pnpm build
pnpm exec playwright install chromium   # first run
pnpm test:e2e                           # desktop + 375px mobile smoke checks
```

The integration test deliberately fails if Docker is unavailable instead of
silently skipping. Playwright covers navigation, mobile overflow, and API
connection/error states. The future booking/payment flow is not tested yet.

If this Windows machine reports certificate-chain errors, use its existing
trusted root store for the current terminal only (TLS verification stays on):

```powershell
$env:NODE_USE_SYSTEM_CA = '1'
$env:MAVEN_OPTS = '-Djavax.net.ssl.trustStoreType=Windows-ROOT -Djavax.net.ssl.trustStore=NONE'
```

Manual checks: open the frontend, use the Explore link, then check the backend
status at the bottom. Open Swagger and run `GET /api/status` and `GET /api/csrf`.
`GET /api/bookings` should return 401 while authentication is unimplemented.

## Why Spring Boot 3.5?

This foundation uses the specification's allowed 3.5 fallback, paired with the
Spring AI 1.1 compatibility path, rather than claiming to use the newest Boot.
[Spring AI's compatibility table](https://github.com/spring-projects/spring-ai)
maps 1.1.x to Boot 3.5.x. AI provider starters are intentionally deferred until
that feature is implemented. Before production, reassess the supported versions
and migrate the whole dependency set together.

## Learning

Spring Boot auto-configuration creates common application components based on the
libraries on the classpath and your settings. A starter brings together libraries
for a capability, such as web endpoints or database access. Profiles select
environment-specific configuration: `dev` reads local settings and exposes
Swagger, while `prod` requires explicit configuration and enables JSON logs.

Next: implement the database model and seed data, then authentication, following
the roadmap. See [architecture notes](docs/architecture.md) before implementing
seat allocation and Stripe Checkout.
