import {ObjectUtils} from '@b2b-saas-starter-kit/utils'

/**
 * Deep-merges plain objects. Later source keys win. Nested mappings merge;
 * arrays and scalars are replaced (not concatenated).
 */
export class DeepMerge {
  static merge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {...target}

    for (const [key, value] of Object.entries(source)) {
      const existing = result[key]

      if (ObjectUtils.isPlainObject(existing) && ObjectUtils.isPlainObject(value)) {
        result[key] = DeepMerge.merge(existing, value)
        continue
      }

      result[key] = value
    }

    return result
  }
}
