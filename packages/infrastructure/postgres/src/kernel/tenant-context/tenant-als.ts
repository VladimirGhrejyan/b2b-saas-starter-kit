import {AsyncLocalStorage} from 'node:async_hooks'

import type {TenantScope} from '@b2b-saas-starter-kit/platform'

export type TenantAlsStore = {
  readonly scope: TenantScope | undefined
  readonly skipTenantScope: boolean
}

export const tenantAls = new AsyncLocalStorage<TenantAlsStore>()
