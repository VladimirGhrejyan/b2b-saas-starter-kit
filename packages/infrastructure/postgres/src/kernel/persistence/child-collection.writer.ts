import type {EntityManager, EntityTarget, ObjectLiteral} from 'typeorm'
import {OptimisticLockVersionMismatchError} from 'typeorm'

import {AssertAmbientTransaction} from './assert-ambient-transaction'
import type {AuditableEntity} from './auditable.entity'
import type {DeleteParentAndChildrenOptions, ReplaceChildrenOptions} from './child-collection.writer.types'
import {OptimisticConcurrencyError} from './optimistic-concurrency.error'
import type {VersionedEntity} from './versioned.entity'

/**
 * Saves and deletes parent rows with child-collection replacement under a parent row lock.
 */
export class ChildCollectionWriter {
  constructor(private readonly manager: EntityManager) {}

  async saveVersionedParentAndReplaceChildren<TParent extends VersionedEntity, TChild extends ObjectLiteral>(options: {
    readonly parentEntity: EntityTarget<TParent>
    readonly parentId: string
    readonly entityName: string
    readonly buildParent: () => TParent
    readonly children: ReplaceChildrenOptions<TChild>
  }): Promise<void> {
    AssertAmbientTransaction.assert()

    const existing = await this.manager.findOne(options.parentEntity, {
      where: {id: options.parentId} as object,
      lock: {mode: 'pessimistic_write'},
    })

    const parent = options.buildParent()

    if (existing !== null) {
      parent.createdAt = existing.createdAt
      parent.version = existing.version
    }

    try {
      await this.manager.save(options.parentEntity, parent)
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new OptimisticConcurrencyError(options.entityName, options.parentId)
      }

      throw error
    }

    await this.#replaceChildren(options.children)
  }

  async saveAuditableParentAndReplaceChildren<TParent extends AuditableEntity, TChild extends ObjectLiteral>(options: {
    readonly parentEntity: EntityTarget<TParent>
    readonly parentId: string
    readonly buildParent: () => TParent
    readonly children: ReplaceChildrenOptions<TChild>
  }): Promise<void> {
    AssertAmbientTransaction.assert()

    const existing = await this.manager.findOne(options.parentEntity, {
      where: {id: options.parentId} as object,
      lock: {mode: 'pessimistic_write'},
    })

    const parent = options.buildParent()

    if (existing !== null) {
      parent.createdAt = existing.createdAt
    }

    await this.manager.save(options.parentEntity, parent)
    await this.#replaceChildren(options.children)
  }

  async deleteParentAndChildren<TParent extends ObjectLiteral, TChild extends ObjectLiteral>(
    options: DeleteParentAndChildrenOptions<TParent, TChild>,
  ): Promise<void> {
    AssertAmbientTransaction.assert()

    const existing = await this.manager.findOne(options.parentEntity, {
      where: {id: options.parentId} as object,
      lock: {mode: 'pessimistic_write'},
    })

    if (existing === null) {
      return
    }

    await this.manager.delete(options.childEntity, {[options.parentIdColumn]: options.parentId})
    await this.manager.delete(options.parentEntity, {id: options.parentId})
  }

  async #replaceChildren<TChild extends ObjectLiteral>(options: ReplaceChildrenOptions<TChild>): Promise<void> {
    await this.manager.delete(options.childEntity, {[options.parentIdColumn]: options.parentId})

    const children = options.buildChildren()

    if (children.length === 0) {
      return
    }

    await this.manager.insert(options.childEntity, children)
  }
}
