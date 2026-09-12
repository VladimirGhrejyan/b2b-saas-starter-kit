import {Inject, Injectable} from '@nestjs/common'
import type {DataSource, EntityManager} from 'typeorm'

import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {PasswordResetToken, PasswordResetTokenRepository} from '@b2b-saas-starter-kit/domain'

import {transactionAls} from '../../../kernel/persistence/transaction-als'
import {DATA_SOURCE} from '../../../kernel/tokens'
import {PasswordResetTokenEntity} from '../entities/password-reset-token.entity'
import {PasswordResetTokenMapper} from '../mappers/password-reset-token.mapper'

/**
 * TypeORM {@link PasswordResetTokenRepository}. Tokens are global.
 */
@Injectable()
export class TypeOrmPasswordResetTokenRepository implements PasswordResetTokenRepository {
  constructor(@Inject(DATA_SOURCE) private readonly dataSource: DataSource) {}

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const row = await this.#manager.findOneBy(PasswordResetTokenEntity, {tokenHash})

    return row === null ? null : PasswordResetTokenMapper.toDomain(row)
  }

  async findByUserId(userId: UserId): Promise<PasswordResetToken | null> {
    const row = await this.#manager.findOneBy(PasswordResetTokenEntity, {userId})

    return row === null ? null : PasswordResetTokenMapper.toDomain(row)
  }

  async save(token: PasswordResetToken): Promise<void> {
    await this.#manager.upsert(PasswordResetTokenEntity, PasswordResetTokenMapper.toEntity(token), {
      conflictPaths: ['userId'],
    })
  }

  get #manager(): EntityManager {
    return transactionAls.getStore()?.manager ?? this.dataSource.manager
  }
}
