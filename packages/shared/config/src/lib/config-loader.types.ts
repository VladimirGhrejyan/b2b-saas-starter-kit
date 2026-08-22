/**
 * Options for {@link ConfigLoader.load}.
 * Discriminated by `source` so loaders (yaml, env, future secrets manager) share one call shape.
 */
export type LoadConfigOptions = YamlLoadConfigOptions | EnvLoadConfigOptions

/** Load and merge YAML files from a directory, then validate with Zod. */
export type YamlLoadConfigOptions = {
  source: 'yaml'
  /** Absolute or relative path to the config directory. */
  directory: string
  /**
   * Explicit file names (relative to `directory`).
   * Default: all `*.yml` / `*.yaml` files, sorted; later files overwrite earlier keys.
   */
  files?: string[]
}

/**
 * Read environment variables into a flat object, then validate with Zod.
 *
 * Values are raw strings; use coercing schemas (`z.coerce.number()`, etc.) in the app.
 * This is the env-driven contract used by containers (`DATABASE_URL`, `REDIS_URL`, …).
 */
export type EnvLoadConfigOptions = {
  source: 'env'
  /**
   * Only include variables whose name starts with this prefix; the prefix is
   * stripped from the resulting keys (e.g. `prefix: 'APP_'` maps `APP_PORT` → `PORT`).
   */
  prefix?: string
  /**
   * Restrict to these variable names (looked up with `prefix` applied, if set).
   * Default: every defined variable (optionally filtered by `prefix`).
   */
  keys?: string[]
  /** Environment to read from. Defaults to `process.env`. */
  env?: Record<string, string | undefined>
}
