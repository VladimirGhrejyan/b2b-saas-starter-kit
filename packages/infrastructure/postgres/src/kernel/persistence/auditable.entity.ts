import {BeforeInsert, BeforeUpdate, CreateDateColumn, UpdateDateColumn} from 'typeorm'

/**
 * Audit timestamps for every persisted table row.
 */
export abstract class AuditableEntity {
  @CreateDateColumn({name: 'created_at', type: 'timestamptz'})
  createdAt!: Date

  @UpdateDateColumn({name: 'updated_at', type: 'timestamptz'})
  updatedAt!: Date

  @BeforeInsert()
  protected stampCreatedAt(): void {
    const now = new Date()

    this.createdAt = now
    this.updatedAt = now
  }

  @BeforeUpdate()
  protected stampUpdatedAt(): void {
    this.updatedAt = new Date()
  }
}
