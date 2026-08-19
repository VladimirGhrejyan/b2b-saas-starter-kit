# DevEx tooling gaps

Local quality gates are already in place (ESLint/Prettier, Husky, Commitlint, branch conventions, layered TypeScript, Cursor/Nx skills). This list covers what is still missing for a smooth monorepo DevEx once apps and packages land.

## Do next (highest leverage)

### 1. CI with `nx affected`

- Add GitHub Actions (or equivalent) for PR checks: `lint`, `typecheck`, `test`, `build`
- Prefer `pnpm nx affected` over full `run-many` so unchanged projects are skipped
- Align with the CI outline in `docs/nx_guide.md` and the README “Next Steps”

### 2. Nx Cloud

- Enable remote caching so local and CI share task outputs
- Consider distributed task execution later as the graph grows
- Pair with the existing `monitor-ci` Cursor skill once Cloud is connected

### 3. Editor defaults

- Expand `.vscode/extensions.json` beyond Nx Console + Prettier (e.g. ESLint)
- Add `.vscode/settings.json`: format on save, ESLint flat config, workspace TypeScript version
- Reduces “works on my machine” formatting/lint drift

### 4. Dependency hygiene

- Renovate or Dependabot for automated updates (branch exemptions already include `dependabot/**`)
- pnpm catalogs and/or syncpack so Nest/React/shared packages share Zod, Vitest, TypeScript versions

### 5. `nx sync` / project-reference check in CI

- Fail PRs when TypeScript project references drift
- Cheap guardrail for the composite / layered `tsconfig` setup

## Soon after first apps exist

### 6. Local infra (Docker Compose)

- Postgres + Redis to match the planned stack
- One-command local dependencies for Nest `serve` / integration tests

### 7. Vitest as a workspace standard

- Shared Vitest config/presets via Nx
- Today Vitest is only used for custom ESLint plugin tests

### 8. Knip

- Detect unused exports, dependencies, and files
- Complements the custom file-structure ESLint rules

### 9. Secret scanning

- gitleaks (or similar) in pre-commit and/or CI
- Important once real `.env*` usage and third-party services appear

### 10. CODEOWNERS + PR template

- Lightweight process DevEx for ownership and consistent review checklists

## Defer until there is real product surface

| Tool                            | When                                        |
| ------------------------------- | ------------------------------------------- |
| Playwright                      | E2E against running apps                    |
| Storybook                       | Design-system / UI library work             |
| Changesets / release automation | Publishing versioned packages               |
| OpenAPI codegen                 | Stable API contracts between Nest and React |
| Docker image build pipelines    | Deployable artifacts                        |

## Explicitly out of scope for now

- More ESLint plugins (coverage is already strong)
- Lefthook (Husky already owns hooks)
- Turborepo (workspace is on Nx)

## Suggested order

1. CI with `nx affected`
2. Nx Cloud
3. VS Code settings / extensions
4. Renovate (or Dependabot) + syncpack / catalogs
5. Docker Compose when the first Nest app is generated
