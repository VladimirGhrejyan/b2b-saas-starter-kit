import {Injectable} from '@nestjs/common'

import type {RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {
  CreateCustomRoleUseCase,
  DeleteCustomRoleUseCase,
  ListRolesQuery,
  UpdateCustomRoleUseCase,
} from '@b2b-saas-starter-kit/composition'

import type {CreateRoleInputDto} from './dto/create-role.input'
import type {RoleOutputDto} from './dto/role.output'
import {RolesMapper} from './dto/roles.mapper'
import type {TenantRolesOutputDto} from './dto/tenant-roles.output'
import type {UpdateRoleInputDto} from './dto/update-role.input'

@Injectable()
export class RolesService {
  constructor(
    private readonly listRoles: ListRolesQuery,
    private readonly createCustomRole: CreateCustomRoleUseCase,
    private readonly updateCustomRole: UpdateCustomRoleUseCase,
    private readonly deleteCustomRole: DeleteCustomRoleUseCase,
  ) {}

  async list(tenantId: TenantId, actorId: UserId): Promise<TenantRolesOutputDto> {
    const result = await this.listRoles.execute(RolesMapper.toListQuery(tenantId, actorId))

    return RolesMapper.toListOutput(result)
  }

  async create(tenantId: TenantId, actorId: UserId, input: CreateRoleInputDto): Promise<RoleOutputDto> {
    const result = await this.createCustomRole.execute(RolesMapper.toCreateCommand(tenantId, actorId, input))

    return RolesMapper.toRoleOutput(result)
  }

  async update(tenantId: TenantId, roleId: RoleId, actorId: UserId, input: UpdateRoleInputDto): Promise<RoleOutputDto> {
    const result = await this.updateCustomRole.execute(RolesMapper.toUpdateCommand(tenantId, roleId, actorId, input))

    return RolesMapper.toRoleOutput(result)
  }

  async delete(tenantId: TenantId, roleId: RoleId, actorId: UserId): Promise<void> {
    await this.deleteCustomRole.execute(RolesMapper.toDeleteCommand(tenantId, roleId, actorId))
  }
}
