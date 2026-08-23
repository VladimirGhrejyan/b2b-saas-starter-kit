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
const infrastructureCore = '/workspace/packages/infrastructure-postgres/src/tenant-aware.repository.ts'
const infrastructureTenancy = '/workspace/packages/infrastructure-postgres/src/tenancy/tenant.entity.ts'

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
      code: `import {TenantEntity} from './tenancy/tenant.entity'`,
    },
    {
      filename: domainTenancy,
      code: `import type {RoleId} from '@b2b-saas-starter-kit/shared-kernel-types'`,
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
  ],
})
