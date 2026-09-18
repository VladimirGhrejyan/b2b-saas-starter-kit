import {Inject, Injectable} from '@nestjs/common'
import type {DataSource} from 'typeorm'

import type {HealthCheckResult, HealthIndicator} from '@b2b-saas-starter-kit/platform'
import {HealthCheckStatus} from '@b2b-saas-starter-kit/platform'

import {DATA_SOURCE} from '../tokens'

/**
 * Readiness probe for Postgres. Uses {@link DATA_SOURCE} directly — no UnitOfWork or tenant ALS.
 */
@Injectable()
export class PostgresHealthIndicator implements HealthIndicator {
  readonly name = 'postgres'

  constructor(@Inject(DATA_SOURCE) private readonly dataSource: DataSource) {}

  async check(): Promise<HealthCheckResult> {
    try {
      await this.dataSource.query('SELECT 1')

      return {status: HealthCheckStatus.Up}
    } catch {
      return {status: HealthCheckStatus.Down, message: 'unreachable'}
    }
  }
}
