import {ObjectUtils, TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

/**
 * Reads `COUNT(*)` from a raw SQL result row.
 */
export class SqlCount {
  static parse(rows: unknown): number {
    if (!Array.isArray(rows) || rows[0] === undefined || !ObjectUtils.isPlainObject(rows[0])) {
      return 0
    }

    const count = rows[0].count

    if (TypeScriptUtils.isNumber(count)) {
      return count
    }

    if (TypeScriptUtils.isString(count)) {
      return Number(count)
    }

    return 0
  }
}
