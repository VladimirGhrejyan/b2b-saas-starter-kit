import {Inject, Injectable} from '@nestjs/common'
import type {DataSource, EntityManager} from 'typeorm'

import type {RefreshFamilyId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {RefreshSession, RefreshSessionRepository} from '@b2b-saas-starter-kit/domain'

import {SqlCount} from '../../../kernel/persistence/sql-count'
import {transactionAls} from '../../../kernel/persistence/transaction-als'
import {DATA_SOURCE} from '../../../kernel/tokens'
import {RefreshSessionEntity} from '../entities/refresh-session.entity'
import {RefreshSessionMapper} from '../mappers/refresh-session.mapper'

/**
 * TypeORM {@link RefreshSessionRepository}. Sessions are global.
 */
@Injectable()
export class TypeOrmRefreshSessionRepository implements RefreshSessionRepository {
  constructor(@Inject(DATA_SOURCE) private readonly dataSource: DataSource) {}

  async findByTokenHash(tokenHash: string): Promise<RefreshSession | null> {
    const row = await this.#manager.findOneBy(RefreshSessionEntity, {tokenHash})

    return row === null ? null : RefreshSessionMapper.toDomain(row)
  }

  async save(session: RefreshSession): Promise<void> {
    await this.#manager.save(RefreshSessionEntity, RefreshSessionMapper.toEntity(session))
  }

  async revokeFamily(familyId: RefreshFamilyId, at: Date): Promise<void> {
    await this.#manager
      .createQueryBuilder()
      .update(RefreshSessionEntity)
      .set({revokedAt: at})
      .where('familyId = :familyId', {familyId})
      .andWhere('revokedAt IS NULL')
      .execute()
  }

  async revokeAllForUser(userId: UserId, at: Date): Promise<void> {
    await this.#manager
      .createQueryBuilder()
      .update(RefreshSessionEntity)
      .set({revokedAt: at})
      .where('userId = :userId', {userId})
      .andWhere('revokedAt IS NULL')
      .execute()
  }

  async deleteExpiredOrRevoked(before: Date, limit: number): Promise<number> {
    return SqlCount.parse(
      await this.#manager.query(
        `
          WITH stale AS (
            SELECT id
            FROM refresh_sessions
            WHERE expires_at < $1 OR revoked_at IS NOT NULL
            ORDER BY expires_at ASC
            LIMIT $2
          ),
          deleted AS (
            DELETE FROM refresh_sessions
            WHERE id IN (SELECT id FROM stale)
            RETURNING id
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
