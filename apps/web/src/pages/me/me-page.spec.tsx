import {screen} from '@testing-library/react'

import {PermissionName} from '@b2b-saas-starter-kit/contracts'

import {webRoutes} from '@/pages/shell/web-routes'
import {paths} from '@/shared/router'
import {memberSession, ownerSession, WebMsw} from '@/shared/testing/msw'
import {renderWithProviders} from '@/shared/testing/render-with-providers'

describe('MePage', () => {
  beforeAll(() => {
    WebMsw.listen()
  })

  afterEach(() => {
    WebMsw.reset()
  })

  afterAll(() => {
    WebMsw.close()
  })

  it('hydrates an Owner so members read is allowed', async () => {
    WebMsw.useOwner()

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
    WebMsw.useMember()

    await renderWithProviders(null, {
      routes: webRoutes,
      initialEntries: [paths.me],
      preloadedState: {session: memberSession},
    })

    expect(await screen.findByText(/member@example.com/)).toBeTruthy()
    expect(screen.queryByText(PermissionName.tenancyMembersRead)).toBeNull()
    expect(screen.queryByRole('link', {name: 'Members'})).toBeNull()
  })

  it('shows the dev principal picker on UNAUTHORIZED', async () => {
    WebMsw.useUnauthorized()

    await renderWithProviders(null, {
      routes: webRoutes,
      initialEntries: [paths.me],
      preloadedState: {session: ownerSession},
    })

    expect((await screen.findAllByText(/UNAUTHORIZED/)).length).toBeGreaterThan(0)
    expect(screen.getByLabelText('User ID')).toBeTruthy()
    expect(screen.getByLabelText('Tenant ID')).toBeTruthy()
    expect(screen.queryByRole('heading', {name: 'Login'})).toBeNull()
  })
})
