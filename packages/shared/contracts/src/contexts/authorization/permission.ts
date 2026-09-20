import {z} from 'zod'

export const PermissionName = {
  tenancyMembersRead: 'tenancy.members.read',
  tenancyMembersInvite: 'tenancy.members.invite',
  tenancyMembersManage: 'tenancy.members.manage',
  tenancyTenantRead: 'tenancy.tenant.read',
  authorizationRolesRead: 'authorization.roles.read',
  authorizationRolesManage: 'authorization.roles.manage',
  identityUsersRead: 'identity.users.read',
  identityApiKeysManage: 'identity.api_keys.manage',
} as const

export const permissionSchema = z
  .enum([
    PermissionName.tenancyMembersRead,
    PermissionName.tenancyMembersInvite,
    PermissionName.tenancyMembersManage,
    PermissionName.tenancyTenantRead,
    PermissionName.authorizationRolesRead,
    PermissionName.authorizationRolesManage,
    PermissionName.identityUsersRead,
    PermissionName.identityApiKeysManage,
  ])
  .meta({
    id: 'Permission',
    description: 'Permission name used on the wire',
  })

export type ApiPermission = z.infer<typeof permissionSchema>
