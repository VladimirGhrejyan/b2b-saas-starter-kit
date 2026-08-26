import {IdentityCreateUsers1787745264235} from '../migrations/1787745264235-identity-create-users'
import {AuthorizationCreateRoles1787745264236} from '../migrations/1787745264236-authorization-create-roles'
import {TenancyCreateTenantsAndMemberships1787745264237} from '../migrations/1787745264237-tenancy-create-tenants-and-memberships'

import type {DataSourceClass} from './create-data-source.types'

/**
 * Ordered TypeORM migration classes. Append generated drafts here after review.
 */
export const postgresMigrations: DataSourceClass[] = [
  IdentityCreateUsers1787745264235,
  AuthorizationCreateRoles1787745264236,
  TenancyCreateTenantsAndMemberships1787745264237,
]
