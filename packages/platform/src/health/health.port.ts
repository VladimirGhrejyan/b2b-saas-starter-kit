import type {HealthCheckResult} from './health.types'

/**
 * Dependency probe used by readiness. Implementations must not throw — return `down` on failure.
 */
export interface HealthIndicator {
  readonly name: string
  check(): Promise<HealthCheckResult>
}
