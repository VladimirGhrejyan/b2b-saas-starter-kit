import type {MigrationInterface, QueryRunner} from 'typeorm'

export class TenancyIndexInvitationExpiry1787745264249 implements MigrationInterface {
  name = 'TenancyIndexInvitationExpiry1787745264249'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_invitations_expires_at" ON "invitations" ("expires_at")`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_invitations_expires_at"`)
  }
}
