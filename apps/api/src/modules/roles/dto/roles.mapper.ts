import {Permission, type RoleId, type TenantActor, type TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'
import {
  type CreateRoleInput,
  permissionSchema,
  type RoleOutput,
  type TenantRolesOutput,
  type UpdateRoleInput,
} from '@b2b-saas-starter-kit/contracts'

import type {
  CreateCustomRoleUseCase,
  DeleteCustomRoleUseCase,
  ListRolesQuery,
  UpdateCustomRoleUseCase,
} from '@b2b-saas-starter-kit/composition'

export class RolesMapper {
  static toListQuery(tenantId: TenantId, actor: TenantActor): Parameters<ListRolesQuery['execute']>[0] {
    return {tenantId, actor}
  }

  static toCreateCommand(
    tenantId: TenantId,
    actor: TenantActor,
    input: CreateRoleInput,
  ): Parameters<CreateCustomRoleUseCase['execute']>[0] {
    return {
      actor,
      tenantId,
      name: input.name,
      permissions: input.permissions.map((permission) => Permission.parse(permission)),
    }
  }

  static toUpdateCommand(
    tenantId: TenantId,
    roleId: RoleId,
    actor: TenantActor,
    input: UpdateRoleInput,
  ): Parameters<UpdateCustomRoleUseCase['execute']>[0] {
    return {
      actor,
      tenantId,
      roleId,
      name: input.name,
      permissions: input.permissions?.map((permission) => Permission.parse(permission)),
    }
  }

  static toDeleteCommand(
    tenantId: TenantId,
    roleId: RoleId,
    actor: TenantActor,
  ): Parameters<DeleteCustomRoleUseCase['execute']>[0] {
    return {actor, tenantId, roleId}
  }

  static toRoleOutput(result: {
    readonly roleId: RoleId
    readonly name: string
    readonly permissions: readonly string[]
    readonly isSystem: boolean
  }): RoleOutput {
    return {
      id: result.roleId,
      name: result.name,
      permissions: result.permissions.map((permission) => permissionSchema.parse(permission)),
      isSystem: result.isSystem,
    }
  }

  static toListOutput(result: Awaited<ReturnType<ListRolesQuery['execute']>>): TenantRolesOutput {
    return {
      roles: result.roles.map((role) =>
        RolesMapper.toRoleOutput({
          roleId: role.roleId,
          name: role.name,
          permissions: role.permissions,
          isSystem: role.isSystem,
        }),
      ),
    }
  }
}
