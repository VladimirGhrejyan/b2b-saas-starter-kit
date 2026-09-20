import type {MigrationInterface, QueryRunner} from 'typeorm'

export class KernelIndexOutboxProcessingUpdatedAt1787745264250 implements MigrationInterface {
  name = 'KernelIndexOutboxProcessingUpdatedAt1787745264250'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_outbox_processing_updated_at" ON "outbox" ("updated_at") WHERE status = 'processing'`,
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_outbox_processing_updated_at"`)
  }
}
