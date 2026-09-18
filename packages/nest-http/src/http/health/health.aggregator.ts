import {Inject, Injectable, Optional} from '@nestjs/common'

import type {HealthOutput} from '@b2b-saas-starter-kit/contracts'

import type {HealthCheckResult, HealthIndicator} from '@b2b-saas-starter-kit/platform'
import {HEALTH_INDICATORS, HealthCheckStatus} from '@b2b-saas-starter-kit/platform'

/**
 * Aggregates {@link HealthIndicator} results into the contracts health envelope.
 */
@Injectable()
export class HealthAggregator {
  readonly #indicators: readonly HealthIndicator[]

  constructor(@Optional() @Inject(HEALTH_INDICATORS) indicators?: HealthIndicator | HealthIndicator[]) {
    if (indicators === undefined) {
      this.#indicators = []
    } else {
      this.#indicators = Array.isArray(indicators) ? indicators : [indicators]
    }
  }

  live(): HealthOutput {
    return {status: 'ok'}
  }

  async ready(): Promise<HealthOutput> {
    const entries = await Promise.all(
      this.#indicators.map(async (indicator) => {
        const result = await this.checkOne(indicator)

        return [indicator.name, result] as const
      }),
    )

    const checks = Object.fromEntries(entries)
    const allUp = Object.values(checks).every((check) => check.status === HealthCheckStatus.Up)

    return {
      status: allUp ? 'ok' : 'error',
      checks,
    }
  }

  private async checkOne(indicator: HealthIndicator): Promise<HealthCheckResult> {
    try {
      return await indicator.check()
    } catch {
      return {status: HealthCheckStatus.Down, message: 'unreachable'}
    }
  }
}
