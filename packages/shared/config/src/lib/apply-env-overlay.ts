import {ObjectUtils, TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

/**
 * Copies selected env vars onto a config object at dot-paths.
 * Does not dump the entire environment. Nested objects are created as needed.
 */
export class EnvOverlay {
  static apply(
    target: Record<string, unknown>,
    overlay: Record<string, string>,
    env: NodeJS.ProcessEnv,
  ): Record<string, unknown> {
    const result = structuredClone(target)

    for (const [path, envKey] of Object.entries(overlay)) {
      const value = env[envKey]

      if (TypeScriptUtils.isNil(value)) {
        continue
      }

      EnvOverlay.setByPath(result, path, value)
    }

    return result
  }

  private static setByPath(target: Record<string, unknown>, path: string, value: unknown): void {
    const segments = path.split('.')
    let current = target

    for (const segment of segments.slice(0, -1)) {
      const next = current[segment]

      if (ObjectUtils.isPlainObject(next)) {
        current = next
        continue
      }

      const created: Record<string, unknown> = {}

      current[segment] = created

      current = created
    }

    const leaf = segments.at(-1)

    if (TypeScriptUtils.isNil(leaf) || leaf.length === 0) {
      throw new Error(`Invalid env overlay path "${path}"`)
    }

    current[leaf] = value
  }
}
