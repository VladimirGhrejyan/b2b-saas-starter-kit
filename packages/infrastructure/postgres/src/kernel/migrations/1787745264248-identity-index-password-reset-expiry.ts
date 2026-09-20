import type {MigrationInterface, QueryRunner} from 'typeorm'

export class IdentityIndexPasswordResetExpiry1787745264248 implements MigrationInterface {
  name = 'IdentityIndexPasswordResetExpiry1787745264248'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_password_reset_tokens_expires_at" ON "password_reset_tokens" ("expires_at")`,
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_password_reset_tokens_expires_at"`)
  }
}
