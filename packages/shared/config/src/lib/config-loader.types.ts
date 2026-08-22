/**
 * Options for {@link ConfigLoader.load}.
 * Discriminated by `source` so future loaders (env, secrets manager) can extend the union.
 */
export type LoadConfigOptions = YamlLoadConfigOptions

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
