import {configureFrontendCore, createStore, I18n} from '@b2b-saas-starter-kit/frontend-core'

import {environment} from '@/shared/environment'
import {loadAdminLocaleNamespace} from '@/shared/i18n/load-admin-locale-namespace'

import {createAdminRouter} from './providers/router'
import type {CreateAdminAppOptions} from './create-admin-app.types'
import {Providers} from './providers'

export async function createAdminApp(options: CreateAdminAppOptions) {
  configureFrontendCore({
    baseUrl: environment.apiBaseUrl,
    ports: options.ports,
  })

  const store = createStore()
  const i18n = await I18n.create({
    defaultLocale: 'en',
    storage: options.ports.storage,
    namespaces: ['common'],
    loadNamespace: loadAdminLocaleNamespace,
  })
  const router = createAdminRouter(options.history)

  return <Providers store={store} i18n={i18n} router={router} logger={options.ports.logger} />
}
