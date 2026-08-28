import {screen} from '@testing-library/react'

import {webRoutes} from '@/pages/shell/web-routes'
import {buildPath, paths} from '@/shared/router'
import {fixtureIds, memberSession, ownerSession, WebMsw} from '@/shared/testing/msw'
import {renderWithProviders} from '@/shared/testing/render-with-providers'

describe('MembersPage', () => {
  beforeAll(() => {
    WebMsw.listen()
  })

  afterEach(() => {
    WebMsw.reset()
  })

  afterAll(() => {
    WebMsw.close()
  })

  it('shows the members list for an Owner', async () => {
    WebMsw.useOwner()

    await renderWithProviders(null, {
      routes: webRoutes,
      initialEntries: [buildPath(paths.members, {tenantId: fixtureIds.tenantId})],
      preloadedState: {session: ownerSession},
    })

    expect(await screen.findByText(new RegExp(fixtureIds.ownerUserId))).toBeTruthy()
    expect(screen.getByText(new RegExp(fixtureIds.memberUserId))).toBeTruthy()
  })

  it('hides the members list for a Member', async () => {
    WebMsw.useMember()

    await renderWithProviders(null, {
      routes: webRoutes,
      initialEntries: [buildPath(paths.members, {tenantId: fixtureIds.tenantId})],
      preloadedState: {session: memberSession},
    })

    expect(await screen.findByRole('heading', {name: 'Members'})).toBeTruthy()
    expect(screen.queryByText(new RegExp(fixtureIds.ownerUserId))).toBeNull()
  })

  it('surfaces the 403 envelope code and message', async () => {
    WebMsw.useForbiddenMembers()

    await renderWithProviders(null, {
      routes: webRoutes,
      initialEntries: [buildPath(paths.members, {tenantId: fixtureIds.tenantId})],
      preloadedState: {session: ownerSession},
    })

    expect(await screen.findByText(/INSUFFICIENT_PERMISSION/)).toBeTruthy()
    expect(screen.getByText(/missing permission 'tenancy.members.read'/)).toBeTruthy()
  })
})
