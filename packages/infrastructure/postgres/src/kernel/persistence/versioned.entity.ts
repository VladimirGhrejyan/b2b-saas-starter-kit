import {VersionColumn} from 'typeorm'

import {AuditableEntity} from './auditable.entity'

/**
 * Optimistic concurrency for parent rows of child-collection aggregates.
 */
export abstract class VersionedEntity extends AuditableEntity {
  @VersionColumn()
  version!: number
}
