import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

import type {EnvLoadConfigOptions} from '../config-loader.types'

/** Reads selected environment variables into a flat object of raw string values. */
export class EnvConfigSource {
  /**
   * Collects variables from `options.env` (default `process.env`) into a plain object.
   *
   * `undefined` values are dropped. When `prefix` is set, only matching variables are
   * included and the prefix is stripped from result keys. When `keys` is set, only those
   * names are read (with `prefix` applied on lookup). Values stay strings for the app's
   * (coercing) Zod schema to parse.
   *
   * @param options - Env-specific load options.
   * @returns Flat configuration object (not yet Zod-validated).
   */
  static load(options: EnvLoadConfigOptions): Record<string, unknown> {
    const {prefix, keys, env = process.env} = options
    const result: Record<string, unknown> = {}

    if (keys !== undefined) {
      for (const key of keys) {
        const lookup = prefix === undefined ? key : `${prefix}${key}`
        const value = env[lookup]

        if (!TypeScriptUtils.isNil(value)) {
          result[key] = value
        }
      }

      return result
    }

    for (const [name, value] of Object.entries(env)) {
      if (TypeScriptUtils.isNil(value)) {
        continue
      }

      if (prefix === undefined) {
        result[name] = value
      } else if (name.startsWith(prefix)) {
        result[name.slice(prefix.length)] = value
      }
    }

    return result
  }
}
