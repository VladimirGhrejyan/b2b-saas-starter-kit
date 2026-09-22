import {configureFrontendCore, createStore, I18n} from '@b2b-saas-starter-kit/frontend-core'

import {environment} from '@/shared/environment'
import {loadAdminLocaleNamespace} from '@/shared/i18n/load-admin-locale-namespace'

import {createAdminRouter} from './providers/router'
import type {CreateAdminAppOptions} from './create-admin-app.types'
import {Providers} from './providers'

export async function createAdminApp(options: CreateAdminAppOptions) {
  const logger = options.ports.logger

  configureFrontendCore({
    baseUrl: environment.apiBaseUrl,
    ports: options.ports,
  })
  logger.debug('Frontend core configured')

  const store = createStore()

  logger.debug('Redux initialized')

  const i18n = await I18n.create({
    defaultLocale: 'en',
    storage: options.ports.storage,
    namespaces: ['common'],
    loadNamespace: loadAdminLocaleNamespace,
  })

  logger.debug('I18n initialized')

  const router = createAdminRouter(options.history)

  logger.debug('Router initialized')

  return <Providers store={store} i18n={i18n} router={router} logger={logger} />
}
