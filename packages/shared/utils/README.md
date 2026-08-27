# `@b2b-saas-starter-kit/utils`

Shared pure utility library for the monorepo. Usable from NestJS/Node apps and React/browser apps.

**Path:** `packages/shared/utils`  
**Nx project:** `utils`  
**Tags:** `scope:shared`, `layer:utils`

## Purpose

Generic, framework-free helpers and TypeScript utility types. No domain logic, no Nest/React, no I/O, no Zod, no date library.

Architecture rules: [`docs/architecture/shared-packages.md`](../../../docs/architecture/shared-packages.md).

## Usage

```typescript
import {ObjectUtils, TypeScriptUtils, DateUtils} from '@b2b-saas-starter-kit/utils'
import type {WithRequired, NonEmptyArray} from '@b2b-saas-starter-kit/utils'

const keys = ObjectUtils.keys({a: 1, b: 2})
if (TypeScriptUtils.isNil(value)) {
  return
}
```

Import only from `@b2b-saas-starter-kit/utils`. Do not deep-import `src/lib/...` or fork helpers into local `utils.ts` files.

## API

### Runtime classes

| Class             | Role                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `ObjectUtils`     | Typed `keys` / `values` / `entries`, `pick` / `omit`, shallow `merge`, plain-object checks       |
| `ArrayUtils`      | Non-empty guards, `unique` / `uniqueBy`, `groupBy`, `partition`, `chunk`, `compact`, `filterMap` |
| `StringUtils`     | Blank checks, truncate, conservative ASCII casing (`camel` / `pascal` / `kebab` / `snake`)       |
| `NumberUtils`     | Finite / integer guards, range, `clamp`, `parseFinite`                                           |
| `DateUtils`       | UTC/ISO-only date helpers (no local timezone APIs)                                               |
| `TypeScriptUtils` | `isNil` / `isEmpty` / `isString` / `isNonEmptyString` / `isNumber`, assertions, exhaustiveness   |

### Utility types

`ObjectValue`, `WithRequired`, `WithOptional`, `RequireAtLeastOne`, `RequireExactlyOne`, `Nullable`, `Nullish`, `NonEmptyArray`

Built-in TypeScript utilities (`Partial`, `Pick`, `Omit`, `NonNullable`, …) are not re-exported.

## Design notes

- **Zero runtime dependencies.** Prefer native APIs unless typing or semantics justify a helper.
- **`DateUtils` is UTC/ISO-only.** Display formatting and IANA timezones are out of scope (revisit with `date-fns` later if needed).
- **`ObjectUtils.keys` / `values` / `entries`** are pragmatically typed (stronger than native JS guarantees; see JSDoc).
- **`ObjectUtils.merge`** is shallow and immutable — no `deepMerge` in this package.
- Prefer `NumberUtils.isFiniteNumber` over `TypeScriptUtils.isNumber` when validating numbers (`isNumber` allows `NaN` / `Infinity`).

## Extending

When a needed helper is generic and cross-cutting:

1. Add it to the correct class (or a new type file) under `src/lib/`.
2. Export from `src/index.ts`.
3. Add unit tests next to the implementation.
4. Document with JSDoc (`@param`, `@returns`, `@throws` where relevant).

Do **not** add SaaS/domain helpers (users, tenants, permissions, auth, API DTOs, TypeORM, Redis, …).

## Commands

```bash
pnpm nx run utils:typecheck
pnpm nx run utils:test
pnpm nx run utils:lint
```
