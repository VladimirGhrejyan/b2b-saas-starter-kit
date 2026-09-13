import type {Permission, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type CreateCustomRoleCommand = {
  readonly actorId: UserId
  readonly tenantId: TenantId
  readonly name: string
  readonly permissions: readonly Permission[]
}

export type CreateCustomRoleResult = {
  readonly roleId: RoleId
  readonly name: string
  readonly permissions: readonly Permission[]
  readonly isSystem: boolean
}
