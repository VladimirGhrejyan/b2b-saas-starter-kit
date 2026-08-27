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
import {TENANT_OPTIONAL_KEY} from './tenant-optional-key'

@Injectable()
export class DevPrincipalInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
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
    const userIdRaw = readHeader(request.headers, 'x-user-id')

    if (userIdRaw === undefined) {
      throw new UnauthorizedException('x-user-id is required')
    }

    const userId = UserId.parse(userIdRaw)
    const tenantOptional = this.reflector.getAllAndOverride<boolean>(TENANT_OPTIONAL_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    const tenantIdRaw = readHeader(request.headers, 'x-tenant-id')

    if (tenantIdRaw === undefined) {
      if (!tenantOptional) {
        throw new UnauthorizedException('x-tenant-id is required')
      }

      request[DEV_PRINCIPAL_KEY] = {userId} satisfies DevPrincipal
      RequestContextLocator.bind({actorId: userId})

      return lastValueFrom(next.handle())
    }

    const tenantId = TenantId.parse(tenantIdRaw)
    const membership = await this.assertActiveMembership.findActive(userId, tenantId)

    if (membership === null) {
      throw new ForbiddenException('active membership is required')
    }

    request[DEV_PRINCIPAL_KEY] = {userId, tenantId} satisfies DevPrincipal
    RequestContextLocator.bind({actorId: userId, tenantId})

    return this.tenantContext.run({tenantId, actorId: userId}, () => lastValueFrom(next.handle()))
  }
}
