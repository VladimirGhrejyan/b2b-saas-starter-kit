import 'reflect-metadata'

import {RoleEntity} from '../../contexts/authorization/role.entity'
import {RolePermissionEntity} from '../../contexts/authorization/role-permission.entity'
import {UserEntity} from '../../contexts/identity/user.entity'
import {MembershipEntity} from '../../contexts/tenancy/membership.entity'
import {MembershipRoleEntity} from '../../contexts/tenancy/membership-role.entity'
import {TenantEntity} from '../../contexts/tenancy/tenant.entity'

export const postgresEntities = [
  UserEntity,
  TenantEntity,
  MembershipEntity,
  MembershipRoleEntity,
  RoleEntity,
  RolePermissionEntity,
]
