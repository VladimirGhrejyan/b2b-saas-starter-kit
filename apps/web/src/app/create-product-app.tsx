import {configureFrontendCore, createStore, I18n} from '@b2b-saas-starter-kit/frontend-core'

import {environment} from '@/shared/environment'
import {loadWebLocaleNamespace} from '@/shared/i18n/load-web-locale-namespace'

import {createWebRouter} from './providers/router'
import type {CreateProductAppOptions} from './create-product-app.types'
import {Providers} from './providers'

export async function createProductApp(options: CreateProductAppOptions) {
  configureFrontendCore({
    baseUrl: environment.apiBaseUrl,
    ports: options.ports,
  })

  const store = createStore()
  const i18n = await I18n.create({
    defaultLocale: 'en',
    storage: options.ports.storage,
    namespaces: ['common', 'tenancy'],
    loadNamespace: loadWebLocaleNamespace,
  })
  const router = createWebRouter(options.history)

  return <Providers store={store} i18n={i18n} router={router} logger={options.ports.logger} />
}
