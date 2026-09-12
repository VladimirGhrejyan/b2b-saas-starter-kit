import type {IncomingHttpHeaders} from 'node:http'

import type {CallHandler, ExecutionContext, NestInterceptor} from '@nestjs/common'
import {ForbiddenException, Inject, Injectable, UnauthorizedException} from '@nestjs/common'
import {Reflector} from '@nestjs/core'
import type {Observable} from 'rxjs'
import {from, lastValueFrom} from 'rxjs'

import {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {TenantContext} from '@b2b-saas-starter-kit/composition'
import {AssertActiveMembership, TENANT_CONTEXT} from '@b2b-saas-starter-kit/composition'

import {IS_PUBLIC_KEY, RequestContextLocator} from '@b2b-saas-starter-kit/nest-http'

import {readHeader} from '../http/read-header'

import type {DevPrincipal} from './dev-principal.types'
import {DEV_PRINCIPAL_KEY} from './dev-principal-key'
import {JwtAccessService} from './jwt-access.service'
import {TENANT_OPTIONAL_KEY} from './tenant-optional-key'

@Injectable()
export class AuthPrincipalInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtAccessService,
    private readonly assertActiveMembership: AssertActiveMembership,
    @Inject(TENANT_CONTEXT) private readonly tenantContext: TenantContext,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return next.handle()
    }

    return from(this.authenticate(context, next))
  }

  private async authenticate(context: ExecutionContext, next: CallHandler): Promise<unknown> {
    const request = context.switchToHttp().getRequest<{headers: IncomingHttpHeaders} & Record<string, unknown>>()
    const tenantOptional = this.reflector.getAllAndOverride<boolean>(TENANT_OPTIONAL_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    const bearer = this.readBearer(request.headers)

    if (bearer !== undefined) {
      const claims = await this.jwt.verify(bearer)

      return this.bindPrincipal(request, next, claims.userId, claims.tenantId, tenantOptional)
    }

    if (this.jwt.nodeEnv === 'development' || this.jwt.nodeEnv === 'test') {
      return this.authenticateFromHeaders(request, next, tenantOptional)
    }

    throw new UnauthorizedException('Authorization bearer token is required')
  }

  private async authenticateFromHeaders(
    request: {headers: IncomingHttpHeaders} & Record<string, unknown>,
    next: CallHandler,
    tenantOptional: boolean,
  ): Promise<unknown> {
    const userIdRaw = readHeader(request.headers, 'x-user-id')

    if (userIdRaw === undefined) {
      throw new UnauthorizedException('x-user-id is required')
    }

    const tenantIdRaw = readHeader(request.headers, 'x-tenant-id')
    const tenantId = tenantIdRaw === undefined ? undefined : TenantId.parse(tenantIdRaw)

    return this.bindPrincipal(request, next, UserId.parse(userIdRaw), tenantId, tenantOptional)
  }

  private async bindPrincipal(
    request: Record<string, unknown>,
    next: CallHandler,
    userId: UserId,
    tenantId: TenantId | undefined,
    tenantOptional: boolean,
  ): Promise<unknown> {
    if (tenantId === undefined) {
      if (!tenantOptional) {
        throw new UnauthorizedException('tenant is required')
      }

      request[DEV_PRINCIPAL_KEY] = {userId} satisfies DevPrincipal
      RequestContextLocator.bind({actorId: userId})

      return lastValueFrom(next.handle())
    }

    const membership = await this.assertActiveMembership.findActive(userId, tenantId)

    if (membership === null) {
      throw new ForbiddenException('active membership is required')
    }

    request[DEV_PRINCIPAL_KEY] = {userId, tenantId} satisfies DevPrincipal
    RequestContextLocator.bind({actorId: userId, tenantId})

    return this.tenantContext.run({tenantId, actorId: userId}, () => lastValueFrom(next.handle()))
  }

  private readBearer(headers: IncomingHttpHeaders): string | undefined {
    const authorization = readHeader(headers, 'authorization')

    if (authorization === undefined) {
      return undefined
    }

    const match = /^Bearer\s+(\S+)$/i.exec(authorization)

    if (match?.[1] === undefined) {
      throw new UnauthorizedException('Authorization bearer token is invalid')
    }

    return match[1]
  }
}
