import type {CallHandler, ExecutionContext, NestInterceptor} from '@nestjs/common'
import {Inject, Injectable} from '@nestjs/common'
import {Reflector} from '@nestjs/core'
import type {Observable} from 'rxjs'
import {from, lastValueFrom} from 'rxjs'

import type {RateLimiterPort} from '@b2b-saas-starter-kit/platform'
import {CacheKey, RATE_LIMITER, RateLimitExceededError} from '@b2b-saas-starter-kit/platform'

import {LoggerLocator} from '@b2b-saas-starter-kit/logger'

import type {RateLimitOptions} from './rate-limit.types'
import {RATE_LIMIT_KEY} from './rate-limit-key'
import {readClientIp} from './read-client-ip'
import type {ClientIpRequest} from './read-client-ip.types'

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(RATE_LIMITER) private readonly rateLimiter: RateLimiterPort,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions | undefined>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (options === undefined) {
      return next.handle()
    }

    return from(this.consume(context, next, options))
  }

  private async consume(context: ExecutionContext, next: CallHandler, options: RateLimitOptions): Promise<unknown> {
    const request = context.switchToHttp().getRequest<ClientIpRequest>()
    const key = CacheKey.global('rate-limit', options.bucket, readClientIp(request))

    try {
      const decision = await this.rateLimiter.consume(key, {
        limit: options.limit,
        windowSeconds: options.windowSeconds,
      })

      if (!decision.allowed) {
        throw new RateLimitExceededError(decision.retryAfterSeconds)
      }
    } catch (error) {
      if (error instanceof RateLimitExceededError) {
        throw error
      }

      LoggerLocator.get()
        .context(RateLimitInterceptor.name)
        .warn(error instanceof Error ? error : {err: error}, 'rate limiter failed; allowing request')
    }

    return lastValueFrom(next.handle())
  }
}
