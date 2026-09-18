import {RequestMethod} from '@nestjs/common'

/**
 * Unversioned probe path segments excluded from the global prefix and access logs.
 */
export class HealthProbePaths {
  static readonly segments = ['live', 'ready', 'health'] as const

  static matches(path: string): boolean {
    const normalized = (path.split('?')[0] ?? '').replace(/\/+$/, '') || '/'

    return HealthProbePaths.segments.some((segment) => {
      return normalized === `/${segment}` || normalized.endsWith(`/${segment}`)
    })
  }

  static globalPrefixExclude(): Array<{path: string; method: RequestMethod}> {
    return HealthProbePaths.segments.map((path) => ({path, method: RequestMethod.GET}))
  }
}
