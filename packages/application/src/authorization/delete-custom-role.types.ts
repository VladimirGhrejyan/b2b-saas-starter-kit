import type {RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type DeleteCustomRoleCommand = {
  readonly actorId: UserId
  readonly tenantId: TenantId
  readonly roleId: RoleId
}
