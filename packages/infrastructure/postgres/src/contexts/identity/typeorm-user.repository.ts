import {Inject, Injectable} from '@nestjs/common'
import type {DataSource, EntityManager} from 'typeorm'

import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {User, UserRepository} from '@b2b-saas-starter-kit/domain'

import {transactionAls} from '../../kernel/persistence/transaction-als'
import {DATA_SOURCE} from '../../kernel/tokens'

import {UserEntity} from './user.entity'
import {UserMapper} from './user.mapper'

/**
 * TypeORM {@link UserRepository}. Users are global; writes still join the ambient UnitOfWork.
 */
@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(@Inject(DATA_SOURCE) private readonly dataSource: DataSource) {}

  async findById(id: UserId): Promise<User | null> {
    const row = await this.#manager.findOneBy(UserEntity, {id})

    return row === null ? null : UserMapper.toDomain(row)
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.#manager.findOneBy(UserEntity, {email: email.trim().toLowerCase()})

    return row === null ? null : UserMapper.toDomain(row)
  }

  async save(user: User): Promise<void> {
    await this.#manager.upsert(UserEntity, UserMapper.toEntity(user), {conflictPaths: ['id']})
  }

  get #manager(): EntityManager {
    return transactionAls.getStore()?.manager ?? this.dataSource.manager
  }
}
