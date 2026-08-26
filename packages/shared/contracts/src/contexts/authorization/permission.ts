import {z} from 'zod'

export const PermissionName = {
  tenancyMembersRead: 'tenancy.members.read',
  tenancyTenantRead: 'tenancy.tenant.read',
  authorizationRolesRead: 'authorization.roles.read',
  identityUsersRead: 'identity.users.read',
} as const

export const permissionSchema = z
  .enum([
    PermissionName.tenancyMembersRead,
    PermissionName.tenancyTenantRead,
    PermissionName.authorizationRolesRead,
    PermissionName.identityUsersRead,
  ])
  .meta({
    id: 'Permission',
    description: 'Permission name used on the wire',
  })

export type ApiPermission = z.infer<typeof permissionSchema>
