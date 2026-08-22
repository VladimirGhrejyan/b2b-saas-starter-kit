# B2B SaaS Starter Kit

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

A production-ready Nx monorepo foundation for building multi-tenant B2B SaaS applications.

## What is This?

This is an **Nx workspace** configured with official plugins for:

- **NestJS** (backend applications)
- **React + Vite** (frontend applications)
- **TypeScript** (shared libraries)
- **AI-assisted development** (Nx MCP server, agent skills)

The workspace is currently **empty by design**. No applications or libraries have been generated yet. This allows you to design your architecture and generate projects when ready.

## Technology Stack

**Environment:**

- Node.js 24.x LTS (Active LTS)
- PNPM 11.8.0 (package manager)
- Nx 23.1.1 (monorepo orchestration)

**Future Stack:**

- Backend: NestJS, TypeScript, Postgres, TypeORM, Redis, Zod, Vitest
- Frontend: React, Vite, TypeScript, Redux Toolkit, Tailwind CSS, Zod, Vitest
- Shared: TypeScript, Zod, Vitest

## Getting Started

### Prerequisites

1. **Install Node.js 24.x LTS:**

   ```bash
   nvm use
   ```

   This reads the version from `.nvmrc` and activates Node.js 24.19.0.

2. **Install PNPM 11.8.0:**

   ```bash
   npm install -g pnpm@11.8.0
   ```

3. **Install dependencies:**
   ```bash
   pnpm install
   ```

### Workspace Structure

```
.
├── apps/              # Future applications (NestJS APIs, React frontends)
├── packages/          # Shared + future libs (`packages/shared/utils`, …)
├── docs/              # Documentation (Nx guide + architecture)
├── .cursor/           # Cursor skills and engineering rules
├── AGENTS.md          # AI agent instructions (for Cursor, etc.)
├── eslint.config.mts  # Root ESLint flat config (entry; fragments in config/eslint/)
├── config/eslint/     # Split ESLint config modules (class-based)
├── config/commitlint/ # Commitlint config + conventions plugin
├── config/conventions.json # Task prefix, commit types, exempt branches
├── scripts/git/       # Commit/branch convention helpers (Husky hooks)
├── tsconfig.base.json # Strict shared TypeScript defaults
├── tsconfig.node.json # Nest / Node overlay (`types: ["node"]`)
├── tsconfig.browser.json # React / Vite overlay (DOM + bundler)
├── tsconfig.tooling.json # Root tooling (eslint, commitlint, scripts)
├── .nvmrc             # Node.js version (24.19.0)
├── nx.json            # Nx workspace configuration
├── package.json       # Root package with workspace dependencies
└── pnpm-workspace.yaml # PNPM workspace configuration
```

## Common Commands

### Explore the Workspace

```bash
# View the project graph (currently empty)
pnpm nx graph

# List all projects (none yet)
pnpm nx show projects

# List installed Nx plugins
pnpm exec nx list

# Show Nx version
pnpm exec nx --version
```

### Generate Projects

When ready to create applications and libraries:

```bash
# Generate a NestJS application
pnpm nx g @nx/nest:application apps/backend-api

# Generate a React + Vite application
pnpm nx g @nx/react:application apps/admin-frontend --bundler=vite

# Generate a TypeScript library
pnpm nx g @nx/js:library packages/shared-types
```

### Run Tasks

```bash
# Run a target on a specific project
pnpm nx <target> <project-name>

# Examples:
pnpm nx build backend-api
pnpm nx serve admin-frontend
pnpm nx test shared-types

# Run a target on multiple projects
pnpm nx run-many -t build

# Run only on affected projects (after changes)
pnpm nx affected -t build,test,lint
```

### Formatting & Linting

```bash
# Format all files (Prettier)
pnpm format

# Check formatting without writing
pnpm format:check

# Lint the workspace (ESLint flat config)
pnpm lint

# Auto-fix lint issues where possible
pnpm lint:fix

# Once packages exist, prefer Nx-inferred targets:
pnpm nx run-many -t lint
pnpm nx affected -t lint
```

**Git hooks (Husky):**

- `pre-commit` — runs lint-staged (ESLint + Prettier on staged files)
- `prepare-commit-msg` — on feature branches, auto-prefixes a bare subject with `type(task-id):` from the branch name
- `commit-msg` — runs Commitlint (`type(task-id): subject`)
- `pre-push` — validates branch name format

**Conventions** (see [`config/conventions.json`](config/conventions.json); set `taskPrefix` per project):

- Branch: `<type>/<task-id>/<kebab-description>`  
  Example: `feature/VC-1/add-x-functionality`
- Commit: `<type>(<task-id>): <subject>`  
  Example: `feature(VC-1): add x functionality`
- Allowed types: `feature`, `fix`, `hotfix`, `refactor`, `build`, `chore`, `docs`, `test`, `ci`
- Exempt branches (no branch-format / branch↔commit match): `main`, `master`, `develop`, `release/*`, `hotfix/*`, `dependabot/**`

```bash
# Validate the current branch name manually
pnpm git:validate-branch
```

### TypeScript configs

Layered configs (keep **strict**; do not add `allowImportingTsExtensions` to the base):

| Config                  | Use for                                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| `tsconfig.base.json`    | Shared domain libs (no Node/DOM APIs)                                                               |
| `tsconfig.node.json`    | Nest apps, Node libs, workers                                                                       |
| `tsconfig.browser.json` | React/Vite apps and frontend libs                                                                   |
| `tsconfig.tooling.json` | Root eslint / commitlint / `scripts/**` (Node types + bundler resolution for extensionless imports) |

**Relative imports** are always extensionless (`from './foo'`, never `from './foo.ts'`). Cross-package imports use workspace names (`@b2b-saas-starter-kit/...`).

After generating an app, prefer extending the matching overlay (`tsconfig.node.json` or `tsconfig.browser.json`) instead of only the base.

### Workspace Maintenance

```bash
# Sync TypeScript project references
pnpm nx sync

# Clear Nx cache
pnpm nx reset

# Check for Nx updates
pnpm nx migrate latest
```

## AI Integration

This workspace is configured with the Nx MCP server and AI agent skills for enhanced development in AI-assisted editors like Cursor.

**Files:**

- `AGENTS.md` - Instructions for AI agents on working with Nx
- `.cursor/skills/` - Nx-specific skills for workspace exploration and code generation
- `.cursor/rules/` - Engineering rules aligned with `docs/architecture/`

**Installation:**

- Install the [Nx Console extension](https://nx.dev/getting-started/editor-setup) in your editor
- The MCP server will be automatically configured when using Cursor or VS Code

## Documentation

📖 **[Read the Nx Guide](docs/nx_guide.md)** - Comprehensive guide covering:

- Nx concepts (workspace, projects, targets, plugins, caching, affected)
- Project Graph and Task Graph
- How to use Nx with PNPM
- Integration with NestJS and React/Vite
- Common commands and workflows
- Things to avoid
- Practical learning exercises

## Next Steps

1. **Read the Nx guide:** [docs/nx_guide.md](docs/nx_guide.md)
2. **Read the architecture:** [docs/architecture/overview.md](docs/architecture/overview.md)
3. **Shared utils:** import generic helpers from `@b2b-saas-starter-kit/utils` (`packages/shared/utils`); extend in-package when needed
4. **Generate applications** — Create backend and frontend apps when ready
5. **Create more shared libraries** — `packages/shared/contracts` and `packages/shared/kernel-types` (config already at `packages/shared/config`)
6. **Tighten ESLint TODOs** — Enable package tags / context-isolation once projects exist
7. **Set up CI/CD** — Configure GitHub Actions after architecture scaffolding

## Learn More

- [Nx Documentation](https://nx.dev)
- [Nx on GitHub](https://github.com/nrwl/nx)
- [Nx Community Discord](https://go.nx.dev/community)
- [Nx Blog](https://nx.dev/blog)

## License

MIT
