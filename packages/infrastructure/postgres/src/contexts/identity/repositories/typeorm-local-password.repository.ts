import {Inject, Injectable} from '@nestjs/common'
import type {DataSource, EntityManager} from 'typeorm'

import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {LocalPassword, LocalPasswordRepository} from '@b2b-saas-starter-kit/domain'

import {transactionAls} from '../../../kernel/persistence/transaction-als'
import {DATA_SOURCE} from '../../../kernel/tokens'
import {LocalPasswordEntity} from '../entities/local-password.entity'
import {LocalPasswordMapper} from '../mappers/local-password.mapper'

/**
 * TypeORM {@link LocalPasswordRepository}. Credentials are global.
 */
@Injectable()
export class TypeOrmLocalPasswordRepository implements LocalPasswordRepository {
  constructor(@Inject(DATA_SOURCE) private readonly dataSource: DataSource) {}

  async findByUserId(userId: UserId): Promise<LocalPassword | null> {
    const row = await this.#manager.findOneBy(LocalPasswordEntity, {userId})

    return row === null ? null : LocalPasswordMapper.toDomain(row)
  }

  async save(password: LocalPassword): Promise<void> {
    await this.#manager.save(LocalPasswordEntity, LocalPasswordMapper.toEntity(password))
  }

  get #manager(): EntityManager {
    return transactionAls.getStore()?.manager ?? this.dataSource.manager
  }
}
