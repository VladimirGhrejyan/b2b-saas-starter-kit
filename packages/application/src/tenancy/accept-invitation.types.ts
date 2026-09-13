import type {MembershipId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type AcceptInvitationCommand = {
  readonly token: string
  readonly displayName?: string
  readonly password?: string
}

export type AcceptInvitationResult = {
  readonly userId: UserId
  readonly membershipId: MembershipId
  readonly tenantId: TenantId
}
