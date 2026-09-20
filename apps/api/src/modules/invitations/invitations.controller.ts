import {Body, Controller, Param} from '@nestjs/common'

import {HttpStatus, PermissionName} from '@b2b-saas-starter-kit/contracts'

import {ApiErrorResponses, ApiRoute, Idempotent, Public, Response} from '@b2b-saas-starter-kit/nest-http'

import {RequirePermission} from '../../common/auth/permission/require-permission.decorator'
import {CurrentPrincipal} from '../../common/auth/principal/current-principal.decorator'
import type {AuthPrincipal} from '../../common/auth/principal/dev-principal.types'
import {toTenantActor} from '../../common/auth/principal/to-tenant-actor'

import {AcceptInvitationInputDto} from './dto/accept-invitation.input'
import {AcceptInvitationOutputDto} from './dto/accept-invitation.output'
import {InviteMemberInputDto} from './dto/invite-member.input'
import {InviteMemberOutputDto} from './dto/invite-member.output'
import {TenantIdParamDto} from './dto/tenant-id.param'
import {InvitationsRoutes} from './invitations.routes'
import {InvitationsService} from './invitations.service'

@Controller()
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @RequirePermission(PermissionName.tenancyMembersInvite)
  @Idempotent()
  @ApiRoute(InvitationsRoutes.invite)
  @Response({
    status: HttpStatus.CREATED,
    description: 'Invitation created',
    type: InviteMemberOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'},
    {status: HttpStatus.UNAUTHORIZED, description: 'x-user-id or x-tenant-id is missing or invalid'},
    {status: HttpStatus.FORBIDDEN, description: 'Missing tenancy.members.invite or Owner role assignment'},
    {status: HttpStatus.CONFLICT, description: 'Pending invitation or membership already exists'},
  ])
  invite(
    @Param() params: TenantIdParamDto,
    @Body() body: InviteMemberInputDto,
    @CurrentPrincipal() principal: AuthPrincipal,
  ): Promise<InviteMemberOutputDto> {
    return this.invitations.invite(params.tenantId, toTenantActor(principal), body)
  }

  @Public()
  @ApiRoute(InvitationsRoutes.accept)
  @Response({
    status: HttpStatus.CREATED,
    description: 'Invitation accepted',
    type: AcceptInvitationOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Invalid token or missing registration fields'},
    {status: HttpStatus.CONFLICT, description: 'Membership already exists'},
  ])
  accept(@Body() body: AcceptInvitationInputDto): Promise<AcceptInvitationOutputDto> {
    return this.invitations.accept(body)
  }
}
