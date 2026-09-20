import type {Permission, RoleId, TenantActor, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type ListRolesQueryInput = {
  readonly tenantId: TenantId
  readonly actor: TenantActor
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
