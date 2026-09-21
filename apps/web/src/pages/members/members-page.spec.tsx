import {screen} from '@testing-library/react'

import {fixtureIds, FrontendMsw, memberSession, ownerSession} from '@b2b-saas-starter-kit/frontend-core/testing'

import {webRoutes} from '@/pages/shell/web-routes'
import {buildPath, paths} from '@/shared/router'
import {renderWithProviders} from '@/shared/testing/render-with-providers'

describe('MembersPage', () => {
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

  it('shows the members list for an Owner', async () => {
    msw.useOwner()

    await renderWithProviders(null, {
      routes: webRoutes,
      initialEntries: [buildPath(paths.members, {tenantId: fixtureIds.tenantId})],
      preloadedState: {session: ownerSession},
    })

    expect(await screen.findByText(new RegExp(fixtureIds.ownerUserId))).toBeTruthy()
    expect(screen.getByText(new RegExp(fixtureIds.memberUserId))).toBeTruthy()
  })

  it('hides the members list for a Member', async () => {
    msw.useMember()

    await renderWithProviders(null, {
      routes: webRoutes,
      initialEntries: [buildPath(paths.members, {tenantId: fixtureIds.tenantId})],
      preloadedState: {session: memberSession},
    })

    expect(await screen.findByRole('heading', {name: 'Members'})).toBeTruthy()
    expect(screen.queryByText(new RegExp(fixtureIds.ownerUserId))).toBeNull()
  })

  it('surfaces the 403 envelope code and message', async () => {
    msw.useForbiddenMembers()

    await renderWithProviders(null, {
      routes: webRoutes,
      initialEntries: [buildPath(paths.members, {tenantId: fixtureIds.tenantId})],
      preloadedState: {session: ownerSession},
    })

    expect(await screen.findByText(/INSUFFICIENT_PERMISSION/)).toBeTruthy()
    expect(screen.getByText(/missing permission 'tenancy.members.read'/)).toBeTruthy()
  })
})
