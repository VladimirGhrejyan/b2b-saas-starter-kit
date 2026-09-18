import {Module} from '@nestjs/common'

import {INVITATION_REPOSITORY, MEMBERSHIP_REPOSITORY, TENANT_REPOSITORY} from '@b2b-saas-starter-kit/domain'

import {MEMBERSHIP_ROLES, MembershipRolesService} from '@b2b-saas-starter-kit/application'

import {
  TypeOrmInvitationRepository,
  TypeOrmMembershipRepository,
  TypeOrmTenantRepository,
} from '@b2b-saas-starter-kit/postgres'

@Module({
  providers: [
    {provide: TENANT_REPOSITORY, useClass: TypeOrmTenantRepository},
    {provide: MEMBERSHIP_REPOSITORY, useClass: TypeOrmMembershipRepository},
    {provide: INVITATION_REPOSITORY, useClass: TypeOrmInvitationRepository},
    MembershipRolesService,
    {provide: MEMBERSHIP_ROLES, useExisting: MembershipRolesService},
  ],
  exports: [TENANT_REPOSITORY, MEMBERSHIP_REPOSITORY, INVITATION_REPOSITORY, MembershipRolesService, MEMBERSHIP_ROLES],
})
export class TenancyModule {}
