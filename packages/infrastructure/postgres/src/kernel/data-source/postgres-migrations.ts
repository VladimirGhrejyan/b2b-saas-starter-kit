import {IdentityCreateUsers1787745264235} from '../migrations/1787745264235-identity-create-users'
import {AuthorizationCreateRoles1787745264236} from '../migrations/1787745264236-authorization-create-roles'
import {TenancyCreateTenantsAndMemberships1787745264237} from '../migrations/1787745264237-tenancy-create-tenants-and-memberships'
import {IdentityCreateCredentials1787745264238} from '../migrations/1787745264238-identity-create-credentials'
import {TenancyCreateInvitations1787745264239} from '../migrations/1787745264239-tenancy-create-invitations'
import {AuthorizationBackfillAdminPermissions1787745264240} from '../migrations/1787745264240-authorization-backfill-admin-permissions'
import {KernelCreateOutbox1787745264241} from '../migrations/1787745264241-kernel-create-outbox'
import {KernelAddAuditAndVersionColumns1787745264242} from '../migrations/1787745264242-kernel-add-audit-and-version-columns'
import {TenancyIndexMembershipRolesRoleId1787745264243} from '../migrations/1787745264243-tenancy-index-membership-roles-role-id'
import {KernelCreateIdempotencyKeys1787745264244} from '../migrations/1787745264244-kernel-create-idempotency-keys'
import {IdentityCreateApiKeys1787745264245} from '../migrations/1787745264245-identity-create-api-keys'
import {AuthorizationBackfillAdminApiKeysManage1787745264246} from '../migrations/1787745264246-authorization-backfill-admin-api-keys-manage'

import type {DataSourceClass} from './create-data-source.types'

/**
 * Ordered TypeORM migration classes. Append generated drafts here after review.
 */
export const postgresMigrations: DataSourceClass[] = [
  IdentityCreateUsers1787745264235,
  AuthorizationCreateRoles1787745264236,
  TenancyCreateTenantsAndMemberships1787745264237,
  IdentityCreateCredentials1787745264238,
  TenancyCreateInvitations1787745264239,
  AuthorizationBackfillAdminPermissions1787745264240,
  KernelCreateOutbox1787745264241,
  KernelAddAuditAndVersionColumns1787745264242,
  TenancyIndexMembershipRolesRoleId1787745264243,
  KernelCreateIdempotencyKeys1787745264244,
  IdentityCreateApiKeys1787745264245,
  AuthorizationBackfillAdminApiKeysManage1787745264246,
]
