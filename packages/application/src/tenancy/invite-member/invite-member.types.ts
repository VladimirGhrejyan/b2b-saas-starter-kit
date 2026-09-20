import type {InvitationId, RoleId, TenantActor, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type InviteMemberCommand = {
  readonly actor: TenantActor
  readonly tenantId: TenantId
  readonly email: string
  readonly roleIds: readonly RoleId[]
}

export type InviteMemberResult = {
  readonly invitationId: InvitationId
}
