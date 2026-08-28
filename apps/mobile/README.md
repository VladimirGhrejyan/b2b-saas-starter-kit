# Mobile host

Thin Capacitor shell. The WebView payload **is** the `apps/web` bundle (`nx build web` → `apps/web/dist`). This app has no product FSD (`features` / `pages`). Native `ios/` and `android/` trees are generated later with `cap add` and are not committed.

## Config

`capacitor.config.ts` sets `webDir` to `../web/dist`.

## Sync

```
pnpm nx build web
pnpm nx run mobile:sync
```

`mobile:sync` depends on `web:build`, then runs `cap sync`. Add platforms first (`pnpm exec cap add ios` / `android` from `apps/mobile`) when you need a native project.

## History mode

Capacitor typically serves the web assets over a local origin (`https://localhost` / `capacitor://`), so `createBrowserRouter` often works. If a platform uses `file://`, the same hash-router caveat as desktop applies. `apps/web` still uses `history: 'browser'`.

## Adapter injection

`createProductApp({ports, history})` in `apps/web` is the injection seam. This host still uses web adapters. Capacitor Preferences / Secure Storage adapters are deferred.
