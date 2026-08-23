import path from 'node:path'

/** Bounded-context folders that must not import each other's internals. */
const BOUNDARY_CONTEXTS = new Set(['identity', 'tenancy', 'authorization', 'audit', 'notifications'])

/** Folders that any context may import (domain shared-kernel, application shared). */
const SHARED_FOLDERS = new Set(['shared-kernel', 'shared'])

const LAYER_PATTERNS = [
  /(?:^|\/)packages\/domain\/src\/([^/]+)\//,
  /(?:^|\/)packages\/application\/src\/([^/]+)\//,
  /(?:^|\/)packages\/composition(?:-[^/]+)?\/src\/([^/]+)\//,
  /(?:^|\/)packages\/infrastructure-[^/]+\/src\/([^/]+)\//,
  /(?:^|\/)packages\/infrastructure-[^/]+\/([^/]+)\//,
] as const

export type ContextLocation = {
  layerRoot: string
  segment: string
}

/**
 * Locates the layer root and context (or shared) folder for a backend source file.
 */
export class ContextPath {
  static normalize(filePath: string): string {
    return filePath.replaceAll('\\', '/')
  }

  static locate(filePath: string): ContextLocation | null {
    const normalized = ContextPath.normalize(filePath)
    const withSlash = normalized.endsWith('/') ? normalized : `${normalized}/`

    for (const pattern of LAYER_PATTERNS) {
      const match = pattern.exec(withSlash)

      if (!match) {
        continue
      }

      const segment = match[1]

      if (!segment || (!BOUNDARY_CONTEXTS.has(segment) && !SHARED_FOLDERS.has(segment))) {
        continue
      }

      return {
        layerRoot: withSlash.slice(0, match.index + match[0].length - segment.length - 1),
        segment,
      }
    }

    return null
  }

  static resolveRelative(fromFile: string, specifier: string): string {
    return ContextPath.normalize(path.normalize(path.join(path.dirname(fromFile), specifier)))
  }

  static isSharedFolder(segment: string): boolean {
    return SHARED_FOLDERS.has(segment)
  }

  static isBoundaryContext(segment: string): boolean {
    return BOUNDARY_CONTEXTS.has(segment)
  }

  static isRelativeSpecifier(specifier: string): boolean {
    return specifier.startsWith('./') || specifier.startsWith('../')
  }
}
