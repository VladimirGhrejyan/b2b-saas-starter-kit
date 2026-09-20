import type {MigrationInterface, QueryRunner} from 'typeorm'

export class IdentityIndexRefreshSessionExpiry1787745264247 implements MigrationInterface {
  name = 'IdentityIndexRefreshSessionExpiry1787745264247'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_refresh_sessions_expires_at" ON "refresh_sessions" ("expires_at")`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_refresh_sessions_expires_at"`)
  }
}
