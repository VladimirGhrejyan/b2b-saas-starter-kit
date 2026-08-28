# Desktop host

Thin Electron shell. The renderer **is** the `apps/web` bundle (`nx build web` → `apps/web/dist`). This app has no product FSD (`features` / `pages`).

## Run

```
pnpm nx build web
pnpm nx serve desktop
```

`desktop:serve` depends on `desktop:build` and `web:build`.

## History mode

`createBrowserRouter` (used by `apps/web`) expects a real HTTP origin. Loading `apps/web/dist/index.html` with `file://` can break deep links and refreshes.

`createAppRouter` already accepts `history: 'hash'`. The SPA still boots with `history: 'browser'` — do not switch it in this host. A custom protocol or hash router can land later.

## Adapter injection

`createProductApp({ports, history})` in `apps/web` is the injection seam. This host still uses web adapters (`createWebPorts()`). Native `StoragePort` / `LinkingPort` adapters (for example `safeStorage`) are deferred; they would be wired through preload `contextBridge`, not imported from product features.
