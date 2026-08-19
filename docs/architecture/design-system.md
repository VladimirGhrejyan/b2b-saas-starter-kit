# Design System & Tenant Theming

A single, themeable `frontend/ui` library shared by `web` and `admin`, built to support **per-tenant white-labeling** — at minimum brand-color customization, with light/dark support.

Related: [`frontend.md`](./frontend.md).

## Ownership

**Decision:** one design-system library, `packages/frontend/ui`, owns:

- Components (built on **shadcn/ui** patterns over **Radix** primitives).
- **Design tokens** expressed as **CSS variables**.
- A shared **Tailwind preset** mapping utility classes to those tokens.
- The `ThemeProvider` that applies tenant branding at runtime.

`ui` is presentation-only: no data fetching, no business logic, no `contracts` dependency for behavior. It may use `utils`.

## Why shadcn + Radix + Tailwind for theming

- **Radix** gives unstyled, accessible primitives — accessibility survives any theming because behavior is decoupled from appearance.
- **shadcn/ui** components are copied into `ui` and styled with Tailwind classes that reference **semantic tokens**, not hard-coded colors.
- **Tailwind** (via a shared preset) resolves those semantic utilities to **CSS variables**, which is what makes runtime, per-tenant re-theming possible **without rebuilding**.

## Token layering

Three levels keep branding flexible but consistent:

```
1. Primitive tokens      --color-brand-500, --radius-md         (raw scale values)
2. Semantic tokens       --background, --foreground, --primary, (roles that components use)
                         --primary-foreground, --border, --ring
3. Component usage        bg-primary text-primary-foreground     (Tailwind → var(--primary))
```

Components only ever reference **semantic** tokens. Branding changes a small set of primitives/semantics; every component updates automatically.

```css
/* ui/theme/base.css — defaults (light) */
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --primary: 222 47% 40%; /* overridden per tenant */
  --primary-foreground: 0 0% 100%;
  --ring: var(--primary);
  --radius: 0.5rem;
}
.dark {
  --background: 222 47% 11%;
  --foreground: 0 0% 98%;
  /* … */
}
```

```ts
// ui/tailwind-preset.ts (shared by web + admin tailwind configs)
export default {
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        // border, ring, muted, accent, destructive, …
      },
      borderRadius: {lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)'},
    },
  },
}
```

## Runtime per-tenant branding

Tenant branding (brand color, optional logo, radius, light/dark preference) is **tenant configuration data**, loaded at runtime and applied by injecting CSS variables — no rebuild, no per-tenant bundle.

```tsx
// ui/ThemeProvider.tsx
export function ThemeProvider({branding, children}: {branding: TenantBranding; children: ReactNode}) {
  useEffect(() => {
    const root = document.documentElement
    if (branding.primaryHsl) root.style.setProperty('--primary', branding.primaryHsl)
    if (branding.radius) root.style.setProperty('--radius', branding.radius)
    root.classList.toggle('dark', branding.mode === 'dark')
  }, [branding])
  return <>{children}</>
}
```

- **Where branding comes from:** a tenant-settings endpoint (part of the `tenancy` context) returns the active tenant's branding; the app passes it to `ThemeProvider`. The **shape** of branding is defined in `contracts` so backend and frontend agree.
- **Scope:** applied on `:root` for a single-tenant session; can be scoped to a container if multiple tenants ever render together.
- **Minimum viable customization:** brand color + light/dark. Extensible to logo, accent, radius, and a fuller token set.

## Accessibility & consistency guarantees

- Radix ensures keyboard/focus/ARIA correctness regardless of theme.
- Because components consume only semantic tokens, a tenant cannot break contrast rules by editing raw component styles — they adjust tokens within validated ranges (branding input is validated via its `contracts` schema; contrast-safe foreground tokens are derived where feasible).
- One `ui` library ⇒ `web` and `admin` stay visually consistent while each tenant can be branded.

## What does NOT go in `ui`

- API calls, RTK Query, business rules (those live in `frontend/core` / features).
- Tenant-fetching logic (the app fetches branding and hands it to `ThemeProvider`).
- App-specific layouts that aren't reusable (keep in the app until shared).
