import {Module} from '@nestjs/common'

import {MembershipRolesService} from '@b2b-saas-starter-kit/application'

import {
  TypeOrmInvitationRepository,
  TypeOrmMembershipRepository,
  TypeOrmTenantRepository,
} from '@b2b-saas-starter-kit/postgres'

@Module({
  providers: [
    TypeOrmTenantRepository,
    TypeOrmMembershipRepository,
    TypeOrmInvitationRepository,
    {
      provide: MembershipRolesService,
      useFactory: (memberships: TypeOrmMembershipRepository) => new MembershipRolesService(memberships),
      inject: [TypeOrmMembershipRepository],
    },
  ],
  exports: [TypeOrmTenantRepository, TypeOrmMembershipRepository, TypeOrmInvitationRepository, MembershipRolesService],
})
export class TenancyModule {}
