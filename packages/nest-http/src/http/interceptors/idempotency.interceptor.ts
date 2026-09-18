import type {CallHandler, ExecutionContext, NestInterceptor} from '@nestjs/common'
import {Inject, Injectable} from '@nestjs/common'
import {HTTP_CODE_METADATA} from '@nestjs/common/constants'
import {Reflector} from '@nestjs/core'
import type {Observable} from 'rxjs'
import {from, lastValueFrom} from 'rxjs'

import {DateUtils, TypeScriptUtils} from '@b2b-saas-starter-kit/utils'
import {HttpStatus} from '@b2b-saas-starter-kit/contracts'

import type {Clock, IdempotencyPort, UnitOfWork} from '@b2b-saas-starter-kit/platform'
import {
  CLOCK,
  IDEMPOTENCY,
  IdempotencyClaimKind,
  IdempotencyInProgressError,
  IdempotencyKeyRequiredError,
  IdempotencyKeyReusedError,
  IdempotencyScopeUnavailableError,
  RequestContextLocator,
  UNIT_OF_WORK,
} from '@b2b-saas-starter-kit/platform'

import {IDEMPOTENT_KEY} from '../decorators/idempotent-key'

import type {IdempotencyIncomingRequest, IdempotencyOutgoingResponse} from './idempotency.interceptor.types'
import {IdempotencyFingerprint} from './idempotency-fingerprint'
import {IdempotencyHeader} from './idempotency-header'

/**
 * Claims an idempotency key before the handler and stores the successful response in the same UnitOfWork.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(IDEMPOTENCY) private readonly idempotency: IdempotencyPort,
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const enabled = this.reflector.getAllAndOverride<boolean | undefined>(IDEMPOTENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (enabled !== true) {
      return next.handle()
    }

    return from(this.handleMarkedRoute(context, next))
  }

  private async handleMarkedRoute(context: ExecutionContext, next: CallHandler): Promise<unknown> {
    const request = context.switchToHttp().getRequest<IdempotencyIncomingRequest>()
    const response = context.switchToHttp().getResponse<IdempotencyOutgoingResponse>()
    const key = IdempotencyHeader.read(request.headers)

    if (key === undefined || !IdempotencyHeader.isValid(key)) {
      throw new IdempotencyKeyRequiredError()
    }

    const scope = IdempotencyInterceptor.scope()
    const method = request.method ?? 'POST'
    const path = IdempotencyInterceptor.routePath(request)
    const endpoint = `${method} ${path}`
    const fingerprint = IdempotencyFingerprint.hash(method, path, request.body)
    const expiresAt = DateUtils.addUtcHours(this.clock.now(), IdempotencyHeader.ttlHours)

    return this.uow.run(async () => {
      const claim = await this.idempotency.claim({scope, endpoint, key, fingerprint, expiresAt})

      if (claim.kind === IdempotencyClaimKind.Replay) {
        response.status(claim.statusCode)

        return claim.body
      }

      if (claim.kind === IdempotencyClaimKind.InFlight) {
        throw new IdempotencyInProgressError()
      }

      if (claim.kind === IdempotencyClaimKind.FingerprintMismatch) {
        throw new IdempotencyKeyReusedError()
      }

      const result: unknown = await lastValueFrom<unknown>(next.handle())

      await this.idempotency.complete({
        scope,
        endpoint,
        key,
        statusCode: this.statusCode(context, response),
        body: result,
      })

      return result
    })
  }

  private statusCode(context: ExecutionContext, response: IdempotencyOutgoingResponse): number {
    const fromMetadata = this.reflector.get<number | undefined>(HTTP_CODE_METADATA, context.getHandler())

    if (fromMetadata !== undefined) {
      return fromMetadata
    }

    return response.statusCode || HttpStatus.OK
  }

  private static scope(): string {
    const context = RequestContextLocator.get()

    if (TypeScriptUtils.isNonEmptyString(context?.tenantId)) {
      return `t:${context.tenantId}`
    }

    if (TypeScriptUtils.isNonEmptyString(context?.actorId)) {
      return `u:${context.actorId}`
    }

    throw new IdempotencyScopeUnavailableError()
  }

  private static routePath(request: IdempotencyIncomingRequest): string {
    if (TypeScriptUtils.isNonEmptyString(request.route?.path)) {
      return request.route.path
    }

    const url = request.url ?? ''

    return url.split('?')[0] || 'unmatched'
  }
}
