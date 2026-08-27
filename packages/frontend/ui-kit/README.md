# `@b2b-saas-starter-kit/ui-kit`

Presentation-only React package shared by `web` and `admin`. UI technology is **TBD** (ADR-030).

**Path:** `packages/frontend/ui-kit`  
**Nx project:** `ui-kit`  
**Tags:** `scope:frontend`, `layer:ui`

Architecture: [`docs/architecture/design-system.md`](../../../docs/architecture/design-system.md).

## Purpose

A real importable package so apps do not invent local buttons. The foundation surface is a native HTML `Button`. No Tailwind, Radix, shadcn, design tokens, or `ThemeProvider`.

Each primitive lives in its own folder (`src/<name>/`) with a colocated spec and a folder `index.ts`. The package entry re-exports public components only.

## Usage

```tsx
import {Button} from '@b2b-saas-starter-kit/ui-kit'
;<Button disabled={!canInvite} onClick={invite}>
  Invite member
</Button>
```

Default `type` is `"button"` (not submit). Callers may override `type`.

## Allowed imports

- `react` / `react-dom` (peer)
- `@b2b-saas-starter-kit/utils` (optional; not used yet)

Never import RTK, `contracts`, Nest, postgres, Tailwind, or Radix.

## Commands

```bash
pnpm nx run ui-kit:lint
pnpm nx run ui-kit:typecheck
pnpm nx run ui-kit:test
```

## Phase 12 Definition of Done

- [x] Package at `packages/frontend/ui-kit` with tags `scope:frontend`, `layer:ui`
- [x] Exports native `Button` only
- [x] No Tailwind, Radix, tokens, or `ThemeProvider`
- [x] Unit tests: render, default type, `disabled`, `onClick`
