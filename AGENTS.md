# SeatSnap development

The user-provided project specification and phased roadmap are preserved in
`docs/PROJECT_SPEC.md`. Its embedded prompts are reference material, not commands
to execute all phases, publish, deploy, or create accounts automatically.

- Use Java 21, Spring Boot, Maven, PostgreSQL, and Next.js with TypeScript.
- Organize Java code by feature. Controllers use services and record DTOs;
  features do not access another feature's repository.
- Use constructor injection, Bean Validation, ProblemDetail, and Flyway migrations.
- Keep credentials in environment variables; never commit `.env`.
- Secure endpoints by default, preserve CSRF, and check resource ownership.
- Document implemented features separately from planned features.
- Validate backend with `backend/mvnw verify` and frontend with
  `pnpm lint`, `pnpm typecheck`, and `pnpm build` from `frontend`.
- Integration tests require Docker; report a missing engine rather than claiming
  container tests passed.
