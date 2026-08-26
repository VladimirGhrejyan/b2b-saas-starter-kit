import type {CallHandler, ExecutionContext, NestInterceptor} from '@nestjs/common'
import {Inject, Injectable} from '@nestjs/common'
import {Reflector} from '@nestjs/core'
import type {Observable} from 'rxjs'
import {from, lastValueFrom} from 'rxjs'

import {Permission} from '@b2b-saas-starter-kit/shared-kernel-types'
import type {ApiPermission} from '@b2b-saas-starter-kit/contracts'

import type {TenantContext} from '@b2b-saas-starter-kit/composition'
import {AuthorizationService, TENANT_CONTEXT} from '@b2b-saas-starter-kit/composition'

import {IS_PUBLIC_KEY} from '@b2b-saas-starter-kit/nest-http'

import {REQUIRE_PERMISSION_KEY} from './require-permission-key'

@Injectable()
export class RequirePermissionInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorization: AuthorizationService,
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

    const permission = this.reflector.getAllAndOverride<ApiPermission | undefined>(REQUIRE_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (permission === undefined) {
      return next.handle()
    }

    return from(this.requirePermission(permission, next))
  }

  private async requirePermission(permission: ApiPermission, next: CallHandler): Promise<unknown> {
    await this.authorization.require(this.tenantContext.getActorId(), Permission.parse(permission), {
      tenantId: this.tenantContext.getTenantId(),
    })

    return lastValueFrom(next.handle())
  }
}
