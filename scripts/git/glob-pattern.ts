/** Glob / RegExp helpers for branch exemption patterns. */
export class GlobPattern {
  static escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /** Supports `*` (one segment) and `**` (any depth). */
  static toRegExp(glob: string): RegExp {
    const tokenized = glob.replace(/\*\*/g, '@@DOUBLE@@').replace(/\*/g, '@@SINGLE@@')
    const escaped = GlobPattern.escapeRegExp(tokenized)
      .replace(/@@DOUBLE@@/g, '.*')
      .replace(/@@SINGLE@@/g, '[^/]+')

    return new RegExp(`^${escaped}$`)
  }
}
