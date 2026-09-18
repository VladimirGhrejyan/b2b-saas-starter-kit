import {Body, Controller, Param} from '@nestjs/common'

import {HttpStatus, PermissionName} from '@b2b-saas-starter-kit/contracts'

import {ApiErrorResponses, ApiRoute, Idempotent, Response} from '@b2b-saas-starter-kit/nest-http'

import {RequirePermission} from '../../common/auth/permission/require-permission.decorator'
import {CurrentPrincipal} from '../../common/auth/principal/current-principal.decorator'
import type {DevPrincipal} from '../../common/auth/principal/dev-principal.types'

import {AttachMemberInputDto} from './dto/attach-member.input'
import {AttachMemberOutputDto} from './dto/attach-member.output'
import {MembershipIdParamDto} from './dto/membership-id.param'
import {ReplaceMembershipRolesInputDto} from './dto/replace-membership-roles.input'
import {ReplaceMembershipRolesOutputDto} from './dto/replace-membership-roles.output'
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

  @RequirePermission(PermissionName.tenancyMembersManage)
  @Idempotent()
  @ApiRoute(MembersRoutes.attach)
  @Response({
    status: HttpStatus.CREATED,
    description: 'Member attached',
    type: AttachMemberOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'},
    {status: HttpStatus.UNAUTHORIZED, description: 'x-user-id or x-tenant-id is missing or invalid'},
    {status: HttpStatus.FORBIDDEN, description: 'Missing tenancy.members.manage or Owner role assignment'},
    {status: HttpStatus.NOT_FOUND, description: 'User was not found'},
    {status: HttpStatus.CONFLICT, description: 'Membership already exists'},
  ])
  attach(
    @Param() params: TenantIdParamDto,
    @Body() body: AttachMemberInputDto,
    @CurrentPrincipal() principal: DevPrincipal,
  ): Promise<AttachMemberOutputDto> {
    return this.members.attach(params.tenantId, principal.userId, body)
  }

  @RequirePermission(PermissionName.tenancyMembersManage)
  @ApiRoute(MembersRoutes.replaceRoles)
  @Response({
    status: HttpStatus.OK,
    description: 'Membership roles replaced',
    type: ReplaceMembershipRolesOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'},
    {status: HttpStatus.UNAUTHORIZED, description: 'x-user-id or x-tenant-id is missing or invalid'},
    {status: HttpStatus.FORBIDDEN, description: 'Missing tenancy.members.manage or Owner role assignment'},
    {status: HttpStatus.NOT_FOUND, description: 'Membership was not found'},
    {status: HttpStatus.CONFLICT, description: 'Would leave the tenant without an Owner'},
  ])
  replaceRoles(
    @Param() params: MembershipIdParamDto,
    @Body() body: ReplaceMembershipRolesInputDto,
    @CurrentPrincipal() principal: DevPrincipal,
  ): Promise<ReplaceMembershipRolesOutputDto> {
    return this.members.replaceRoles(params.tenantId, params.membershipId, principal.userId, body)
  }
}
