import path from 'node:path'

/** Bounded-context folders that must not import each other's internals. */
const BOUNDARY_CONTEXTS = new Set(['identity', 'tenancy', 'authorization', 'audit', 'notifications'])

/** Folders that any context may import (domain shared-kernel, application shared, api common). */
const SHARED_FOLDERS = new Set(['shared-kernel', 'shared', 'common'])

const API_SRC_PATTERN = /(?:^|\/)apps\/api\/src\//

const LAYER_PATTERNS = [
  /(?:^|\/)packages\/domain\/src\/([^/]+)\//,
  /(?:^|\/)packages\/application\/src\/([^/]+)\//,
  /(?:^|\/)packages\/composition(?:-[^/]+)?\/src\/([^/]+)\//,
  /(?:^|\/)packages\/infrastructure\/[^/]+\/src\/contexts\/([^/]+)\//,
  /(?:^|\/)packages\/infrastructure\/[^/]+\/src\/([^/]+)\//,
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

    const apiSrc = API_SRC_PATTERN.exec(withSlash)

    if (apiSrc) {
      const layerRoot = withSlash.slice(0, apiSrc.index + apiSrc[0].length)
      const afterSrc = withSlash.slice(apiSrc.index + apiSrc[0].length)
      const [folder, resource] = afterSrc.split('/')

      if (folder === 'modules' && resource) {
        return {layerRoot, segment: resource}
      }

      if (folder === 'common') {
        return {layerRoot, segment: 'common'}
      }
    }

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

  static isApiSrcLayer(layerRoot: string): boolean {
    return /(?:^|\/)apps\/api\/src\/$/.test(layerRoot)
  }

  static isRelativeSpecifier(specifier: string): boolean {
    return specifier.startsWith('./') || specifier.startsWith('../')
  }
}
