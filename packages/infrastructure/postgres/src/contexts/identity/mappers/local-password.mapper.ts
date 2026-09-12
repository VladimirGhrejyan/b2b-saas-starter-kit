import {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {LocalPassword} from '@b2b-saas-starter-kit/domain'

import {LocalPasswordEntity} from '../entities/local-password.entity'

export const LocalPasswordMapper = {
  toDomain(row: LocalPasswordEntity): LocalPassword {
    return LocalPassword.reconstitute({
      userId: UserId.parse(row.userId),
      passwordHash: row.passwordHash,
    })
  },

  toEntity(password: LocalPassword): LocalPasswordEntity {
    const row = new LocalPasswordEntity()

    row.userId = password.id
    row.passwordHash = password.passwordHash

    return row
  },
}
