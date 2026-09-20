import type {RoleId, TenantActor, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type DeleteCustomRoleCommand = {
  readonly actor: TenantActor
  readonly tenantId: TenantId
  readonly roleId: RoleId
}
