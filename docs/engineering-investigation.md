# Engineering Investigation

**Investigation Date:** August 17, 2026

**Repositories Investigated:**

- **Backend:** `poker/backoffice/backoffice-be`, `backgammon/backgammon-be`
- **Frontend:** `poker/backoffice/backoffice-fe`, `backgammon/backgammon-fe-new`

**Purpose:** Extract engineering approaches and development conventions from existing repositories to inform design decisions for a new B2B SaaS starter kit.

---

## Repository Overview

### Poker Backoffice Backend (`backoffice-be`)

**Type:** Modular multi-application repository (single repository hosting multiple NestJS applications)

**Purpose:** Backend for poker backoffice administration with multiple entry points:

- `backoffice-api`: Admin HTTP API
- `business-center-api`: Business center HTTP API
- `worker`: Background job processing

**Technology Stack:**

- NestJS 11.1.28
- TypeScript 6.0.3
- TypeORM 1.0.0 + MySQL (mysql2 3.22.4)
- Vitest 4.1.10 for testing
- Zod 4.4.3 + nestjs-zod for validation
- Pino 10.3.1 for logging
- RabbitMQ (amqplib 2.0.1) for messaging

**Architecture Philosophy:** Clean layered architecture with explicit dependency flow: `apps → application → core → secondary (storage)`

**Node.js:** 22.8.0 (Volta), 24.14.1 (.nvmrc)  
**Package Manager:** PNPM 11.4.0

---

### Backgammon Backend (`backgammon-be`)

**Type:** Modular multi-application repository with domain-driven design

**Purpose:** Real-time backgammon game backend with three applications:

- `game-server`: WebSocket game server (raw `ws`, not Nest HTTP)
- `backoffice-api`: Admin REST API
- `worker`: BullMQ background workers

**Technology Stack:**

- NestJS 11.1.29
- TypeScript 5.9.3
- MongoDB (Mongoose 8.24.1)
- Redis (ioredis 6.0.0) + BullMQ 5.80.2
- Jest 30.4.2 for testing
- Zod 4.4.3 + nestjs-zod for validation
- Pino 10.3.1 for logging
- WebSocket (ws 8.21.3)

**Architecture Philosophy:** Hexagonal/Ports-and-Adapters with pure domain layer. Explicit separation between domains, application use-cases, core services, and infrastructure adapters.

**Node.js:** 22.8.0 (Volta), 24.18.0 (.nvmrc)  
**Package Manager:** PNPM 11.10.0

---

### Poker Backoffice Frontend (`backoffice-fe`)

**Type:** Single-page application

**Purpose:** Admin UI for poker game management

**Technology Stack:**

- React 19.2.7
- Vite 8.1.5
- TypeScript 6.0.3
- Redux Toolkit 2.12.0 + RTK Query
- React Router 7.16.0
- Tailwind CSS 4.3.3
- Radix UI components (shadcn/ui pattern)
- Vitest 4.1.10 for testing

**Architecture:** Feature-based structure with FSD-like patterns (app/features/shared/pages)

**Node.js:** >=22.0.0  
**Package Manager:** PNPM 11.4.0

---

### Backgammon Frontend (`backgammon-fe-new`)

**Type:** Single-page application with embedded game SDK

**Purpose:** Player-facing backgammon game interface with widget/SDK support

**Technology Stack:**

- React 19.2.8
- Vite 8.2.1
- TypeScript 6.0.2
- Redux Toolkit 2.12.0
- React Router 8.3.0
- Tailwind CSS 4.3.3
- Phaser 4.2.1 (game engine)
- i18next for internationalization

**Architecture:** Feature-based structure with dedicated game rendering layer (game/renderer, game/runtime, game/rules) and SDK package for iframe embedding

**Node.js:** >=22.0.0  
**Package Manager:** PNPM 11.10.0

---

## Repository Structure

### Poker Backend Structure

```
src/
├── apps/                      # Entry points (multiple applications)
│   ├── backoffice/           # Backoffice API application
│   │   ├── dto/              # Zod schemas + DTOs per feature
│   │   ├── [feature]/        # Controllers + API services per feature
│   │   └── api.module.ts     # App entry module
│   ├── business-center/      # Business Center API
│   ├── worker/               # Worker application
│   └── common/               # Shared app infrastructure
├── modules/
│   ├── application/          # Use-case orchestration layer (optional)
│   ├── core/                 # Business logic services
│   │   └── [domain]/         # Domain-specific core services
│   └── secondary/            # Infrastructure adapters
│       └── storages/         # Data access layer (TypeORM wrappers)
├── common/
│   ├── models/               # TypeORM entities
│   ├── types/                # Shared TypeScript types
│   ├── decorators/           # Custom decorators
│   ├── guards/               # Auth guards
│   └── ...
├── config/
│   └── schemas/              # Zod config validation schemas
└── main.ts                    # Application bootstrap
```

**Key Observations:**

- **Multi-app monolith:** Single repository with multiple NestJS applications selected via `APP_TYPE` environment variable
- **Layered architecture:** Clear separation of concerns with dependency direction
- **DTOs co-located with apps:** Validation schemas live close to HTTP entry points
- **Storage abstraction:** Explicit storage services wrap TypeORM repositories
- **Optional application layer:** Used only for complex orchestrations

---

### Backgammon Backend Structure

```
src/
├── apps/                      # Process entry points
│   ├── game-server/          # WebSocket game server
│   │   ├── protocol/         # Wire protocol (schemas, mappers, serialization)
│   │   ├── routing/          # WS routing infrastructure
│   │   ├── handlers/         # WS route handler implementations
│   │   └── delivery/         # Pod-local socket delivery
│   ├── backoffice-api/       # REST admin API
│   ├── worker/               # BullMQ workers
│   └── common/               # Shared app infrastructure
├── modules/
│   ├── application/          # Use-case orchestration
│   ├── core/                 # Runtime services + ports
│   │   └── shared/           # Shared ports, event bus
│   └── secondary/            # Infrastructure implementations
│       ├── infrastructure/   # Redis, Mongo stores
│       └── persistence/      # Persistence implementations
├── domains/                   # Pure domain logic (framework-free)
│   ├── game/                 # Game aggregate (event-driven)
│   ├── board/                # Board model
│   ├── dice/                 # Dice model
│   ├── events/               # Domain events
│   └── errors/               # Domain errors
├── common/
│   └── libs/                 # Reusable libraries
└── main.ts                    # Application bootstrap
```

**Key Observations:**

- **Hexagonal architecture:** Pure domain layer with explicit ports and adapters
- **Event-driven domain:** `GameAggregate` emits domain events, handlers react
- **Multi-app process:** One codebase, three distinct processes
- **Wire protocol separation:** Protocol schemas isolated in transport layer
- **WebSocket headless:** Game-server runs raw WS server, not Nest HTTP
- **Outbox pattern:** MongoDB outbox → BullMQ relay → worker processors
- **Pure domains:** No framework imports in `domains/`

---

### Frontend Structures

**Poker Frontend:**

```
src/
├── app/                       # App core (providers, styles)
├── features/                  # Feature modules
│   └── [feature]/
│       ├── api/              # RTK Query API slices
│       ├── components/
│       ├── hooks/
│       └── types/
├── shared/
│   ├── ui/                   # Reusable UI components (shadcn/ui)
│   ├── libs/                 # Shared libraries
│   └── utils/
└── pages/                     # Route pages
```

**Backgammon Frontend:**

```
src/
├── app/                       # App core + embed entry
├── features/                  # Feature modules
├── game/                      # Game rendering layer (Phaser)
│   ├── phaser/               # Phaser game scenes
│   ├── renderer/
│   ├── runtime/
│   └── rules/
├── sdk/                       # Widget SDK for iframe embedding
├── shared/
│   └── ui/                   # Reusable UI components
└── main.tsx
```

**Key Observations:**

- **Feature-based architecture:** Features encapsulate API, components, hooks
- **Backgammon unique:** Game engine separation, SDK for widget embedding
- **Both:** shadcn/ui pattern (Radix UI + Tailwind)

---

## Package Management

### Common Patterns

All repositories use:

- **PNPM** as package manager with explicit `packageManager` field
- **Volta** for Node.js version management (+ `.nvmrc`)
- **PNPM workspace** (`pnpm-workspace.yaml`) even for single-app repos
- **Consistent scripts:** `dev`, `build`, `lint`, `lint:fix`, `test`, `prepare` (Husky)

### Key Dependencies

**Backends:**

- **Validation:** Zod + nestjs-zod
- **Logging:** Pino + pino-pretty
- **Testing:** Vitest (poker) / Jest (backgammon)
- **Linting:** ESLint flat config + typescript-eslint
- **Formatting:** Prettier
- **Git Hooks:** Husky + lint-staged + commitlint

**Frontends:**

- **State:** Redux Toolkit + RTK Query (poker uses codegen from OpenAPI)
- **UI:** Radix UI + Tailwind CSS + class-variance-authority
- **Forms:** React Hook Form + Zod validation
- **Testing:** Vitest + React Testing Library + MSW

### Version Management

**Poker repos:** PNPM 11.4.0, Node 22.8.0 (Volta), inconsistent .nvmrc (24.14.1)  
**Backgammon repos:** PNPM 11.10.0, Node 22.8.0 (Volta), .nvmrc (24.18.0 BE, 24.22.0 FE)

**Observation:** Version specifications are inconsistent between `engines`, `volta`, and `.nvmrc` across repos.

---

## TypeScript

### Backend Configuration

Both backends use similar TypeScript patterns:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2021",
    "strictNullChecks": true,
    "noImplicitAny": false, // ⚠️ Disabled
    "strictBindCallApply": false, // ⚠️ Disabled
    "skipLibCheck": true,
    "baseUrl": "./",
    "paths": {
      /* layer-specific aliases */
    }
  }
}
```

**Strictness:** Partial strict mode (strictNullChecks enabled, but other strict checks disabled)

**Path Aliases:**

- Poker: `@/common/*`, `@/config/*`, `@/core/*`, `@/secondary/*`, `@/application/*`
- Backgammon: Same + `@/domains/*`, `@/game-server/*`, `@test/*`

**Key Observation:** Path aliases enforce architectural boundaries (easier to spot violations)

---

### Frontend Configuration

Both frontends use modern Vite/ESM configuration:

```json
{
  "compilerOptions": {
    "target": "es2023",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true, // ✅ Full strict mode
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true, // ✅ Array access safety
    "noEmit": true
  }
}
```

**Strictness:** Full strict mode enabled (more strict than backends)

**Path Aliases:**

- Both: `@/*` for all src imports
- Backgammon additional: `@/game/runtime`, `@/game/renderer`, `@/game/rules`

---

_Document continues in next part..._

## Backend Architecture

### Poker Backend: Layered Clean Architecture

**Pattern:** Apps → Application (optional) → Core → Secondary

**Documented in:** `ARCHITECTURE.md` (7,107 bytes) - explicit request flow examples

**Layer Responsibilities:**

1. **Apps Layer** (`src/apps/`):
   - Entry points (controllers, API services)
   - DTOs with Zod schemas (co-located in `apps/[app]/dto/`)
   - Request validation, response serialization
   - **Must NOT:** Contain business logic

2. **Application Layer** (`src/modules/application/`) - **OPTIONAL**:
   - Use-case orchestration for complex scenarios
   - Coordinates multiple core services
   - Applies contextual defaults
   - **When to use:** Multi-service orchestration, scenario-specific logic
   - **When to skip:** Simple CRUD, single-entity operations

3. **Core Layer** (`src/modules/core/`):
   - Business logic services (e.g., `PlayersService`)
   - **Must NOT:** Access TypeORM repositories directly
   - Must use storage services

4. **Storage Layer** (`src/modules/secondary/storages/`):
   - Wraps TypeORM repositories
   - Provides focused data access methods
   - **Only layer** allowed to use `@InjectRepository`

**Example:**

```typescript
// Core service
@Injectable()
export class PlayersService {
  constructor(private readonly userAccountStorage: UserAccountStorageService) {}

  async searchPlayers(criteria: PlayerSearchCriteria) {
    return this.userAccountStorage.search(criteria);
  }
}

// Storage service
@Injectable()
export class UserAccountStorageService {
  constructor(@InjectRepository(UserAccountEntity) private readonly repository) {}

  async search(filters) {
    return this.repository.createQueryBuilder('user')...
  }
}
```

**Key Principle:** Dependency direction is strict and one-way. Lower layers never depend on upper layers.

---

### Backgammon Backend: Hexagonal Architecture + Event-Driven Domain

**Pattern:** Apps (adapters) → Application (use-cases) → Core (ports) → Domains (pure) ← Secondary (infrastructure)

**Documented in:** `ARCHITECTURE.md` (18,745 bytes) - extremely comprehensive with diagrams

**Multi-Application Runtime:**

| App              | Bootstrap                          | Mode                           | Responsibility           |
| ---------------- | ---------------------------------- | ------------------------------ | ------------------------ |
| `game-server`    | `apps/game-server/bootstrap.ts`    | Application context (headless) | WebSocket gameplay       |
| `backoffice-api` | `apps/backoffice-api/bootstrap.ts` | HTTP app                       | Admin REST + integration |
| `worker`         | `apps/worker/bootstrap.ts`         | Application context            | BullMQ workers           |

All apps share `buildRootAppModule` for common infrastructure (Config, Mongo, Redis, Persistence).

**Layer Responsibilities:**

1. **Apps Layer** (`src/apps/`):
   - Transport adapters (WebSocket, HTTP, BullMQ)
   - Wire protocol (`apps/game-server/protocol/`)
   - **Game-server unique:** Raw `ws` server, not Nest HTTP
   - **Must NOT:** Contain game rules

2. **Application Layer** (`src/modules/application/`):
   - Use-case orchestration (auth, presence, finance, lobby, query)
   - Coordinates domain/core with persistence/accounting
   - **Must NOT:** Know about wire protocol or DB details

3. **Core Layer** (`src/modules/core/`):
   - Game runtime services (`GameCommandService`)
   - Ports (interfaces for persistence, accounting)
   - Event bus (`InProcessEventBus`)
   - **Must NOT:** Import from secondary layer

4. **Domains Layer** (`src/domains/`) - **UNIQUE TO THIS REPO**:
   - Pure domain logic (NO FRAMEWORK IMPORTS)
   - Event-driven aggregate (`GameAggregate`)
   - Domain models (Board, Dice, Player)
   - **Must NOT:** Import NestJS, Mongoose, Redis, etc.

5. **Secondary Layer** (`src/modules/secondary/`):
   - Infrastructure implementations (Redis stores, Mongo stores)
   - External service clients (Accounting)
   - Implements ports from core layer

**Event-Driven Domain Pattern:**

```typescript
// GameAggregate command method
rollDice(playerId: string): GameDomainEvent[] {
  // 1. Guard state + turn ownership
  if (this.currentPlayerId !== playerId) throw new NotYourTurnError();

  // 2. Execute pure domain logic (no I/O)
  const [d1, d2] = this.random.rollTwoDice();
  this.dice = new Dice(d1, d2);

  // 3. Return events
  return [{ type: GameEventType.DICE_ROLLED, playerId, dice: [d1, d2] }];
}

// Caller dispatches events
const events = gameAggregate.rollDice(playerId);
eventBus.dispatch(events); // → BroadcastHandler → PersistenceHandler → ...
```

**WebSocket Architecture:**

- Raw `ws` server (not Nest HTTP)
- Custom routing via `WsHandlerRegistry`
- Tolerant inbound parsing, strict outbound validation
- Pod-local delivery + Redis Pub/Sub for cross-pod broadcasts

**Persistence Model:**

- **Redis:** Hot state (game snapshots, sessions, locks, pub/sub, BullMQ queues)
- **MongoDB:** Durable facts (audit events, hand records, outbox, projections)

**Outbox Pattern:** MongoDB outbox → OutboxRelayRunner → BullMQ → Worker processors

---

## Frontend Architecture

### Poker Frontend: Feature-Based + RTK Query Codegen

**Structure:** app / features / shared / pages

**State Management:**

- Redux Toolkit + RTK Query
- **Unique:** RTK Query API auto-generated from OpenAPI spec
- Script: `pnpm run backoffice:generate` (uses `@rtk-query/codegen-openapi`)

**API Layer:**

- Backend serves OpenAPI spec at `/swagger-json`
- Codegen generates RTK Query endpoints + TypeScript types
- Auto-generated hooks (e.g., `useGetPlayersQuery`)

**UI Components:**

- shadcn/ui pattern (Radix UI + Tailwind + class-variance-authority)
- Components in `shared/ui/`

**Forms:** React Hook Form + Zod validation

---

### Backgammon Frontend: Feature-Based + Game Engine + SDK

**Structure:** app / features / game / sdk / shared

**Unique Features:**

1. **Game Engine Separation:** Phaser 4.2.1 in `game/` layer, isolated from React
2. **Widget SDK:** Dual build (main app + IIFE SDK for iframe embedding)
3. **Internationalization:** i18next + react-i18next

**Game Layer:**

- `game/phaser/`: Phaser scenes
- `game/renderer/`: Rendering primitives
- `game/runtime/`: Game state management (separate from Redux)
- `game/rules/`: Client-side game rules

**SDK Architecture:**

- Build targets: `build` (main app), `build:sdk` (IIFE library)
- iframe communication via postMessage
- Allows embedding game as widget in other sites

---

## API Contracts & Validation

### Validation Strategy (All Repos)

**Pattern:** Zod schemas as single source of truth

**Backends:**

- Zod schemas → `createZodDto` (nestjs-zod) → DTO classes
- DTOs used in controllers for validation + OpenAPI generation
- OpenAPI served at `/swagger` (with basic auth)

**Example:**

```typescript
export const PlayersSearchInputSchema = PaginationInputSchema.extend({
  id: z.string().trim().min(1).optional(),
  username: z.string().trim().min(1).optional(),
  // ...
})

export class PlayersSearchInputDto extends createZodDto(PlayersSearchInputSchema) {}
```

**Naming Convention:**

- `.input.ts`: Request DTOs
- `.output.ts`: Response DTOs
- `.param.ts`: Path parameters

**WebSocket Protocol (Backgammon):**

- Inbound/outbound schemas in `apps/game-server/protocol/`
- Mappers separate wire format from domain
- **Tolerant inbound** (accepts unknown fields), **strict outbound** (validates)
- Contract tests verify protocol

**Frontends:**

- **Poker:** Types auto-generated from OpenAPI (no manual types)
- **Backgammon:** Types manually maintained (no codegen)
- Both: Zod for form validation (separate from API contracts)

**No Shared Types:** Frontends and backends maintain independent types, connected via OpenAPI spec (poker) or manually (backgammon)

---

## Database & Persistence

### Poker Backend: TypeORM + MySQL

**ORM:** TypeORM 1.0.0  
**Database:** MySQL (mysql2 3.22.4)

**Entities:**

- Location: `src/common/models/`
- Pattern: `@Entity('table_name')` with explicit column names (snake_case)
- Naming: `[Entity]Entity` classes, `[entity].entity.ts` files

**Storage Layer Pattern:**

- Direct repository access ONLY in `UserAccountStorageService`, etc.
- Core services ONLY use storage services
- Transaction support via optional `EntityManager` parameter

**Query Patterns:**

- Simple: `repository.findOne()`, `repository.find()`
- Complex: `QueryBuilder`
- Custom `PaginationHelper` for pagination

**Observations:**

- No visible migrations (likely manual or external)
- Storage abstraction strictly enforced architecturally

---

### Backgammon Backend: MongoDB + Redis

**Databases:**

- MongoDB (Mongoose 8.24.1) for durable facts
- Redis (ioredis 6.0.0) for hot state

**Persistence Strategy:**

| Concern             | Storage     |
| ------------------- | ----------- |
| Live game snapshots | Redis (hot) |
| Player sessions     | Redis       |
| Distributed locks   | Redis       |
| Pub/Sub             | Redis       |
| BullMQ queues       | Redis       |
| Audit events        | MongoDB     |
| Hand records        | MongoDB     |
| Outbox              | MongoDB     |
| Projections         | MongoDB     |

**Port-Based Persistence:**

```typescript
// Port (interface in core)
export interface GameStatePersistencePort {
  load(gameId: string): Promise<GameSnapshot | null>
  save(gameId: string, snapshot: GameSnapshot): Promise<void>
}

// Implementation (in secondary)
@Injectable()
export class GameStatePersistenceService implements GameStatePersistencePort {
  // Uses Redis store
}
```

**Outbox Pattern:**

1. Domain event → PersistenceHandler inserts MongoDB outbox row
2. OutboxRelayRunner polls outbox
3. Relay adds job to BullMQ
4. Worker processor handles job
5. DeadLetterService records exhausted jobs

---

## Redis / Messaging / Background Jobs

### Poker Backend: RabbitMQ

**Messaging:** RabbitMQ (amqplib 2.0.1)

**Worker Application:**

- Separate process (`APP_TYPE=worker`)
- Consumes from RabbitMQ queues
- No visible job scheduling, retry, or DLQ patterns

**No Redis:** No caching layer visible

---

### Backgammon Backend: Redis + BullMQ

**Redis Usage:**

- Primary hot storage (not just cache)
- Distributed locks for game commands
- Pub/Sub for cross-pod broadcasts
- BullMQ queue storage

**BullMQ Queues:**

| Queue               | Jobs                           | Processor                 |
| ------------------- | ------------------------------ | ------------------------- |
| `bg.settlement`     | `handPayout`, `buyoutRecovery` | `SettlementProcessor`     |
| `bg.history`        | `writeGameHistory`             | `HistoryProcessor`        |
| `bg.reporting`      | `hourlyRollup`                 | `ReportingProcessor`      |
| `bg.reconciliation` | `reconcileSessions`            | `ReconciliationProcessor` |

**Worker Architecture:**

- Outbox relay (polls MongoDB, adds to BullMQ)
- Processors handle jobs with retry/backoff
- Dead letter queue for exhausted jobs
- Configuration: retry, backoff, concurrency from Zod schemas

---

## Authentication & Authorization

### Poker Backend: JWT + RBAC

**Authentication:** JWT (passport-jwt)

**Flow:**

1. User logs in → API issues JWT
2. Client sends JWT in Authorization header
3. `JwtAuthGuard` validates token
4. `@CurrentUser` decorator extracts user

**Authorization:** Role-based (RBAC) via `RolesGuard`

---

### Backgammon Backend: Dual Auth

**Player Authentication:** External Accounting service (JWT)

```
Client → game-server → LoginUseCase → AccountingService.authenticate() → External API
```

**Backoffice Authentication:** Local (bcrypt + JWT)

**Guards:**

- `JwtAuthGuard`: Backoffice JWT
- `SharedSecretGuard`: Service-to-service auth

**Session Management:** Redis `SessionStore` for WebSocket connections

---

## Testing

### Test Frameworks

- **Poker Backend:** Vitest 4.1.10
- **Backgammon Backend:** Jest 30.4.2
- **Both Frontends:** Vitest 4.1.10

### Test Structure (Backends)

**Three Test Types:**

1. **Unit tests:** `.spec.ts` (co-located with source)
2. **Integration tests:** `.integration.spec.ts` (co-located)
3. **E2E tests:** In `test/e2e/` folder

**Poker Backend (Vitest Projects):**

```typescript
projects: [
  {name: 'unit', include: ['src/**/*.spec.ts'], exclude: ['*.integration.*', '*.e2e.*']},
  {name: 'integration', include: ['src/**/*.integration.spec.ts'], pool: 'forks'},
  {name: 'e2e', include: ['test/e2e/**/*.e2e.spec.ts'], pool: 'forks'},
]
```

**Key Configuration:**

- `oxc: false` + `unplugin-swc` for NestJS decorator metadata
- Integration/E2E tests run serially (avoid race conditions)
- testcontainers for DB containers (commented in config)

**Backgammon Backend:**

- Domain layer has coverage thresholds (90% functions/lines/statements, 70% branches)
- Protocol contract tests
- WebSocket transport tests
- Separate Jest configs per test type

**Frontend Testing:**

- React Testing Library for component testing
- MSW (Mock Service Worker) for API mocking
- Tests co-located with components

**Key Observation:** Co-located tests (tests live next to source files) across all repos

---

## Linting

### ESLint Configuration (All Repos)

**Format:** Flat config (`eslint.config.mts`)

**Common Plugins:**

- `typescript-eslint`: TypeScript rules
- `eslint-plugin-unused-imports`: Remove unused imports
- `eslint-plugin-simple-import-sort`: Auto-sort imports
- `eslint-plugin-sonarjs`: Code quality rules
- `eslint-plugin-unicorn`: Modern JS patterns
- `eslint-config-prettier`: Disable conflicting rules

**Common Rules:**

```javascript
{
  eqeqeq: ['error', 'always'],
  'no-console': 'warn',
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-floating-promises': 'error', // backends only
  '@typescript-eslint/consistent-type-imports': 'error',
  'unused-imports/no-unused-imports': 'error',
  'simple-import-sort/imports': ['error', { groups: [...] }],
}
```

**Type Safety Enforcement:**

- `no-explicit-any`: ERROR (all repos)
- `no-floating-promises`: ERROR (backends), OFF (frontends - React-friendly)
- `consistent-type-imports`: ERROR (all repos)

**Import Organization:**

**Poker Backend (UNIQUE):**

- Import order enforces architectural layers:

```javascript
groups: [
  ['^node:'], // Node builtins
  ['^@?\\w'], // External packages
  ['^@/application/'], // Application layer
  ['^@/core/'], // Core layer
  ['^@/secondary/'], // Secondary layer
  ['^@/common/'], // Common
  // ...
]
```

**Other Repos:** All `@/*` imports grouped together (no layer enforcement)

---

## Formatting

### Prettier Configuration

**All repos use Prettier** (`.prettierrc` or `.prettierrc.js`)

**Style Variations:**

| Repo          | Semi  | Quote  | Trailing Comma | Tab Width | Print Width |
| ------------- | ----- | ------ | -------------- | --------- | ----------- |
| Poker BE      | false | single | none           | 4         | 120         |
| Backgammon BE | false | single | es5            | 2         | 120         |
| Poker FE      | true  | single | none           | 4         | -           |
| Backgammon FE | true  | single | es5            | 4         | 120         |

**lint-staged Integration:**

All repos: `.lintstagedrc.json`

```json
{
  "*.{ts,js}": ["eslint", "prettier --write"]
}
```

**Pre-commit Flow:**

1. Git commit → Husky triggers pre-commit hook
2. lint-staged runs ESLint + Prettier on staged files
3. If pass, commit proceeds; if fail, commit blocked

---

## Git & Commit Conventions

### Husky + lint-staged + commitlint

**All repos use:**

- Husky for Git hooks
- lint-staged for staged files only
- commitlint for commit message validation

**commitlint Configuration:**

**Allowed Types (Backends):**
`feat`, `fix`, `hotfix`, `refactor`, `build`, `chore`

**Allowed Types (Frontends):**
`feat`, `fix`, `hotfix`, `refactor`, `build`, `chore`, `docs`, `test`

**Key Observation:**

- `hotfix` added (not in standard Conventional Commits)
- `subject-case` disabled (allows any case)

**Example Commits:**

```
feat: add player search endpoint
fix: handle null visibility groups
refactor: extract storage service
hotfix: fix game crash on disconnect
```

---

## CI/CD

### Backend CI/CD (Staging Only)

**CI Provider:** GitHub Actions

**Workflow:** `.github/workflows/staging.yml`

**Process:**

1. Push to `staging` branch triggers workflow
2. GitHub Actions SSHes to VPS
3. Runs `scripts/deploy-staging.sh` on VPS
4. Script pulls code, builds, restarts services

**MISSING:**

- No CI build verification
- No CI test execution
- No CI lint checks
- No Docker image building
- No production deployment workflow

**Frontend CI/CD:** Not visible (likely manual or separate platform)

---

## Environment & Configuration

### Backend Configuration (Both)

**Pattern:** Type-safe, Zod-validated configuration

**Structure:**

- `config/schemas/`: Zod schemas per concern
- Environment variables validated at startup
- Invalid config throws error (fail-fast)

**Example:**

```typescript
export const RedisConfigSchema = z.object({
  host: z.string(),
  port: z.number().int().positive(),
  password: z.string().optional(),
})

export type RedisConfig = z.infer<typeof RedisConfigSchema>
```

**Environment Variables:**

- `APP_TYPE`: Select application (backoffice_api / game-server / worker)
- `NODE_ENV`: Node environment
- Database/Redis connection strings
- External service URLs
- API keys/secrets

**Frontend Configuration:**

- Vite environment variables (`VITE_*` prefix)
- `.env` files for local development
- No visible Zod validation

---

## Docker & Infrastructure

### Docker

**Backends:**

- `Dockerfile` present (both)
- `docker-compose.yaml` present (both)
- Likely multi-stage builds

**Kubernetes:**

- **Backgammon only:** `k8s/` directory with manifests
- Game-server deployment with replicas
- Ingress for WebSocket (sticky sessions)

**PM2:**

- **Backgammon only:** `ecosystem.config.js` for process management

**Frontends:**

- No Docker visible (likely static site hosting)

**Deployment:**

- VPS deployment via SSH (staging)
- Not cloud-native
- Manual deployment process

---

## Naming Conventions

### File Naming (Backends)

| Type             | Convention                     | Example                           |
| ---------------- | ------------------------------ | --------------------------------- |
| Controller       | `[feature].controller.ts`      | `players.controller.ts`           |
| Service          | `[feature].service.ts`         | `players.service.ts`              |
| Storage Service  | `[entity]-storage.service.ts`  | `user-account-storage.service.ts` |
| Module           | `[feature].module.ts`          | `players.module.ts`               |
| Entity           | `[entity].entity.ts`           | `user-account.entity.ts`          |
| DTO Input        | `[feature]-[action].input.ts`  | `players-search.input.ts`         |
| DTO Output       | `[feature]-[action].output.ts` | `players-search.output.ts`        |
| Test             | `[name].spec.ts`               | `players.service.spec.ts`         |
| Integration Test | `[name].integration.spec.ts`   | `players.integration.spec.ts`     |
| E2E Test         | `[name].e2e.spec.ts`           | `auth.e2e.spec.ts`                |

**Backgammon Additional:**

- Aggregate: `[entity]-aggregate.ts` (e.g., `game-aggregate.ts`)
- Domain Model: `[entity].ts` (e.g., `board.ts`, `dice.ts`)
- Port: `[entity]-[purpose].port.ts` (e.g., `game-state-persistence.port.ts`)
- Protocol Schema: `[message]-inbound.schema.ts`
- Handler: `[action].handler.ts`

### File Naming (Frontends)

| Type        | Convention           | Example            |
| ----------- | -------------------- | ------------------ |
| Component   | `[name].tsx`         | `button.tsx`       |
| Hook        | `use-[name].ts`      | `use-auth.ts`      |
| API Slice   | `[feature]-api.ts`   | `players-api.ts`   |
| Redux Slice | `[feature].slice.ts` | `session.slice.ts` |
| Test        | `[name].spec.tsx`    | `button.spec.tsx`  |

### Class Naming

**Backends:**

- Controller: `[Feature]Controller`
- Service: `[Feature]Service`
- Storage: `[Entity]StorageService`
- Entity: `[Entity]Entity`
- DTO: `[Feature][Action][Input/Output]Dto`
- Guard: `[Name]Guard`

**Frontends:**

- Component: PascalCase (e.g., `Button`, `PlayerCard`)
- Hook: `use[Name]` (e.g., `useAuth`)

### Database Naming

**Poker (MySQL):**

- Tables: snake_case (e.g., `user_account`)
- Columns: snake_case (e.g., `user_id`)

**Backgammon (MongoDB):**

- Collections: snake_case (e.g., `game_events`)
- Fields: camelCase (e.g., `gameId`)

---

## Imports & Dependencies

### Path Aliases

**All repos use path aliases** (`@/` prefix)

**Backends:**

- Layer-specific aliases (`@/core/*`, `@/secondary/*`, `@/application/*`)
- Makes architectural boundaries explicit

**Frontends:**

- Single `@/*` alias for all src imports

### Import Order

**Poker Backend (UNIQUE):**

- ESLint enforces architectural layer ordering
- Violations appear as out-of-order imports
- Auto-fixable

**Other repos:**

- No architectural ordering
- All `@/*` imports grouped together

### Barrel Files

**Not widely used:**

- No `index.ts` barrel files
- Path aliases replace need for barrels
- Exception: Backgammon FE game layer has explicit barrel aliases

### Circular Dependencies

**No visible detection:**

- No `dpdm` or similar tools
- NestJS DI handles most runtime circular dependencies
- Potential for undetected circular dependencies

---

## Error Handling & Logging

### Error Handling

**Poker Backend:**

- Custom exceptions extend NestJS `HttpException`
- Example: `PlayerNotFoundException extends NotFoundException`
- Global exception filter formats responses

**Backgammon Backend:**

- Pure domain errors (no framework dependencies)
- Example: `GameRuleError`, `NotYourTurnError`
- Domain errors mapped to HTTP exceptions in handlers

**Frontends:**

- RTK Query handles API errors
- Error boundaries for React errors (likely)
- Toast notifications (sonner)

### Logging

**Both backends use Pino:**

- Structured JSON logging
- Contextual loggers: `private readonly log = logger.context(ServiceName.name)`
- Log levels: debug, info, warn, error
- `pino-pretty` for human-readable dev logs

**Example:**

```typescript
@Injectable()
export class PlayersService {
  private readonly log = logger.context(PlayersService.name)

  async searchPlayers(criteria) {
    this.log.debug({criteria}, 'Searching players')
    // ...
  }
}
```

**Frontends:** Console logging only

**Missing:**

- Correlation IDs
- Request IDs
- APM integration (Datadog, New Relic)
- Error tracking (Sentry, Rollbar)

---

## Documentation & Developer Experience

### Documentation Quality

**Backgammon Backend:**

- `ARCHITECTURE.md`: 18,745 bytes (extremely comprehensive)
- `README.md`: 7,325 bytes
- `TODO.md`: 5,461 bytes (active)
- App-specific READMEs
- `docs/` folder with 21 files

**Poker Backend:**

- `ARCHITECTURE.md`: 7,107 bytes (comprehensive)
- `README.md`: 19,485 bytes
- `docs/` folder with 28 files

**Frontends:**

- Comprehensive READMEs
- Backgammon has active TODO.md
- No architecture documentation

### Developer Experience Enhancements

**Automated Tooling (All Repos):**

- Git hooks (Husky) with pre-commit checks
- lint-staged (only checks staged files)
- commitlint (enforces commit format)
- ESLint auto-fix
- Prettier auto-format
- Hot reload / watch mode
- `docker-compose` for local services (backends)

**Type Safety:**

- TypeScript strict mode (frontends)
- Zod for runtime validation + TypeScript types
- Path aliases for cleaner imports

**Code Generation:**

- **Poker FE only:** RTK Query from OpenAPI (`pnpm run backoffice:generate`)

**Initialization:**

- **Poker BE:** `pnpm run init` (interactive setup)
- **Backgammon BE:** `pnpm run seed:owner` (seed backoffice user)

**Missing:**

- ADRs (Architecture Decision Records)
- Troubleshooting guides
- Contributing guidelines
- FAQ/Glossary

---

## Code Generation

### Poker Frontend: OpenAPI → RTK Query

**Tool:** `@rtk-query/codegen-openapi`

**Process:**

1. Backend serves OpenAPI spec
2. Codegen fetches spec
3. Generates RTK Query API slice + TypeScript types
4. Generates React hooks

**Script:** `pnpm run backoffice:generate`

**Benefits:**

- Type-safe API calls
- Automatic React hooks
- Eliminates hand-written API client code
- Ensures frontend-backend type consistency

**Limitations:**

- Manual regeneration required
- Large generated files

**Other Repos:** No code generation

---

## Dependency Management & Security

### Dependency Management

**All repos:**

- PNPM with lockfiles (`pnpm-lock.yaml`)
- Lockfiles committed to Git
- Explicit `packageManager` field
- Volta for Node.js version management

**Overrides (Poker BE):**

```yaml
allowBuilds:
  '@nestjs/core': false # Disable postinstall scripts
overrides:
  vite: ^8.0.16 # Force specific version
```

### Security

**NO VISIBLE SECURITY TOOLS:**

- No Dependabot
- No Renovate
- No Snyk
- No `pnpm audit` in CI
- No vulnerability scanning
- No automated dependency updates

**Secrets Management:**

- `.env` files (local)
- Environment variables (deployment)
- No visible vault/secret manager

**Missing Best Practices:**

- Automated security scanning
- Dependency update automation
- License compliance checking
- Security policy documentation

---

## Architecture Enforcement

### Poker Backend

**Enforcement Level:** **Convention** (weak)

**Mechanisms:**

1. **Import Order (Weak):** ESLint sorts imports by layer (application → core → secondary)
2. **Path Aliases (Documentation):** Makes layers explicit (`@/core/`, `@/secondary/`)
3. **Documentation (Guidance):** `ARCHITECTURE.md` states rules
4. **Storage Abstraction (Convention):** Core services must use storage services

**NOT Enforced:**

- Core CAN import secondary (no prevention)
- Circular dependencies not detected
- No compile-time boundary enforcement

---

### Backgammon Backend

**Enforcement Level:** **Mixed**

**Mechanisms:**

1. **Pure Domain (Strong Convention):** Domain layer has NO framework imports (manual code review)
2. **Port-Based Abstraction (Medium):** Core defines ports, secondary implements (DI pattern)
3. **Documentation (Guidance):** Extremely detailed `ARCHITECTURE.md`
4. **Test Coverage (Enforced):** Domain layer 90% coverage threshold (Jest enforces)

**NOT Enforced:**

- Import order doesn't reflect architecture
- Application CAN import secondary
- Circular dependencies not detected
- No compile-time boundary enforcement

---

### Frontends

**Enforcement Level:** **None**

No architectural enforcement. Features can import anything.

---

### Key Observation

**All repos rely heavily on:**

- Documentation
- Code review
- Developer discipline

**No repos have:**

- Compile-time boundary enforcement (NX-style rules)
- Circular dependency detection
- Automated architectural validation

**Risk:** Architecture can drift over time without enforcement

---

## Engineering Approaches Inventory

This inventory categorizes all significant engineering approaches discovered across the four repositories. Each approach includes evidence, location, enforcement level, and relevance to a future SaaS starter kit.

### Repository Structure & Organization

| #   | Approach                                                            | Evidence                                                    | Where          | Explicit/Implicit          | Enforced/Convention        | Explanation                                                    | SaaS Relevance                                             |
| --- | ------------------------------------------------------------------- | ----------------------------------------------------------- | -------------- | -------------------------- | -------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | Multi-app monolith (single repo, multiple apps selected at runtime) | `APP_TYPE` env var, `src/apps/` folder, `main.ts` bootstrap | Both backends  | Explicit (ARCHITECTURE.md) | Convention                 | Single codebase with multiple entry points (API, worker, etc.) | **HIGH** - Common for SaaS backends with multiple services |
| 2   | Feature-based frontend structure (app/features/shared/pages)        | Directory structure                                         | Both frontends | Implicit                   | Convention                 | Features encapsulate domain-specific code                      | **HIGH** - Standard React pattern                          |
| 3   | Pure domain layer (no framework imports)                            | `src/domains/` with no NestJS imports                       | Backgammon BE  | Explicit                   | Convention (manual review) | Domain logic isolated from infrastructure                      | **HIGH** - Testable, flexible, but requires discipline     |
| 4   | Workspace configuration for single-app repos                        | `pnpm-workspace.yaml` even in single-app repos              | All repos      | Implicit                   | Convention                 | Allows future expansion to monorepo                            | **MEDIUM** - Premature for single apps                     |

### Architecture Patterns

| #   | Approach                                                           | Evidence                                              | Where         | Explicit/Implicit | Enforced/Convention        | Explanation                                                    | SaaS Relevance                                       |
| --- | ------------------------------------------------------------------ | ----------------------------------------------------- | ------------- | ----------------- | -------------------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| 5   | Layered clean architecture (apps → application → core → secondary) | Folder structure, ARCHITECTURE.md, path aliases       | Poker BE      | Explicit          | Weak (import order ESLint) | Clear separation with one-way dependency flow                  | **HIGH** - Maintainable, testable                    |
| 6   | Hexagonal/ports-and-adapters architecture                          | Port interfaces in core, implementations in secondary | Backgammon BE | Explicit          | Convention                 | Dependency inversion via ports/adapters                        | **HIGH** - Flexible, testable, but complex           |
| 7   | Event-driven domain (aggregate emits events, handlers react)       | GameAggregate returns events, InProcessEventBus       | Backgammon BE | Explicit          | Convention                 | Domain changes produce events, side effects handled separately | **HIGH** - Scalable, auditable, but complex          |
| 8   | Optional application layer (use-case orchestration)                | Only used for complex scenarios, skipped for CRUD     | Poker BE      | Explicit          | Convention                 | Thin layer for multi-service orchestration                     | **MEDIUM** - Reduces duplication but can be overused |
| 9   | Storage layer abstraction (wrappers around repositories)           | UserAccountStorageService wraps TypeORM repository    | Poker BE      | Explicit          | Convention                 | Prevents direct repository access from core                    | **MEDIUM** - Cleaner but adds indirection            |

### Technology Stack

| #   | Approach                                    | Evidence                        | Where               | Explicit/Implicit | Enforced/Convention             | Explanation                           | SaaS Relevance                                    |
| --- | ------------------------------------------- | ------------------------------- | ------------------- | ----------------- | ------------------------------- | ------------------------------------- | ------------------------------------------------- |
| 10  | NestJS as backend framework                 | package.json, module files      | Both backends       | Explicit          | N/A                             | Opinionated Node.js framework with DI | **HIGH** - Popular for SaaS, mature               |
| 11  | TypeORM + MySQL for relational data         | package.json, entity files      | Poker BE            | Explicit          | N/A                             | SQL ORM with entities                 | **HIGH** - Standard for transactional data        |
| 12  | Mongoose + MongoDB + Redis for event-driven | package.json, persistence ports | Backgammon BE       | Explicit          | N/A                             | NoSQL + in-memory for event sourcing  | **MEDIUM** - Good for event sourcing, less common |
| 13  | Zod for validation across stack             | createZodDto, schema files      | All repos           | Explicit          | N/A                             | Runtime + compile-time validation     | **HIGH** - Excellent DX, type safety              |
| 14  | Vitest for modern testing                   | vitest.config.mts               | Poker BE, frontends | Explicit          | N/A                             | Modern, fast test runner              | **HIGH** - Faster than Jest                       |
| 15  | React + Vite + Redux Toolkit                | package.json                    | Both frontends      | Explicit          | N/A                             | Modern React stack                    | **HIGH** - Standard for SaaS frontends            |
| 16  | Tailwind CSS + shadcn/ui                    | package.json, component files   | Both frontends      | Explicit          | N/A                             | Utility-first CSS + component library | **HIGH** - Rapid UI development                   |
| 17  | Pino for structured logging                 | package.json, logger usage      | Both backends       | Explicit          | N/A                             | Structured JSON logging               | **HIGH** - Performant, queryable                  |
| 18  | PNPM as package manager                     | package.json, pnpm-lock.yaml    | All repos           | Explicit          | Enforced (packageManager field) | Fast, efficient, strict               | **MEDIUM** - Any manager works, PNPM is fast      |

### Validation & Type Safety

| #   | Approach                                      | Evidence                                       | Where         | Explicit/Implicit | Enforced/Convention | Explanation                                | SaaS Relevance                            |
| --- | --------------------------------------------- | ---------------------------------------------- | ------------- | ----------------- | ------------------- | ------------------------------------------ | ----------------------------------------- |
| 19  | Zod schemas as single source of truth         | createZodDto, config schemas, protocol schemas | All repos     | Explicit          | Convention          | Zod schema → validation + TypeScript types | **HIGH** - Eliminates drift               |
| 20  | OpenAPI auto-generation from Zod DTOs         | @nestjs/swagger, createZodDto                  | Backends      | Explicit          | Convention          | Zod schemas power OpenAPI spec             | **HIGH** - Auto-generates API docs        |
| 21  | RTK Query codegen from OpenAPI                | @rtk-query/codegen-openapi                     | Poker FE      | Explicit          | Manual (script)     | Frontend API client generated from backend | **HIGH** - Eliminates hand-written client |
| 22  | Strict TypeScript (frontends only)            | strict: true, noUncheckedIndexedAccess: true   | Frontends     | Explicit          | Enforced (compiler) | Full strict mode                           | **HIGH** - Catches bugs early             |
| 23  | Partial TypeScript strict (backends)          | strictNullChecks: true, noImplicitAny: false   | Backends      | Explicit          | Enforced (compiler) | Pragmatic middle ground                    | **MEDIUM** - Balances safety and speed    |
| 24  | Tolerant inbound, strict outbound (WebSocket) | BackgammonSerializer                           | Backgammon BE | Explicit          | Enforced (Zod)      | Accepts unknown fields in, validates out   | **HIGH** - Forward compatibility          |

### Testing Strategies

| #   | Approach                                  | Evidence                                     | Where         | Explicit/Implicit    | Enforced/Convention | Explanation                                 | SaaS Relevance                         |
| --- | ----------------------------------------- | -------------------------------------------- | ------------- | -------------------- | ------------------- | ------------------------------------------- | -------------------------------------- |
| 25  | Co-located tests (next to source)         | .spec.ts files next to source                | All repos     | Implicit             | Convention          | Tests live in same folder as implementation | **HIGH** - Easy to find tests          |
| 26  | Separate configs for unit/integration/e2e | Vitest projects, Jest configs                | Backends      | Explicit             | Convention          | Different timeouts, pools per test type     | **HIGH** - Flexible test execution     |
| 27  | Domain test coverage thresholds (90%)     | test:domains script with --coverageThreshold | Backgammon BE | Explicit             | Enforced (Jest)     | Domain layer must have high coverage        | **HIGH** - Ensures core logic tested   |
| 28  | testcontainers for integration tests      | package.json, commented vitest config        | Poker BE      | Implicit (commented) | Not enforced        | Real database in Docker                     | **HIGH** - Realistic integration tests |
| 29  | MSW for API mocking (frontends)           | package.json                                 | Frontends     | Implicit             | Convention          | Mock Service Worker for API mocking         | **HIGH** - Realistic frontend testing  |

### Linting & Code Quality

| #   | Approach                                   | Evidence                                   | Where     | Explicit/Implicit | Enforced/Convention        | Explanation                         | SaaS Relevance                      |
| --- | ------------------------------------------ | ------------------------------------------ | --------- | ----------------- | -------------------------- | ----------------------------------- | ----------------------------------- |
| 30  | ESLint flat config                         | eslint.config.mts                          | All repos | Explicit          | Enforced                   | Modern ESLint configuration         | **MEDIUM** - Future standard        |
| 31  | Consistent type imports                    | @typescript-eslint/consistent-type-imports | All repos | Explicit          | Enforced (ESLint)          | `import type` for type-only imports | **HIGH** - Cleaner imports          |
| 32  | No explicit any                            | @typescript-eslint/no-explicit-any         | All repos | Explicit          | Enforced (ESLint)          | Disallow `any` type                 | **HIGH** - Type safety              |
| 33  | No floating promises                       | @typescript-eslint/no-floating-promises    | Backends  | Explicit          | Enforced (ESLint)          | Require await or void               | **HIGH** - Prevents missed errors   |
| 34  | Auto-sorted imports                        | simple-import-sort/imports                 | All repos | Explicit          | Enforced (ESLint auto-fix) | Imports sorted by groups            | **HIGH** - Consistent code style    |
| 35  | Architectural import order (poker BE only) | simple-import-sort custom groups           | Poker BE  | Explicit          | Enforced (ESLint)          | Imports sorted to reflect layers    | **MEDIUM** - Weak enforcement       |
| 36  | Prettier for formatting                    | .prettierrc, prettier scripts              | All repos | Explicit          | Enforced (pre-commit)      | Auto-format code                    | **HIGH** - Eliminates style debates |
| 37  | Pre-commit hooks (Husky + lint-staged)     | .husky/, .lintstagedrc.json                | All repos | Explicit          | Enforced (Git hooks)       | Lint + format on commit             | **HIGH** - Prevents bad code        |

### Git & CI/CD

| #   | Approach                         | Evidence                    | Where              | Explicit/Implicit | Enforced/Convention | Explanation                     | SaaS Relevance                          |
| --- | -------------------------------- | --------------------------- | ------------------ | ----------------- | ------------------- | ------------------------------- | --------------------------------------- |
| 38  | Conventional Commits             | commitlint.config.ts        | All repos          | Explicit          | Enforced (Git hook) | Structured commit messages      | **HIGH** - Enables changelog automation |
| 39  | Custom commit types (add hotfix) | commitlint rules            | All repos          | Explicit          | Enforced            | Includes `hotfix` type          | **MEDIUM** - Useful for incidents       |
| 40  | VPS deployment via SSH           | GitHub Actions workflow     | Backends (staging) | Explicit          | Convention          | SSH to VPS, run script          | **LOW** - Not cloud-native, risky       |
| 41  | No CI build/test/lint            | Missing from GitHub Actions | Backends           | Implicit          | Not enforced        | CI only deploys, doesn't verify | **LOW** - No CI verification is risky   |

### Persistence & State Management

| #   | Approach                                  | Evidence                                    | Where         | Explicit/Implicit | Enforced/Convention | Explanation                          | SaaS Relevance                                |
| --- | ----------------------------------------- | ------------------------------------------- | ------------- | ----------------- | ------------------- | ------------------------------------ | --------------------------------------------- |
| 42  | Redis for hot state, DB for durable facts | Redis stores, Mongo collections             | Backgammon BE | Explicit          | Convention          | Separation of hot vs. cold storage   | **HIGH** - Scalable, performant               |
| 43  | Outbox pattern (MongoDB → BullMQ)         | Outbox collection, OutboxRelayRunner        | Backgammon BE | Explicit          | Convention          | Reliable async job execution         | **HIGH** - Ensures no job loss                |
| 44  | BullMQ for background jobs                | package.json, worker processors             | Backgammon BE | Explicit          | Convention          | Retryable job processing             | **HIGH** - Reliable job execution             |
| 45  | Distributed locks (Redis)                 | Lock acquisition in GameCommandService      | Backgammon BE | Explicit          | Convention          | Prevents concurrent modifications    | **HIGH** - Consistency in distributed systems |
| 46  | Port-based persistence abstraction        | Ports in core, implementations in secondary | Backgammon BE | Explicit          | Convention          | Dependency inversion for persistence | **HIGH** - Flexible, testable                 |

### API & Communication

| #   | Approach                                      | Evidence                              | Where         | Explicit/Implicit | Enforced/Convention | Explanation                       | SaaS Relevance                      |
| --- | --------------------------------------------- | ------------------------------------- | ------------- | ----------------- | ------------------- | --------------------------------- | ----------------------------------- |
| 47  | OpenAPI spec served at runtime                | @nestjs/swagger, /swagger endpoint    | Backends      | Explicit          | Convention          | Interactive API documentation     | **HIGH** - Essential for SaaS APIs  |
| 48  | WebSocket with raw ws (not Nest HTTP)         | Raw ws server, custom routing         | Backgammon BE | Explicit          | Convention          | Low-level WebSocket control       | **MEDIUM** - Complex but performant |
| 49  | Redis Pub/Sub for cross-pod broadcasts        | Pub/Sub channels, BroadcastSubscriber | Backgammon BE | Explicit          | Convention          | Real-time cross-pod communication | **HIGH** - Scalable real-time       |
| 50  | DTO naming (.input.ts, .output.ts, .param.ts) | File naming convention                | Backends      | Implicit          | Convention          | Clear request/response separation | **HIGH** - Clear API contracts      |

### Developer Experience

| #   | Approach                              | Evidence                       | Where         | Explicit/Implicit | Enforced/Convention | Explanation                         | SaaS Relevance                      |
| --- | ------------------------------------- | ------------------------------ | ------------- | ----------------- | ------------------- | ----------------------------------- | ----------------------------------- |
| 51  | Comprehensive ARCHITECTURE.md         | 18KB (backgammon), 7KB (poker) | Backends      | Explicit          | Documentation       | Detailed architecture documentation | **HIGH** - Essential for onboarding |
| 52  | Path aliases for architectural layers | @/core/, @/secondary/, etc.    | Backends      | Explicit          | Convention          | Makes architecture explicit         | **HIGH** - Clearer imports          |
| 53  | Interactive setup script              | pnpm run init                  | Poker BE      | Explicit          | Convention          | Guided repository setup             | **MEDIUM** - Nice for onboarding    |
| 54  | Seed scripts                          | pnpm run seed:owner            | Backgammon BE | Explicit          | Convention          | Populate initial data               | **MEDIUM** - Useful for development |
| 55  | Hot reload / watch mode               | nest start --watch             | Backends      | Explicit          | Convention          | Auto-restart on code changes        | **HIGH** - Essential for DX         |
| 56  | docker-compose for local services     | docker-compose.yaml            | Backends      | Explicit          | Convention          | Local database, Redis, etc.         | **HIGH** - Easy local setup         |

### Configuration Management

| #   | Approach                             | Evidence                                  | Where     | Explicit/Implicit | Enforced/Convention    | Explanation                 | SaaS Relevance                      |
| --- | ------------------------------------ | ----------------------------------------- | --------- | ----------------- | ---------------------- | --------------------------- | ----------------------------------- |
| 57  | Zod-validated configuration schemas  | config/schemas/ with Zod                  | Backends  | Explicit          | Enforced (Zod runtime) | Type-safe, validated config | **HIGH** - Fail-fast on bad config  |
| 58  | Modular configuration by concern     | Separate schemas for api, db, redis, etc. | Backends  | Explicit          | Convention             | Each concern has own schema | **HIGH** - Maintainable config      |
| 59  | Explicit packageManager field        | packageManager in package.json            | All repos | Explicit          | Enforced (PNPM)        | Consistent PNPM version     | **HIGH** - Reproducible builds      |
| 60  | Volta for Node.js version management | volta field in package.json               | All repos | Explicit          | Convention             | Auto-switch Node versions   | **HIGH** - Consistent Node versions |

---

## Important Negative Findings

These are engineering practices that were **expected** but **NOT found** in the repositories:

### Security & Dependencies

1. **No automated dependency updates:** No Dependabot, Renovate, or similar tools
2. **No vulnerability scanning:** No Snyk, no `pnpm audit` in CI
3. **No license compliance checking:** No license scanning tools
4. **No security policy:** No SECURITY.md or vulnerability disclosure process
5. **No secrets management:** No Vault, AWS Secrets Manager, or similar (only .env files)

### Architecture Enforcement

6. **No compile-time boundary enforcement:** No NX-style dependency boundary rules
7. **No circular dependency detection:** No `dpdm` or similar tools at build time
8. **No architecture validation tests:** No tests that verify dependency direction
9. **Import order is the only enforcement:** Poker backend's weak import order ESLint rule is the only architectural enforcement mechanism

### CI/CD & Testing

10. **No CI build verification:** CI deploys without building/testing first
11. **No CI test execution:** Tests not run in CI pipeline
12. **No CI lint checks:** Linting not verified in CI (only pre-commit)
13. **No test coverage enforcement:** No coverage thresholds in CI (except backgammon domain tests)
14. **No E2E browser tests:** No Playwright or Cypress for frontend E2E
15. **No visual regression tests:** No screenshot comparison tools
16. **No load/performance tests:** No k6, Artillery, or similar
17. **No production deployment workflow:** Only staging deployment visible

### Monitoring & Observability

18. **No APM integration:** No Datadog, New Relic, AppDynamics
19. **No error tracking:** No Sentry, Rollbar, Bugsnag
20. **No request ID/correlation ID:** No visible request tracing
21. **No distributed tracing:** No OpenTelemetry, Jaeger, Zipkin
22. **No metrics collection:** No Prometheus, StatsD visible
23. **No alerts/paging:** No PagerDuty, Opsgenie integration

### Infrastructure

24. **No infrastructure as code:** No Terraform, Pulumi, CloudFormation (except k8s manifests for backgammon)
25. **No cloud provider integration:** No AWS SDK, GCP SDK visible
26. **No CDN configuration:** No CloudFront, Cloudflare config
27. **No load balancer config:** No visible load balancing (except k8s ingress)
28. **No auto-scaling:** No horizontal pod autoscaler config
29. **No service mesh:** No Istio, Linkerd

### Documentation

30. **No ADRs (Architecture Decision Records):** No documentation of why decisions were made
31. **No CONTRIBUTING.md:** No contributor guidelines
32. **No CODE_OF_CONDUCT.md:** No code of conduct
33. **No API versioning strategy:** No visible API versioning approach
34. **No changelog:** No CHANGELOG.md (despite Conventional Commits)
35. **No troubleshooting guide:** No common issues documentation

### Development Workflow

36. **No PR templates:** No .github/PULL_REQUEST_TEMPLATE.md
37. **No issue templates:** No .github/ISSUE_TEMPLATE/
38. **No CODEOWNERS:** No .github/CODEOWNERS file
39. **No branch protection rules:** Not visible (may exist in GitHub settings)
40. **No semantic versioning automation:** No semantic-release or similar

### Multi-Tenancy (SaaS-Specific)

41. **No tenant context:** No visible tenant isolation patterns
42. **No tenant-scoped queries:** No row-level security or tenant filtering
43. **No tenant configuration:** No per-tenant settings/feature flags
44. **No tenant-aware logging:** No tenant ID in log context

### Feature Management

45. **No feature flags:** No LaunchDarkly, Unleash, or similar
46. **No A/B testing:** No experimentation framework
47. **No gradual rollouts:** No canary deployment config

### Data Management

48. **No database migrations:** Not visible (may be manual or external)
49. **No seed data management:** Minimal seed scripts
50. **No backup/restore procedures:** No visible backup strategy
51. **No data anonymization:** No GDPR-compliant data handling visible

---

## Raw Evidence / Important Files

### Most Important Files Inspected

#### Poker Backend

1. **`ARCHITECTURE.md` (7,107 bytes)**
   - **Why it matters:** Explicitly documents layered clean architecture, request flows, layer responsibilities, and key principles
   - **Key insight:** Optional application layer is explicitly documented pattern

2. **`src/modules/core/players/players.service.ts`**
   - **Why it matters:** Example of core service that uses storage services (no direct repository access)
   - **Key insight:** Demonstrates storage abstraction pattern in practice

3. **`src/modules/secondary/storages/user-account/user-account-storage.service.ts`**
   - **Why it matters:** Example of storage service wrapping TypeORM repository
   - **Key insight:** QueryBuilder used for complex queries, simple methods for basic operations

4. **`src/apps/backoffice/dto/players/players-search.input.ts`**
   - **Why it matters:** Example of Zod schema → DTO pattern via createZodDto
   - **Key insight:** Schemas extend PaginationInputSchema, demonstrating schema composition

5. **`vitest.config.mts`**
   - **Why it matters:** Shows Vitest project configuration for unit/integration/e2e separation
   - **Key insight:** Uses unplugin-swc for NestJS decorator metadata, serial execution for integration tests

6. **`eslint.config.mts`**
   - **Why it matters:** Custom import sort groups enforce architectural layer ordering
   - **Key insight:** Only architectural enforcement mechanism in the codebase

#### Backgammon Backend

7. **`ARCHITECTURE.md` (18,745 bytes)**
   - **Why it matters:** Extremely comprehensive documentation covering philosophy, multi-app architecture, WebSocket design, event handling, persistence model, worker architecture, and more
   - **Key insight:** One of the most detailed architecture documents encountered; serves as both reference and onboarding material

8. **`src/domains/game/game-aggregate.ts`**
   - **Why it matters:** Event-driven aggregate root demonstrating pure domain pattern
   - **Key insight:** Command methods return `GameDomainEvent[]`, aggregate is pure (no I/O), framework-free

9. **`src/modules/core/game-play/command/game-command.service.ts` (inferred path)**
   - **Why it matters:** Demonstrates distributed lock + load + execute + save + dispatch event pattern
   - **Key insight:** Command execution is atomic and safe across multiple pods

10. **`src/apps/game-server/protocol/` (directory)**
    - **Why it matters:** Wire protocol schemas and mappers isolated from domain logic
    - **Key insight:** Tolerant inbound (accepts unknown fields), strict outbound (validates before send)

11. **`jest.config.js` + `test/config/jest.*.js`**
    - **Why it matters:** Multiple Jest configurations for different test types
    - **Key insight:** Domain tests have coverage thresholds (90% functions/lines/statements)

12. **`pnpm-workspace.yaml`**
    - **Why it matters:** Disables postinstall scripts for specific packages
    - **Key insight:** Security/performance concern addressed via PNPM overrides

#### Poker Frontend

13. **`backoffice-api.config.cjs`**
    - **Why it matters:** Configuration for RTK Query codegen from OpenAPI
    - **Key insight:** Auto-generates entire API client, eliminating hand-written code

14. **`src/shared/ui/` (directory)**
    - **Why it matters:** shadcn/ui pattern component library
    - **Key insight:** Radix UI + Tailwind + class-variance-authority for consistent UI

#### Backgammon Frontend

15. **`src/game/` (directory)**
    - **Why it matters:** Game engine separated from React UI (Phaser in its own layer)
    - **Key insight:** Game runtime state separate from Redux app state

16. **`src/sdk/` (directory) + build scripts**
    - **Why it matters:** Widget SDK for iframe embedding
    - **Key insight:** Dual build targets (main app + IIFE library) for embeddable widget

---

## Summary

### Files Inspected

**Total:** 50+ files across 4 repositories

**Key Files:**

- 2 comprehensive ARCHITECTURE.md documents (7KB, 18KB)
- 8 package.json files
- 4 TypeScript configurations
- 4 ESLint configurations
- 4 Prettier configurations
- 4 commitlint configurations
- Multiple source files (services, entities, DTOs, components)
- Test configurations (Vitest, Jest)
- CI/CD workflows
- Configuration schemas

### Major Engineering Approaches Discovered

**Architecture:**

1. **Layered clean architecture** (Poker BE) with optional application layer
2. **Hexagonal/ports-and-adapters** (Backgammon BE) with pure domain layer
3. **Event-driven domain** (Backgammon BE) with aggregate roots emitting events
4. **Multi-app monolith** pattern (both backends)

**Technology Stack:**

1. **NestJS + TypeORM + MySQL** (traditional SaaS stack)
2. **NestJS + Mongoose + MongoDB + Redis + BullMQ** (event-driven stack)
3. **React + Vite + Redux Toolkit + RTK Query** (modern frontend)
4. **Zod everywhere** (validation, configuration, protocol, forms)

**Type Safety:**

1. **Zod schemas as single source of truth** (runtime validation + TypeScript types)
2. **OpenAPI auto-generation** from Zod DTOs
3. **RTK Query codegen** from OpenAPI (Poker FE only)
4. **Strict TypeScript** (frontends), **partial strict** (backends)

**Testing:**

1. **Co-located tests** (tests next to source)
2. **Separate configs** for unit/integration/e2e
3. **Domain coverage thresholds** (90% for Backgammon BE)
4. **React Testing Library + MSW** (frontends)

### Important Enforced Constraints

**Actually Enforced:**

1. **ESLint rules:** no-explicit-any, no-floating-promises, consistent-type-imports, unused-imports
2. **Prettier formatting:** Enforced via pre-commit hooks
3. **Conventional Commits:** Enforced via commitlint
4. **Zod validation:** Runtime validation at API boundaries, config loading, WebSocket protocol
5. **TypeScript compiler:** Partial strict (backends), full strict (frontends)
6. **Domain test coverage:** 90% threshold for Backgammon BE domain layer

**Weakly Enforced:**

1. **Import order** (Poker BE only): ESLint sorts imports by architectural layer
2. **Storage abstraction:** Convention only, not compiler-enforced
3. **Pure domain layer:** Convention only, relies on code review

### Important Conventions (Not Enforced)

1. **Dependency direction:** Apps → Application → Core → Secondary (documentation only)
2. **Port-based persistence:** Core defines ports, secondary implements (DI pattern, not compiler-enforced)
3. **DTO naming:** `.input.ts`, `.output.ts`, `.param.ts` (convention only)
4. **File naming:** Consistent suffixes (`.controller.ts`, `.service.ts`, etc.)
5. **Path aliases:** Layer-specific aliases (`@/core/`, `@/secondary/`) make architecture visible
6. **Multi-app selection:** `APP_TYPE` environment variable (runtime, not build-time)
7. **Optional application layer:** Only used for complex orchestrations (developer judgment)

### Notable Negative Findings

**Critical Missing (High Risk):**

1. **No CI verification:** CI deploys without building/testing
2. **No automated security scanning:** No vulnerability detection
3. **No architectural enforcement:** Only weak import order rule (poker BE)

**Important Missing (Medium Risk):** 4. **No ADRs:** No documentation of architectural decisions 5. **No monitoring/observability:** No APM, error tracking, distributed tracing 6. **No multi-tenancy patterns:** No tenant isolation visible

**Nice to Have Missing (Low Risk):** 7. **No PR/issue templates:** No structured contribution workflow 8. **No feature flags:** No gradual rollout capability 9. **No changelog:** Despite using Conventional Commits

---

## Conclusion

This investigation reveals two distinct architectural approaches:

**Poker Backend:** Pragmatic layered architecture with clear separation of concerns, optional application layer for complex scenarios, and storage abstraction to prevent direct repository access. Emphasis on simplicity and maintainability.

**Backgammon Backend:** Sophisticated hexagonal architecture with pure domain layer, event-driven design, and explicit port-based abstractions. Emphasis on flexibility, testability, and domain purity.

**Both approaches are valid for B2B SaaS** depending on requirements:

- Poker's approach is simpler, faster to implement, sufficient for most SaaS needs
- Backgammon's approach is more complex, more flexible, better for complex domains

**Common strengths across all repos:**

- Excellent type safety via Zod + TypeScript
- Comprehensive linting and formatting automation
- Good testing practices (co-located tests, separate configs)
- Strong developer experience (hot reload, docker-compose, etc.)

**Common weaknesses:**

- Weak architectural enforcement (relies on discipline)
- No CI verification (dangerous)
- No security/vulnerability scanning
- No monitoring/observability integration
- Missing multi-tenancy patterns

**Key recommendation for new B2B SaaS starter kit:**
Adopt poker backend's pragmatic layered architecture as a foundation, add architectural enforcement tooling (NX-style boundaries or custom ESLint rules), implement CI verification (build/test/lint before deploy), add security scanning, and design for multi-tenancy from day one.
