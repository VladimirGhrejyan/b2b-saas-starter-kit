import type {IncomingHttpHeaders} from 'node:http'

import type {CallHandler, ExecutionContext, NestInterceptor} from '@nestjs/common'
import {ForbiddenException, Inject, Injectable, UnauthorizedException} from '@nestjs/common'
import {Reflector} from '@nestjs/core'
import type {Observable} from 'rxjs'
import {from, lastValueFrom} from 'rxjs'

import type {ApiKeyId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'
import {
  apiKeyActor,
  TenantActorKind,
  TenantId as TenantIdBrand,
  userActor,
  UserId as UserIdBrand,
} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {TenantContext} from '@b2b-saas-starter-kit/platform'
import {TENANT_CONTEXT} from '@b2b-saas-starter-kit/platform'

import {applyActiveSpanAttributes} from '@b2b-saas-starter-kit/telemetry'

import {AssertActiveMembership, ResolveApiKeyQuery, TouchApiKeyLastUsed} from '@b2b-saas-starter-kit/composition'

import {IS_PUBLIC_KEY, RequestContextLocator} from '@b2b-saas-starter-kit/nest-http'

import {readHeader} from '../../http/read-header'
import {JwtAccessService} from '../jwt/jwt-access.service'

import type {AuthPrincipal} from './dev-principal.types'
import {DEV_PRINCIPAL_KEY} from './dev-principal-key'
import {TENANT_OPTIONAL_KEY} from './tenant-optional-key'

@Injectable()
export class AuthPrincipalInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtAccessService,
    private readonly assertActiveMembership: AssertActiveMembership,
    private readonly resolveApiKey: ResolveApiKeyQuery,
    private readonly touchApiKeyLastUsed: TouchApiKeyLastUsed,
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

    if (bearer !== undefined && bearer.startsWith('bsk_')) {
      return this.authenticateApiKey(request, next, bearer)
    }

    if (bearer !== undefined) {
      const claims = await this.jwt.verify(bearer)

      return this.bindUserPrincipal(request, next, claims.userId, claims.tenantId, tenantOptional)
    }

    if (this.jwt.nodeEnv === 'development' || this.jwt.nodeEnv === 'test') {
      return this.authenticateFromHeaders(request, next, tenantOptional)
    }

    throw new UnauthorizedException('Authorization bearer token is required')
  }

  private async authenticateApiKey(
    request: Record<string, unknown>,
    next: CallHandler,
    token: string,
  ): Promise<unknown> {
    const resolved = await this.resolveApiKey.execute(token)

    if (resolved === null) {
      throw new UnauthorizedException('API key is invalid')
    }

    await this.touchApiKeyLastUsed.execute(resolved.apiKeyId)

    const principal = {
      kind: TenantActorKind.apiKey,
      apiKeyId: resolved.apiKeyId,
      tenantId: resolved.tenantId,
    } satisfies AuthPrincipal

    request[DEV_PRINCIPAL_KEY] = principal
    RequestContextLocator.bind({
      actorId: resolved.apiKeyId,
      actorKind: TenantActorKind.apiKey,
      tenantId: resolved.tenantId,
    })
    this.applySpanAttributes(resolved.apiKeyId, resolved.tenantId)

    return this.tenantContext.run({tenantId: resolved.tenantId, actor: apiKeyActor(resolved.apiKeyId)}, () =>
      lastValueFrom(next.handle()),
    )
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
    const tenantId = tenantIdRaw === undefined ? undefined : TenantIdBrand.parse(tenantIdRaw)

    return this.bindUserPrincipal(request, next, UserIdBrand.parse(userIdRaw), tenantId, tenantOptional)
  }

  private async bindUserPrincipal(
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

      request[DEV_PRINCIPAL_KEY] = {kind: TenantActorKind.user, userId} satisfies AuthPrincipal
      RequestContextLocator.bind({actorId: userId, actorKind: TenantActorKind.user})
      this.applySpanAttributes(userId)

      return lastValueFrom(next.handle())
    }

    const membership = await this.assertActiveMembership.findActive(userId, tenantId)

    if (membership === null) {
      throw new ForbiddenException('active membership is required')
    }

    request[DEV_PRINCIPAL_KEY] = {kind: TenantActorKind.user, userId, tenantId} satisfies AuthPrincipal
    RequestContextLocator.bind({actorId: userId, actorKind: TenantActorKind.user, tenantId})
    this.applySpanAttributes(userId, tenantId)

    return this.tenantContext.run({tenantId, actor: userActor(userId)}, () => lastValueFrom(next.handle()))
  }

  private applySpanAttributes(actorId: UserId | ApiKeyId, tenantId?: TenantId): void {
    applyActiveSpanAttributes({
      requestId: RequestContextLocator.get()?.requestId,
      actorId,
      tenantId,
    })
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
