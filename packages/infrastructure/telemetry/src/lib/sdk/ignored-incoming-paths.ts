/**
 * Incoming HTTP paths that must not create traces or RED metrics.
 * Duplicated here because `layer:infrastructure` cannot import nest-http.
 */
export class IgnoredIncomingPaths {
  static matches(url: string | undefined): boolean {
    if (url === undefined || url.length === 0) {
      return false
    }

    const path = IgnoredIncomingPaths.#pathname(url.split('?')[0] ?? '').replace(/\/+$/, '') || '/'

    if (path === '/docs' || path.startsWith('/docs/') || path.startsWith('/docs-')) {
      return true
    }

    return IgnoredIncomingPaths.#probeSegments.some((segment) => {
      return path === `/${segment}` || path.endsWith(`/${segment}`)
    })
  }

  static #pathname(value: string): string {
    if (!value.includes('://')) {
      return value
    }

    return new URL(value).pathname
  }

  static readonly #probeSegments = ['live', 'ready', 'health'] as const
}
