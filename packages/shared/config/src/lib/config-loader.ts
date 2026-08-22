import type {ZodType} from 'zod'

import {EnvConfigSource} from './sources/env-config.source'
import {YamlConfigSource} from './sources/yaml-config.source'
import type {LoadConfigOptions} from './config-loader.types'
import {ConfigValidationError} from './config-validation.error'

/**
 * Loads application configuration from a pluggable source and validates it with Zod.
 *
 * Apps own schemas and value files; this class owns how values are obtained.
 * Call explicitly from bootstrap / Vite plugins — do not load at module import time.
 *
 * `options` is a discriminated union on `source` (`'yaml' | 'env'`); the loader branches
 * on `options.source` and delegates to the matching source.
 */
export class ConfigLoader {
  /**
   * Loads raw config from `options.source`, then validates against `schema`.
   *
   * @param schema - Zod schema describing the expected config shape.
   * @param options - Discriminated load options (`source: 'yaml' | 'env'`).
   * @returns Validated, typed configuration.
   * @throws {ConfigValidationError} If Zod validation fails.
   * @throws {Error} If the source cannot load (missing dir/files, invalid YAML shape, …).
   */
  static load<T>(schema: ZodType<T>, options: LoadConfigOptions): T {
    const raw = ConfigLoader.loadRaw(options)
    const result = schema.safeParse(raw)

    if (!result.success) {
      throw new ConfigValidationError(result.error)
    }

    return result.data
  }

  private static loadRaw(options: LoadConfigOptions): Record<string, unknown> {
    if (options.source === 'yaml') {
      return YamlConfigSource.load(options)
    }

    return EnvConfigSource.load(options)
  }
}
