import {Module} from '@nestjs/common'

import {MembershipRolesService} from '@b2b-saas-starter-kit/application'

import {TypeOrmMembershipRepository, TypeOrmTenantRepository} from '@b2b-saas-starter-kit/postgres'

@Module({
  providers: [
    TypeOrmTenantRepository,
    TypeOrmMembershipRepository,
    {
      provide: MembershipRolesService,
      useFactory: (memberships: TypeOrmMembershipRepository) => new MembershipRolesService(memberships),
      inject: [TypeOrmMembershipRepository],
    },
  ],
  exports: [TypeOrmTenantRepository, TypeOrmMembershipRepository, MembershipRolesService],
})
export class TenancyModule {}
