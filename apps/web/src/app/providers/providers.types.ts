import type {i18n} from 'i18next'

import type {AppRouter, AppStore, LoggerPort} from '@b2b-saas-starter-kit/frontend-core'

export type ProvidersProps = {
  store: AppStore
  i18n: i18n
  router: AppRouter
  logger: LoggerPort
}
