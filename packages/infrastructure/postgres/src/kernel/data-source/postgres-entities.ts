import 'reflect-metadata'

import {RoleEntity} from '../../contexts/authorization/entities/role.entity'
import {RolePermissionEntity} from '../../contexts/authorization/entities/role-permission.entity'
import {LocalPasswordEntity} from '../../contexts/identity/entities/local-password.entity'
import {PasswordResetTokenEntity} from '../../contexts/identity/entities/password-reset-token.entity'
import {RefreshSessionEntity} from '../../contexts/identity/entities/refresh-session.entity'
import {UserEntity} from '../../contexts/identity/entities/user.entity'
import {MembershipEntity} from '../../contexts/tenancy/entities/membership.entity'
import {MembershipRoleEntity} from '../../contexts/tenancy/entities/membership-role.entity'
import {TenantEntity} from '../../contexts/tenancy/entities/tenant.entity'

export const postgresEntities = [
  UserEntity,
  LocalPasswordEntity,
  RefreshSessionEntity,
  PasswordResetTokenEntity,
  TenantEntity,
  MembershipEntity,
  MembershipRoleEntity,
  RoleEntity,
  RolePermissionEntity,
]
