import type {ReactNode} from 'react'
import {I18nextProvider} from 'react-i18next'
import {Provider} from 'react-redux'
import {RouterProvider} from 'react-router'

import {ErrorBoundary} from './error-boundary'
import type {ProvidersProps} from './providers.types'

export function Providers({store, i18n, router, logger}: ProvidersProps): ReactNode {
  return (
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <ErrorBoundary logger={logger} i18n={i18n}>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </I18nextProvider>
    </Provider>
  )
}
