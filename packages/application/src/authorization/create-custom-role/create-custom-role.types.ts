import type {Permission, RoleId, TenantActor, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type CreateCustomRoleCommand = {
  readonly actor: TenantActor
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
