import {RuleTester} from '@typescript-eslint/rule-tester'
import tseslint from 'typescript-eslint'
import {afterAll, describe, it} from 'vitest'

import {noCrossContextImportsRule} from './no-cross-context-imports'

RuleTester.afterAll = afterAll
RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
})

const domainTenancy = '/workspace/packages/domain/src/tenancy/tenant.ts'
const applicationAuthorization = '/workspace/packages/application/src/authorization/require-permission.ts'
const compositionTenancy = '/workspace/packages/composition/src/tenancy/tenancy.module.ts'
const infrastructureCore =
  '/workspace/packages/infrastructure/postgres/src/kernel/persistence/tenant-aware.repository.ts'
const infrastructureTenancy = '/workspace/packages/infrastructure/postgres/src/contexts/tenancy/tenant.entity.ts'

const apiUsersController = '/workspace/apps/api/src/modules/users/users.controller.ts'
const apiCommonAuth = '/workspace/apps/api/src/common/auth/dev-principal.interceptor.ts'

ruleTester.run('no-cross-context-imports', noCrossContextImportsRule, {
  valid: [
    {
      filename: domainTenancy,
      code: `import {Membership} from './membership'`,
    },
    {
      filename: domainTenancy,
      code: `import {AggregateRoot} from '../shared-kernel/aggregate-root'`,
    },
    {
      filename: applicationAuthorization,
      code: `import {AuthorizationPort} from '../shared/authorization.port'`,
    },
    {
      filename: compositionTenancy,
      code: `import {TenancyProviders} from './tenancy.providers'`,
    },
    {
      filename: infrastructureTenancy,
      code: `import {TenantMapper} from './tenant.mapper'`,
    },
    {
      filename: infrastructureCore,
      code: `import {TenantEntity} from '../../contexts/tenancy/tenant.entity'`,
    },
    {
      filename: infrastructureTenancy,
      code: `import {TenantAwareRepository} from '../../kernel/persistence/tenant-aware.repository'`,
    },
    {
      filename: domainTenancy,
      code: `import type {RoleId} from '@b2b-saas-starter-kit/shared-kernel-types'`,
    },
    {
      filename: apiUsersController,
      code: `import {DevPrincipalInterceptor} from '../../common/auth/dev-principal.interceptor'`,
    },
    {
      filename: apiUsersController,
      code: `import {UsersService} from './users.service'`,
    },
  ],
  invalid: [
    {
      filename: domainTenancy,
      code: `import {Role} from '../authorization/role'`,
      errors: [{messageId: 'crossContext'}],
    },
    {
      filename: applicationAuthorization,
      code: `import {MembershipRolesPort} from '../tenancy/membership-roles.port'`,
      errors: [{messageId: 'crossContext'}],
    },
    {
      filename: compositionTenancy,
      code: `export {IdentityModule} from '../identity/identity.module'`,
      errors: [{messageId: 'crossContext'}],
    },
    {
      filename: infrastructureTenancy,
      code: `import {RoleEntity} from '../authorization/role.entity'`,
      errors: [{messageId: 'crossContext'}],
    },
    {
      filename: apiUsersController,
      code: `import {TenantsService} from '../tenants/tenants.service'`,
      errors: [{messageId: 'crossContext'}],
    },
    {
      filename: apiCommonAuth,
      code: `import {UsersService} from '../../modules/users/users.service'`,
      errors: [{messageId: 'crossContext'}],
    },
  ],
})
