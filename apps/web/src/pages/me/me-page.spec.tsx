import {screen} from '@testing-library/react'

import {PermissionName} from '@b2b-saas-starter-kit/contracts'
import {FrontendMsw, memberSession, ownerSession} from '@b2b-saas-starter-kit/frontend-core/testing'

import {webRoutes} from '@/pages/shell/web-routes'
import {paths} from '@/shared/router'
import {renderWithProviders} from '@/shared/testing/render-with-providers'

describe('MePage', () => {
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

  it('hydrates an Owner so members read is allowed', async () => {
    msw.useOwner()

    await renderWithProviders(null, {
      routes: webRoutes,
      initialEntries: [paths.me],
      preloadedState: {session: ownerSession},
    })

    expect(await screen.findByText(/owner@example.com/)).toBeTruthy()
    expect(screen.getByText(PermissionName.tenancyMembersRead)).toBeTruthy()
    expect(screen.getByRole('link', {name: 'Members'})).toBeTruthy()
  })

  it('hydrates a Member so members read is denied', async () => {
    msw.useMember()

    await renderWithProviders(null, {
      routes: webRoutes,
      initialEntries: [paths.me],
      preloadedState: {session: memberSession},
    })

    expect(await screen.findByText(/member@example.com/)).toBeTruthy()
    expect(screen.queryByText(PermissionName.tenancyMembersRead)).toBeNull()
    expect(screen.queryByRole('link', {name: 'Members'})).toBeNull()
  })

  it('redirects to login after a failed refresh on UNAUTHORIZED', async () => {
    msw.useUnauthorized()

    await renderWithProviders(null, {
      routes: webRoutes,
      initialEntries: [paths.me],
      preloadedState: {session: ownerSession},
    })

    expect(await screen.findByRole('heading', {name: 'Login'})).toBeTruthy()
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByLabelText('Password')).toBeTruthy()
    expect(screen.queryByLabelText('User ID')).toBeNull()
    expect(screen.queryByLabelText('Tenant ID')).toBeNull()
  })
})
