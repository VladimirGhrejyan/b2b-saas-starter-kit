import type {i18n} from 'i18next'
import type {ReactNode} from 'react'

import type {LoggerPort} from '@b2b-saas-starter-kit/frontend-core'

export type ErrorBoundaryProps = {
  children: ReactNode
  logger: LoggerPort
  i18n: i18n
}

export type ErrorBoundaryState = {
  error: Error | null
}
