import type {ApiPermission} from '@b2b-saas-starter-kit/contracts'

export function can(permissions: readonly ApiPermission[], permission: ApiPermission): boolean {
  return permissions.includes(permission)
}
