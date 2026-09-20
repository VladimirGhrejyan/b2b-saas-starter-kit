import {Inject, Injectable} from '@nestjs/common'
import type {DataSource, EntityManager} from 'typeorm'

import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {PasswordResetToken, PasswordResetTokenRepository} from '@b2b-saas-starter-kit/domain'

import {SqlCount} from '../../../kernel/persistence/sql-count'
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
    await this.#manager.save(PasswordResetTokenEntity, PasswordResetTokenMapper.toEntity(token))
  }

  async deleteInactive(before: Date, limit: number): Promise<number> {
    return SqlCount.parse(
      await this.#manager.query(
        `
          WITH stale AS (
            SELECT user_id
            FROM password_reset_tokens
            WHERE expires_at < $1 OR consumed_at IS NOT NULL
            ORDER BY expires_at ASC
            LIMIT $2
          ),
          deleted AS (
            DELETE FROM password_reset_tokens
            WHERE user_id IN (SELECT user_id FROM stale)
            RETURNING user_id
          )
          SELECT COUNT(*)::int AS count FROM deleted
        `,
        [before, limit],
      ),
    )
  }

  get #manager(): EntityManager {
    return transactionAls.getStore()?.manager ?? this.dataSource.manager
  }
}
