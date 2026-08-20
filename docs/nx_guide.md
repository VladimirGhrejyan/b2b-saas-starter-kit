# Nx Workspace Guide

This guide explains the Nx workspace that powers this B2B SaaS starter kit repository. It's designed as a practical learning resource specific to **this workspace**, not as generic Nx documentation.

## Table of Contents

1. [What is Nx and Why We Use It](#1-what-is-nx-and-why-we-use-it)
2. [Nx Workspace Concepts](#2-nx-workspace-concepts)
3. [Workspace vs Monorepo vs Project vs Library vs Package](#3-workspace-vs-monorepo-vs-project-vs-library-vs-package)
4. [Important Files in This Repository](#4-important-files-in-this-repository)
5. [How Nx Discovers Projects](#5-how-nx-discovers-projects)
6. [How Nx Tracks Dependencies](#6-how-nx-tracks-dependencies)
7. [Project Graph](#7-project-graph)
8. [Task Graph](#8-task-graph)
9. [Nx Caching](#9-nx-caching)
10. [Affected Commands](#10-affected-commands)
11. [Common Commands](#11-common-commands)
12. [Nx Plugins](#12-nx-plugins)
13. [Future Integration: NestJS and React/Vite](#13-future-integration-nestjs-and-reactvite)
14. [What Should Be an Nx Project](#14-what-should-be-an-nx-project)
15. [Using Libraries](#15-using-libraries)
16. [Project Boundaries and Dependency Constraints](#16-project-boundaries-and-dependency-constraints)
17. [Enforcing Architectural Boundaries](#17-enforcing-architectural-boundaries)
18. [Nx in CI/CD](#18-nx-in-cicd)
19. [Nx + PNPM + TypeScript + Prettier](#19-nx--pnpm--typescript--prettier)
20. [Nx AI Integration](#20-nx-ai-integration)
21. [Things You Should NOT Do](#21-things-you-should-not-do)
22. [Learning Exercises](#22-learning-exercises)

---

## 1. What is Nx and Why We Use It

**Nx** is a build system and monorepo orchestration tool. Think of it as a "project coordinator" that understands the structure of your entire codebase and can intelligently run tasks only where needed.

### Why Nx for this B2B SaaS starter kit?

1. **Monorepo Management**: We will have multiple applications (backend APIs, admin frontend, customer frontend) and many shared libraries (types, utilities, validation schemas) in one repository. Nx makes this manageable.

2. **Intelligent Builds**: Nx knows which projects depend on each other. If you change a shared library, Nx knows exactly which apps need to be rebuilt or tested.

3. **Speed via Caching**: Nx caches the results of tasks (builds, tests, lints). If nothing changed, it replays the cached result instantly.

4. **Affected Analysis**: In a large monorepo, you don't want to rebuild everything on every commit. Nx's "affected" commands only run tasks for projects that changed (or depend on what changed).

5. **Scalability**: As this starter kit grows to 10, 20, or 50+ packages, Nx keeps build times fast and CI costs low.

6. **Plugin Ecosystem**: Nx has official plugins for NestJS, React, Vite, and many other technologies we plan to use.

7. **Enforced Boundaries**: Nx can enforce architectural rules (e.g., "backend code cannot import frontend code") at build time.

8. **AI Integration**: Nx provides native AI tooling integration through the MCP server and agent skills.

**Current version in this workspace**: Nx v23.1.1

---

## 2. Nx Workspace Concepts

Let's define the key concepts that Nx introduces:

### Workspace

The entire repository is a **workspace**. It's defined by the presence of `nx.json` at the root.

A workspace contains:

- One or more **projects** (applications or libraries)
- Configuration files (`nx.json`, `tsconfig.base.json`, etc.)
- Shared tooling configuration (Prettier, etc.)
- A package manager workspace setup (`pnpm-workspace.yaml`)

### Project

A **project** is a unit of code that Nx tracks. There are two types:

1. **Application**: A deployable artifact (e.g., a NestJS API server, a React app)
2. **Library**: A collection of reusable code (e.g., shared types, utilities, UI components)

Each project has:

- A unique name
- A root directory (usually under `packages/` or `apps/`)
- One or more **targets** (tasks you can run against it)

### Target

A **target** is a task you can run on a project. Common targets:

- `build` - compile TypeScript to JavaScript
- `test` - run tests
- `lint` - check code style
- `typecheck` - verify TypeScript types
- `serve` - run a development server

You run a target with: `pnpm nx run <project>:<target>` or the shorthand `pnpm nx <target> <project>`

### Executor

An **executor** is the actual code that runs a target. It's like a task runner.

Examples:

- `@nx/js:tsc` - TypeScript compiler executor
- `@nx/vite:build` - Vite build executor
- `@nx/nest:build` - NestJS build executor

Executors are provided by Nx plugins or can be custom scripts.

### Plugin

A **plugin** is an npm package that extends Nx's capabilities for a specific technology.

Examples:

- `@nx/js` - TypeScript/JavaScript support (installed in this workspace)
- `@nx/nest` - NestJS support (installed in this workspace)
- `@nx/react` - React support (installed in this workspace)
- `@nx/vite` - Vite support (installed in this workspace)

Plugins provide:

- **Generators**: Code scaffolding (e.g., `pnpm nx g @nx/nest:app my-api`)
- **Executors**: Task runners
- **Inferred tasks**: Automatic target discovery

### Project Graph

The **Project Graph** is a directed graph showing dependencies between projects.

If `backend-api` imports from `@org/shared-types`, then:

- `backend-api` depends on `shared-types`
- The graph has an edge: `backend-api → shared-types`

Nx builds this graph by analyzing `import` and `require` statements in your code.

### Task Graph

The **Task Graph** is a directed graph showing the order in which tasks must run.

If you run `pnpm nx build backend-api` and `backend-api` depends on `shared-types`, Nx creates a task graph:

1. First: `build shared-types`
2. Then: `build backend-api`

This ensures dependencies are built before dependents.

### Affected Projects

**Affected projects** are projects that changed, or depend on something that changed.

If you modify `shared-types`, the affected projects are:

- `shared-types` itself
- Any project that imports from `shared-types`

The command `pnpm nx affected -t build` builds only affected projects.

### Caching

Nx caches the outputs of tasks. If you run `pnpm nx build my-lib` twice without changes, the second run is instant (cache hit).

---

## 3. Workspace vs Monorepo vs Project vs Library vs Package

These terms can be confusing. Here's how they relate:

| Term            | Definition                                       | In This Repo                                |
| --------------- | ------------------------------------------------ | ------------------------------------------- |
| **Workspace**   | The entire repository managed by Nx              | The root directory with `nx.json`           |
| **Monorepo**    | A repository containing multiple projects        | This repository is a monorepo               |
| **Project**     | An Nx-tracked unit (app or library)              | Will be under `packages/` or `apps/`        |
| **Library**     | A project meant to be consumed by other projects | Shared code like `@org/types`, `@org/utils` |
| **Package**     | An npm package (has `package.json`)              | Every project is also an npm package        |
| **Application** | A project that is deployed/run (not imported)    | Future: `backend-api`, `admin-frontend`     |

**Key insight**: In an Nx workspace with PNPM, every **project** (library or app) is also an npm **package**. They have `package.json` files and can be versioned/published independently.

---

## 4. Important Files in This Repository

### `nx.json`

The main Nx configuration file. Located at the root.

**Current contents**:

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "analytics": false,
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": ["default"],
    "sharedGlobals": []
  },
  "plugins": [
    {
      "plugin": "@nx/js/typescript",
      "options": {
        "typecheck": {"targetName": "typecheck"},
        "build": {
          "targetName": "build",
          "configName": "tsconfig.lib.json",
          "buildDepsName": "build-deps",
          "watchDepsName": "watch-deps"
        }
      }
    }
  ]
}
```

**What it does**:

- **`namedInputs`**: Defines which files are considered "inputs" for caching. `default` means "all files in the project root". `sharedGlobals` can include workspace-level files that affect all projects (currently empty).

- **`plugins`**: Registers the `@nx/js/typescript` plugin, which automatically infers TypeScript-related targets (`typecheck`, `build`) for projects.

- **`analytics`**: Disabled (we opted out of Nx usage analytics).

**What's NOT in here**: No explicit `projects` array. Nx 23.x auto-discovers projects from the file system.

### `package.json`

The root package file.

**Key sections**:

```json
{
  "name": "@b2b-saas-starter-kit/source",
  "version": "0.0.0",
  "license": "MIT",
  "packageManager": "pnpm@11.8.0",
  "engines": {
    "node": ">=24.0.0 <25.0.0"
  },
  "devDependencies": {
    "@nx/js": "23.1.1",
    "@nx/nest": "23.1.1",
    "@nx/react": "23.1.1",
    "@nx/vite": "23.1.1",
    "nx": "23.1.1",
    "prettier": "~3.6.2",
    "typescript": "~6.0.3"
  }
}
```

**Key points**:

- `private: true` - This is a monorepo root, not meant to be published
- `packageManager: "pnpm@11.8.0"` - Explicitly declares PNPM version
- `engines.node` - Requires Node.js 24.x (matches `.nvmrc`)
- Official Nx plugins installed: `@nx/js`, `@nx/nest`, `@nx/react`, `@nx/vite`

### `.nvmrc`

Specifies the Node.js version for this project:

```
24.19.0
```

Developers use `nvm use` to activate this version.

### `pnpm-workspace.yaml`

Defines the PNPM workspace.

**Current contents**:

```yaml
packages:
  - 'packages/*'
  - 'apps/*'

autoInstallPeers: true
allowBuilds:
  nx: true
```

**What it does**:

- `packages: ["packages/*", "apps/*"]` - All directories under `packages/` and `apps/` are part of the PNPM workspace
- `autoInstallPeers: true` - Automatically install peer dependencies
- `allowBuilds: nx: true` - Allow Nx to use custom build steps

**Important**: When you create a library with `pnpm nx g @nx/js:lib packages/my-lib`, PNPM recognizes it as a workspace package.

### `tsconfig.base.json`

The root TypeScript configuration. All projects extend this.

**Current contents**:

```json
{
  "compilerOptions": {
    "composite": true,
    "declarationMap": true,
    "emitDeclarationOnly": true,
    "importHelpers": true,
    "isolatedModules": true,
    "lib": ["es2022"],
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "noEmitOnError": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "skipLibCheck": true,
    "strict": true,
    "target": "es2022",
    "customConditions": ["@b2b-saas-starter-kit/source"]
  }
}
```

**Key settings**:

- `strict: true` - Strict type checking
- `module: "nodenext"` - Modern ESM + CJS support
- `composite: true` - Enables TypeScript project references (required for Nx)
- `isolatedModules: true` - Each file can be compiled independently (required for tools like SWC)

**What's NOT in here yet**: No `paths` mapping. When you create projects, Nx will add `paths` entries automatically (e.g., `"@org/my-lib": ["packages/my-lib/src/index.ts"]`).

### `AGENTS.md`

Instructions for AI agents (Cursor, Claude, etc.) on how to work with this Nx workspace.

Contains guidelines like:

- Use the `nx-workspace` skill for exploring the workspace
- Always run tasks through `nx` (not underlying tools directly)
- Prefix nx commands with PNPM (e.g., `pnpm nx build`)
- Use the Nx MCP server tools
- Invoke `nx-generate` skill before scaffolding

This file is automatically read by AI assistants.

### `.agents/skills/`

Contains Nx-specific skills for AI agents:

- `nx-workspace` - For querying projects, targets, and dependencies
- `nx-generate` - For scaffolding apps and libraries
- Other workspace exploration skills

These are used by AI editors like Cursor to provide better assistance.

### `.prettierrc` and `.prettierignore`

Prettier configuration files. Nx initialized these with sensible defaults.

```
.prettierrc:
{
  "singleQuote": true
}
```

### `.gitignore`

Standard gitignore with Nx-specific entries:

```
.nx/cache           # Local task cache
.nx/workspace-data  # Nx workspace metadata
dist                # Build output
```

### `.vscode/extensions.json`

Recommends the Nx Console extension for VS Code:

```json
{
  "recommendations": ["nrwl.angular-console", "esbenp.prettier-vscode"]
}
```

**Nx Console** is a GUI for running Nx commands and generators. It also manages the Nx MCP server for AI integration.

---

## 5. How Nx Discovers Projects

Nx 23.x uses **automatic project discovery** via conventions:

1. **PNPM workspace packages**: Any directory in `packages/*` or `apps/*` with a `package.json` is a potential project.

2. **Plugin inference**: The `@nx/js/typescript` plugin looks for projects with `tsconfig.json` files.

3. **No explicit registration**: You don't need to list projects in `nx.json`.

**Example**: When you run `pnpm nx g @nx/js:lib packages/my-lib`, Nx:

- Creates `packages/my-lib/`
- Adds a `package.json` with `"name": "@b2b-saas-starter-kit/my-lib"`
- Adds a `tsconfig.json`
- PNPM automatically recognizes it (due to `pnpm-workspace.yaml`)
- Nx automatically recognizes it (due to the TypeScript plugin)

**To see all projects**: `pnpm nx show projects`

Currently, this returns nothing because we have no projects yet.

---

## 6. How Nx Tracks Dependencies

Nx builds the Project Graph by analyzing code:

### Source Code Analysis

Nx scans TypeScript/JavaScript files for import statements:

```typescript
// In apps/backend-api/src/main.ts
import {validate} from '@b2b-saas-starter-kit/validation'
```

Nx sees this and records: `backend-api` depends on `validation`.

### TypeScript Path Mappings

Nx reads `tsconfig.base.json` `paths` to resolve import aliases:

```json
{
  "compilerOptions": {
    "paths": {
      "@b2b-saas-starter-kit/validation": ["packages/validation/src/index.ts"]
    }
  }
}
```

This tells Nx that `@b2b-saas-starter-kit/validation` maps to the `validation` project.

### package.json Dependencies

Nx also considers `dependencies` in `package.json` files, but in a monorepo with path mappings, source code imports are the primary signal.

### Updating the Graph

The Project Graph updates automatically when you:

- Add/remove projects
- Change imports
- Modify TypeScript configs

**To visualize**: `pnpm nx graph` (opens an interactive HTML viewer)

---

## 7. Project Graph

The **Project Graph** is a visual representation of your workspace structure.

### Current State

Right now, the graph is empty (no projects).

### Future State

Once we add projects like `backend-api`, `admin-frontend`, `shared-types`, `shared-utils`, the graph might look like:

```
backend-api → shared-types
backend-api → shared-utils
admin-frontend → shared-types
admin-frontend → ui-components
ui-components → shared-utils
```

### Viewing the Graph

```bash
pnpm nx graph
```

This generates an interactive HTML file showing:

- **Nodes**: Projects
- **Edges**: Dependencies (A imports from B)
- **Colors**: Different colors for apps vs libraries

### Why It Matters

The graph is the foundation for:

- **Affected analysis**: Only rebuild what changed
- **Task orchestration**: Build dependencies before dependents
- **Architectural validation**: Detect circular dependencies or violated boundaries

---

## 8. Task Graph

The **Task Graph** is different from the Project Graph. It shows the order of task execution.

### Example

Given projects:

- `shared-types` (library)
- `shared-utils` (library, depends on `shared-types`)
- `backend-api` (app, depends on `shared-types` and `shared-utils`)

Running `pnpm nx build backend-api` creates this task graph:

```
build:shared-types
      ↓
build:shared-utils
      ↓
build:backend-api
```

Nx executes tasks in topological order, respecting dependencies.

### Parallelization

Nx runs independent tasks in parallel. If `admin-frontend` and `backend-api` don't depend on each other, `pnpm nx run-many -t build` builds them concurrently.

### Task Graph Visualization

You can see the task graph for a specific command:

```bash
pnpm nx build backend-api --graph
```

This shows which tasks will run and in what order.

---

## 9. Nx Caching

Caching is one of Nx's most powerful features. It makes repeated builds and tests nearly instant.

### What is Cached?

When you run a task (e.g., `pnpm nx build my-lib`), Nx caches:

- The **outputs** (e.g., compiled files in `dist/`)
- The **terminal output** (logs)

### Cache Key (Hash)

Nx generates a hash based on:

- **Inputs**: All files in the project (as defined by `namedInputs` in `nx.json`)
- **Command**: The task name and options (e.g., `build` vs `build --watch`)
- **Environment**: Runtime environment variables (if specified)
- **Dependencies**: Hashes of all dependent projects

If the hash is the same as a previous run, it's a **cache hit**.

### Local Cache

By default, Nx caches locally in `.nx/cache/` (gitignored).

**Cache hit behavior**:

- Nx replays the terminal output
- Nx restores the output files (e.g., copies from cache to `dist/`)
- The task completes in milliseconds

### Cache Miss

If inputs changed (e.g., you edited a source file), the hash changes. Nx runs the task for real and caches the new result.

### Inspecting Cache

```bash
# Clear the cache
pnpm nx reset
```

### Remote Caching (Future)

You can enable **Nx Cloud** (a service) to share caches across machines and CI.

Benefits:

- Team members benefit from each other's builds
- CI runs are faster (cache hits from local dev)
- No need to rebuild unchanged code in CI

**Not configured yet**. When we set it up, caching behavior stays the same, but the cache is stored remotely.

### Why Caching Matters

In a monorepo with 20 projects:

- Without cache: `pnpm nx run-many -t build` takes 10 minutes
- With cache (no changes): `pnpm nx run-many -t build` takes 5 seconds

In CI:

- Without cache: Every PR rebuild takes 10 minutes
- With cache: Only affected projects rebuild (maybe 1-2 minutes)

---

## 10. Affected Commands

In a monorepo, you rarely want to build/test everything. **Affected commands** run tasks only on projects that changed.

### How It Works

Nx compares the current state to a base commit (usually `main` or `origin/main`) and determines:

1. Which files changed
2. Which projects contain those files
3. Which projects depend on the changed projects (transitively)

Those are the "affected" projects.

### Example

You're on a feature branch. You changed `packages/shared-types/src/user.ts`.

Running:

```bash
pnpm nx affected -t build
```

Nx:

1. Detects `shared-types` changed
2. Finds all projects importing from `shared-types`: `backend-api`, `admin-frontend`
3. Builds: `shared-types`, `backend-api`, `admin-frontend`
4. Skips: `ui-components`, `shared-utils` (not affected)

### Common Affected Commands

```bash
# Build only affected projects
pnpm nx affected -t build

# Test only affected projects
pnpm nx affected -t test

# Lint only affected projects
pnpm nx affected -t lint

# Run multiple targets on affected projects
pnpm nx affected -t build,test,lint

# See which projects are affected (dry run)
pnpm nx affected:graph
```

### Base Commit

By default, Nx compares against `origin/main`. You can override:

```bash
pnpm nx affected -t build --base=HEAD~1  # Compare to previous commit
pnpm nx affected -t build --base=develop --head=HEAD
```

### Why Affected Commands Matter

In CI:

- **Without affected**: Every PR runs all tests (slow, expensive)
- **With affected**: Only test what changed (fast, cheap)

For a 50-project monorepo, this can reduce CI time from 30 minutes to 2 minutes.

---

## 11. Common Commands

Here are the Nx commands you'll use most often, with examples relevant to this workspace.

### `nx graph`

Visualizes the Project Graph.

```bash
pnpm nx graph
```

Opens an interactive HTML viewer. Useful for understanding project dependencies.

**Try it now**: You'll see an empty graph (no projects yet).

### `nx show projects`

Lists all projects in the workspace.

```bash
pnpm nx show projects
```

**Current output**: (empty)

**Future output**:

```
backend-api
admin-frontend
shared-types
shared-utils
ui-components
```

### `nx show project <project>`

Shows details about a specific project.

```bash
pnpm nx show project backend-api
```

Output includes:

- Root directory
- Available targets
- Implicit dependencies
- Tags

### `nx run <project>:<target>`

Runs a target on a project.

```bash
# Build a library
pnpm nx run shared-types:build

# Typecheck an app
pnpm nx run backend-api:typecheck

# Shorthand (same as above)
pnpm nx build shared-types
pnpm nx typecheck backend-api
```

### `nx run-many`

Runs a target on multiple projects.

```bash
# Build all projects
pnpm nx run-many -t build

# Build and test all projects
pnpm nx run-many -t build,test

# Build specific projects
pnpm nx run-many -t build -p backend-api,admin-frontend
```

### `nx affected`

Runs a target on affected projects (see [Affected Commands](#10-affected-commands)).

```bash
pnpm nx affected -t build
pnpm nx affected -t test
pnpm nx affected -t lint
```

### `nx reset`

Clears the Nx cache.

```bash
pnpm nx reset
```

Use this if:

- Cache is corrupted
- You want to measure real build time (without cache)
- Debugging caching issues

### `nx migrate`

Updates Nx and related packages.

```bash
# Check for updates
pnpm exec nx migrate latest

# Apply migrations
pnpm exec nx migrate --run-migrations
```

Nx provides automated migrations when upgrading major versions.

### Generators (`nx g`)

Creates new projects or code.

```bash
# Generate a TypeScript library
pnpm nx g @nx/js:lib packages/shared-types

# Generate a NestJS application
pnpm nx g @nx/nest:app apps/backend-api

# Generate a React + Vite application
pnpm nx g @nx/react:app apps/admin-frontend --bundler=vite

# List all available generators
pnpm exec nx list

# Show options for a generator
pnpm nx g @nx/js:lib --help
```

Generators scaffold code with Nx configuration built-in.

### `nx list`

Lists installed and available Nx plugins.

```bash
pnpm exec nx list
```

**Current output**:

```
Installed plugins:
  @nx/js
  @nx/nest
  @nx/react
  @nx/vite
  nx
```

### `nx sync`

Syncs TypeScript project references with the Project Graph.

```bash
pnpm nx sync
```

Nx automatically runs this during builds, but you can run it manually.

### `nx sync:check`

Checks if TypeScript project references are in sync (useful in CI).

```bash
pnpm nx sync:check
```

Exits with error if out of sync.

---

## 12. Nx Plugins

Plugins extend Nx's capabilities for specific technologies.

### What Plugins Do

1. **Generators**: Scaffold code (e.g., `pnpm nx g @nx/nest:app my-api`)
2. **Executors**: Run tasks (e.g., build, test, serve)
3. **Inferred tasks**: Automatically detect and configure targets based on file conventions

### Currently Installed

**`@nx/js`** (v23.1.1)

Provides TypeScript/JavaScript support:

- Generators: `@nx/js:lib` (create a library)
- Executors: `@nx/js:tsc` (TypeScript compiler)
- Inferred tasks: `build`, `typecheck` for TypeScript projects

**`@nx/nest`** (v23.1.1)

Provides NestJS support:

- Generators: `@nx/nest:app`, `@nx/nest:lib`
- Executors: `@nx/nest:build`, `@nx/nest:serve`
- Inferred tasks: Automatically configure NestJS projects

**`@nx/react`** (v23.1.1)

Provides React support:

- Generators: `@nx/react:app`, `@nx/react:component`
- Executors: `@nx/react:build`, `@nx/react:serve`

**`@nx/vite`** (v23.1.1)

Provides Vite bundler support:

- Executors: `@nx/vite:build`, `@nx/vite:dev`
- Optimized for fast dev servers
- Used with React applications

### Plugin Discovery

```bash
# List available plugins
pnpm exec nx list

# Show details about a plugin
pnpm exec nx list @nx/nest
```

### Custom Plugins

You can create your own Nx plugins for internal tooling. We may do this for:

- Custom code generators
- Internal build processes
- Shared CI workflows

---

## 13. Future Integration: NestJS and React/Vite

This section explains how NestJS and React/Vite will eventually fit into this Nx workspace.

### NestJS Integration

**Generating a NestJS app**:

```bash
pnpm nx g @nx/nest:app apps/backend-api
```

This creates:

```
apps/backend-api/
  src/
    app/
      app.controller.ts
      app.service.ts
      app.module.ts
    main.ts
  tsconfig.app.json
  tsconfig.json
  project.json
```

**Available targets** (auto-inferred):

- `pnpm nx serve backend-api` - Runs in dev mode with hot reload
- `pnpm nx build backend-api` - Compiles to `dist/apps/backend-api`
- `pnpm nx test backend-api` - Runs tests
- `pnpm nx lint backend-api` - Runs ESLint

**Importing shared libraries**:

```typescript
// apps/backend-api/src/app/app.service.ts
import {validateUser} from '@b2b-saas-starter-kit/validation'
import {UserDto} from '@b2b-saas-starter-kit/types'

@Injectable()
export class AppService {
  createUser(data: UserDto) {
    validateUser(data)
    // ...
  }
}
```

Nx ensures that `validation` and `types` libraries are built before `backend-api`.

### React + Vite Integration

**Generating a React app with Vite**:

```bash
pnpm nx g @nx/react:app apps/admin-frontend --bundler=vite
```

This creates:

```
apps/admin-frontend/
  src/
    app/
      App.tsx
      App.module.css
    main.tsx
  index.html
  vite.config.ts
  tsconfig.app.json
  tsconfig.json
  project.json
```

**Available targets**:

- `pnpm nx serve admin-frontend` - Runs Vite dev server (fast HMR)
- `pnpm nx build admin-frontend` - Builds for production
- `pnpm nx test admin-frontend` - Runs tests
- `pnpm nx lint admin-frontend` - Runs ESLint

**Importing shared libraries**:

```typescript
// apps/admin-frontend/src/app/App.tsx
import { UserDto } from '@b2b-saas-starter-kit/types';
import { Button } from '@b2b-saas-starter-kit/ui-components';

export function App() {
  const user: UserDto = { /* ... */ };
  return <Button>Hello {user.name}</Button>;
}
```

### Shared Libraries Across Backend and Frontend

One of the monorepo's biggest benefits: sharing code between backend and frontend.

**Example: Zod schemas**

```typescript
// packages/schemas/src/user.schema.ts
import {z} from 'zod'

export const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  age: z.number().min(18),
})

export type User = z.infer<typeof userSchema>
```

**Backend usage** (NestJS):

```typescript
import { userSchema, User } from '@b2b-saas-starter-kit/schemas';

@Post('/users')
createUser(@Body() data: unknown) {
  const user: User = userSchema.parse(data);  // Validates at runtime
  // ...
}
```

**Frontend usage** (React):

```typescript
import {userSchema, User} from '@b2b-saas-starter-kit/schemas'

function UserForm() {
  const handleSubmit = (data: unknown) => {
    const user: User = userSchema.parse(data) // Validates before API call
    // ...
  }
}
```

Single source of truth for validation logic!

---

## 14. What Should Be an Nx Project

Not everything should be a project. Here are guidelines:

### Should Be a Project

✅ **Applications**: Anything deployed independently

- Backend API servers
- Frontend apps
- CLI tools
- Admin dashboards

✅ **Shared Libraries**: Code used by 2+ projects

- Type definitions (`@org/types`)
- Validation schemas (`@org/schemas`)
- Utilities (`@org/utils`)
- UI component libraries (`@org/ui-components`)
- Feature modules (`@org/feature-auth`, `@org/feature-billing`)

✅ **Domain Libraries**: Bounded contexts in DDD

- `@org/domain-users`
- `@org/domain-tenants`
- `@org/domain-billing`

✅ **Tooling Libraries**: Internal dev tools

- Custom ESLint rules
- Test utilities
- Code generators

### Should NOT Be a Project

❌ **Small Utility Modules**: A single function or class

- Don't create `@org/capitalize-string` - put it in `@org/utils`

❌ **Configuration Files**: Shared configs

- Keep `.prettierrc`, `tsconfig.base.json` at the root

❌ **Documentation**: Markdown files

- Keep in `docs/` at the root

❌ **Scripts**: One-off scripts

- Keep in `scripts/` or `tools/` at the root

❌ **Test Fixtures**: Test data

- Keep in `__tests__` or `__fixtures__` within projects

### Granularity

**Too coarse**: A single `@org/shared` library with everything

- Hard to understand dependencies
- Changes affect too many projects

**Too fine**: Hundreds of tiny libraries

- Overhead in managing projects
- Harder to navigate

**Just right**: Group related code

- `@org/ui-components` (all UI components)
- `@org/backend-utils` (backend-specific utilities)
- `@org/frontend-utils` (frontend-specific utilities)

---

## 15. Using Libraries

Libraries are the building blocks of a monorepo. Here's how to use them effectively.

### Types of Libraries

**1. Shared Types/Schemas**

Purpose: Type definitions, interfaces, Zod schemas

Example:

```typescript
// packages/types/src/index.ts
export interface User {
  id: string
  email: string
  name: string
}

export interface Tenant {
  id: string
  name: string
}
```

Consumed by: All apps and libraries

**2. Utility Libraries**

Purpose: Pure functions, helpers

Example:

```typescript
// packages/shared/utils/src/index.ts
export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-')
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  // ...
}
```

Consumed by: All apps and libraries

**3. UI Component Libraries**

Purpose: Reusable React components

Example:

```typescript
// packages/ui-components/src/Button.tsx
export function Button({ children, onClick }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}
```

Consumed by: Frontend apps

**4. Backend Shared Libraries**

Purpose: Backend-specific code (e.g., database utilities, middleware)

Example:

```typescript
// packages/backend-utils/src/index.ts
export function createLogger(context: string) {
  // ...
}
```

Consumed by: Backend apps only

**5. Feature Libraries**

Purpose: Encapsulate a feature/domain (smart components, state, API calls)

Example:

```typescript
// packages/feature-auth/src/index.ts
export {AuthProvider} from './AuthProvider'
export {useAuth} from './useAuth'
export {login, logout} from './api'
```

Consumed by: Frontend apps

### Creating a Library

```bash
# Basic library
pnpm nx g @nx/js:lib packages/my-lib

# Publishable library (can be published to npm)
pnpm nx g @nx/js:lib packages/my-lib --publishable --importPath=@b2b-saas-starter-kit/my-lib
```

### Importing a Library

After creating a library, you can import it using the path alias:

```typescript
// From any app or library
import {something} from '@b2b-saas-starter-kit/my-lib'
```

Nx automatically updates `tsconfig.base.json` with the path mapping:

```json
{
  "compilerOptions": {
    "paths": {
      "@b2b-saas-starter-kit/my-lib": ["packages/my-lib/src/index.ts"]
    }
  }
}
```

### Organizing Library Code

**Public API** (`index.ts`):

```typescript
// packages/my-lib/src/index.ts
export {publicFunction} from './public'
// Don't export internal utilities
```

**Internal code**:

```typescript
// packages/my-lib/src/internal.ts
// This should NOT be exported from index.ts
export function internalHelper() {
  /* ... */
}
```

Only export what other projects should use. Keep implementation details private.

---

## 16. Project Boundaries and Dependency Constraints

Nx can enforce architectural rules through **dependency constraints**.

### What Are Project Boundaries?

In a large monorepo, you want to prevent:

- Backend code importing frontend code
- Frontend code importing backend code
- Shared libraries importing from apps
- Circular dependencies

**Project boundaries** are rules that define which projects can depend on which.

### Tagging Projects

First, tag projects by type or layer:

```json
// apps/backend-api/project.json
{
  "name": "backend-api",
  "tags": ["type:app", "scope:backend"]
}

// packages/shared-types/project.json
{
  "name": "shared-types",
  "tags": ["type:lib", "scope:shared"]
}

// packages/ui-components/project.json
{
  "name": "ui-components",
  "tags": ["type:lib", "scope:frontend"]
}
```

### Defining Constraints

Use ESLint with `@nx/eslint-plugin` to enforce constraints.

**Example configuration**:

```json
{
  "rules": {
    "@nx/enforce-module-boundaries": [
      "error",
      {
        "allow": [],
        "depConstraints": [
          {
            "sourceTag": "scope:backend",
            "onlyDependOnLibsWithTags": ["scope:backend", "scope:shared"]
          },
          {
            "sourceTag": "scope:frontend",
            "onlyDependOnLibsWithTags": ["scope:frontend", "scope:shared"]
          },
          {
            "sourceTag": "type:app",
            "onlyDependOnLibsWithTags": ["type:lib"]
          }
        ]
      }
    ]
  }
}
```

### What This Enforces

- `scope:backend` projects can only import from `scope:backend` or `scope:shared`
- `scope:frontend` projects can only import from `scope:frontend` or `scope:shared`
- `type:app` projects can only import from `type:lib` (apps can't import other apps)

### Violation Example

If `backend-api` tries to import from `ui-components`:

```typescript
// apps/backend-api/src/main.ts
import {Button} from '@b2b-saas-starter-kit/ui-components' // ❌ Violation!
```

ESLint will error:

```
A project tagged with "scope:backend" can only depend on libs tagged with "scope:backend" or "scope:shared"
```

### Benefits

1. **Prevents coupling**: Backend and frontend stay decoupled
2. **Enforces layering**: Apps depend on libs, not vice versa
3. **Catches mistakes early**: At lint time, not runtime
4. **Documents architecture**: Tags serve as documentation

**We haven't set this up yet**, but we will once we define our architecture.

---

## 17. Enforcing Architectural Boundaries

Beyond dependency constraints, Nx helps enforce broader architectural patterns.

### Layered Architecture

Example layers:

- **Apps**: Entry points (backend-api, admin-frontend)
- **Features**: High-level features (feature-auth, feature-billing)
- **UI**: UI components (ui-components, ui-layout)
- **Data Access**: API clients, database access (data-access-api, data-access-db)
- **Shared**: Pure utilities, types (shared-types, shared-utils)

**Rules**:

- Apps can import from any layer
- Features can import from UI, Data Access, Shared
- UI can import from Shared
- Data Access can import from Shared
- Shared cannot import from any other layer

Tag projects by layer and enforce with ESLint.

### Domain-Driven Design (DDD)

If using DDD, tag by domain:

```json
{ "tags": ["domain:users"] }
{ "tags": ["domain:tenants"] }
{ "tags": ["domain:billing"] }
```

Constraint: `domain:users` should not import from `domain:billing` (enforce bounded contexts).

### Module Boundaries

Nx's `@nx/eslint-plugin` can also prevent:

- Importing from internal paths (e.g., `@org/my-lib/src/internal` instead of `@org/my-lib`)
- Circular dependencies

### Visualizing Boundaries

```bash
pnpm nx graph
```

The graph visualizes dependencies. Look for:

- Circular dependencies (problematic)
- Unexpected dependencies (e.g., shared importing from app)

**We will define our architecture later**, but Nx gives us the tools to enforce it.

---

## 18. Nx in CI/CD

Nx is designed to make CI fast and efficient.

### Basic CI Setup

In CI (e.g., GitHub Actions), you want to:

1. Install dependencies
2. Run affected tasks (build, test, lint)
3. Only deploy if affected

**Example GitHub Actions workflow**:

```yaml
name: CI
on: [pull_request]

jobs:
  affected:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Needed for Nx affected
      - uses: pnpm/action-setup@v2
        with:
          version: 11.8.0
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm nx affected -t build,test,lint --base=origin/main
```

### Why `fetch-depth: 0`?

Nx needs git history to compute affected projects. `fetch-depth: 0` fetches all commits.

### Caching in CI

Without remote caching:

- Every CI run rebuilds everything (slow)

With **Nx Cloud** (remote caching):

- If a developer already built a project locally, CI skips it (cache hit)
- Shared cache across all CI jobs and developers

Setup:

```bash
pnpm exec nx connect
```

### Affected Deployment

Only deploy apps that changed:

```yaml
- name: Check if backend affected
  id: backend-affected
  run: pnpm nx show projects --affected | grep backend-api || echo "not-affected"

- name: Deploy backend
  if: contains(steps.backend-affected.outputs.stdout, 'backend-api')
  run: ./deploy-backend.sh
```

This prevents deploying unchanged apps.

### Distributed Task Execution (DTE)

Nx Cloud can distribute tasks across multiple machines:

- Split tests across 10 machines
- Each machine runs a subset of tasks
- Huge speedup for large monorepos

**We haven't set up CI yet**, but Nx makes it straightforward.

---

## 19. Nx + PNPM + TypeScript + Prettier

This workspace uses a stack of tools. Here's how they work together.

### Nx

**Role**: Monorepo orchestration, task running, caching, affected analysis

**Responsibilities**:

- Project discovery
- Task graph execution
- Caching
- Code generation (via plugins)

### PNPM

**Role**: Package manager

**Responsibilities**:

- Installing dependencies
- Managing workspace packages (`pnpm-workspace.yaml`)
- Linking local packages (e.g., `@b2b-saas-starter-kit/shared-types`)

**Why PNPM?**:

- Fast (uses content-addressable storage)
- Efficient (no duplicate packages across workspaces)
- Strict (no phantom dependencies)
- Supports Node.js 24

**Integration with Nx**:

- Nx runs PNPM commands (e.g., `pnpm install`)
- PNPM workspace structure aligns with Nx projects
- `packageManager` field in `package.json` ensures consistent version

### TypeScript

**Role**: Type checking and compilation

**Responsibilities**:

- Static type checking
- Transpiling TS to JS
- Project references (for incremental builds)

**Config hierarchy**:

- `tsconfig.base.json` - Root config (shared settings, path aliases)
- `packages/my-lib/tsconfig.json` - Project config (extends base)
- `packages/my-lib/tsconfig.lib.json` - Library-specific build config

**Integration with Nx**:

- Nx auto-updates `tsconfig.base.json` `paths` when creating projects
- Nx runs TypeScript compiler via `@nx/js:tsc` executor
- Nx syncs TypeScript project references with the Project Graph (`pnpm nx sync`)

### Prettier

**Role**: Code formatting

**Responsibilities**:

- Auto-format code (indentation, quotes, line length)

**Config**:

- `.prettierrc` (currently: `{ "singleQuote": true }`)
- `.prettierignore` (excludes `dist/`, `node_modules/`, etc.)

**Integration with Nx**:

- Nx can run Prettier via executors
- Usually run as a pre-commit hook (e.g., via Husky + lint-staged)

### How They Work Together

1. **Developer writes code** in TypeScript
2. **Nx** determines which projects changed
3. **Prettier** formats the code (on save or pre-commit)
4. **TypeScript** type-checks the code
5. **Nx** compiles projects (using TypeScript compiler) in dependency order
6. **Nx** caches the results
7. **PNPM** manages dependencies and linking

**Workflow**:

```bash
# Install dependencies
pnpm install

# Generate a library
pnpm nx g @nx/js:lib packages/my-lib

# Write code in packages/my-lib/src/index.ts

# Format code
pnpm exec prettier --write packages/my-lib/src/index.ts

# Typecheck
pnpm nx typecheck my-lib

# Build
pnpm nx build my-lib

# Run affected tasks
pnpm nx affected -t build,test,lint
```

---

## 20. Nx AI Integration

This workspace is configured with official Nx AI tooling for enhanced development in Cursor and other AI-assisted editors.

### What Nx Generated

When we ran the official Nx AI setup command (`pnpm exec nx configure-ai-agents`), Nx created:

1. **AGENTS.md** - General AI agent guidelines for working with Nx workspaces
2. **Skills** - 7 Nx-specific skills in Cursor-compatible format
3. **Nx MCP Server registration** - Model Context Protocol for deep workspace integration

### Why `.agents/` Existed Initially

Nx originally created `.agents/skills/` as a **cross-tool compatible** location. This directory format works with:

- Cursor
- Claude Code
- GitHub Copilot (with extensions)
- Codex
- Gemini CLI
- Other agents supporting the `SKILL.md` format

The `.agents/` naming convention signals "works with multiple AI agents" rather than being tool-specific.

### Current Cursor Configuration

**Location:** `.cursor/skills/`

For this explicitly Cursor-focused repository, skills were moved from `.agents/skills/` to `.cursor/skills/`. Both locations are recognized by Cursor, but `.cursor/` makes the Cursor-first intent clear.

**Structure:**

```
.cursor/
├── README.md                         # This Cursor setup documentation
└── skills/                           # Nx workspace skills
    ├── nx-workspace/                 # Explore projects, targets, dependencies
    │   ├── SKILL.md
    │   └── references/
    │       └── AFFECTED.md
    ├── nx-generate/                  # Scaffold apps and libraries
    │   └── SKILL.md
    ├── nx-run-tasks/                 # Execute build, test, lint tasks
    │   └── SKILL.md
    ├── nx-plugins/                   # Discover and add plugins
    │   └── SKILL.md
    ├── link-workspace-packages/      # Link monorepo dependencies
    │   └── SKILL.md
    ├── nx-import/                    # Import external projects
    │   ├── SKILL.md
    │   └── references/
    │       ├── ESLINT.md
    │       ├── JEST.md
    │       ├── NEXT.md
    │       ├── VITE.md
    │       ├── GRADLE.md
    │       └── TURBOREPO.md
    └── monitor-ci/                   # Monitor and fix Nx Cloud CI
        ├── SKILL.md
        └── references/
            └── fix-flows.md
```

### Skill Format

Each skill follows the **Cursor SKILL.md format**:

```markdown
---
name: skill-name
description: 'When to use this skill. TRIGGER WORDS.'
---

# Skill Title

Detailed instructions for the AI agent...
```

**YAML Frontmatter:**

- `name` - Skill identifier (must match directory name)
- `description` - When Cursor should invoke this skill

**Content:**

- Markdown instructions
- Code examples
- Reference documents (optional)
- Scripts (optional)

### Available Skills

**Core Nx Operations:**

1. **nx-workspace** - Explore workspace structure, query projects, understand dependencies
2. **nx-generate** - Scaffold new applications, libraries, and features
3. **nx-run-tasks** - Run builds, tests, lints; execute affected commands
4. **nx-plugins** - Discover and install Nx plugins

**Monorepo Management:** 5. **link-workspace-packages** - Wire up dependencies between PNPM workspace packages 6. **nx-import** - Import external repositories while preserving git history

**CI/CD:** 7. **monitor-ci** - Monitor Nx Cloud CI pipelines and apply self-healing fixes (requires Nx Cloud)

### How Cursor Discovers Skills

Cursor automatically scans for skills on startup in these locations:

| Location            | Scope                                 |
| ------------------- | ------------------------------------- |
| `.cursor/skills/`   | Project-level (this repo)             |
| `.agents/skills/`   | Project-level (cross-tool compatible) |
| `~/.cursor/skills/` | User-level (global, all projects)     |
| `~/.agents/skills/` | User-level (global, cross-tool)       |

**This workspace uses:** `.cursor/skills/` for Cursor-specific project skills.

### MCP Server Integration

The Nx MCP (Model Context Protocol) server provides real-time workspace context to Cursor.

**Setup:**

1. Install [Nx Console extension](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console) in Cursor
2. Cursor detects Nx Console and prompts to enable MCP server
3. Accept the prompt or manually run: Command Palette → `nx.configureMcpServer`

**What MCP Provides:**

- Live project graph data
- Workspace structure and configuration
- Target and task information
- Access to Nx documentation
- Real-time updates as workspace changes

The MCP server complements the skills: skills provide workflows and instructions, MCP provides live data.

### Usage

Skills are automatically invoked by Cursor when relevant. You don't need to explicitly call them.

**Examples:**

| You say...                | Cursor invokes... | Result                                      |
| ------------------------- | ----------------- | ------------------------------------------- |
| "Show all projects"       | `nx-workspace`    | Lists projects with `pnpm nx show projects` |
| "Create a React library"  | `nx-generate`     | Walks through library generation            |
| "Build affected projects" | `nx-run-tasks`    | Runs `pnpm nx affected -t build`            |
| "Add @nx/nest plugin"     | `nx-plugins`      | Installs and configures plugin              |

### What's NOT Included Yet

**Application-specific skills are intentionally absent:**

- NestJS architecture patterns
- React component guidelines
- Domain-driven design patterns
- API conventions
- Database schema patterns
- RBAC implementation guides
- Multi-tenancy patterns

These will be created **after** architectural decisions are made by investigating existing repositories.

### Agent Guidelines (from AGENTS.md)

Core principles for AI agents working with Nx:

1. **Navigation**: Use `nx-workspace` skill to explore before making changes
2. **Task Execution**: Always run tasks through Nx (`pnpm nx <command>`)
3. **Scaffolding**: Use `nx-generate` skill before creating projects
4. **Package Manager**: Prefix all nx commands with `pnpm`
5. **Documentation**: Use `nx_docs` MCP tool for advanced questions
6. **Flags**: Never guess CLI flags - always check `--help` first

### Benefits of This Setup

1. **Workspace Understanding** - Cursor knows your project structure
2. **Accurate Commands** - Generates correct PNPM-prefixed Nx commands
3. **Best Practices** - Follows official Nx workflows
4. **Context-Aware** - Understands project dependencies and constraints
5. **Efficient** - Avoids redundant exploration; uses cached knowledge
6. **Extensible** - Easy to add application-specific skills later

### Technical Details

**Skill Loading:**

- Cursor scans `.cursor/skills/` on startup
- Each directory with `SKILL.md` is registered as a skill
- Skills are matched against user intent via `description` field
- Relevant skills are loaded into context when needed

**Progressive Loading:**

- `SKILL.md` is loaded first (lightweight)
- `references/` are loaded on-demand (detailed docs)
- `scripts/` are executed only when needed
- Keeps context efficient

**Skill Format Standard:**

- YAML frontmatter is a quasi-standard across AI tools
- `SKILL.md` naming is consistent across Cursor, Claude Code, etc.
- Format is interoperable but tool discovery paths differ

---

_This AI setup was generated by `nx configure-ai-agents` and adapted for Cursor. Skills preserve official Nx knowledge and workflows._

---

## 21. Things You Should NOT Do

Here are common mistakes to avoid when working with Nx.

### ❌ Don't Bypass Nx

**Wrong**:

```bash
cd packages/my-lib
node build.js  # Bypasses Nx
```

**Right**:

```bash
pnpm nx build my-lib  # Uses Nx caching and task graph
```

**Why**: Bypassing Nx means no caching, no dependency ordering, no affected analysis.

### ❌ Don't Import from Internal Paths

**Wrong**:

```typescript
import {foo} from '@org/my-lib/src/internal'
```

**Right**:

```typescript
import {foo} from '@org/my-lib'
```

**Why**: Internal paths break encapsulation. The library's `index.ts` is the public API.

### ❌ Don't Create Circular Dependencies

**Wrong**:

```
lib-a imports from lib-b
lib-b imports from lib-a  // ❌ Circular!
```

**Why**: Circular dependencies break the task graph and cause build failures.

**Fix**: Extract shared code into a third library.

### ❌ Don't Manually Edit `tsconfig.base.json` Paths

**Wrong**: Manually adding path aliases:

```json
{
  "compilerOptions": {
    "paths": {
      "@org/my-lib": ["packages/my-lib/src/index.ts"] // Manual
    }
  }
}
```

**Right**: Let Nx manage this. Use generators:

```bash
pnpm nx g @nx/js:lib packages/my-lib
```

**Why**: Nx generators keep paths in sync with the project structure.

### ❌ Don't Use npm or npx

**Wrong**:

```bash
npx nx graph
npm install
```

**Right**:

```bash
pnpm nx graph
pnpm install
```

**Why**: This workspace is configured for PNPM exclusively. Using npm/npx can cause version mismatches.

### ❌ Don't Ignore Nx Cache Issues

If you see stale builds (cached old code), investigate. Common causes:

- Incorrect `namedInputs` configuration
- External files (outside project root) affecting builds

**Fix**: `pnpm nx reset` to clear cache, then investigate root cause.

### ❌ Don't Over-Nest Projects

**Wrong**:

```
packages/
  backend/
    my-feature/
      sub-feature/
        micro-lib/  // Too nested
```

**Right**:

```
packages/
  backend-my-feature/
  backend-sub-feature/
```

**Why**: Flat structure is easier to navigate. Nesting doesn't provide benefits in Nx.

### ❌ Don't Put Everything in One Library

**Wrong**: A single `shared` library with 50 unrelated utilities.

**Right**: Split into focused libraries:

- `shared-types`
- `shared-utils`
- `shared-validators`

**Why**: Smaller libraries improve caching and dependency clarity.

### ❌ Don't Skip `nx sync`

If TypeScript complains about missing references, run:

```bash
pnpm nx sync
```

**Why**: Keeps TypeScript project references in sync with the Project Graph.

### ❌ Don't Use `nx run-many` Without Filters

**Wrong**:

```bash
pnpm nx run-many -t test  # Runs tests for ALL projects
```

**Better**:

```bash
pnpm nx affected -t test  # Only affected projects
pnpm nx run-many -t test -p backend-*  # Only backend projects
```

**Why**: Unnecessary work wastes time and CI resources.

### ❌ Don't Commit Nx Cache

The `.nx/cache` folder is gitignored. Don't commit it.

**Why**: Cache is machine-specific and huge. Use remote caching (Nx Cloud) for shared caches.

### ❌ Don't Use Different Node/PNPM Versions

Ensure consistent versions across team and CI:

- Node.js 24.19.0 (from `.nvmrc`)
- PNPM 11.8.0 (from `package.json` `packageManager`)

**Solution**: Use `nvm use` and respect the `packageManager` field.

---

## 22. Learning Exercises

Here are practical exercises to learn Nx by working with this repository.

### Exercise 1: Inspect the Workspace

Run these commands and observe the output:

```bash
# Check Nx version
pnpm exec nx --version

# Check Node.js version
node --version  # Should be 24.19.0

# Check PNPM version
pnpm --version  # Should be 11.8.0

# List all projects (currently empty)
pnpm nx show projects

# View the project graph
pnpm nx graph

# List installed plugins
pnpm exec nx list
```

**Expected**: Graph is empty (no projects yet).

### Exercise 2: Create Your First Library

```bash
# Generate a TypeScript library
pnpm nx g @nx/js:lib packages/hello-world

# View the generated files
ls -la packages/hello-world

# Check the project graph again
pnpm nx graph
```

**Expected**: You'll see `hello-world` in the graph.

### Exercise 3: Build the Library

```bash
# Build the library
pnpm nx build hello-world

# Check the output
ls -la dist/packages/hello-world

# Build again (should be instant due to cache)
pnpm nx build hello-world
```

**Expected**: Second build is cached (completes in ~100ms).

### Exercise 4: Create a Second Library with a Dependency

```bash
# Generate another library
pnpm nx g @nx/js:lib packages/greeter

# Edit packages/greeter/src/lib/greeter.ts
# Add:
# export function greet(name: string) { return `Hello, ${name}!`; }

# Update packages/hello-world/src/lib/hello-world.ts to import from greeter
# Add:
# import { greet } from '@b2b-saas-starter-kit/greeter';
# export function sayHello() { return greet('World'); }

# View the project graph
pnpm nx graph
```

**Expected**: Graph shows `hello-world → greeter` dependency.

### Exercise 5: Observe Task Graph

```bash
# Build hello-world (should build greeter first)
pnpm nx build hello-world --verbose

# Observe the task order
```

**Expected**: Nx builds `greeter` before `hello-world`.

### Exercise 6: Test Caching

```bash
# Build both libraries
pnpm nx run-many -t build

# Clear the cache
pnpm nx reset

# Build again and time it
time pnpm nx run-many -t build

# Build again without clearing cache
time pnpm nx run-many -t build
```

**Expected**: Second build is much faster (cache hit).

### Exercise 7: Simulate a Change and Use Affected

```bash
# Make a change to greeter
echo "// Comment" >> packages/greeter/src/lib/greeter.ts

# See which projects are affected
pnpm nx affected:graph

# Build only affected projects
pnpm nx affected -t build
```

**Expected**: Both `greeter` and `hello-world` are affected.

### Exercise 8: Explore Generators

```bash
# List all generators for @nx/js
pnpm exec nx list @nx/js

# Show options for the library generator
pnpm nx g @nx/js:lib --help

# Generate a publishable library
pnpm nx g @nx/js:lib packages/publishable-example --publishable --importPath=@b2b-saas-starter-kit/publishable
```

**Expected**: Generated library has additional `package.json` configuration for publishing.

### Exercise 9: Inspect Project Configuration

```bash
# Show project details
pnpm nx show project hello-world

# Check tsconfig.base.json for path mappings
cat tsconfig.base.json | grep hello-world
```

**Expected**: Path alias `@b2b-saas-starter-kit/hello-world` is registered.

### Exercise 10: Test AI Integration

If using Cursor with Nx Console installed:

1. Ask the AI: "Show me all projects in this workspace"
2. Ask: "Generate a new library called utils"
3. Ask: "What targets are available for the hello-world project?"

**Expected**: AI uses the Nx MCP server to answer accurately.

### Exercise 11: Clean Up

```bash
# Delete the example libraries
rm -rf packages/hello-world packages/greeter packages/publishable-example

# Reset the cache
pnpm nx reset

# Verify projects are gone
pnpm nx show projects
```

**Expected**: Back to an empty workspace.

---

## Summary

This Nx workspace is now ready for building a B2B SaaS starter kit.

**Key takeaways**:

1. **Nx orchestrates** the monorepo, providing caching, affected analysis, and task graphs
2. **PNPM manages** packages and workspace linking (version 11.8.0)
3. **Node.js 24 LTS** is the active LTS version for production use
4. **TypeScript** provides type safety with project references
5. **Official plugins** (`@nx/nest`, `@nx/react`, `@nx/vite`) enable future app generation
6. **AI integration** through Nx MCP server and agent skills enhances development
7. **Libraries** are the unit of code sharing. Apps consume libraries
8. **Affected commands** ensure you only build/test what changed
9. **Caching** makes repeated builds near-instant
10. **Project boundaries** can enforce architectural rules

**Next steps** (after this guide):

1. Design the SaaS architecture (tenancy model, RBAC, modules)
2. Generate backend applications with NestJS
3. Generate frontend applications with React + Vite
4. Create shared libraries for types, utilities, and business logic
5. Configure testing with Vitest
6. Set up ESLint rules and architectural constraints
7. Configure CI/CD pipelines
8. Build features!

**Resources**:

- [Nx Documentation](https://nx.dev)
- [Nx Community Discord](https://go.nx.dev/community)
- [Nx Blog](https://nx.dev/blog)
- [Nx MCP Server](https://nx.dev/docs/reference/nx-mcp)

---

_This guide was created on August 16, 2026 for Nx v23.1.1, Node.js 24.19.0, and PNPM 11.8.0._
