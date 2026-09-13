import {InvitationId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Invitation} from '@b2b-saas-starter-kit/domain'

import {InvitationEntity} from '../entities/invitation.entity'
import {InvitationRoleEntity} from '../entities/invitation-role.entity'

export const InvitationMapper = {
  toDomain(row: InvitationEntity): Invitation {
    return Invitation.reconstitute({
      id: InvitationId.parse(row.id),
      tenantId: TenantId.parse(row.tenantId),
      email: row.email,
      roleIds: row.roleRows.map((roleRow) => RoleId.parse(roleRow.roleId)),
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      invitedByUserId: UserId.parse(row.invitedByUserId),
      consumedAt: row.consumedAt ?? undefined,
    })
  },

  toEntity(invitation: Invitation): InvitationEntity {
    const row = new InvitationEntity()

    row.id = invitation.id
    row.tenantId = invitation.tenantId
    row.email = invitation.email
    row.tokenHash = invitation.tokenHash
    row.expiresAt = invitation.expiresAt
    row.invitedByUserId = invitation.invitedByUserId
    row.consumedAt = invitation.consumedAt ?? null
    row.roleRows = invitation.roleIds.map((roleId) => {
      const roleRow = new InvitationRoleEntity()

      roleRow.invitationId = invitation.id
      roleRow.roleId = roleId

      return roleRow
    })

    return row
  },
}
