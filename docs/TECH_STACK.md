# Technology baseline

- Java target 21; Spring Boot 3.5.16; Maven Wrapper.
- PostgreSQL 16, Flyway, JPA; Redis and Redisson core.
- Spring Security, OAuth2/JWT libraries; CSRF and restricted CORS configured.
- Kafka, WebSocket, Mail/Thymeleaf, ShedLock, Stripe, ZXing, Bucket4j dependencies.
- MapStruct annotation processing and Lombok; Prometheus registry; springdoc 2.9.1.
- Next.js 16, React 19, TypeScript, Tailwind 4, shadcn-compatible UI primitives.
- TanStack Query, React Hook Form/Zod, STOMP and QR scanner dependencies.
- JUnit 5, Mockito, MockMvc, Testcontainers, ArchUnit dependencies.

See the lockfile and Maven POM for exact versions. Planned capabilities are not
implemented merely because their libraries are present. Spring AI, dashboards,
CI/CD, and production deployment are deferred to their roadmap milestones.
