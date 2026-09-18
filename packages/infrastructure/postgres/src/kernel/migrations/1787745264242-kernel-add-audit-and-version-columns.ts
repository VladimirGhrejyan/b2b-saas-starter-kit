import type {MigrationInterface, QueryRunner} from 'typeorm'

import {AUDIT_MIGRATION_TABLES} from './audit-migration.tables'

export class KernelAddAuditAndVersionColumns1787745264242 implements MigrationInterface {
  name = 'KernelAddAuditAndVersionColumns1787745264242'

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of AUDIT_MIGRATION_TABLES) {
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()`)
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()`)
    }

    await queryRunner.query(`ALTER TABLE "roles" ADD COLUMN "version" integer NOT NULL DEFAULT 1`)
    await queryRunner.query(`ALTER TABLE "memberships" ADD COLUMN "version" integer NOT NULL DEFAULT 1`)
    await queryRunner.query(`ALTER TABLE "outbox" ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "outbox" DROP COLUMN "updated_at"`)

    await queryRunner.query(`ALTER TABLE "memberships" DROP COLUMN "version"`)
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "version"`)

    for (const table of [...AUDIT_MIGRATION_TABLES].reverse()) {
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "updated_at"`)
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "created_at"`)
    }
  }
}
