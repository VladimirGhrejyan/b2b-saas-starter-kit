import {fireEvent, screen} from '@testing-library/react'

import {webRoutes} from '@/pages/shell/web-routes'
import {paths} from '@/shared/router'
import {ownerSession, WebMsw} from '@/shared/testing/msw'
import {renderWithProviders} from '@/shared/testing/render-with-providers'

describe('LoginPage', () => {
  beforeAll(() => {
    WebMsw.listen()
  })

  afterEach(() => {
    WebMsw.reset()
  })

  afterAll(() => {
    WebMsw.close()
  })

  it('signs in and lands on home', async () => {
    WebMsw.useOwner()

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
    WebMsw.useInvalidLogin()

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
    WebMsw.useOwner()

    await renderWithProviders(null, {
      routes: webRoutes,
      initialEntries: [paths.login],
      preloadedState: {session: ownerSession},
    })

    expect(await screen.findByRole('heading', {name: 'B2B SaaS Starter'})).toBeTruthy()
    expect(screen.queryByRole('heading', {name: 'Login'})).toBeNull()
  })
})
