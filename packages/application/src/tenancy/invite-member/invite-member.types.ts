import type {InvitationId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type InviteMemberCommand = {
  readonly actorId: UserId
  readonly tenantId: TenantId
  readonly email: string
  readonly roleIds: readonly RoleId[]
}

export type InviteMemberResult = {
  readonly invitationId: InvitationId
}
