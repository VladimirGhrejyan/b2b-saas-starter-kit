import type {Permission, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type UpdateCustomRoleCommand = {
  readonly actorId: UserId
  readonly tenantId: TenantId
  readonly roleId: RoleId
  readonly name?: string
  readonly permissions?: readonly Permission[]
}

export type UpdateCustomRoleResult = {
  readonly roleId: RoleId
  readonly name: string
  readonly permissions: readonly Permission[]
  readonly isSystem: boolean
}
