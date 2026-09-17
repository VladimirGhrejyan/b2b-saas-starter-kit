import type {MigrationInterface, QueryRunner} from 'typeorm'

export class KernelCreateOutbox1787745264241 implements MigrationInterface {
  name = 'KernelCreateOutbox1787745264241'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "outbox" (
        "id" uuid NOT NULL,
        "event_type" text NOT NULL,
        "payload" jsonb NOT NULL,
        "tenant_id" uuid,
        "status" text NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL,
        "processed_at" TIMESTAMPTZ,
        "attempt_count" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_outbox_id" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(`
      CREATE INDEX "IDX_outbox_pending_created_at"
      ON "outbox" ("created_at")
      WHERE "status" = 'pending'
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_outbox_pending_created_at"`)
    await queryRunner.query(`DROP TABLE "outbox"`)
  }
}
