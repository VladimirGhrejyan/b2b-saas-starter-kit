import {randomUUID} from 'node:crypto'

import type {CallHandler, ExecutionContext, NestInterceptor} from '@nestjs/common'
import {Injectable} from '@nestjs/common'
import type {Observable} from 'rxjs'
import {from, lastValueFrom} from 'rxjs'

import {DateUtils, TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

import type {RequestContext} from '@b2b-saas-starter-kit/platform'
import {LoggerLocator, RequestContextLocator} from '@b2b-saas-starter-kit/platform'

import {REQUEST_CONTEXT_KEY} from '../request-context-key'

import {REQUEST_ID_HEADER, REQUEST_ID_RESPONSE_HEADER, SWAGGER_PATH_PREFIX} from './http-request.constants'
import type {HttpIncomingRequest, HttpOutgoingResponse} from './http-request.interceptor.types'

@Injectable()
export class HttpRequestInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<HttpIncomingRequest>()
    const response = context.switchToHttp().getResponse<HttpOutgoingResponse>()

    if (this.isSwaggerPath(request)) {
      return next.handle()
    }

    const store: RequestContext = {requestId: this.resolveRequestId(request)}

    request[REQUEST_CONTEXT_KEY] = store
    response.setHeader(REQUEST_ID_RESPONSE_HEADER, store.requestId)

    const startedAt = new Date()

    response.once('finish', () => {
      this.logAccess(request, response, store, DateUtils.diffUtcMs(new Date(), startedAt))
    })

    return from(RequestContextLocator.run(store, () => lastValueFrom(next.handle())))
  }

  private isSwaggerPath(request: HttpIncomingRequest): boolean {
    const path = (request.originalUrl ?? request.url ?? '').split('?')[0] ?? ''

    return (
      path === SWAGGER_PATH_PREFIX ||
      path.startsWith(`${SWAGGER_PATH_PREFIX}/`) ||
      path.startsWith(`${SWAGGER_PATH_PREFIX}-`)
    )
  }

  private resolveRequestId(request: HttpIncomingRequest): string {
    const header = request.headers[REQUEST_ID_HEADER]

    if (TypeScriptUtils.isNonEmptyString(header)) {
      return header
    }

    if (Array.isArray(header) && TypeScriptUtils.isNonEmptyString(header[0])) {
      return header[0]
    }

    return randomUUID()
  }

  private logAccess(
    request: HttpIncomingRequest,
    response: HttpOutgoingResponse,
    store: RequestContext,
    durationMs: number,
  ): void {
    const statusCode = response.statusCode
    const payload = {
      method: request.method ?? 'UNKNOWN',
      route: this.resolveRoute(request),
      statusCode,
      durationMs,
      requestId: store.requestId,
      ...(store.tenantId === undefined ? {} : {tenantId: store.tenantId}),
      ...(store.actorId === undefined ? {} : {actorId: store.actorId}),
    }

    const logger = LoggerLocator.get().context('http')

    if (statusCode >= 500) {
      logger.error(payload, 'request completed')

      return
    }

    if (statusCode >= 400) {
      logger.warn(payload, 'request completed')

      return
    }

    logger.info(payload, 'request completed')
  }

  private resolveRoute(request: HttpIncomingRequest): string {
    const routePath = request.route?.path

    if (TypeScriptUtils.isNonEmptyString(routePath)) {
      return routePath
    }

    return 'unmatched'
  }
}
