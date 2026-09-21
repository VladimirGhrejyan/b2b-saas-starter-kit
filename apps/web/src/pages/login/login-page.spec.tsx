import {fireEvent, screen} from '@testing-library/react'

import {FrontendMsw, ownerSession} from '@b2b-saas-starter-kit/frontend-core/testing'

import {webRoutes} from '@/pages/shell/web-routes'
import {paths} from '@/shared/router'
import {renderWithProviders} from '@/shared/testing/render-with-providers'

describe('LoginPage', () => {
  const msw = new FrontendMsw()

  beforeAll(() => {
    msw.listen()
  })

  afterEach(() => {
    msw.reset()
  })

  afterAll(() => {
    msw.close()
  })

  it('signs in and lands on home', async () => {
    msw.useOwner()

    await renderWithProviders(null, {
      routes: webRoutes,
      initialEntries: [paths.login],
    })

    fireEvent.change(screen.getByLabelText('Email'), {target: {value: 'owner@example.com'}})
    fireEvent.change(screen.getByLabelText('Password'), {target: {value: 'secret-password'}})
    fireEvent.click(screen.getByRole('button', {name: 'Sign in'}))

    expect(await screen.findByRole('heading', {name: 'B2B SaaS Starter'})).toBeTruthy()
  })

  it('surfaces INVALID_CREDENTIALS from the envelope', async () => {
    msw.useInvalidLogin()

    await renderWithProviders(null, {
      routes: webRoutes,
      initialEntries: [paths.login],
    })

    fireEvent.change(screen.getByLabelText('Email'), {target: {value: 'owner@example.com'}})
    fireEvent.change(screen.getByLabelText('Password'), {target: {value: 'wrong-password'}})
    fireEvent.click(screen.getByRole('button', {name: 'Sign in'}))

    expect(await screen.findByText(/INVALID_CREDENTIALS/)).toBeTruthy()
    expect(screen.getByRole('heading', {name: 'Login'})).toBeTruthy()
  })

  it('redirects home when a session already exists', async () => {
    msw.useOwner()

    await renderWithProviders(null, {
      routes: webRoutes,
      initialEntries: [paths.login],
      preloadedState: {session: ownerSession},
    })

    expect(await screen.findByRole('heading', {name: 'B2B SaaS Starter'})).toBeTruthy()
    expect(screen.queryByRole('heading', {name: 'Login'})).toBeNull()
  })
})
