# GHL Prime — Project Management (Backend)

Express + Prisma + PostgreSQL API for the Ops Command Center: projects, tasks, per-assignee time tracking, reporting, clients, subscriptions, and a per-user password vault.

Pairs with **[GHL-Prime-Project-Management-Frontend](https://github.com/vibeteamoctopidigital/GHL-Prime-Project-Management-Frontend)**.

---

## Tech stack

| | |
|---|---|
| Runtime | Node.js 20+ (developed on 24.x), ES modules |
| Framework | Express 4 |
| ORM | Prisma 6 (`prismaSchemaFolder`) |
| Database | PostgreSQL (Neon) |
| Auth | Stateless JWT (`jsonwebtoken`) + bcrypt |
| Validation | Zod |
| Hardening | helmet, cors, compression |
| Uploads | multer (in-memory → Postgres `bytea`) |
| Dev | tsx watch, TypeScript 5 |

---

## Getting started

```bash
# 1. install
pnpm install          # runs prisma generate via postinstall

# 2. configure
cp .env.example .env  # then fill in DATABASE_URL and JWT_SECRET

# 3. create the schema
pnpm prisma:deploy    # applies migrations to the database in .env

# 4. seed starter accounts (optional)
pnpm db:seed

# 5. run
pnpm dev              # http://localhost:4000
```

Health check: `GET /health` → `{ "status": "ok", ... }`

---

## Environment variables

Copy `.env.example` → `.env`. **Never commit `.env`** (it is gitignored — see SOP §7).

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | Long random string. Rotating it invalidates all sessions |
| `PORT` | | `4000` | |
| `NODE_ENV` | | `development` | `production` hides error stacks |
| `BACKEND_URL` | | `http://localhost:4000` | |
| `CORS_ORIGINS` | | `http://localhost:3000` | Comma-separated allow-list |
| `JWT_EXPIRES_IN` | | `60d` | Sessions last until explicit logout |
| `MAX_UPLOAD_BYTES` | | `10485760` | 10 MB upload cap |

---

## Scripts

| Command | Does |
|---|---|
| `pnpm dev` | Watch-mode dev server |
| `pnpm build` | Compile TypeScript → `dist/` |
| `pnpm start` | Run the compiled build |
| `pnpm prisma:generate` | Regenerate the Prisma client |
| `pnpm prisma:migrate` | Create + apply a migration (development) |
| `pnpm prisma:deploy` | Apply pending migrations (CI / production) |
| `pnpm prisma:studio` | Prisma Studio GUI |
| `pnpm db:seed` | Seed starter accounts |
| `pnpm db:clean` | Wipe application data |
| `pnpm lint` | ESLint |

---

## Project structure

```
src/
  app.ts                  Express app (helmet, cors, compression, routes)
  server.ts               Boot, keep-alive tuning, graceful shutdown
  config/                 env parsing, shared Prisma client
  middleware/             requireAuth, requireRole, validate, errorHandler
  routes/index.ts         Mounts every module under /api
  modules/<name>/         *.routes.ts (HTTP) + *.service.ts (data)
  utils/                  scope, cache, serialize, jwt, password, ApiError
prisma/
  schema/*.prisma         Split schema (prismaSchemaFolder)
  schema/migrations/      Migration history  ← see note below
  seed.ts / clean.ts
```

> **⚠️ Migrations live in `prisma/schema/migrations/`, not `prisma/migrations/`.**
> With `prismaSchemaFolder`, Prisma resolves migrations *inside* the schema folder. At the wrong path it silently reports *"No migration found"* **and** *"schema is up to date"* — against an empty database. Keep them where they are.

---

## API

All routes are mounted under `/api` and require `Authorization: Bearer <token>` unless noted.

| Prefix | Purpose |
|---|---|
| `/auth` | login, me, change/reset password *(login is public)* |
| `/users` | team directory, invite, pause, delete |
| `/projects` | CRUD, reorder, hours override |
| `/tasks` | CRUD + `GET /tasks/board` (batched board payload) |
| `/task-assignments` | assignees and per-assignee status |
| `/time-logs` | logged/billing hours |
| `/clients` · `/subscriptions` | CRM records |
| `/activity-logs` | audit trail |
| `/project-credentials` · `/project-documents` | per-project attachments |
| `/vault` | per-user password vault |
| `/files` | upload / stream (avatars, attachments) |
| `/stats` | dashboard + project aggregates |

### Roles

`super-admin` › `Admin` › `Lead` › `Member`

### Access scoping — important

Read endpoints are scoped **server-side** by `src/utils/scope.ts`:

| Role | Sees |
|---|---|
| `super-admin` / `Admin` | everything |
| `Lead` | themselves + Members they created (`managed_by_id`) |
| `Member` | themselves only |

The client sends no team parameter, so scope cannot be widened by tampering. An explicit `member_id` is **intersected** with the caller's scope, never merged over it. Cached aggregates include the scope in their cache key — omitting it would let one Lead's numbers be served to another.

**Any new read endpoint returning member-attributable data must apply this scope.**

---

## Notable behaviour

- **Board payload** — `GET /tasks/board` resolves tasks, assignees, time logs and reference docs in one query. Prefer it over chaining several requests.
- **Dates stay client-interpreted** — `log_date` is a date-only column; the UI renders it in the *browser's* timezone. Endpoints do row *selection* only; moving that arithmetic server-side shifts days for users in other timezones.
- **Completed + logged time is frozen** — a `Complete` task with booked hours cannot change status or be deleted, on every path.
- **Sole-assignee sync** — for single-assignee tasks, `Task.status` and `TaskAssignment.status` are kept identical in both directions. Multi-assignee tasks keep independent statuses by design.
- **Files are immutable** — `FileAsset` rows are only ever created/deleted, never updated, so `GET /files/:id` serves a permanent `ETag` and an immutable cache header.

---

## Contributing

Follow the **Octopi Git & GitHub Development SOP**:

- Branch: `<type>/<issue-number>-<short-description>` — e.g. `feat/42-invite-members`
- Commit: `<type>(<scope>): <description>` — e.g. `fix(tasks): guard status change after logging time`
- Types: `feat` `fix` `hotfix` `refactor` `chore` `docs` `test`
- **Never** push directly to `main`, `dev`, or `staging` — PR only, 1+ approval, author cannot self-approve
- Flow: feature branch → PR → `dev` → QA/staging → PR → `main`
- Never commit `.env`, keys, tokens, or database credentials

Before opening a PR:

```bash
pnpm lint
pnpm build
```

---

## Deployment

```bash
pnpm install --prod=false
pnpm prisma:deploy     # apply migrations BEFORE starting
pnpm build
pnpm start
```

Set every required variable from the table above in the host's environment. Behind a reverse proxy, note that `keepAliveTimeout` is deliberately set above typical proxy idle timeouts (nginx 75s / ALB 60s) to avoid intermittent 502s.
