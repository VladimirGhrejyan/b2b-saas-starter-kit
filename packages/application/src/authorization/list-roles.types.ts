import type {Permission, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type ListRolesQueryInput = {
  readonly tenantId: TenantId
  readonly actorId: UserId
}

export type RoleListItem = {
  readonly roleId: RoleId
  readonly name: string
  readonly permissions: readonly Permission[]
  readonly isSystem: boolean
}

export type ListRolesResult = {
  readonly roles: readonly RoleListItem[]
}
