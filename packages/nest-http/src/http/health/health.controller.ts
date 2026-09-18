import {Controller, Res, VERSION_NEUTRAL} from '@nestjs/common'

import {HttpStatus} from '@b2b-saas-starter-kit/contracts'

import {ApiRoute} from '../decorators/api-route.decorator'
import {Public} from '../decorators/public.decorator'
import {Response} from '../decorators/response.decorator'

import {HealthAggregator} from './health.aggregator'
import {HealthOutputDto} from './health.output'
import {HealthRoutes} from './health.routes'
import type {HealthHttpResponse} from './health-http-response.types'

@Controller({version: VERSION_NEUTRAL})
@Public()
export class HealthController {
  constructor(private readonly health: HealthAggregator) {}

  @ApiRoute(HealthRoutes.live)
  @Response({
    status: HttpStatus.OK,
    description: 'Process is up',
    type: HealthOutputDto,
  })
  live(): HealthOutputDto {
    return this.health.live()
  }

  @ApiRoute(HealthRoutes.ready)
  @Response({
    status: HttpStatus.OK,
    description: 'All dependencies are up',
    type: HealthOutputDto,
  })
  @Response({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'One or more dependencies are down',
    type: HealthOutputDto,
  })
  ready(@Res({passthrough: true}) response: HealthHttpResponse): Promise<HealthOutputDto> {
    return this.#writeReady(response)
  }

  @ApiRoute(HealthRoutes.health)
  @Response({
    status: HttpStatus.OK,
    description: 'All dependencies are up',
    type: HealthOutputDto,
  })
  @Response({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'One or more dependencies are down',
    type: HealthOutputDto,
  })
  healthAlias(@Res({passthrough: true}) response: HealthHttpResponse): Promise<HealthOutputDto> {
    return this.#writeReady(response)
  }

  async #writeReady(response: HealthHttpResponse): Promise<HealthOutputDto> {
    const body = await this.health.ready()

    if (body.status === 'error') {
      response.status(HttpStatus.SERVICE_UNAVAILABLE)
    }

    return body
  }
}
