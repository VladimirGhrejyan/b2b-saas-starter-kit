import {cleanup, render} from '@testing-library/react'
import type {ReactElement} from 'react'
import {I18nextProvider} from 'react-i18next'
import {Provider} from 'react-redux'
import {createMemoryRouter, RouterProvider} from 'react-router'

import {configureFrontendCore, createStore, createWebPorts, I18n} from '@b2b-saas-starter-kit/frontend-core'

import {loadWebLocaleNamespace} from '../i18n/load-web-locale-namespace'

import type {RenderWithProvidersOptions} from './render-with-providers.types'

export async function renderWithProviders(
  ui: ReactElement | null = null,
  options: RenderWithProvidersOptions = {},
): Promise<void> {
  cleanup()

  const ports = createWebPorts()

  configureFrontendCore({
    baseUrl: 'http://web.test/v1',
    ports,
  })

  const store = createStore({preloadedState: options.preloadedState})
  const i18n = await I18n.create({
    defaultLocale: 'en',
    storage: ports.storage,
    namespaces: ['common', 'tenancy'],
    loadNamespace: loadWebLocaleNamespace,
  })
  const routes = options.routes ?? [{path: '*', element: ui}]
  const router = createMemoryRouter(routes, {
    initialEntries: options.initialEntries ?? [options.route ?? '/'],
  })

  render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>
    </Provider>,
  )
}
