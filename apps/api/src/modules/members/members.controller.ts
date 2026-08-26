import {Controller, Param} from '@nestjs/common'

import {HttpStatus, PermissionName} from '@b2b-saas-starter-kit/contracts'

import {ApiErrorResponses, ApiRoute, Response} from '@b2b-saas-starter-kit/nest-http'

import {CurrentPrincipal} from '../../common/auth/current-principal.decorator'
import type {DevPrincipal} from '../../common/auth/dev-principal.types'
import {RequirePermission} from '../../common/auth/require-permission.decorator'

import {TenantIdParamDto} from './dto/tenant-id.param'
import {TenantMembersOutputDto} from './dto/tenant-members.output'
import {MembersRoutes} from './members.routes'
import {MembersService} from './members.service'

@Controller()
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @RequirePermission(PermissionName.tenancyMembersRead)
  @ApiRoute(MembersRoutes.list)
  @Response({
    status: HttpStatus.OK,
    description: 'Tenant members',
    type: TenantMembersOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Path parameters failed validation'},
    {status: HttpStatus.UNAUTHORIZED, description: 'x-user-id or x-tenant-id is missing or invalid'},
    {status: HttpStatus.FORBIDDEN, description: 'Missing tenancy.members.read or no active membership'},
  ])
  list(
    @Param() params: TenantIdParamDto,
    @CurrentPrincipal() principal: DevPrincipal,
  ): Promise<TenantMembersOutputDto> {
    return this.members.list(params.tenantId, principal.userId)
  }
}
