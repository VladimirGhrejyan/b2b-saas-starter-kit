# Frontend UI kit

Shared presentation library for `web` and `admin`. UI **technology is TBD** — this document defines the **package boundary**, not a component/CSS stack.

Related: [`frontend.md`](./frontend.md). ADR: [ADR-030](./decisions.md).

## Ownership

**Decision:** one presentation library, `packages/frontend/ui-kit` (`@b2b-saas-starter-kit/ui-kit`), tags `scope:frontend`, `layer:ui`.

It owns reusable presentational components. It is **presentation-only**: no data fetching, no business logic, no RTK, no `contracts` dependency for behavior. It may use `utils`.

**Not in this package (until a later ADR):** Tailwind, Radix, shadcn, CSS-variable tokens, `ThemeProvider`, light/dark theming, per-tenant branding.

## Foundation surface

The kit ships so apps import a real package instead of inventing local buttons. The only component for now is a native HTML button:

```tsx
import type {ButtonHTMLAttributes} from 'react'

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} />
}
```

No class libraries, no CSS framework, no theme wrapper.

## Deferred (product goals, not current implementation)

Per-tenant white-labeling (brand color, light/dark, runtime tokens) remains a **later** design-system concern. It is **not** implemented until UI technology is chosen. Do not add a `ThemeProvider` or token layer as a placeholder.

## What does NOT go in `ui-kit`

- API calls, RTK Query, business rules (those live in `frontend/core` / features).
- App-specific layouts that aren't reusable (keep in the app until shared).
- Tailwind, Radix, shadcn, or any other UI stack until an ADR selects them.
