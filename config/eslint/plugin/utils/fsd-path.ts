import path from 'node:path'

const FSD_LAYERS = ['shared', 'features', 'pages', 'app'] as const

export type FsdLayer = (typeof FSD_LAYERS)[number]

const LAYER_RANK: Record<FsdLayer, number> = {
  shared: 0,
  features: 1,
  pages: 2,
  app: 3,
}

const APP_SRC_PATTERN = /(?:^|\/)apps\/(?:web|admin)\/src\//

const ALIAS_PATTERN = /^@\/(app|pages|features|shared)(?:\/|$)/

/**
 * Locates FSD layers inside `apps/web` and `apps/admin`.
 */
export class FsdPath {
  static normalize(filePath: string): string {
    return filePath.replaceAll('\\', '/')
  }

  static rank(layer: FsdLayer): number {
    return LAYER_RANK[layer]
  }

  static locate(filePath: string): FsdLayer | null {
    const normalized = FsdPath.normalize(filePath)
    const withSlash = normalized.endsWith('/') ? normalized : `${normalized}/`
    const appSrc = APP_SRC_PATTERN.exec(withSlash)

    if (!appSrc) {
      return null
    }

    const afterSrc = withSlash.slice(appSrc.index + appSrc[0].length)
    const folder = afterSrc.split('/')[0]

    if (folder === 'app' || folder === 'pages' || folder === 'features' || folder === 'shared') {
      return folder
    }

    return null
  }

  static locateSpecifier(fromFile: string, specifier: string): FsdLayer | null {
    const alias = ALIAS_PATTERN.exec(specifier)

    if (alias) {
      return alias[1] as FsdLayer
    }

    if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
      return null
    }

    const resolved = FsdPath.normalize(path.normalize(path.join(path.dirname(fromFile), specifier)))

    return FsdPath.locate(resolved)
  }
}
