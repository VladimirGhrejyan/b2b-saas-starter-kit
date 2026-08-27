# Nx Boundaries & Enforcement

The source of truth for how the architecture is enforced mechanically. Scope/layer tags, `@nx/enforce-module-boundaries`, folder-level context isolation (`@b2b-saas-starter-kit/no-cross-context-imports`), domain-purity `no-restricted-imports`, and platform-purity `no-restricted-imports` are active.

Related: [`workspace-topology.md`](./workspace-topology.md), [`bounded-contexts.md`](./bounded-contexts.md).

## Two-axis tag taxonomy

Every Nx project carries a **scope** tag and a **layer** tag.

**`scope:*`** — which side of the world it belongs to:

- `scope:shared` — usable by backend and frontend
- `scope:backend`
- `scope:frontend`

**`layer:*`** — its architectural layer:

- `layer:shared-types`, `layer:contracts`, `layer:utils`, `layer:config` (shared leaves)
- `layer:domain`, `layer:application`, `layer:platform`, `layer:infrastructure`, `layer:nest-http`, `layer:composition` (backend)
- `layer:logger` — extra tag on the `logger` project so `type:app` can bootstrap Pino without being allowed to import `postgres`
- `layer:ui`, `layer:frontend-core`, `layer:feature` (frontend)
- `type:app` for applications

| Project                                 | Tags                                                    |
| --------------------------------------- | ------------------------------------------------------- |
| `shared-kernel-types`                   | `scope:shared`, `layer:shared-types`                    |
| `contracts`                             | `scope:shared`, `layer:contracts`                       |
| `utils`                                 | `scope:shared`, `layer:utils`                           |
| `config`                                | `scope:shared`, `layer:config`                          |
| `domain`                                | `scope:backend`, `layer:domain`                         |
| `application`                           | `scope:backend`, `layer:application`                    |
| `platform`                              | `scope:backend`, `layer:platform`                       |
| `postgres` (later `redis`, `messaging`) | `scope:backend`, `layer:infrastructure`                 |
| `logger`                                | `scope:backend`, `layer:infrastructure`, `layer:logger` |
| `nest-http`                             | `scope:backend`, `layer:nest-http`                      |
| `composition`                           | `scope:backend`, `layer:composition`                    |
| `frontend/ui-kit`                       | `scope:frontend`, `layer:ui`                            |
| `frontend/core`                         | `scope:frontend`, `layer:frontend-core`                 |
| `apps/api`,`apps/worker`                | `scope:backend`, `type:app`                             |
| `apps/web`,`apps/admin`                 | `scope:frontend`, `type:app`                            |

## Dependency constraints (`@nx/enforce-module-boundaries`)

Intended constraints (illustrative shape, to be added to ESLint config during implementation):

```jsonc
{
  "depConstraints": [
    // scope isolation
    {"sourceTag": "scope:shared", "onlyDependOnLibsWithTags": ["scope:shared"]},
    {"sourceTag": "scope:backend", "onlyDependOnLibsWithTags": ["scope:backend", "scope:shared"]},
    {"sourceTag": "scope:frontend", "onlyDependOnLibsWithTags": ["scope:frontend", "scope:shared"]},

    // backend layer direction (inward only)
    {"sourceTag": "layer:domain", "onlyDependOnLibsWithTags": ["layer:shared-types"]},
    {"sourceTag": "layer:platform", "onlyDependOnLibsWithTags": ["layer:shared-types"]},
    {"sourceTag": "layer:contracts", "onlyDependOnLibsWithTags": ["layer:shared-types"]},
    {
      "sourceTag": "layer:application",
      "onlyDependOnLibsWithTags": ["layer:domain", "layer:platform", "layer:shared-types", "layer:utils"],
    },
    {
      "sourceTag": "layer:infrastructure",
      "onlyDependOnLibsWithTags": [
        "layer:domain",
        "layer:application",
        "layer:platform",
        "layer:shared-types",
        "layer:utils",
        "layer:config",
      ],
    },
    {
      "sourceTag": "layer:nest-http",
      "onlyDependOnLibsWithTags": [
        "layer:contracts",
        "layer:platform",
        "layer:shared-types",
        "layer:utils",
        "layer:config",
      ],
    },
    {
      "sourceTag": "layer:composition",
      "onlyDependOnLibsWithTags": [
        "layer:domain",
        "layer:application",
        "layer:infrastructure",
        "layer:platform",
        "layer:shared-types",
        "layer:utils",
        "layer:config",
      ],
    },

    // frontend
    {"sourceTag": "layer:ui", "onlyDependOnLibsWithTags": ["layer:utils"]},
    {
      "sourceTag": "layer:frontend-core",
      "onlyDependOnLibsWithTags": ["layer:contracts", "layer:shared-types", "layer:utils", "layer:config"],
    },
    {
      "sourceTag": "layer:feature",
      "onlyDependOnLibsWithTags": [
        "layer:ui",
        "layer:frontend-core",
        "layer:contracts",
        "layer:shared-types",
        "layer:utils",
      ],
    },

    // apps compose libs; apps never depend on apps
    {
      "sourceTag": "type:app",
      "onlyDependOnLibsWithTags": [
        "layer:composition",
        "layer:nest-http",
        "layer:logger",
        "layer:ui",
        "layer:frontend-core",
        "layer:feature",
        "layer:contracts",
        "layer:shared-types",
        "layer:utils",
        "layer:config",
      ],
    },
  ],
}
```

### The forbidden edges (why they matter)

- `domain → anything but shared-types` — keeps the domain pure (no ORM, no framework, no contracts).
- `application → contracts` — keeps use cases decoupled from the wire format (mapping happens in `apps/api`).
- `application → infrastructure` — enforces dependency inversion (application uses ports, not adapters).
- `scope:shared → scope:backend|frontend` — a shared package can never pull framework/infra code.
- `scope:backend ↔ scope:frontend` — the two never import each other.
- `type:app → type:app` — apps don't depend on other apps.
- `type:app → postgres/domain/application` — apps stay thin; delivery helpers live in `nest-http`, wiring in `composition`. Bootstrap may import `logger` (`layer:logger`) without opening `postgres`.
- `nest-http → domain/application/postgres` — the HTTP kit is delivery, not composition.

## Context isolation (the gap layer-first leaves)

Because contexts are **folders** within layer projects, Nx cannot separate them as projects. Context isolation is therefore enforced with a **folder-level import lint** (e.g. `eslint-plugin-boundaries` or targeted `no-restricted-imports`) with rules like:

- Within `domain/src/<A>`, do not import from `domain/src/<B>` (A ≠ B), except from `domain/src/shared-kernel`.
- Same rule across `application/src/*`, `infrastructure/*/<context>`, `composition/src/*`.
- Cross-context interaction is allowed **only** via the sanctioned mechanisms in [`bounded-contexts.md`](./bounded-contexts.md): ID references, domain events, or another context's **application** use case.

Frontend FSD layering (`app → pages → features → shared`) is enforced by the same folder-level lint inside each app.

## Import order (carried convention)

`eslint-plugin-simple-import-sort` groups imports to make layers visible (external → shared leaves → domain → application → platform → infrastructure → relative), and `import type` is required for type-only imports. This is a readability/consistency aid layered on top of the hard boundaries above.

## What Nx enforcement buys us

- **Compile/lint-time guarantees** for the layer dependency rule and FE/BE separation — not conventions.
- **`affected`**: touching `domain` marks its dependents affected; CI builds/tests only what changed.
- **Visible blast radius**: `nx graph` shows the DAG; a boundary violation fails lint in CI.

## Enforcement responsibility matrix

| Rule                               | Enforced by                                                  |
| ---------------------------------- | ------------------------------------------------------------ |
| Layer dependency direction         | Nx `@nx/enforce-module-boundaries` (tags)                    |
| Frontend/backend separation        | Nx scope tags                                                |
| Shared purity (no framework/infra) | Nx scope tags                                                |
| Context isolation                  | Folder-level ESLint import boundaries                        |
| FSD layering within apps           | Folder-level ESLint import boundaries                        |
| Domain purity (no TypeORM/Nest)    | Nx tags + ESLint `no-restricted-imports` on `layer:domain`   |
| Platform purity (no TypeORM/Nest)  | Nx tags + ESLint `no-restricted-imports` on `layer:platform` |
| Import order / type imports        | `simple-import-sort` + `consistent-type-imports`             |
