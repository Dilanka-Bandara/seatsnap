# AGENTS.md — SeatSnap

> This file is the instruction manual for AI coding agents (Codex) working in this repo.
> Read this whole file before writing any code. Follow it on every task.

---

## 1. What we are building

**SeatSnap** is an event ticketing and seat booking platform.

- **Organizers** create venues (seat layouts) and events with price tiers, publish them, see sales, and scan tickets at the door.
- **Users** browse and search events, pick seats on a **live seat map**, get a **10-minute hold** on their seats, pay with Stripe, and receive **QR-code e-tickets** by email.
- **Admins** manage users and see platform-wide stats.
- **AI assistant** (small feature): "Find me a jazz event this weekend under 5000 LKR" → recommends events.

**The core engineering challenge:** two users must **never** book the same seat, even when they click at the same millisecond, and payments must never be applied twice.

**Purpose of the project:** learning Spring Boot and full-stack development, and an internship/CV portfolio project.
Code must be **clean, layered, well-tested and commented where the "why" is not obvious**.

---

## 2. Tech stack (do not change without asking)

| Area | Choice |
|---|---|
| Language | Java 21 (LTS) — or 25 if every dependency supports it |
| Framework | Spring Boot (latest stable). If a needed library (springdoc, Spring AI, Redisson) is not yet compatible, use the latest Spring Boot 3.5.x instead and note it in the README |
| Build | Maven with Maven Wrapper (`./mvnw`) |
| API | Spring Web (REST), Bean Validation (Jakarta), springdoc-openapi (Swagger UI), `ProblemDetail` (RFC 9457) errors |
| Security | Spring Security, JWT (access 15 min + refresh 7 days, rotated, hashed in DB) in **httpOnly cookies**, Google OAuth2 login, BCrypt, roles `USER` / `ORGANIZER` / `ADMIN` |
| Database | PostgreSQL 16, Spring Data JPA / Hibernate, Flyway migrations |
| Mapping / boilerplate | MapStruct, Lombok (only `@Getter`, `@Setter`, `@Builder`, `@RequiredArgsConstructor`, `@Slf4j` — no `@Data` on entities) |
| Cache / locks | Redis — Spring Cache, Redisson distributed locks |
| Messaging | Apache Kafka (KRaft mode, no ZooKeeper), Spring for Apache Kafka, **transactional outbox** pattern |
| Real-time | Spring WebSocket + STOMP (seat map updates) |
| Scheduling | `@Scheduled` + ShedLock (so only one instance runs a job) |
| Payments | Stripe Java SDK, test mode — Checkout + webhooks |
| Email / QR | Spring Mail + Thymeleaf email templates (Mailpit locally, Resend SMTP in prod), ZXing for QR codes |
| AI | Spring AI (OpenAI or AWS Bedrock, chosen by profile/env) with tool calling |
| Rate limiting | Bucket4j + Redis |
| Testing | JUnit 5, Mockito, AssertJ, MockMvc, Testcontainers (Postgres, Redis, Kafka), ArchUnit |
| Observability | Spring Boot Actuator, Micrometer, Prometheus, Grafana, structured JSON logs with request ID (MDC) |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form + Zod, `@stomp/stompjs`, `html5-qrcode` |
| Containers | Docker (multi-stage, Spring Boot layered jars), Docker Compose |
| Reverse proxy | Caddy (automatic HTTPS) |
| CI/CD | GitHub Actions → GHCR → deploy to VPS over SSH |

---

## 3. Repository structure

```
seatsnap/
├── backend/                          # Spring Boot app (port 8080)
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/seatsnap/
│       │   ├── SeatSnapApplication.java
│       │   ├── common/               # config, exceptions, security, web, outbox, util
│       │   ├── auth/
│       │   ├── user/
│       │   ├── venue/
│       │   ├── event/
│       │   ├── seat/
│       │   ├── booking/
│       │   ├── payment/
│       │   ├── ticket/
│       │   ├── notification/
│       │   ├── assistant/            # Spring AI
│       │   └── admin/
│       ├── main/resources/
│       │   ├── application.yml
│       │   ├── application-dev.yml
│       │   ├── application-prod.yml
│       │   ├── db/migration/         # Flyway: V1__init.sql, V2__...
│       │   └── templates/email/      # Thymeleaf email templates
│       └── test/java/com/seatsnap/   # mirrors main packages
├── frontend/                         # Next.js app (port 3000)
├── infra/
│   ├── caddy/Caddyfile
│   ├── prometheus/prometheus.yml
│   ├── grafana/                      # provisioned dashboards
│   └── scripts/                      # backup, deploy
├── docs/
│   ├── LEARNING.md                   # written by the human
│   ├── TECH_STACK.md
│   └── architecture.md
├── .github/workflows/                # ci.yml, deploy.yml
├── docker-compose.yml                # local dev
├── docker-compose.prod.yml
├── .env.example
└── AGENTS.md
```

### Package layout inside each feature (package-by-feature)

```
booking/
├── BookingController.java     # HTTP only: validate, call service, return DTO
├── BookingService.java        # business logic + @Transactional
├── BookingRepository.java     # Spring Data JPA
├── Booking.java               # JPA entity
├── BookingStatus.java         # enum
├── dto/                       # request/response records
└── BookingMapper.java         # MapStruct
```

Rule: a feature may call another feature's **service**, never its **repository**.

---

## 4. Local services and ports

| Service | Port | Notes |
|---|---|---|
| frontend (Next.js) | 3000 | |
| backend (Spring Boot) | 8080 | Swagger at `/swagger-ui.html`, Actuator at `/actuator` |
| postgres | 5432 | |
| redis | 6379 | |
| kafka (KRaft) | 9092 | |
| kafka-ui | 8085 | browse topics and messages |
| mailpit | 1025 / 8025 | 8025 = inbox UI |
| prometheus | 9090 | |
| grafana | 3001 | |

---

## 5. Commands

```bash
docker compose up -d                       # start infra (postgres, redis, kafka, mailpit, ...)
cd backend && ./mvnw spring-boot:run       # run backend with dev profile (default in dev)
cd backend && ./mvnw test                  # unit tests
cd backend && ./mvnw verify                # unit + integration tests (Testcontainers)
cd frontend && pnpm install && pnpm dev    # run frontend
cd frontend && pnpm lint && pnpm typecheck
cd frontend && pnpm test:e2e               # Playwright
docker compose --profile app up --build    # run everything in containers
```

Keep these commands working. If you add one, add it here.

---

## 6. Data model (source of truth — Flyway SQL must match)

All tables: `id` (uuid), `created_at`, `updated_at` (via JPA auditing).
Money is stored as **integer cents** (`price_cents`) + `currency` — never `double`.

- **users**: email (unique), password_hash (nullable for Google users), full_name, role (`USER`|`ORGANIZER`|`ADMIN`), google_id (unique, nullable), enabled
- **refresh_tokens**: user_id, token_hash, expires_at, revoked_at
- **venues**: organizer_id, name, address, city, layout (jsonb: sections → rows → seat count)
- **events**: organizer_id, venue_id, title, description, category (`MUSIC`|`SPORTS`|`THEATRE`|`CONFERENCE`|`COMEDY`|`OTHER`), city, starts_at, ends_at, status (`DRAFT`|`PUBLISHED`|`CANCELLED`|`COMPLETED`), poster_url
- **price_tiers**: event_id, name (e.g. VIP), price_cents, currency
- **seats**: event_id, price_tier_id, section, row_label, seat_number, status (`AVAILABLE`|`HELD`|`BOOKED`), held_by_user_id, hold_expires_at, **version** (for optimistic locking). Unique on (event_id, section, row_label, seat_number)
- **bookings**: user_id, event_id, status (`PENDING_PAYMENT`|`CONFIRMED`|`CANCELLED`|`EXPIRED`), total_cents, currency, stripe_checkout_session_id, idempotency_key (unique), expires_at
- **booking_seats**: booking_id, seat_id — unique on seat_id where booking is active (enforced in service + DB partial unique index on active bookings)
- **tickets**: booking_id, seat_id, code (unique, random, unguessable), status (`VALID`|`USED`|`CANCELLED`), checked_in_at, checked_in_by
- **stripe_events**: stripe_event_id (unique), type, processed_at — webhook idempotency
- **outbox_events**: aggregate_type, aggregate_id, event_type, payload (jsonb), published_at (nullable)
- **shedlock**: standard ShedLock table

Every query on user-owned data **must** filter by the current user (or organizer ownership).

---

## 7. Coding rules (always follow)

### General
1. Small, focused changes. One task = one feature. Don't rewrite unrelated code.
2. Constructor injection only (`@RequiredArgsConstructor`, `final` fields). **No field `@Autowired`.**
3. DTOs are Java `record`s. **Never return JPA entities from controllers.**
4. Validate every input with Bean Validation (`@Valid`, `@NotBlank`, `@Size`, ...).
5. Errors: throw domain exceptions (`NotFoundException`, `ConflictException`, `ForbiddenException`); a single `@RestControllerAdvice` converts them to `ProblemDetail` JSON.
6. No secrets in code. Read from env vars via `@ConfigurationProperties` records with validation; add every new var to `.env.example`.
7. Add a short comment explaining **why** for any non-obvious decision (the human is learning).
8. Use `java.time` (`Instant`, `OffsetDateTime`) and store timestamps in UTC.

### JPA / database
- Schema changes **only** through new Flyway migrations (`V{n}__description.sql`). Never edit an applied migration. `spring.jpa.hibernate.ddl-auto=validate`.
- Relations are `LAZY` by default. Avoid N+1: use `@EntityGraph` or `JOIN FETCH` for list endpoints; keep `spring.jpa.open-in-view=false`.
- `@Transactional` goes on **service** methods, not controllers or repositories. Read methods use `@Transactional(readOnly = true)`.
- Paginate all list endpoints with `Pageable` (max page size 50).

### Concurrency and consistency (critical)
- Seat holds: acquire Redisson locks on all requested seat IDs (**sorted**, to avoid deadlocks) → in one transaction check every seat is `AVAILABLE` → set `HELD` with `hold_expires_at`. `@Version` on `Seat` gives optimistic locking as a second safety net; translate `OptimisticLockException` to HTTP 409.
- Anything that must happen after a DB change (Kafka messages) goes through the **outbox table** in the same transaction; a scheduled publisher sends it to Kafka.
- Kafka consumers and Stripe webhook handlers must be **idempotent**.
- Booking creation accepts an `Idempotency-Key` header.

### Security
- Every endpoint is secured by default; public endpoints are explicitly listed in `SecurityConfig`.
- Use `@PreAuthorize` for role/ownership checks.
- CORS only for the frontend origin, with credentials. CSRF protection enabled for cookie-authenticated state-changing requests (cookie-to-header token).

### Frontend (Next.js)
- Server Components by default; `"use client"` only when needed.
- Server data through TanStack Query hooks in `frontend/src/hooks/`. One API client `frontend/src/lib/api.ts` (`credentials: "include"`, attaches CSRF header, refreshes once on 401).
- Every page handles **loading**, **empty** and **error** states and works at 375px width.

### Tests
- Every service gets unit tests (Mockito). Every controller gets MockMvc tests (security included).
- Integration tests use **Testcontainers** (real Postgres/Redis/Kafka) — no H2.
- Never call real Stripe/LLM/SMTP in tests — mock them.
- Name tests `methodName_condition_expectedResult`.

### Git
- Conventional commits (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`).
- Before finishing a task: `./mvnw verify` and `pnpm lint && pnpm typecheck`. Fix failures.

---

## 8. Definition of done (every task)

- [ ] Builds; all tests pass.
- [ ] New env vars in `.env.example`; new migration if the schema changed.
- [ ] Swagger annotations on new endpoints.
- [ ] Loading / empty / error states for new UI.
- [ ] At the end of your reply, give the human a **"What I built & why"** summary:
  1. Files created/changed.
  2. The key Spring/Java concept used, explained in 3–5 simple sentences.
  3. How to test it manually (exact steps, URLs, curl or Swagger).

---

## 9. Build plan — step by step

> **Human:** go in order. Copy each **Prompt** into Codex. Check **Done when**.
> Then answer the **Learn** questions in your own words in `docs/LEARNING.md` (these are real interview questions).
> Commit after every step.

### Phase 0 — Prepare your machine (human, no AI)

Install: Git, JDK 21 (Eclipse Temurin), IntelliJ IDEA Community, Docker Desktop, Node.js LTS, pnpm, Codex, Stripe CLI.
Create an empty GitHub repo `seatsnap`, add this `AGENTS.md`, commit.

---

### Phase 1 — Foundation (week 1)

#### Step 1.1 — Project skeleton
**Prompt:**
> Read AGENTS.md. Create the repo structure from section 3. Generate the backend with Spring Initializr settings: Maven, Java 21, group `com.seatsnap`, dependencies: Web, Validation, Security, OAuth2 Client, OAuth2 Resource Server, Data JPA, PostgreSQL, Flyway, Data Redis, Cache, Kafka, WebSocket, Mail, Thymeleaf, Actuator, Lombok, Configuration Processor, Testcontainers. Add springdoc-openapi, MapStruct, Redisson, ShedLock, Bucket4j, ZXing, Stripe, Micrometer Prometheus. Create profiles `dev` and `prod`. Create the Next.js app in `frontend/` with Tailwind and shadcn/ui. Add `.gitignore`, `.editorconfig`, `.env.example`, README.

**Done when:** `./mvnw verify` passes; `pnpm dev` shows the Next.js page.
**Learn:** What does Spring Boot auto-configuration do? What is a "starter" dependency? What are profiles?

#### Step 1.2 — Local infrastructure (Docker Compose)
**Prompt:**
> Create `docker-compose.yml` with postgres 16 (volume, healthcheck), redis (healthcheck), kafka in KRaft mode (single node, healthcheck), kafka-ui, mailpit. Use ports from section 4 and credentials from `.env`. Add `backend` and `frontend` services under a `app` compose profile (Dockerfiles come later). Comment every service.

**Done when:** `docker compose up -d` → all healthy; kafka-ui on :8085, Mailpit on :8025.
**Learn:** Container vs image? Why does Kafka need a broker? What is a volume?

#### Step 1.3 — Backend skeleton
**Prompt:**
> In `backend/`: `@ConfigurationProperties` records for app settings with validation; JSON logging with a request-ID filter putting `requestId` into MDC; global `@RestControllerAdvice` returning `ProblemDetail`; domain exceptions (`NotFoundException`, `ConflictException`, `ForbiddenException`, `BadRequestException`); CORS config; Swagger UI; Actuator exposing `health`, `info`, `prometheus`; JPA auditing for `created_at/updated_at` via a `BaseEntity` with UUID id. Temporarily permit all requests in security.

**Done when:** `/actuator/health` shows db + redis UP; Swagger loads.
**Learn:** What is a bean and the IoC container? What does `@RestControllerAdvice` do? Why constructor injection?

#### Step 1.4 — Database schema, entities and seed data
**Prompt:**
> Write Flyway `V1__init.sql` for the full data model in section 6 (indexes on all foreign keys, on `seats(event_id, status)`, on `events(status, starts_at)`, on `events(city, category)`). Create JPA entities, enums and repositories for every table (`@Version` on `Seat`). Add a `dev`-profile-only seed (`V2__seed_dev.sql` via a separate Flyway location for dev): 1 admin, 2 organizers, 3 users (password `Demo1234!`), 2 venues, 6 published events with price tiers and generated seats.

**Done when:** app starts with `ddl-auto=validate`; seed data visible in the DB.
**Learn:** Why Flyway instead of `ddl-auto=update`? What is LAZY vs EAGER loading? What does `@Version` do?

#### Step 1.5 — Authentication and authorization
**Prompt:**
> Build `auth` and `user` features: register, login, logout, refresh, `GET /api/auth/me`, Google OAuth2 login (create or link user). BCrypt passwords. Issue JWT access token (15 min, signed with HS256 secret from env) and refresh token (7 days, random, stored hashed, rotated) in httpOnly cookies (`Secure` in prod, `SameSite=Lax`). Configure the resource server to read the JWT from the cookie (custom `BearerTokenResolver`). `SecurityConfig` with explicit public endpoints, method security, CSRF with cookie-to-header token. Roles USER/ORGANIZER/ADMIN; "become organizer" endpoint. MockMvc + Testcontainers tests.

**Done when:** register/login/me/refresh/logout work in Swagger; protected endpoint returns 401 without login, 403 with wrong role.
**Learn:** Explain the Spring Security filter chain. Authentication vs authorization? Why httpOnly cookies? What is CSRF?

#### Step 1.6 — Frontend shell and auth pages
**Prompt:**
> In `frontend/`: TanStack Query provider, `lib/api.ts` (credentials include, CSRF header, refresh once on 401), theme toggle. Pages: home (`/`) with hero + upcoming events placeholder, `/login`, `/register` (React Hook Form + Zod), "Continue with Google", "Try demo user" and "Try demo organizer" buttons. Layout with navbar (Events, My Tickets, Organizer dashboard if role allows, user menu). Middleware protecting `/tickets`, `/organizer/*`, `/admin/*`.

**Done when:** login as demo user/organizer works; navbar changes by role.
**Learn:** How does the browser send cookies cross-origin? What does the Next.js middleware do?

#### Step 1.7 — Dockerize backend and frontend
**Prompt:**
> Multi-stage Dockerfile for backend: build with Maven (cache `~/.m2`), extract Spring Boot **layered jar**, run on a JRE-only image as non-root user with container-aware JVM flags (`-XX:MaxRAMPercentage=75`). Multi-stage Dockerfile for frontend (Next.js standalone output). `.dockerignore` files. Wire into the `app` compose profile with `depends_on` health conditions.

**Done when:** `docker compose --profile app up --build` runs the whole system.
**Learn:** Why are layered jars faster to rebuild? Why run as non-root? Why JRE instead of JDK in the final image?

---

### Phase 2 — Venues, events and browsing (week 2)

#### Step 2.1 — Venues and events (organizer side)
**Prompt:**
> Organizer-only endpoints: CRUD venues (layout JSON validated), CRUD events in `DRAFT`, price tiers, assign seat sections to tiers, `POST /events/{id}/publish` which generates all `seats` rows from the venue layout in one transaction (batch inserts). Organizers can only touch their own venues/events (`@PreAuthorize` + ownership check). Frontend `/organizer`: venues list + form with a simple layout builder (sections, rows, seats per row), event form, publish button.

**Done when:** an organizer creates a venue and publishes an event; seats exist in the DB.
**Learn:** How do JPA batch inserts work? How did you enforce ownership?

#### Step 2.2 — Public browsing, search and caching
**Prompt:**
> Public endpoints: `GET /api/events` (filters: city, category, date range, text search on title; pagination; sort by date) and `GET /api/events/{id}` (with venue, tiers, min price, available seat count). Use Spring Data `Specification` for dynamic filters. Fix N+1 with `@EntityGraph`. Cache event details in Redis with `@Cacheable` (5 min TTL) and evict on update. Frontend: `/events` grid with filter bar + infinite scroll, `/events/[id]` detail page (server-rendered).

**Done when:** filtering works; SQL logs show no N+1; second request served from cache.
**Learn:** What is the N+1 problem? How does `@Cacheable` work (proxies)? When is caching dangerous?

#### Step 2.3 — Seat map
**Prompt:**
> `GET /api/events/{id}/seats` returns seats grouped by section/row with status and tier price. Frontend seat map component: grid per section, colours by tier, states available/held/booked/selected, select up to 6 seats, sticky summary with total price. Mobile friendly (pinch/scroll).

**Done when:** seat map renders seed events; selection and total work.

---

### Phase 3 — Booking and concurrency (week 3)

#### Step 3.1 — Seat holds (the core)
**Prompt:**
> `POST /api/events/{id}/holds` with seat IDs + `Idempotency-Key` header: acquire Redisson locks on sorted seat IDs (wait 2s, lease 10s), then in one `@Transactional` method verify all seats `AVAILABLE`, set `HELD` with `held_by_user_id` and `hold_expires_at = now + 10 min`, create a `PENDING_PAYMENT` booking + `booking_seats`. If any seat is taken → 409 with the conflicting seat IDs. Translate `OptimisticLockException` → 409. `DELETE /api/bookings/{id}` releases a hold. Frontend: "Reserve seats" → booking page with countdown timer.

**Done when:** holding works; holding a held seat returns 409.
**Learn:** Optimistic vs pessimistic locking — which did you use where and why? Why sort lock keys? What is `@Transactional` propagation?

#### Step 3.2 — Hold expiry job
**Prompt:**
> `@Scheduled` job every 30s (protected by ShedLock) that finds expired `PENDING_PAYMENT` bookings, marks them `EXPIRED` and releases their seats in batches. Expose a Micrometer counter `seatsnap.holds.expired`.

**Done when:** a hold disappears after expiry (set expiry to 1 min in dev to test).
**Learn:** Why ShedLock if we run more than one backend instance?

#### Step 3.3 — Prove it: concurrency test
**Prompt:**
> Testcontainers integration test: 50 threads (use an `ExecutorService` + `CountDownLatch` so they start together) try to hold the same seat for 50 different users. Assert exactly 1 success and 49 conflicts, and the seat is held by exactly one booking. Add a second test with overlapping multi-seat requests.

**Done when:** the test passes reliably 10 runs in a row.
**Learn:** Explain to an interviewer how you guaranteed no double booking.

#### Step 3.4 — Live seat map (WebSocket)
**Prompt:**
> Configure STOMP over WebSocket at `/ws` with the simple broker, authenticated via the JWT cookie in a `ChannelInterceptor`. After a hold/release/booking commits (`@TransactionalEventListener(phase = AFTER_COMMIT)`), broadcast seat status changes to `/topic/events/{id}/seats`. Frontend subscribes with `@stomp/stompjs` and updates the seat map instantly.

**Done when:** two browser windows: holding a seat in one turns it grey in the other immediately.
**Learn:** Why publish only AFTER_COMMIT? WebSocket vs polling? What changes when you scale to 2 instances (external broker)?

---

### Phase 4 — Payments, events and tickets (week 4)

#### Step 4.1 — Stripe payment
**Prompt:**
> `POST /api/bookings/{id}/checkout` creates a Stripe Checkout Session (line items per seat tier, `client_reference_id` = booking ID, expires with the hold). `POST /api/payments/webhook`: verify the Stripe signature using the raw body, store `stripe_event_id` (skip duplicates), on `checkout.session.completed` mark booking `CONFIRMED` and seats `BOOKED` in one transaction; on `checkout.session.expired` release the hold. Frontend: pay button → Stripe → success page that polls booking status.

**Done when:** test card `4242 4242 4242 4242` confirms the booking (`stripe listen --forward-to localhost:8080/api/payments/webhook`).
**Learn:** Why trust the webhook and not the success redirect? What is idempotency and how did you implement it?

#### Step 4.2 — Transactional outbox + Kafka
**Prompt:**
> When a booking is confirmed or cancelled, insert an `outbox_events` row in the same transaction (`BookingConfirmed`, `BookingCancelled` JSON payloads). A scheduled `OutboxPublisher` (ShedLock) sends unpublished rows to Kafka topics `booking.confirmed` / `booking.cancelled` (key = booking ID) and sets `published_at`. Configure JSON serialization, topic creation via `NewTopic` beans, and a dead-letter topic with retry for consumers.

**Done when:** confirming a booking shows a message in kafka-ui.
**Learn:** What problem does the outbox pattern solve (dual write)? What is a Kafka partition, consumer group and offset? Why key by booking ID?

#### Step 4.3 — Tickets and emails (Kafka consumers)
**Prompt:**
> Consumer group `ticketing`: on `booking.confirmed`, create one ticket per seat with a random unguessable code (idempotent: skip if tickets exist). Consumer group `notifications`: send a Thymeleaf HTML email with event details and QR codes (ZXing, embedded images) via Spring Mail; on `booking.cancelled` send a cancellation email. Frontend `/tickets`: list of upcoming/past tickets, ticket page with large QR code.

**Done when:** after payment, the email with QR codes appears in Mailpit and tickets show in the app.
**Learn:** Why two consumer groups for the same topic? What happens if the email consumer crashes mid-message?

#### Step 4.4 — Check-in scanner
**Prompt:**
> `POST /api/events/{id}/check-in` (organizer of that event only) with a ticket code: valid → mark `USED` with time and scanner; already used → 409 with the first check-in time; wrong event → 400. Frontend `/organizer/events/[id]/scan` uses `html5-qrcode` with the phone camera, big green/red result screen and a live checked-in counter.

**Done when:** scanning a QR from Mailpit on your phone checks in once; second scan is rejected.

#### Step 4.5 — Organizer and admin dashboards
**Prompt:**
> Organizer: per-event stats (seats sold per tier, revenue, check-in rate, sales per day) using JPQL aggregate queries / projections. Admin: users table (search, change role, disable), platform totals. Frontend with shadcn tables and Recharts. Admin pages and endpoints restricted to ADMIN.

**Done when:** dashboards show correct numbers after a few test bookings.
**Learn:** What are Spring Data projections and why use them for reports?

---

### Phase 5 — AI assistant, quality and observability (week 5)

#### Step 5.1 — AI event assistant (Spring AI)
**Prompt:**
> `assistant` feature with Spring AI `ChatClient` (provider chosen by env). Register a **tool** `searchEvents(city, category, dateFrom, dateTo, maxPriceCents)` that calls `EventService`. `POST /api/assistant/chat` streams the answer (SSE, `Flux<String>`) and returns referenced event IDs. System prompt restricts answers to SeatSnap events. Rate limit 20 requests/hour/user. Frontend: chat widget on `/events` that shows event cards for recommendations.

**Done when:** "music events in Colombo next weekend under 5000" returns real seeded events.
**Learn:** What is tool/function calling? How does Spring AI abstract providers?

#### Step 5.2 — Test coverage and architecture rules
**Prompt:**
> Add missing unit and MockMvc tests; JaCoCo report with ≥ 70% line coverage on services; ArchUnit tests enforcing: controllers don't use repositories, no cross-feature repository access, no field injection. Playwright E2E: login → pick seats → hold → (mock checkout) → ticket visible.

**Done when:** `./mvnw verify` passes with coverage report; E2E passes.
**Learn:** Unit vs slice (`@WebMvcTest`) vs integration (`@SpringBootTest`) tests?

#### Step 5.3 — Security hardening
**Prompt:**
> Bucket4j + Redis rate limits: login (5/min/IP), holds (10/min/user), assistant. Security headers. Account lockout after repeated failed logins. Validate ticket codes and UUIDs strictly. Write an OWASP Top 10 checklist in `docs/architecture.md` showing how each risk is handled.

**Done when:** spamming login returns 429; checklist written.

#### Step 5.4 — Observability
**Prompt:**
> Add Prometheus + Grafana to docker-compose with provisioned datasource and a dashboard: HTTP request rate/latency/errors, JVM memory/GC, HikariCP pool, Kafka consumer lag, custom metrics (`seatsnap.bookings.confirmed`, `seatsnap.holds.expired`, `seatsnap.checkins`). Add Micrometer tracing with trace IDs in logs.

**Done when:** Grafana at :3001 shows live charts while you click around.
**Learn:** Logs vs metrics vs traces. What does HikariCP do?

---

### Phase 6 — Ship it (week 6)

#### Step 6.1 — Production compose
**Prompt:**
> `docker-compose.prod.yml`: images from GHCR, `prod` profile, Caddy (`infra/caddy/Caddyfile`: domain → frontend, `/api`, `/ws`, `/actuator/health` → backend; block other actuator endpoints publicly), restart policies, memory limits, Kafka/Postgres/Redis not exposed publicly, daily Postgres backup script to S3/R2.

**Done when:** works locally with `localhost`.

#### Step 6.2 — CI
**Prompt:**
> `.github/workflows/ci.yml`: Java 21 setup with Maven cache, `./mvnw verify` (Testcontainers works on GitHub runners), frontend lint/typecheck/build, Playwright. On `main`: build and push both images to GHCR tagged with commit SHA and `latest`.

**Done when:** PRs show green checks; images in GitHub Packages.

#### Step 6.3 — Deploy to VPS
**Prompt:**
> `.github/workflows/deploy.yml`: SSH to the server, pull new images, `docker compose up -d`, wait for `/actuator/health` = UP, fail otherwise. Write `docs/deploy.md` (server setup, firewall, DNS, `.env`, rollback by SHA tag, Stripe webhook endpoint setup in dashboard).

**Done when:** pushing to `main` updates the live site.

#### Step 6.4 — Portfolio polish
**Prompt:**
> README: one-line pitch, live demo link + demo user/organizer credentials + Stripe test card, screenshots/GIF placeholders, Mermaid architecture diagram, **"How double booking is prevented"** section with a sequence diagram, tech stack table, how to run locally in 3 commands, testing, deployment. `docs/architecture.md`: sequence diagrams for login, hold → pay → webhook → outbox → Kafka → ticket/email, check-in.

**Done when:** a stranger understands and runs the project from the README alone.

---

## 10. How the human works with you (Codex)

- One step at a time. If a step is big, split it (e.g. "Step 1.5 part A: register + login only").
- After each step the human may ask *"Explain this like I'm new to Spring"* — answer simply, with an analogy and a tiny example.
- If something is unclear or conflicts with this file, **ask before guessing**.
- If you change an architectural decision, update this file in the same commit.
